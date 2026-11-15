// Optional refresh: imports a single official MITRE STIX bundle in one transaction.
const db = require("./db");
const source =
  "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";
async function seed() {
  const response = await fetch(source, { signal: AbortSignal.timeout(120000) });
  if (!response.ok)
    throw new Error(`Dataset download failed (${response.status}).`);
  const bundle = await response.json();
  if (!Array.isArray(bundle.objects))
    throw new Error("Invalid STIX bundle. Existing data was preserved.");
  const attacks = bundle.objects.filter(
    (object) =>
      object.type === "attack-pattern" &&
      !object.revoked &&
      !object.x_mitre_deprecated,
  );
  if (!attacks.length)
    throw new Error("No active techniques found. Existing data was preserved.");
  const insert = db.prepare(
    "INSERT INTO attacks (id, name, description, platforms, detection, phase_name, technique_id, external_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  db.transaction(() => {
    db.prepare("DELETE FROM attacks").run();
    for (const object of attacks) {
      const reference = (object.external_references || []).find(
        (ref) => ref.source_name === "mitre-attack",
      );
      insert.run(
        object.id,
        object.name,
        object.description || "",
        (object.x_mitre_platforms || []).join(", "),
        object.x_mitre_detection || "",
        (object.kill_chain_phases || [])
          .map((phase) => phase.phase_name)
          .join(", "),
        reference?.external_id || null,
        reference?.url || null,
      );
    }
  })();
  console.log(`Imported ${attacks.length} active techniques from ${source}`);
}
seed()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
