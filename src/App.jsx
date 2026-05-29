import { useState, useRef, useEffect } from "react";
import Editor from "./components/Editor";
import Review from "./components/Review";
import { reviewCode, generateCode } from "./groq";

function App() {
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [originalCode, setOriginalCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  const [rightTab, setRightTab] = useState("review"); // "review" | "generate"
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: "Hi! Tell me what code to write.\nExample: \"write a debounce function\" or \"binary search in python\"" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (rightTab === "generate") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, rightTab]);

  async function handleReview() {
    if (!code.trim()) return;
    setLoading(true);
    setOriginalCode(code);
    try {
      const result = await reviewCode(code);
      setReview(result);
    } catch (error) {
      setReview("Error: " + error.message);
    }
    setLoading(false);
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);
    try {
      const generated = await generateCode(userMsg, language);
      setChatMessages(prev => [...prev, { role: "ai", text: "Done! Code added to editor. Switch to Review tab to analyze it." }]);
      setCode(generated);
      setReview("");
      setTimeout(() => setRightTab("review"), 1200);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "ai", text: "Error: " + err.message }]);
    }
    setChatLoading(false);
  }

  function handleChatKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  }

  const [theme, setTheme] = useState("dark");
  const [codeCopied, setCodeCopied] = useState(false);

  const themes = {
    dark:    { bg: "#0e0e10", bar: "#1a1a1f", border: "#2a2a2e", text: "#e0e0e0", muted: "#555", editorTheme: "vs-dark" },
    light:   { bg: "#f5f5f5", bar: "#ffffff", border: "#ddd",    text: "#1a1a1a", muted: "#888", editorTheme: "light"   },
    monokai: { bg: "#272822", bar: "#1e1f1c", border: "#3a3a2e", text: "#f8f8f2", muted: "#75715e", editorTheme: "vs-dark" },
  };
  const t = themes[theme];

  function handleCopyCode() {
    if (!code.trim()) return;
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  const themeOrder = ["dark", "light", "monokai"];
  const themeLabels = { dark: "🌑 dark", light: "☀ light", monokai: "🎨 monokai" };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "monospace", display: "flex", flexDirection: "column" }}>

      {/* Titlebar */}
      <div style={{ background: t.bar, borderBottom: `0.5px solid ${t.border}`, padding: "0 16px", height: "38px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: "12px", color: t.muted, letterSpacing: "0.3px" }}>AI Code Reviewer</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Copy editor code */}
          <button
            onClick={handleCopyCode}
            disabled={!code.trim()}
            style={{
              background: codeCopied ? "#1a3a1a" : "transparent",
              color: codeCopied ? "#4ec94e" : code.trim() ? t.muted : "#333",
              border: `0.5px solid ${codeCopied ? "#2a4a2a" : t.border}`,
              borderRadius: "5px", padding: "3px 10px", fontSize: "11px",
              cursor: code.trim() ? "pointer" : "not-allowed", fontFamily: "monospace",
              display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s",
            }}
          >
            {codeCopied ? "✓ copied" : "⎘ copy code"}
          </button>
          {/* Theme switcher */}
          <button
            onClick={() => setTheme(th => themeOrder[(themeOrder.indexOf(th) + 1) % themeOrder.length])}
            style={{
              background: "transparent", color: t.muted,
              border: `0.5px solid ${t.border}`,
              borderRadius: "5px", padding: "3px 10px", fontSize: "11px",
              cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s",
            }}
          >
            {themeLabels[theme]}
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ background: t.bar, borderBottom: `0.5px solid ${t.border}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", background: "#1e3a5f", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>⌨</div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "500", color: "#e0e0e0" }}>AI Code Reviewer</div>
            <div style={{ fontSize: "11px", color: "#555" }}>Powered by Groq · LLaMA 3.3-70B</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ background: "#1a1a1f", color: "#888", border: "0.5px solid #2a2a2e", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", fontFamily: "monospace", cursor: "pointer" }}
          >
            {["javascript", "typescript", "python", "java", "cpp"].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* AI Generate button */}
          <button
            onClick={() => setRightTab(t => t === "generate" ? "review" : "generate")}
            style={{
              background: rightTab === "generate" ? "#2a1a4a" : "#1a1a2e",
              color: rightTab === "generate" ? "#cc99cd" : "#888",
              border: rightTab === "generate" ? "1px solid #8855cc" : "0.5px solid #2a2a2e",
              padding: "7px 16px", borderRadius: "6px", fontSize: "12px",
              cursor: "pointer", fontFamily: "monospace", fontWeight: "600",
              display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s",
              boxShadow: rightTab === "generate" ? "0 0 12px rgba(136,85,204,0.4)" : "none",
            }}
          >
            ✦ Generate
          </button>

          <button
            onClick={handleReview}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#2a5fa8" }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1a56c4" }}
            style={{
              background: loading ? "#162a45" : "#1a56c4",
              color: loading ? "#555" : "#ffffff",
              border: loading ? "0.5px solid #2a2a2e" : "1px solid #4e9eff",
              padding: "7px 20px", borderRadius: "6px", fontSize: "12px",
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace",
              fontWeight: "600", display: "flex", alignItems: "center", gap: "6px",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 0 12px rgba(78,158,255,0.4), 0 0 24px rgba(78,158,255,0.15)",
              letterSpacing: "0.3px"
            }}
          >
            {loading ? "⟳ Reviewing..." : "▶ Review Code"}
          </button>
        </div>
      </div>

      {/* Main panels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, minHeight: 0 }}>
        {/* Editor panel */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: "0.5px solid #2a2a2e" }}>
          <div style={{ background: "#16161d", padding: "6px 14px", borderBottom: "0.5px solid #2a2a2e", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4e9eff" }} />
            <span style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px" }}>editor</span>
            <span style={{ fontSize: "11px", color: "#333", marginLeft: "auto" }}>{language}</span>
          </div>
          <div style={{ flex: 1 }}>
            <Editor code={code} setCode={setCode} language={language} editorTheme={t.editorTheme} />
          </div>
        </div>

        {/* Right panel — tabbed */}
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Tab bar */}
          <div style={{ background: "#16161d", borderBottom: "0.5px solid #2a2a2e", display: "flex", alignItems: "stretch" }}>
            {[
              { key: "review", label: "▶ AI Review", dot: loading ? "#febc2e" : review ? "#28c840" : "#555", dotColor: loading ? "#febc2e" : review ? "#4ec94e" : "#444", status: loading ? "analyzing..." : review ? "ready" : "waiting" },
              { key: "generate", label: "✦ Generate", dot: "#cc99cd", dotColor: "#cc99cd", status: "chat" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setRightTab(tab.key)}
                style={{
                  flex: 1, background: rightTab === tab.key ? "#0e0e10" : "transparent",
                  color: rightTab === tab.key ? "#e0e0e0" : "#555",
                  border: "none", borderTop: rightTab === tab.key ? (tab.key === "review" ? "1px solid #4e9eff" : "1px solid #8855cc") : "1px solid transparent",
                  borderRight: "0.5px solid #2a2a2e", padding: "7px 14px", fontSize: "12px",
                  cursor: "pointer", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "8px",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: rightTab === tab.key ? tab.dot : "#333", flexShrink: 0 }} />
                {tab.label}
                {rightTab === tab.key && (
                  <span style={{ fontSize: "10px", color: tab.dotColor, marginLeft: "auto" }}>{tab.status}</span>
                )}
              </button>
            ))}
          </div>

          {/* Review tab */}
          {rightTab === "review" && (
            <div style={{ flex: 1 }}>
              <Review review={review} loading={loading} originalCode={originalCode} />
            </div>
          )}

          {/* Generate tab */}
          {rightTab === "generate" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0f0f18" }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "80%", padding: "8px 12px",
                      borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                      background: msg.role === "user" ? "#1e3a5f" : "#1a1a2e",
                      border: msg.role === "user" ? "0.5px solid #2d5f9e" : "0.5px solid #2a2a3e",
                      fontSize: "12px", color: msg.role === "user" ? "#7ab8f5" : "#cc99cd",
                      fontFamily: "monospace", lineHeight: "1.6", whiteSpace: "pre-wrap"
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", gap: "5px", padding: "4px 0" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#8855cc", animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "10px 14px", borderTop: "0.5px solid #2a2a2e", display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  placeholder={`Describe code in ${language}... (Enter to send)`}
                  rows={2}
                  style={{
                    flex: 1, background: "#13131a", color: "#e0e0e0", border: "0.5px solid #2a2a3e",
                    borderRadius: "6px", padding: "8px 12px", fontSize: "12px", fontFamily: "monospace",
                    resize: "none", outline: "none", lineHeight: "1.5"
                  }}
                />
                <button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    background: chatLoading || !chatInput.trim() ? "#1a1a2e" : "#5522aa",
                    color: chatLoading || !chatInput.trim() ? "#444" : "#fff",
                    border: "0.5px solid #3a2a5e", borderRadius: "6px", padding: "8px 14px",
                    fontSize: "12px", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                    fontFamily: "monospace", fontWeight: "600", transition: "all 0.2s",
                    boxShadow: !chatLoading && chatInput.trim() ? "0 0 10px rgba(136,85,204,0.4)" : "none"
                  }}
                >
                  ↑ Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statusbar */}
      <div style={{ background: "#1a4a8a", padding: "3px 14px", display: "flex", gap: "12px", flexShrink: 0 }}>
        {["LLaMA 3.3 · 70B", "·", language, "·", "AI Code Reviewer v1.0"].map((item, i) => (
          <span key={i} style={{ fontSize: "11px", color: "#7ab8f5", fontFamily: "monospace" }}>{item}</span>
        ))}
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

export default App;