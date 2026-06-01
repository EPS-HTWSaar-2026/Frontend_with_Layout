// 修改后的 Toolbar.jsx
// 确保解构出来的名字是 onSetTool (对应 App.jsx 传进来的名字)
export default function Toolbar({ activeTool, onSetTool }) {
  const tools = [
    { id: 'select', label: '选择', icon: '🖱️' },
    { id: 'pan', label: '平移', icon: '🖐️' },
    { id: 'anchor', label: '基站', icon: '📡' },
    { id: 'wall', label: '墙体', icon: '🧱' },
  ];

  return (
    <div className="toolbar">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={activeTool === tool.id ? "active" : ""}
          // 这里的函数名必须是 onSetTool
          onClick={() => onSetTool(tool.id)}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}