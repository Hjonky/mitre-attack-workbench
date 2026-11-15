const express = require("express");
const { searchAttacks } = require("../services/searchService");
const { checkHash } = require("../services/virusService");
const { getStats } = require("../stats");
const router = express.Router();
router.post("/", async (req, res) => {
  const message =
    typeof req.body.message === "string" ? req.body.message.trim() : "";
  const context = {
    query:
      typeof req.body.context?.query === "string" ? req.body.context.query : "",
    index: Math.max(0, Number(req.body.context?.index) || 0),
  };
  const find = message.match(/^(?:find|search)\s+(.+)/i);
  let text;
  let techniques;
  if (find) {
    const query = find[1].trim();
    const results = searchAttacks(query);
    context.query = query;
    context.index = 0;
    text = `I found ${results.length} techniques related to “${query}”.${results.length ? " Here are the first matches. Use “show” to read through them." : " Try a broader search term."}`;
    techniques = results.slice(0, 5).map(({ id, name }) => ({ id, name }));
  } else if (/^show\b/i.test(message)) {
    const results = context.query ? searchAttacks(context.query) : [];
    if (!results.length)
      text =
        "Start with “find <query>”, then use “show” to explore each result.";
    else {
      const technique = results[context.index % results.length];
      context.index++;
      text = `**${technique.name}**\n\n${technique.description}`;
      techniques = [{ id: technique.id, name: technique.name }];
    }
  } else if (/^(?:check|virus)\b/i.test(message)) {
    const hash = message.match(
      /\b(?:[a-f0-9]{64}|[a-f0-9]{40}|[a-f0-9]{32})\b/i,
    )?.[0];
    const result = await checkHash(hash);
    text =
      result.status === "found"
        ? `${result.malicious} engines flagged this hash as malicious; ${result.suspicious} flagged it as suspicious. A reputation report does not prove a file is safe.`
        : result.message;
  } else if (/^stats\b/i.test(message)) {
    const stats = getStats();
    text = `This local snapshot contains **${stats.total} techniques**, **${stats.phases.length} tactics**, and **${stats.platforms.length} platforms**. Techniques can belong to multiple tactics and platforms.`;
  } else {
    text =
      "I’m a local, command-based research assistant. Try:\n\n- **find PowerShell** — search technique names and descriptions\n- **show** — read the next result\n- **stats** — summarize this dataset\n- **check <hash>** — look up an existing VirusTotal report\n- **help** — see these commands";
  }
  res.json({ type: "message", message: text, techniques, context });
});
module.exports = router;
