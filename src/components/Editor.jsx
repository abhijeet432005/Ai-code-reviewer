import MonacoEditor from "@monaco-editor/react";

function Editor({ code, setCode, language = "javascript", editorTheme = "vs-dark" }) {
  return (
    <MonacoEditor
      height="calc(100vh - 130px)"
      theme={editorTheme}
      language={language}
      value={code}
      onChange={(value) => setCode(value || "")}
      options={{
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        padding: { top: 12, bottom: 12 },
        lineNumbersMinChars: 3,
        folding: true,
        bracketPairColorization: { enabled: true },
        tabSize: 2,
      }}
    />
  );
}

export default Editor;