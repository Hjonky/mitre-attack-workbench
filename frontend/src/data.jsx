import { createContext, useContext, useEffect, useState } from "react";
const Context = createContext(null);

export async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, options);
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.error || "The server could not complete your request.",
    );
  if (!data) throw new Error("The API returned an unexpected response.");
  return data;
}

export function DatasetProvider({ children }) {
  const [state, setState] = useState({
    attacks: [],
    stats: null,
    health: null,
    loading: true,
    error: "",
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    Promise.all(
      ["/attacks", "/stats", "/health"].map((path) =>
        request(path, { signal: controller.signal }),
      ),
    )
      .then(([attacks, stats, health]) =>
        setState({ attacks, stats, health, loading: false, error: "" }),
      )
      .catch((error) => {
        if (error.name !== "AbortError")
          setState((previous) => ({
            ...previous,
            loading: false,
            error:
              "We couldn’t connect to the local API. Make sure the backend is running, then try again.",
          }));
      });
    return () => controller.abort();
  }, [revision]);
  return (
    <Context.Provider
      value={{ ...state, retry: () => setRevision((value) => value + 1) }}
    >
      {children}
    </Context.Provider>
  );
}
export const useDataset = () => useContext(Context);
export const splitValues = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && item !== "NA");
export const titleCase = (value) =>
  value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
export const plainText = (value) =>
  (value || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\(Citation:[^)]+\)/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
export const prepareMarkdown = (value) =>
  (value || "")
    .replace(/<code>([\s\S]*?)<\/code>/gi, (_, code) => "`" + code + "`")
    .replace(/<br\s*\/?>/gi, "\n");
export const recordLabel = (attack) =>
  attack.technique_id ||
  `STIX · ${attack.id.replace("attack-pattern--", "").slice(0, 8)}`;

export function downloadCSV(attacks) {
  const cell = (value) => {
    let text = String(value || "");
    if (/^[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const rows = [
    ["STIX ID", "Technique ID", "Name", "Tactics", "Platforms", "Description"],
    ...attacks.map((attack) => [
      attack.id,
      attack.technique_id,
      attack.name,
      attack.phase_name,
      attack.platforms,
      plainText(attack.description),
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "attack-techniques.csv";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
