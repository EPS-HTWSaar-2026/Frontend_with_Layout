// src/components/PropertiesPanel.jsx

export default function PropertiesPanel({ selectedEntity, state, dispatch }) {
  // 如果没有选中任何东西，直接返回提示
  if (!selectedEntity) {
    return (
      <div className="properties-panel">
        <p className="placeholder">请选择地图上的实体查看属性</p>
      </div>
    );
  }

  const { type, id } = selectedEntity;

  // 安全地获取实体数据
  const data = type === "anchor"
    ? state.anchors.byId[id]
    : state.walls.byId[id];

  // 如果数据不存在（比如刚被删除），显示错误提示
  if (!data) {
    return (
      <div className="properties-panel">
        <p className="error">未找到该实体的数据 (ID: {id})</p>
      </div>
    );
  }

  // 处理删除逻辑
  const handleDelete = () => {
    // 增加一个简单的确认，防止误删
    if (window.confirm(`确定要删除这个${type === "anchor" ? "基站" : "墙体"}吗？`)) {
      dispatch({
        type: "DELETE_ENTITY",
        payload: { type, id }
      });
    }
  };

  return (
    <div className="properties-panel">
      <h3>{type === "anchor" ? "基站属性" : "墙体属性"}</h3>
      <hr />

      <div className="prop-group">
        <label>名称:</label>
        <input
          value={data.name || ""}
          onChange={(e) => dispatch({
            type: type === "anchor" ? "UPDATE_ANCHOR" : "UPDATE_WALL",
            payload: { id, changes: { name: e.target.value } }
          })}
        />
      </div>

      <div className="prop-group">
        <label>ID:</label>
        <span>{id}</span>
      </div>

      {/* 坐标显示（可选，方便调试） */}
      <div className="prop-group">
        <label>坐标:</label>
        <span>X: {data.x?.toFixed(2)}, Y: {data.y?.toFixed(2)}</span>
      </div>

      {/* 🔥 新增删除区域 */}
      <div className="delete-section" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
        <button
          className="delete-btn"
          onClick={handleDelete}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          删除选中项
        </button>
      </div>
    </div>
  );
}