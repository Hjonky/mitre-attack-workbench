const DB = {
  GET_ATTACKS: "SELECT * FROM attacks ORDER BY name COLLATE NOCASE",
  SEARCH_ATTACKS:
    "SELECT * FROM attacks WHERE name LIKE :query OR description LIKE :query OR id LIKE :query OR COALESCE(technique_id, '') LIKE :query ORDER BY name COLLATE NOCASE",
  GET_ID: "SELECT * FROM attacks WHERE id = ?",
  COUNT: "SELECT COUNT(*) as total FROM attacks",
};
module.exports = { DB };
