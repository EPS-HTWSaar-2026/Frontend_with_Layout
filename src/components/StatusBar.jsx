export default function StatusBar({ activeTool, mouseWorld, selectedLabel }) {
  return (
    <div className="statusbar">
      <span>Tool: {activeTool}</span>
      <span>
        Cursor: X {mouseWorld.x.toFixed(2)} | Y {mouseWorld.y.toFixed(2)}
      </span>
      <span>Selected: {selectedLabel || "None"}</span>
    </div>
  );
}