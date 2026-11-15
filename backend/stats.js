const db = require("./db");
function getStats() {
  const rows = db.prepare("SELECT platforms, phase_name FROM attacks").all();
  const counts = (key) => {
    const values = new Map();
    for (const row of rows) {
      const items = new Set(
        (row[key] || "")
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item && item !== "NA"),
      );
      for (const item of items) values.set(item, (values.get(item) || 0) + 1);
    }
    return [...values]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };
  return {
    total: rows.length,
    phases: counts("phase_name"),
    platforms: counts("platforms"),
  };
}
module.exports = { getStats };
