// imports
const db = require("../db");
const { DB } = require("../constants");

function searchAttacks(query) {
  if (!query) return [];

  const result = db.prepare(DB.SEARCH_ATTACKS).all({ query: `%${query}%` });

  return result;
}

module.exports = {
  searchAttacks,
};
