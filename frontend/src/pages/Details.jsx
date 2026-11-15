import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  Check,
  Monitor,
  Layers3,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";
import { useDataset, splitValues, recordLabel, prepareMarkdown } from "../data";
import { DataState, TacticTag } from "../components";

export default function Details() {
  return (
    <DataState>
      <DetailsContent />
    </DataState>
  );
}
function DetailsContent() {
  const { id } = useParams();
  const { attacks } = useDataset();
  const attack = attacks.find((item) => item.id === id);
  const [copyStatus, setCopyStatus] = useState("");
  if (!attack)
    return (
      <div className="empty-state panel">
        <Fingerprint size={32} />
        <h1>Technique not found</h1>
        <p>This identifier isn’t in the local dataset.</p>
        <Link to="/" className="button primary">
          Return to explorer
        </Link>
      </div>
    );
  const related = attacks
    .filter(
      (item) =>
        item.id !== id &&
        splitValues(item.phase_name).some((tactic) =>
          splitValues(attack.phase_name).includes(tactic),
        ),
    )
    .slice(0, 4);
  async function copy() {
    try {
      await navigator.clipboard.writeText(attack.id);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("unavailable");
    }
  }
  return (
    <>
      <Link className="back-link" to="/">
        <ArrowLeft size={16} />
        Back to technique explorer
      </Link>
      <div className="detail-title">
        <div className="eyebrow">
          TECHNIQUE INTELLIGENCE <span> / </span> {recordLabel(attack)}
        </div>
        <h1>{attack.name}</h1>
        <div className="detail-tags">
          {splitValues(attack.phase_name).map((name) => (
            <TacticTag name={name} key={name} />
          ))}
        </div>
      </div>
      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel prose-panel">
            <div className="section-title">
              <span className="soft-icon">
                <Fingerprint size={19} />
              </span>
              <h2>Behavior overview</h2>
            </div>
            <div className="markdown">
              <Markdown
                components={{
                  a: (props) => (
                    <a {...props} target="_blank" rel="noreferrer" />
                  ),
                }}
              >
                {prepareMarkdown(attack.description) ||
                  "No description is available in this snapshot."}
              </Markdown>
            </div>
          </section>
          <section className="panel prose-panel">
            <div className="section-title">
              <span className="soft-icon">
                <ShieldCheck size={19} />
              </span>
              <h2>Detection guidance</h2>
            </div>
            {attack.detection && attack.detection !== "NA" ? (
              <div className="markdown">
                <Markdown>{prepareMarkdown(attack.detection)}</Markdown>
              </div>
            ) : (
              <div className="subtle-callout">
                This snapshot does not include detection guidance for this
                technique. Consult the official ATT&CK knowledge base for the
                latest research.
              </div>
            )}
          </section>
        </div>
        <aside className="detail-aside">
          <section className="panel record-panel">
            <h2>At a glance</h2>
            <div className="metadata-group">
              <h3>
                <Monitor size={15} />
                Platforms
              </h3>
              <div className="chip-wrap">
                {splitValues(attack.platforms).map((platform) => (
                  <Link
                    className="platform-chip"
                    key={platform}
                    to={`/?platform=${encodeURIComponent(platform)}`}
                  >
                    {platform}
                  </Link>
                ))}
              </div>
            </div>
            <div className="metadata-group">
              <h3>
                <Layers3 size={15} />
                Tactic mappings
              </h3>
              <div className="tag-stack">
                {splitValues(attack.phase_name).map((name) => (
                  <Link
                    className="text-link"
                    to={`/?tactic=${encodeURIComponent(name)}`}
                    key={name}
                  >
                    {name.replace(/-/g, " ")}
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
            <div className="metadata-group">
              <h3>
                <Fingerprint size={15} />
                STIX identifier
              </h3>
              <code className="identifier">{attack.id}</code>
              <button
                className="button secondary small copy-button"
                onClick={copy}
              >
                {copyStatus === "copied" ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}
                {copyStatus === "copied" ? "Copied" : "Copy identifier"}
              </button>
              <span role="status" className="muted small-text">
                {copyStatus === "unavailable" &&
                  "Clipboard unavailable. Select the identifier to copy it."}
              </span>
            </div>
            <a
              className="button primary full-width"
              href={
                attack.external_url?.startsWith("https://attack.mitre.org/")
                  ? attack.external_url
                  : "https://attack.mitre.org/"
              }
              target="_blank"
              rel="noreferrer"
            >
              Official ATT&CK resource
              <ArrowUpRight size={16} />
            </a>
          </section>
          <section className="panel related-panel">
            <h2>Continue exploring</h2>
            <p>Other techniques with a shared tactic.</p>
            {related.map((item) => (
              <Link
                className="related-link"
                to={`/attack/${item.id}`}
                key={item.id}
              >
                {item.name}
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </section>
        </aside>
      </div>
    </>
  );
}
