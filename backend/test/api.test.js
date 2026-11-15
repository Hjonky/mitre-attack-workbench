const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
process.env.DB_PATH = ":memory:";
process.env.VT_API_KEY = "";
const app = require("../server");
const db = require("../db");
const { checkHash, reputationVerdict } = require("../services/virusService");
let server;
let base;
before(async () => {
  const insert = db.prepare(
    "INSERT INTO attacks (id, name, description, platforms, phase_name) VALUES (?, ?, ?, ?, ?)",
  );
  insert.run(
    "attack-pattern--alpha",
    "Alpha technique",
    "A unique behavior",
    "Windows, Linux",
    "execution, persistence",
  );
  insert.run(
    "attack-pattern--beta",
    "Beta technique",
    "Uses Alpha tooling",
    "Linux",
    "persistence",
  );
  insert.run(
    "attack-pattern--gamma",
    "Gamma technique",
    "An unrelated description",
    "macOS",
    "discovery",
  );
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});
async function post(path, body) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 200);
  return response.json();
}
test("health reports optional VirusTotal configuration without exposing credentials", async () => {
  const data = await (await fetch(base + "/health")).json();
  assert.deepEqual(data, { status: "ok", virusTotalConfigured: false });
});
test("library searches names, descriptions, and STIX IDs", async () => {
  const results = await (await fetch(base + "/attacks?search=Alpha")).json();
  assert.deepEqual(
    results.map((item) => item.id),
    ["attack-pattern--alpha", "attack-pattern--beta"],
  );
  const byID = await (
    await fetch(base + "/attacks?search=attack-pattern--gamma")
  ).json();
  assert.equal(byID[0].name, "Gamma technique");
});
test("unknown techniques and API routes return JSON 404s", async () => {
  for (const path of ["/attacks/missing", "/missing"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404);
    assert.ok((await response.json()).error);
  }
});
test("statistics count individual tactic mappings rather than comma-separated combinations", async () => {
  const data = await (await fetch(base + "/stats")).json();
  assert.equal(data.total, 3);
  assert.deepEqual(
    data.phases.find((item) => item.name === "persistence"),
    { name: "persistence", count: 2 },
  );
  assert.equal(data.phases.length, 3);
  assert.equal(data.platforms.find((item) => item.name === "Linux").count, 2);
});
test("assistant search returns navigable techniques and show follows its own context", async () => {
  const search = await post("/chat", { message: "search Alpha" });
  assert.equal(search.techniques.length, 2);
  const show = await post("/chat", {
    message: "show",
    context: search.context,
  });
  assert.match(show.message, /Alpha technique/);
  const next = await post("/chat", { message: "show", context: show.context });
  assert.match(next.message, /Beta technique/);
  const otherUser = await post("/chat", { message: "show" });
  assert.match(otherUser.message, /Start with/);
});
test("file upload returns an exact SHA-256 hash and does not claim an unknown file is clean", async () => {
  const data = new FormData();
  const content = "Harmless test fixture. No execution.";
  data.append("file", new Blob([content]), "sample.txt");
  const response = await fetch(base + "/sandbox/upload", {
    method: "POST",
    body: data,
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(
    result.hash,
    crypto.createHash("sha256").update(content).digest("hex"),
  );
  assert.equal(result.verdict, "unavailable");
  assert.equal(result.raw.status, "missing_key");
});
test("file upload requires a file and enforces the 10 MB limit", async () => {
  const missing = await fetch(base + "/sandbox/upload", {
    method: "POST",
    body: new FormData(),
  });
  assert.equal(missing.status, 400);
  const body = new FormData();
  body.append(
    "file",
    new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]),
    "oversized.bin",
  );
  const oversized = await fetch(base + "/sandbox/upload", {
    method: "POST",
    body,
  });
  assert.equal(oversized.status, 413);
  assert.match((await oversized.json()).error, /10 MB/);
});
test("hash lookups validate input and explain a missing key", async () => {
  assert.equal((await checkHash("bad")).status, "invalid_hash");
  assert.equal((await checkHash("a".repeat(64))).status, "missing_key");
});
test("VirusTotal 404, 429, authorization failure, and network errors never produce a clean verdict", async () => {
  process.env.VT_API_KEY = "fixture-key";
  try {
    for (const [code, status] of [
      [404, "not_found"],
      [429, "rate_limited"],
      [403, "error"],
    ]) {
      const result = await checkHash("a".repeat(64), async () => ({
        status: code,
        ok: false,
      }));
      assert.equal(result.status, status);
      assert.equal(reputationVerdict(result), "unavailable");
    }
    const result = await checkHash("a".repeat(64), async () => {
      throw new Error("offline");
    });
    assert.equal(result.status, "error");
    assert.equal(reputationVerdict(result), "unavailable");
  } finally {
    process.env.VT_API_KEY = "";
  }
});
test("known reports distinguish malicious, suspicious, and no detections", async () => {
  process.env.VT_API_KEY = "fixture-key";
  try {
    for (const [malicious, suspicious, verdict] of [
      [2, 0, "malicious"],
      [0, 1, "suspicious"],
      [0, 0, "no_detections"],
    ]) {
      const result = await checkHash("a".repeat(64), async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            attributes: {
              last_analysis_stats: { malicious, suspicious, undetected: 10 },
            },
          },
        }),
      }));
      assert.equal(reputationVerdict(result), verdict);
    }
  } finally {
    process.env.VT_API_KEY = "";
  }
});
