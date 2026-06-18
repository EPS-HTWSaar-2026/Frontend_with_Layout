export default function Toolbar({ activeTool, onSetTool }) {
  const tools = [
    { id: 'anchor', label: 'ESPs', icon: 'Add ESP' },
    { id: 'wall', label: 'Wall', icon: 'Add Wall' },
  ];

  return (
    <div className="toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={activeTool === tool.id ? "active" : ""}
          onClick={() =>
            onSetTool(activeTool === tool.id ? null : tool.id)
          }
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

