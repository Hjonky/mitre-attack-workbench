import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Markdown from "react-markdown";
import {
  ArrowUp,
  ArrowUpRight,
  MessageSquare,
  Trash2,
  Search,
  ChartNoAxesCombined,
  Fingerprint,
  Terminal,
  Sparkles,
} from "lucide-react";
import { request, prepareMarkdown } from "../data";
import { PageHeading } from "../components";
const prompts = [
  {
    title: "Explore PowerShell",
    command: "find PowerShell",
    description: "Find techniques behind the tool.",
    Icon: Search,
  },
  {
    title: "See the landscape",
    command: "stats",
    description: "Get a quick dataset overview.",
    Icon: ChartNoAxesCombined,
  },
  {
    title: "Investigate persistence",
    command: "find persistence",
    description: "Understand how access is maintained.",
    Icon: Fingerprint,
  },
  {
    title: "Find your next command",
    command: "help",
    description: "See what you can ask.",
    Icon: Terminal,
  },
];
export default function Assistant() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);
  useEffect(() => {
    if (messages.length)
      end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, busy]);
  async function send(value = message) {
    const text = value.trim();
    if (!text || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    setMessages((previous) => [...previous, { role: "user", content: text }]);
    try {
      const data = await request("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.message,
          techniques: data.techniques,
        },
      ]);
      setContext(data.context || context);
    } catch (err) {
      setError(
        err.message || "Could not reach the assistant. Please try again.",
      );
      setMessage(text);
    } finally {
      setBusy(false);
    }
  }
  function clear() {
    setMessages([]);
    setContext({});
    setError("");
    setMessage("");
  }
  return (
    <>
      <PageHeading
        eyebrow="A STARTING POINT FOR EVERY QUESTION"
        title="Cyber assistant"
        action={
          <button
            className="button secondary"
            onClick={clear}
            disabled={!messages.length || busy}
          >
            <Trash2 size={15} />
            Clear conversation
          </button>
        }
      >
        Find relevant techniques and explore your local knowledge base.
      </PageHeading>
      <div className="assistant-layout">
        <section className="panel chat-panel">
          <div className="chat-header">
            <span className="assistant-symbol">
              <MessageSquare size={18} />
            </span>
            <div>
              <strong>Research assistant</strong>
              <span>Local commands. Focused answers.</span>
            </div>
            <span className="tag teal">Command-based</span>
          </div>
          <div className={`chat-body ${messages.length ? "has-messages" : ""}`}>
            {!messages.length && (
              <div className="chat-welcome">
                <span className="welcome-icon">
                  <Sparkles size={27} />
                </span>
                <div className="eyebrow">LET’S CONNECT THE DOTS</div>
                <h2>
                  Where would you
                  <br />
                  like to begin?
                </h2>
                <p>
                  Search techniques, follow a behavior,
                  <br />
                  or get a fresh perspective on the dataset.
                </p>
                <div className="prompt-grid">
                  {prompts.map(({ title, command, description, Icon }) => (
                    <button
                      key={command}
                      disabled={busy}
                      onClick={() => send(command)}
                    >
                      <Icon size={18} />
                      <strong>{title}</strong>
                      <span>{description}</span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div
              className="chat-messages"
              role="log"
              aria-label="Conversation"
              aria-live="polite"
            >
              {messages.map((item, index) => (
                <div className={`chat-message ${item.role}`} key={index}>
                  <span className="message-avatar">
                    {item.role === "user" ? "YOU" : <MessageSquare size={15} />}
                  </span>
                  <div className="message-content">
                    <span className="message-role">
                      {item.role === "user" ? "You" : "Research assistant"}
                    </span>
                    <div className="markdown">
                      <Markdown>{prepareMarkdown(item.content)}</Markdown>
                    </div>
                    {item.techniques?.length > 0 && (
                      <div className="message-links">
                        {item.techniques.map((item) => (
                          <Link to={`/attack/${item.id}`} key={item.id}>
                            {item.name}
                            <ArrowUpRight size={14} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="thinking" role="status">
                  <span className="spinner" />
                  Searching the knowledge base…
                </div>
              )}
            </div>
            <div ref={end} />
          </div>
          <div className="chat-composer">
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <textarea
                rows={1}
                aria-label="Message the research assistant"
                placeholder="Try “find PowerShell” or “stats”…"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              <button
                type="submit"
                className="send-button"
                aria-label="Send message"
                disabled={busy || !message.trim()}
              >
                <ArrowUp size={20} />
              </button>
            </form>
            <p>
              Enter to send <span>·</span> Shift + Enter for a new line{" "}
              <span>·</span> No generative AI service
            </p>
          </div>
        </section>
        <aside className="assistant-aside">
          <section className="panel command-guide">
            <div className="eyebrow">YOUR FIELD GUIDE</div>
            <h2>A few useful commands.</h2>
            {[
              ["find <query>", "Search technique names and descriptions."],
              ["show", "Read the next result from your latest search."],
              ["stats", "See technique, tactic, and platform counts."],
              [
                "check <hash>",
                "Look up known file reputation with VirusTotal.",
              ],
              ["help", "Bring up the command reference."],
            ].map(([command, text]) => (
              <div className="command-row" key={command}>
                <code>{command}</code>
                <p>{text}</p>
              </div>
            ))}
          </section>
          <div className="dataset-note">
            <span className="status-dot" />
            <p>
              <strong>Your research stays focused.</strong>Technique queries run
              against the local dataset. Hash lookups contact VirusTotal and
              require your API key.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
