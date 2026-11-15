import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Layers3, Monitor, X, Info } from "lucide-react";
import { useDataset, titleCase, splitValues } from "../data";
import { PageHeading, DataState, Metrics, TechniqueTable } from "../components";
export default function Analytics() {
  return (
    <>
      <PageHeading eyebrow="THE BIGGER PICTURE" title="Tactic analytics">
        See how adversary behavior is distributed across the knowledge base.
      </PageHeading>
      <DataState>
        <AnalyticsContent />
      </DataState>
    </>
  );
}
function AnalyticsContent() {
  const { stats, attacks } = useDataset();
  const [selected, setSelected] = useState("");
  const results = selected
    ? attacks.filter((attack) =>
        splitValues(attack.phase_name).includes(selected),
      )
    : [];
  return (
    <>
      <Metrics />
      <div className="analytics-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">ADVERSARY LIFECYCLE</div>
              <h2>Techniques by tactic</h2>
              <p>Select a tactic to explore its techniques.</p>
            </div>
            <span className="soft-icon">
              <Layers3 size={20} />
            </span>
          </div>
          <div className="horizontal-chart">
            {stats.phases.map((item) => (
              <button
                key={item.name}
                className={`chart-row ${selected === item.name ? "selected" : ""}`}
                aria-pressed={selected === item.name}
                onClick={() =>
                  setSelected(selected === item.name ? "" : item.name)
                }
              >
                <span className="chart-label">{titleCase(item.name)}</span>
                <span className="chart-track">
                  <span
                    style={{
                      width: `${(item.count / stats.phases[0].count) * 100}%`,
                    }}
                  />
                </span>
                <strong>{item.count}</strong>
              </button>
            ))}
          </div>
          <div className="chart-footnote">
            <Info size={15} />
            <span>
              Each technique can map to multiple tactics. Counts represent
              mappings, so they may add up to more than the total number of
              techniques.
            </span>
          </div>
        </section>
        <section className="panel chart-panel platforms-chart">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">ENVIRONMENT COVERAGE</div>
              <h2>Platform distribution</h2>
              <p>Where these techniques can apply.</p>
            </div>
            <span className="soft-icon blue">
              <Monitor size={20} />
            </span>
          </div>
          <div className="platform-bars">
            {stats.platforms.map((item) => (
              <Link
                className="platform-bar"
                key={item.name}
                to={`/?platform=${encodeURIComponent(item.name)}`}
              >
                <div>
                  <span>{item.name}</span>
                  <strong>
                    {item.count}
                    <ArrowUpRight size={13} />
                  </strong>
                </div>
                <div className="bar-track">
                  <span
                    style={{ width: `${(item.count / stats.total) * 100}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
          <p className="platform-note">
            Counts reflect techniques mapped to each platform in the bundled
            snapshot.
          </p>
        </section>
      </div>
      {selected && (
        <section className="panel selected-techniques">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">TACTIC DEEP DIVE</div>
              <h2>
                {titleCase(selected)}
                <span className="count-pill">{results.length}</span>
              </h2>
            </div>
            <button
              className="icon-button"
              aria-label="Clear selected tactic"
              onClick={() => setSelected("")}
            >
              <X size={18} />
            </button>
          </div>
          <TechniqueTable attacks={results.slice(0, 6)} />
          <div className="panel-bottom">
            <span>Previewing {Math.min(results.length, 6)} techniques</span>
            <Link
              className="text-link"
              to={`/?tactic=${encodeURIComponent(selected)}`}
            >
              Explore all {results.length} techniques
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
