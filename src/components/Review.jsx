import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import * as Diff from "diff";

// ── Copy Button ──────────────────────────────────────────────
function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={handleCopy} style={{
      position: "absolute", top: "8px", right: "8px",
      background: copied ? "#1a3a1a" : "#1e1e2a",
      color: copied ? "#4ec94e" : "#888",
      border: copied ? "0.5px solid #2a4a2a" : "0.5px solid #3a3a4e",
      borderRadius: "5px", padding: "4px 10px", fontSize: "11px",
      cursor: "pointer", fontFamily: "monospace",
      display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s",
    }}>
      {copied ? "✓ copied" : "⎘ copy"}
    </button>
  );
}

// ── Code Block with Copy ─────────────────────────────────────
function CodeBlock({ children }) {
  const code = String(children).replace(/\n$/, "");
  return (
    <div style={{ position: "relative", margin: "10px 0" }}>
      <pre style={{ background: "#13131a", border: "0.5px solid #2a2a2e", borderRadius: "8px", padding: "12px 14px", paddingTop: "36px", overflowX: "auto", margin: 0 }}>
        <code style={{ color: "#7ec699", fontSize: "12px", fontFamily: "monospace" }}>{code}</code>
      </pre>
      <CopyButton code={code} />
    </div>
  );
}

