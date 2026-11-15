async function checkHash(hash, fetchReport = fetch) {
  if (!/^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})$/i.test(hash || "")) {
    return {
      type: "virus",
      status: "invalid_hash",
      message: "Enter a valid MD5, SHA-1, or SHA-256 hash.",
    };
  }
  if (!process.env.VT_API_KEY) {
    return {
      type: "virus",
      status: "missing_key",
      message:
        "Reputation lookup is unavailable. Add VT_API_KEY to backend/.env and restart the server.",
    };
  }
  try {
    const response = await fetchReport(
      `https://www.virustotal.com/api/v3/files/${hash}`,
      {
        headers: { "x-apikey": process.env.VT_API_KEY },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (response.status === 404)
      return {
        type: "virus",
        status: "not_found",
        message: "No existing VirusTotal report was found for this hash.",
      };
    if (response.status === 429)
      return {
        type: "virus",
        status: "rate_limited",
        message: "VirusTotal rate limit reached. Try again later.",
      };
    if (!response.ok)
      return {
        type: "virus",
        status: "error",
        message: "VirusTotal lookup failed. Check your API key and connection.",
      };
    const data = await response.json();
    const stats = data.data.attributes.last_analysis_stats;
    return {
      type: "virus",
      status: "found",
      hash,
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      undetected: stats.undetected || 0,
      harmless: stats.harmless || 0,
    };
  } catch {
    return {
      type: "virus",
      status: "error",
      message: "VirusTotal could not be reached. Try again later.",
    };
  }
}
function reputationVerdict(result) {
  if (result.status !== "found") return "unavailable";
  if (result.malicious > 0) return "malicious";
  if (result.suspicious > 0) return "suspicious";
  return "no_detections";
}
module.exports = { checkHash, reputationVerdict };
