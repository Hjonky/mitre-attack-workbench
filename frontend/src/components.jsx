import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  AlertCircle,
  Database,
  Layers3,
  Monitor,
  ShieldCheck,
  RefreshCw,
  SearchX,
} from "lucide-react";
import {
  useDataset,
  splitValues,
  titleCase,
  plainText,
  recordLabel,
} from "./data";

export function PageHeading({ eyebrow, title, children, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}
export function DataState({ children }) {
  const { loading, error, retry } = useDataset();
  if (loading)
    return (
      <div className="loading-state" role="status">
        <span className="spinner" />
        <h2>Opening your workspace</h2>
        <p>Loading the local ATT&CK knowledge base…</p>
      </div>
    );
  if (error)
    return (
      <div className="empty-state panel" role="alert">
        <AlertCircle size={32} />
        <h2>Connection interrupted</h2>
        <p>{error}</p>
        <button className="button primary" onClick={retry}>
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  return children;
}
export function Metrics() {
  const { stats } = useDataset();
  const metrics = [
    {
      label: "Techniques indexed",
      value: stats.total.toLocaleString(),
      note: "In your local knowledge base",
      Icon: Database,
    },
    {
      label: "Tactics covered",
      value: stats.phases.length.toString().padStart(2, "0"),
      note: "Across the adversary lifecycle",
      Icon: Layers3,
    },
    {
      label: "Platforms mapped",
      value: stats.platforms.length.toString().padStart(2, "0"),
      note: "From endpoints to the cloud",
      Icon: Monitor,
    },
    {
      label: "Dataset access",
      value: "Local",
      note: "Explore without an API key",
      Icon: ShieldCheck,
    },
  ];
  return (
    <div className="metrics">
      {metrics.map(({ label, value, note, Icon }) => (
        <div className="metric panel" key={label}>
          <div className="metric-top">
            <span>{label}</span>
            <Icon size={18} />
          </div>
          <strong>{value}</strong>
          <span className="metric-note">{note}</span>
        </div>
      ))}
    </div>
  );
}
export function TacticTag({ name }) {
  const tone = /execution|impact|credential/.test(name)
    ? "amber"
    : /discovery|reconnaissance|collection/.test(name)
      ? "blue"
      : "teal";
  return <span className={`tag ${tone}`}>{titleCase(name)}</span>;
}
export function TechniqueTable({ attacks, emptyAction }) {
  if (!attacks.length)
    return (
      <div className="empty-state">
        <SearchX size={32} />
        <h3>No matching techniques</h3>
        <p>Try a different keyword or broaden your filters.</p>
        {emptyAction}
      </div>
    );
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Technique results"
      tabIndex={0}
    >
      <table className="technique-table">
        <thead>
          <tr>
            <th scope="col">Technique</th>
            <th scope="col">Tactic</th>
            <th scope="col">Platforms</th>
            <th scope="col">
              <span className="sr-only">Open technique</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {attacks.map((attack) => (
            <tr key={attack.id}>
              <td>
                <span className="record-id">{recordLabel(attack)}</span>
                <Link className="technique-name" to={`/attack/${attack.id}`}>
                  {attack.name}
                </Link>
                <p className="technique-excerpt">
                  {plainText(attack.description)}
                </p>
              </td>
              <td>
                <div className="tag-stack">
                  {splitValues(attack.phase_name)
                    .slice(0, 2)
                    .map((name) => (
                      <TacticTag name={name} key={name} />
                    ))}
                  {splitValues(attack.phase_name).length > 2 && (
                    <span className="more-label">
                      +{splitValues(attack.phase_name).length - 2} more
                    </span>
                  )}
                </div>
              </td>
              <td>
                <div className="platform-list">
                  {splitValues(attack.platforms)
                    .slice(0, 2)
                    .map((platform) => (
                      <span key={platform}>{platform}</span>
                    ))}
                  {splitValues(attack.platforms).length > 2 && (
                    <span className="more-label" title={attack.platforms}>
                      +{splitValues(attack.platforms).length - 2} more
                    </span>
                  )}
                </div>
              </td>
              <td>
                <Link
                  className="table-open"
                  to={`/attack/${attack.id}`}
                  aria-label={`Open ${attack.name}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function SignalGraphic() {
  return (
    <svg
      className="signal-graphic"
      viewBox="0 0 290 180"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" stroke="currentColor" strokeOpacity=".13" />
        </pattern>
        <linearGradient id="beam" x1="145" y1="90" x2="250" y2="20">
          <stop stopColor="#86efbf" stopOpacity=".25" />
          <stop offset="1" stopColor="#86efbf" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="290" height="180" fill="url(#grid)" />
      <g stroke="currentColor" strokeOpacity=".24">
        <circle cx="145" cy="90" r="68" />
        <circle cx="145" cy="90" r="46" />
        <circle cx="145" cy="90" r="23" />
        <path d="M145 9v162M64 90h162" />
      </g>
      <path d="M145 90 196 43A68 68 0 0 1 213 90Z" fill="url(#beam)" />
      <path
        d="m94 120 51-30 39 20 21-62"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      {[
        [94, 120],
        [145, 90],
        [184, 110],
        [205, 48],
      ].map(([cx, cy]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r="9" fill="#86efbf" fillOpacity=".12" />
          <circle cx={cx} cy={cy} r="3" fill="#a5f3cc" />
        </g>
      ))}
      <path
        d="M12 28V12h16M262 12h16v16M12 152v16h16M262 168h16v-16"
        stroke="currentColor"
        strokeOpacity=".5"
      />
    </svg>
  );
}
