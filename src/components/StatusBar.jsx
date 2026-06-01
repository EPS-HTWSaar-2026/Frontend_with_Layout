export default function StatusBar({ activeTool, mouseWorld, selectedLabel }) {
  const x = mouseWorld?.x ?? 0;
  const y = mouseWorld?.y ?? 0;

  return (
    <div className="statusbar">
      <span>Tool: {activeTool}</span>

      <span>
        Cursor: X {x.toFixed(2)} | Y {y.toFixed(2)}
      </span>

      <span>Selected: {selectedLabel || "None"}</span>
    </div>
  );
}