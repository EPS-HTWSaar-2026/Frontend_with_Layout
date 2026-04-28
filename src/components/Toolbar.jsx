const tools = [
  { id: "select", label: "Select" },
  { id: "pan", label: "Pan" },
  { id: "wall", label: "Wall" },
  { id: "anchor", label: "Place ESP" },
];

export default function Toolbar({
  activeTool,
  onToolChange,
  onDeleteSelected,
  onToggleGrid,
  onToggleSnap,
  showGrid,
  snapToGrid,
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-group">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={activeTool === tool.id ? "active" : ""}
            onClick={() => onToolChange(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="toolbar-group">
        <button onClick={onDeleteSelected}>Delete Selected</button>
        <button onClick={onToggleGrid}>{showGrid ? "Hide Grid" : "Show Grid"}</button>
        <button onClick={onToggleSnap}>{snapToGrid ? "Snap On" : "Snap Off"}</button>
      </div>
    </div>
  );
}