import { useRef } from "react";

export default function TopBar({ mapName, onExport, onImport, onReset }) {
  const fileInputRef = useRef(null);

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        const parsed = JSON.parse(content);
        onImport(parsed);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);

    event.target.value = "";
  }

  return (
    <div className="topbar">
      <div>
        <h1>Mine Layout Editor</h1>
        <p>{mapName}</p>
      </div>

      <div className="topbar-actions">
        <button onClick={onExport}>Export JSON</button>
        <button onClick={handleImportClick}>Import JSON</button>
        <button className="danger" onClick={onReset}>New Layout</button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}