// ── Diff View ────────────────────────────────────────────────
function DiffView({ originalCode, optimizedCode }) {
  const diffLines = useMemo(() => {
    const diffs = Diff.diffLines(originalCode || "", optimizedCode || "");
    const result = [];
    let origLine = 1, newLine = 1;
    diffs.forEach(part => {
      const lines = part.value.split("\n").filter((_, i, arr) => i < arr.length - 1 || part.value.endsWith("\n") || arr[i] !== "");
      lines.forEach(line => {
        if (part.added) {
          result.push({ type: "added", content: line, newLine: newLine++ });
        } else if (part.removed) {
          result.push({ type: "removed", content: line, origLine: origLine++ });
        } else {
          result.push({ type: "unchanged", content: line, origLine: origLine++, newLine: newLine++ });
        }
      });
    });
    return result;
  }, [originalCode, optimizedCode]);

  const added = diffLines.filter(l => l.type === "added").length;
  const removed = diffLines.filter(l => l.type === "removed").length;

  return (
    <div style={{ margin: "10px 0", borderRadius: "8px", overflow: "hidden", border: "0.5px solid #2a2a2e" }}>
      {/* Diff header */}
      <div style={{ background: "#16161d", padding: "6px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.5px solid #2a2a2e" }}>
        <span style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>diff — original vs optimized</span>
        <div style={{ display: "flex", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "#4ec94e", fontFamily: "monospace" }}>+{added}</span>
          <span style={{ fontSize: "11px", color: "#f07070", fontFamily: "monospace" }}>-{removed}</span>
        </div>
      </div>
      {/* Lines */}
      <div style={{ overflowX: "auto", background: "#0d0d10" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "monospace" }}>
          <tbody>
            {diffLines.map((line, i) => {
              const bg = line.type === "added" ? "rgba(40,100,40,0.25)" : line.type === "removed" ? "rgba(100,30,30,0.25)" : "transparent";
              const color = line.type === "added" ? "#4ec94e" : line.type === "removed" ? "#f07070" : "#888";
              const prefix = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
              return (
                <tr key={i} style={{ background: bg }}>
                  <td style={{ padding: "1px 8px", color: "#333", textAlign: "right", userSelect: "none", minWidth: "32px", borderRight: "0.5px solid #1e1e28" }}>
                    {line.type !== "added" ? line.origLine : ""}
                  </td>
                  <td style={{ padding: "1px 8px", color: "#333", textAlign: "right", userSelect: "none", minWidth: "32px", borderRight: "0.5px solid #1e1e28" }}>
                    {line.type !== "removed" ? line.newLine : ""}
                  </td>
                  <td style={{ padding: "1px 6px", color: color, userSelect: "none", width: "16px" }}>{prefix}</td>
                  <td style={{ padding: "1px 8px 1px 0", color: line.type === "unchanged" ? "#666" : color, whiteSpace: "pre", width: "100%" }}>{line.content}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Extract optimized code from review markdown ──────────────
function extractOptimizedCode(review) {
  const match = review.match(/(?:#{1,3}\s*optimized\s*version[\s\S]*?)```(?:\w+)?\n([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}

// ── Main Review Component ────────────────────────────────────
function Review({ review, loading, originalCode }) {
  const [activeTab, setActiveTab] = useState("review"); // "review" | "diff"

  const optimizedCode = useMemo(() => review ? extractOptimizedCode(review) : null, [review]);

  function handleExport() {
    const blob = new Blob([review], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-review-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div style={{ height: "calc(100vh - 130px)", background: "#0e0e10", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4e9eff", animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "#555", fontFamily: "monospace" }}>analyzing your code...</span>
        <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }`}</style>
      </div>
    );
  }

  if (!review) {
    return (
      <div style={{ height: "calc(100vh - 130px)", background: "#0e0e10", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
        <span style={{ fontSize: "28px" }}>⌨</span>
        <span style={{ fontSize: "13px", color: "#444", fontFamily: "monospace" }}>paste your code and click Review</span>
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100vh - 130px)", display: "flex", flexDirection: "column", background: "#0e0e10" }}>

      {/* Sub-tab bar */}
      <div style={{ background: "#13131a", borderBottom: "0.5px solid #2a2a2e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", flexShrink: 0 }}>
        <div style={{ display: "flex" }}>
          {[
            { key: "review", label: "📋 Review" },
            { key: "diff", label: "⟺ Diff", disabled: !optimizedCode },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              style={{
                background: "transparent", border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #4e9eff" : "2px solid transparent",
                color: tab.disabled ? "#333" : activeTab === tab.key ? "#e0e0e0" : "#555",
                padding: "8px 14px", fontSize: "11px", cursor: tab.disabled ? "not-allowed" : "pointer",
                fontFamily: "monospace", transition: "all 0.2s"
              }}
            >
              {tab.label}
              {tab.key === "diff" && !optimizedCode && (
                <span style={{ fontSize: "9px", color: "#333", marginLeft: "4px" }}>(no optimized code)</span>
              )}
            </button>
          ))}
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          style={{
            background: "#1a2a1a", color: "#4ec94e", border: "0.5px solid #2a4a2a",
            borderRadius: "5px", padding: "4px 12px", fontSize: "11px",
            cursor: "pointer", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "5px",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1e3a1e"}
          onMouseLeave={e => e.currentTarget.style.background = "#1a2a1a"}
        >
          ↓ export .md
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* Review tab */}
        {activeTab === "review" && (
          <div style={{ padding: "16px 20px" }}>
            <style>{`
              .review-content h1, .review-content h2, .review-content h3 {
                color: #4e9eff; font-size: 12px; text-transform: uppercase;
                letter-spacing: 0.8px; margin: 20px 0 8px; font-family: monospace;
                display: flex; align-items: center; gap: 8px;
              }
              .review-content h1::before, .review-content h2::before, .review-content h3::before {
                content: ''; width: 3px; height: 12px; background: #4e9eff;
                border-radius: 2px; display: inline-block; flex-shrink: 0;
              }
              .review-content p { font-size: 12px; color: #999; line-height: 1.7; margin: 6px 0; font-family: monospace; }
              .review-content ul { padding-left: 0; list-style: none; }
              .review-content li { font-size: 12px; color: #888; padding: 4px 10px; border-left: 2px solid #2a2a2e; margin-bottom: 4px; font-family: monospace; line-height: 1.5; }
              .review-content code { background: #1a1a1f; color: #cc99cd; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-family: monospace; }
              ::-webkit-scrollbar { width: 4px; }
              ::-webkit-scrollbar-track { background: #0e0e10; }
              ::-webkit-scrollbar-thumb { background: #2a2a2e; border-radius: 2px; }
            `}</style>
            <div className="review-content">
              <ReactMarkdown
                components={{
                  code({ node, inline, children, ...props }) {
                    if (inline) return <code {...props}>{children}</code>;
                    return <CodeBlock>{children}</CodeBlock>;
                  }
                }}
              >
                {review}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Diff tab */}
        {activeTab === "diff" && optimizedCode && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", color: "#555", fontFamily: "monospace" }}>original vs ai optimized</span>
              <span style={{ fontSize: "11px", background: "#1a2a1a", color: "#4ec94e", padding: "2px 8px", borderRadius: "4px", fontFamily: "monospace" }}>+ added</span>
              <span style={{ fontSize: "11px", background: "#2a1a1a", color: "#f07070", padding: "2px 8px", borderRadius: "4px", fontFamily: "monospace" }}>- removed</span>
            </div>
            <DiffView originalCode={originalCode} optimizedCode={optimizedCode} />
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
              <CopyButton code={optimizedCode} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Review;