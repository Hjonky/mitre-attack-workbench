import { useRef, useState } from "react";
import {
  FileScan,
  Upload,
  File,
  X,
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  Search,
  AlertTriangle,
  CircleCheck,
  Copy,
  Check,
} from "lucide-react";
import { useDataset, request } from "../data";
import { PageHeading } from "../components";
const LIMIT = 10 * 1024 * 1024;
export default function Analyzer() {
  const { health } = useDataset();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const input = useRef(null);
  function selectFile(selected) {
    setResult(null);
    setCopied(false);
    setError("");
    if (!selected) return;
    if (selected.size > LIMIT) {
      setFile(null);
      setError("Choose a file smaller than 10 MB.");
      return;
    }
    setFile(selected);
  }
  async function analyze() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    setCopied(false);
    const body = new FormData();
    body.append("file", file);
    try {
      setResult(await request("/sandbox/upload", { method: "POST", body }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(result.hash);
      setCopied(true);
    } catch {
      setError("Clipboard unavailable. Select the hash to copy it.");
    }
  }
  const risky = result && ["malicious", "suspicious"].includes(result.verdict);
  const labels = {
    malicious: "Malicious detections reported",
    suspicious: "Suspicious detections reported",
    no_detections: "No detections in the existing report",
    unavailable: "Reputation unavailable",
  };
  return (
    <>
      <PageHeading
        eyebrow="A CLOSER LOOK, WITHOUT EXECUTION"
        title="File analyzer"
      >
        Identify a file and check its known reputation using its fingerprint.
      </PageHeading>
      <div className="analyzer-layout">
        <div>
          <section className="panel upload-panel">
            <div className="panel-heading">
              <div>
                <h2>Start with a file</h2>
                <p>
                  Generate a SHA-256 fingerprint and look for an existing
                  report.
                </p>
              </div>
              <span className="soft-icon">
                <FileScan size={20} />
              </span>
            </div>
            <input
              ref={input}
              className="sr-only"
              id="file-input"
              type="file"
              aria-label="Choose a file to analyze"
              disabled={busy}
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <button
              type="button"
              className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
              disabled={busy}
              onClick={() => input.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (!busy) selectFile(event.dataTransfer.files?.[0]);
              }}
            >
              <span className="upload-symbol">
                {file ? <File size={28} /> : <Upload size={28} />}
              </span>
              <strong>{file ? file.name : "Drop a file to get started"}</strong>
              <span>
                {file ? (
                  `${(file.size / 1024).toFixed(1)} KB · Click to choose a different file`
                ) : (
                  <>
                    or <b>browse your files</b>
                  </>
                )}
              </span>
              <small>
                Any file type <span>·</span> Up to 10 MB <span>·</span> Never
                executed
              </small>
            </button>
            {file && (
              <div className="selected-file">
                <File size={19} />
                <span>
                  <strong>{file.name}</strong>
                  <small>Ready for fingerprinting</small>
                </span>
                <button
                  className="icon-button"
                  aria-label="Remove selected file"
                  disabled={busy}
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    input.current.value = "";
                  }}
                >
                  <X size={17} />
                </button>
              </div>
            )}
            {health && !health.virusTotalConfigured && (
              <div className="notice">
                <Fingerprint size={18} />
                <p>
                  <strong>Fingerprinting is ready.</strong> To enable reputation
                  lookups, add your VirusTotal API key to the backend
                  configuration. Your file’s hash is still available without a
                  key.
                </p>
              </div>
            )}
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            <div className="upload-actions">
              <span>
                <ShieldCheck size={15} />
                File contents stay on your local server
              </span>
              <button
                className="button primary"
                onClick={analyze}
                disabled={!file || busy}
              >
                {busy ? (
                  <>
                    <span className="spinner" />
                    Checking reputation…
                  </>
                ) : (
                  <>
                    Analyze file
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </section>
          {result && (
            <section
              className={`panel analysis-result ${risky ? "is-risky" : ""}`}
              aria-live="polite"
            >
              <div className="result-heading">
                <span className={`result-icon ${risky ? "risky" : ""}`}>
                  {risky ? (
                    <AlertTriangle size={23} />
                  ) : result.verdict === "unavailable" ? (
                    <Search size={23} />
                  ) : (
                    <CircleCheck size={23} />
                  )}
                </span>
                <div>
                  <div className="eyebrow">ANALYSIS RESULT</div>
                  <h2>{labels[result.verdict]}</h2>
                </div>
              </div>
              <dl className="result-details">
                <div>
                  <dt>File name</dt>
                  <dd>{result.filename}</dd>
                </div>
                <div>
                  <dt>SHA-256 fingerprint</dt>
                  <dd className="hash-value">
                    <code>{result.hash}</code>
                    <button
                      className="icon-button"
                      aria-label="Copy SHA-256 hash"
                      onClick={copy}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Report status</dt>
                  <dd>{result.raw.status.replace(/_/g, " ")}</dd>
                </div>
              </dl>
              {result.raw.message && (
                <div className="subtle-callout">{result.raw.message}</div>
              )}
              {result.raw.status === "found" && (
                <div className="detection-counts">
                  <div>
                    <strong>{result.raw.malicious}</strong>
                    <span>Malicious</span>
                  </div>
                  <div>
                    <strong>{result.raw.suspicious}</strong>
                    <span>Suspicious</span>
                  </div>
                  <div>
                    <strong>{result.raw.undetected}</strong>
                    <span>Undetected</span>
                  </div>
                </div>
              )}
              <p className="result-disclaimer">
                Hash reputation reflects an existing report. It does not
                establish that a file is safe, and this tool does not execute or
                dynamically analyze files.
              </p>
            </section>
          )}
        </div>
        <aside>
          <section className="panel how-it-works">
            <div className="eyebrow">KNOW WHAT HAPPENS</div>
            <h2>
              A fingerprint.
              <br />A little more context.
            </h2>
            {[
              {
                Icon: Upload,
                title: "Select a file",
                text: "The local server reads the file in memory. It is never executed or saved to disk.",
              },
              {
                Icon: Fingerprint,
                title: "Generate its fingerprint",
                text: "SHA-256 identifies the exact file contents without sharing the file itself.",
              },
              {
                Icon: Search,
                title: "Check known reputation",
                text: "Only the hash is sent to VirusTotal to retrieve an existing analysis report.",
              },
            ].map(({ Icon, title, text }, index) => (
              <div className="process-step" key={title}>
                <span>
                  <Icon size={18} />
                </span>
                <div>
                  <small>0{index + 1}</small>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </section>
          <div className="dataset-note">
            <ShieldCheck size={17} />
            <p>
              <strong>Designed for local research.</strong>Use this tool for
              files you are authorized to inspect. Reputation lookups require an
              internet connection.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
