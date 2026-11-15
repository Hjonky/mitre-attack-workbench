const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const express = require("express");
const fs = require("fs");
const db = require("./db");
const { DB } = require("./constants");
const { getStats } = require("./stats");
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    virusTotalConfigured: Boolean(process.env.VT_API_KEY),
  }),
);
app.get("/api/attacks", (req, res) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  res.json(
    search
      ? db.prepare(DB.SEARCH_ATTACKS).all({ query: `%${search}%` })
      : db.prepare(DB.GET_ATTACKS).all(),
  );
});
app.get("/api/attacks/:id", (req, res) => {
  const attack = db.prepare(DB.GET_ID).get(req.params.id);
  if (!attack) return res.status(404).json({ error: "Technique not found." });
  res.json(attack);
});
app.get("/api/stats", (_req, res) => res.json(getStats()));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/sandbox", require("./routes/sandbox"));
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "API endpoint not found." }),
);
const frontend = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(path.join(frontend, "index.html"))) {
  app.use(express.static(frontend));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(frontend, "index.html")),
  );
}
app.use((error, _req, res, _next) => {
  const status = error.code === "LIMIT_FILE_SIZE" ? 413 : error.status || 500;
  res
    .status(status)
    .json({
      error:
        status === 413
          ? "File exceeds the 10 MB limit."
          : status === 400
            ? "Invalid request."
            : "The request could not be completed.",
    });
});
if (require.main === module) {
  const port = Number(process.env.PORT) || 3001;
  const host = process.env.HOST || "127.0.0.1";
  app.listen(port, host, (error) => {
    if (error) {
      console.error(`Could not start the API on ${host}:${port}: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    console.log(`ATT&CK API running at http://${host}:${port}`);
  });
}
module.exports = app;
