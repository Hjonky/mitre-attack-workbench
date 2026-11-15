const Database = require("better-sqlite3");
const path = require("path");
const db = new Database(
  process.env.DB_PATH || path.join(__dirname, "mitre.db"),
);
db.exec(`CREATE TABLE IF NOT EXISTS attacks (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
  platforms TEXT, detection TEXT, phase_name TEXT,
  technique_id TEXT, external_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_name ON attacks(name);`);
const columns = db
  .prepare("PRAGMA table_info(attacks)")
  .all()
  .map((column) => column.name);
for (const column of ["technique_id", "external_url"]) {
  if (!columns.includes(column))
    db.exec(`ALTER TABLE attacks ADD COLUMN ${column} TEXT`);
}
module.exports = db;
