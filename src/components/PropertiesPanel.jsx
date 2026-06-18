// src/components/PropertiesPanel.jsx

export default function PropertiesPanel({ selectedEntity, state, dispatch }) {
  if (!selectedEntity) {
    return (
      <div className="properties-panel">
        <p className="placeholder">Please select an entity on the map to view its properties</p>
      </div>
    );
  }

  const { type, id } = selectedEntity;


  const data = type === "anchor"
    ? state.anchors.byId[id]
    : state.walls.byId[id];

  if (!data) {
    return (
      <div className="properties-panel">
        <p className="error">No data found for this entity (ID: {id})</p>
      </div>
    );
  }


  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${type === "anchor" ? "base station" : "wall"}?`)) {
      dispatch({
        type: "DELETE_ENTITY",
        payload: { type, id }
      });
    }
  };

  return (
    <div className="properties-panel">
      <h3>{type === "anchor" ? "Base station properties" : "Wall properties"}</h3>
      <hr />

      <div className="prop-group">
        <label>name:</label>
        <input
          value={data.name || ""}
          onChange={(e) => dispatch({
            type: type === "anchor" ? "UPDATE_ANCHOR" : "UPDATE_WALL",
            payload: { id, changes: { name: e.target.value } }
          })}
        />
      </div>

      {/* Coordinate display */}
      <div className="prop-group">
        <label>Coordinates:</label>
        <span>X: {data.x?.toFixed(2)}, Y: {data.y?.toFixed(2)}</span>
      </div>

      {/* Add/Delete Area */}
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
          Delete Selected
        </button>
      </div>
    </div>
  );
}