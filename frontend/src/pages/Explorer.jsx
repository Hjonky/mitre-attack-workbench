import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  FileScan,
  Layers3,
} from "lucide-react";
import {
  useDataset,
  splitValues,
  titleCase,
  plainText,
  downloadCSV,
} from "../data";
import {
  PageHeading,
  DataState,
  Metrics,
  TechniqueTable,
  SignalGraphic,
} from "../components";

export default function Explorer() {
  return (
    <>
      <PageHeading
        eyebrow="THE ADVERSARY, IN FOCUS"
        title="Technique explorer"
        action={
          <a
            className="button secondary"
            href="https://attack.mitre.org/"
            target="_blank"
            rel="noreferrer"
          >
            ATT&CK knowledge base
            <ArrowUpRight size={16} />
          </a>
        }
      >
        Explore adversary behavior. Turn intelligence into understanding.
      </PageHeading>
      <DataState>
        <ExplorerContent />
      </DataState>
    </>
  );
}
function ExplorerContent() {
  const { attacks, stats } = useDataset();
  const [params, setParams] = useSearchParams();
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  const [page, setPage] = useState(1);
  const search = params.get("q") || "";
  const platform = params.get("platform") || "";
  const tactic = params.get("tactic") || "";
  const deferredSearch = useDeferredValue(search);
  function update(key, value) {
    const next = new URLSearchParams(paramsRef.current);
    if (value) next.set(key, value);
    else next.delete(key);
    paramsRef.current = next;
    setParams(next, { replace: true });
    setPage(1);
  }
  function clear() {
    paramsRef.current = new URLSearchParams();
    setParams({});
    setPage(1);
  }
  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return attacks.filter(
      (attack) =>
        (!platform || splitValues(attack.platforms).includes(platform)) &&
        (!tactic || splitValues(attack.phase_name).includes(tactic)) &&
        (!query ||
          [
            attack.name,
            plainText(attack.description),
            attack.technique_id || "",
            attack.id,
          ].some((value) => value.toLowerCase().includes(query))),
    );
  }, [attacks, deferredSearch, platform, tactic]);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  return (
    <>
      <section className="intro-banner">
        <div className="intro-copy">
          <div className="intro-label">
            <span className="status-dot" />
            ENTERPRISE ATT&CK
          </div>
          <h2>
            Know the behavior.
            <br />
            <span>Understand the threat.</span>
          </h2>
          <p>
            A connected view of the techniques, tactics, and platforms
            <br className="desktop-break" /> that shape the adversary landscape.
          </p>
        </div>
        <SignalGraphic />
        <div className="banner-index">
          <span>YOUR RESEARCH STARTS HERE</span>
          <strong>
            Intelligence.
            <br />
            With perspective.
          </strong>
          <Link to="/stats">
            Explore the landscape
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <Metrics />
      <div className="explorer-layout">
        <section className="panel library">
          <div className="panel-heading">
            <div>
              <h2>
                Technique library{" "}
                <span className="count-pill">{attacks.length}</span>
              </h2>
              <p>Search the knowledge base. Follow the behavior.</p>
            </div>
            <button
              className="button secondary small"
              disabled={!filtered.length}
              onClick={() => downloadCSV(filtered)}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
          <div className="filter-bar">
            <div className="search-field">
              <Search size={18} />
              <input
                aria-label="Search techniques"
                placeholder="Search techniques, keywords, or IDs…"
                value={search}
                onChange={(event) => update("q", event.target.value)}
              />
              {search && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => update("q", "")}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="filter-selects">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <select
                aria-label="Filter by platform"
                value={platform}
                onChange={(event) => update("platform", event.target.value)}
              >
                <option value="">All platforms</option>
                {stats.platforms.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </select>
              <select
                aria-label="Filter by tactic"
                value={tactic}
                onChange={(event) => update("tactic", event.target.value)}
              >
                <option value="">All tactics</option>
                {[...stats.phases]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item) => (
                    <option key={item.name} value={item.name}>
                      {titleCase(item.name)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="results-label" aria-live="polite">
            <span>
              <strong>{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "technique" : "techniques"}{" "}
              {search || tactic || platform
                ? "match your filters"
                : "ready to explore"}
            </span>
            {(search || tactic || platform) && (
              <button className="text-button" onClick={clear}>
                Reset filters
                <X size={12} />
              </button>
            )}
            <span className="sort-note">NAME A–Z</span>
          </div>
          <TechniqueTable
            attacks={filtered.slice(
              (current - 1) * pageSize,
              current * pageSize,
            )}
            emptyAction={
              <button className="button secondary" onClick={clear}>
                Clear all filters
              </button>
            }
          />
          {filtered.length > 0 && (
            <div className="pagination">
              <span>
                Showing{" "}
                <strong>
                  {(current - 1) * pageSize + 1}–
                  {Math.min(current * pageSize, filtered.length)}
                </strong>{" "}
                of {filtered.length}
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Previous page"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <span>
                  Page <strong>{current}</strong> of {pages}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next page"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </section>
        <aside className="insight-rail">
          <section className="panel spotlight">
            <div className="rail-heading">
              <span className="soft-icon">
                <Layers3 size={17} />
              </span>
              <h2>Tactic spotlight</h2>
            </div>
            <p>
              The most represented tactics
              <br />
              in this dataset.
            </p>
            <div className="mini-chart">
              {stats.phases.slice(0, 5).map((item) => (
                <Link
                  to={`/?tactic=${encodeURIComponent(item.name)}`}
                  className="mini-chart-item"
                  key={item.name}
                >
                  <div>
                    <span>{titleCase(item.name)}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="bar-track">
                    <span
                      style={{
                        width: `${(item.count / stats.phases[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
            <Link className="rail-link" to="/stats">
              View tactic analytics
              <ArrowUpRight size={16} />
            </Link>
          </section>
          <section className="panel quick-tools">
            <div className="eyebrow">GO A LITTLE DEEPER</div>
            <h2>Your investigation toolkit.</h2>
            <Link to="/chat" className="tool-link">
              <span className="tool-icon">
                <MessageSquare size={19} />
              </span>
              <span>
                <strong>Ask the assistant</strong>
                <small>Find a starting point.</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
            <Link to="/sandbox" className="tool-link">
              <span className="tool-icon blue">
                <FileScan size={19} />
              </span>
              <span>
                <strong>Inspect a file</strong>
                <small>Check known reputation.</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          </section>
          <div className="dataset-note">
            <span className="status-dot" />
            <p>
              <strong>Open knowledge. Local access.</strong>This is a bundled
              ATT&CK snapshot. Counts reflect this dataset, not a live feed.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
