import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  Shield,
  Compass,
  ChartNoAxesCombined,
  MessageSquare,
  FileScan,
  ArrowUpRight,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  BookOpen,
  CircleHelp,
} from "lucide-react";
import { DatasetProvider } from "./data";
import Explorer from "./pages/Explorer";
import Details from "./pages/Details";
import Analytics from "./pages/Analytics";
import Assistant from "./pages/Assistant";
import Analyzer from "./pages/Analyzer";

const navigation = [
  { to: "/", label: "Technique explorer", Icon: Compass },
  { to: "/stats", label: "Tactic analytics", Icon: ChartNoAxesCombined },
  { to: "/chat", label: "Cyber assistant", Icon: MessageSquare },
  { to: "/sandbox", label: "File analyzer", Icon: FileScan },
];
function Shell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("attack-theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem("attack-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  const current = location.pathname.startsWith("/attack/")
    ? "Technique details"
    : navigation.find((item) => item.to === location.pathname)?.label ||
      "Page not found";
  useEffect(() => {
    document.title = `${current} · ATT&CK Workbench`;
  }, [current]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {menuOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <Link to="/" className="brand">
          <span className="brand-symbol">
            <Shield size={23} strokeWidth={1.8} />
          </span>
          <span>
            ATT&CK<span className="brand-subtitle">WORKBENCH</span>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="workspace-badge">
          <span className="status-dot" />
          <span>Enterprise workspace</span>
          <span className="tiny-tag">LOCAL</span>
        </div>
        <div className="nav-section-label">INVESTIGATE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, label, Icon }) => (
            <NavLink
              end={to === "/"}
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive || (to === "/" && location.pathname.startsWith("/attack/")) ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {to === "/" && <span className="nav-shortcut">01</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="sidebar-note-icon">
              <BookOpen size={18} />
            </span>
            <strong>Built on open knowledge.</strong>
            <p>Explore the behaviors behind real-world cyber threats.</p>
            <a
              href="https://attack.mitre.org/"
              target="_blank"
              rel="noreferrer"
            >
              Visit MITRE ATT&CK
              <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="local-profile">
            <span className="avatar">AW</span>
            <div>
              <strong>Research workspace</strong>
              <span>Local knowledge base</span>
            </div>
            <Shield size={16} />
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{current}</strong>
          </div>
          <div className="topbar-actions">
            <span className="snapshot-label">
              <span className="status-dot" />
              Bundled dataset
            </span>
            <span className="topbar-divider" />
            <button
              className="icon-button theme-toggle"
              onClick={() => setDark(!dark)}
              aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
              title={`Switch to ${dark ? "light" : "dark"} theme`}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              className="icon-button"
              to="/chat"
              aria-label="Open command help"
            >
              <CircleHelp size={19} />
            </Link>
            <span className="top-avatar" aria-hidden="true">
              AW
            </span>
          </div>
        </header>
        <main id="main" className="main-content">
          <Routes>
            <Route path="/" element={<Explorer />} />
            <Route path="/attack/:id" element={<Details />} />
            <Route path="/stats" element={<Analytics />} />
            <Route path="/chat" element={<Assistant />} />
            <Route path="/sandbox" element={<Analyzer />} />
            <Route
              path="*"
              element={
                <div className="empty-state panel">
                  <h1>Page not found</h1>
                  <p>This page isn’t part of the workspace.</p>
                  <Link className="button primary" to="/">
                    Open technique explorer
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
        <footer className="workspace-footer">
          <span>
            ATT&CK Workbench <span className="footer-dot">·</span> Independent
            research project
          </span>
          <span>Knowledge is your first line of defense.</span>
        </footer>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <DatasetProvider>
      <Shell />
    </DatasetProvider>
  );
}
