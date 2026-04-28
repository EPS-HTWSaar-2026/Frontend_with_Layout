function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export default function PropertiesPanel({
  mapMeta,
  selectedAnchor,
  selectedWall,
  environmentProfiles,
  onMapMetaChange,
  onAnchorChange,
  onWallChange,
}) {
  return (
    <div className="properties-panel">
      <section className="properties-section">
        <h2>Map Settings</h2>

        <label>
          Map name
          <input
            value={mapMeta.name}
            onChange={(e) => onMapMetaChange({ name: e.target.value })}
          />
        </label>

        <label>
          Width (m)
          <input
            type="number"
            step="0.1"
            value={mapMeta.width}
            onChange={(e) =>
              onMapMetaChange({ width: toNumber(e.target.value, mapMeta.width) })
            }
          />
        </label>

        <label>
          Height (m)
          <input
            type="number"
            step="0.1"
            value={mapMeta.height}
            onChange={(e) =>
              onMapMetaChange({ height: toNumber(e.target.value, mapMeta.height) })
            }
          />
        </label>

        <label>
          Grid size (m)
          <input
            type="number"
            step="0.1"
            value={mapMeta.gridSize}
            onChange={(e) =>
              onMapMetaChange({
                gridSize: toNumber(e.target.value, mapMeta.gridSize),
              })
            }
          />
        </label>

        <label>
          Scale (px/m)
          <input
            type="number"
            step="1"
            value={mapMeta.scale}
            onChange={(e) =>
              onMapMetaChange({ scale: toNumber(e.target.value, mapMeta.scale) })
            }
          />
        </label>
      </section>

      {selectedAnchor ? (
        <section className="properties-section">
          <h2>Selected ESP</h2>

          <label>
            Name
            <input
              value={selectedAnchor.name}
              onChange={(e) => onAnchorChange({ name: e.target.value })}
            />
          </label>

          <label>
            Anchor ID
            <input
              value={selectedAnchor.anchorId}
              onChange={(e) => onAnchorChange({ anchorId: e.target.value })}
            />
          </label>

          <label>
            X
            <input
              type="number"
              step="0.1"
              value={selectedAnchor.x}
              onChange={(e) => onAnchorChange({ x: toNumber(e.target.value, selectedAnchor.x) })}
            />
          </label>

          <label>
            Y
            <input
              type="number"
              step="0.1"
              value={selectedAnchor.y}
              onChange={(e) => onAnchorChange({ y: toNumber(e.target.value, selectedAnchor.y) })}
            />
          </label>

          <label>
            Z
            <input
              type="number"
              step="0.1"
              value={selectedAnchor.z}
              onChange={(e) => onAnchorChange({ z: toNumber(e.target.value, selectedAnchor.z) })}
            />
          </label>

          <label>
            Environment profile
            <select
              value={selectedAnchor.environmentProfile}
              onChange={(e) => {
                const profileId = e.target.value;
                const profile = environmentProfiles.byId[profileId];
                onAnchorChange({
                  environmentProfile: profileId,
                  nValue: profile.nValue,
                  rssiBase: profile.rssiBaseDefault,
                });
              }}
            >
              {environmentProfiles.allIds.map((profileId) => (
                <option key={profileId} value={profileId}>
                  {environmentProfiles.byId[profileId].name}
                </option>
              ))}
            </select>
          </label>

          <label>
            N-value
            <input
              type="number"
              step="0.1"
              value={selectedAnchor.nValue}
              onChange={(e) =>
                onAnchorChange({
                  nValue: toNumber(e.target.value, selectedAnchor.nValue),
                })
              }
            />
          </label>

          <label>
            RSSI base
            <input
              type="number"
              step="1"
              value={selectedAnchor.rssiBase}
              onChange={(e) =>
                onAnchorChange({
                  rssiBase: toNumber(e.target.value, selectedAnchor.rssiBase),
                })
              }
            />
          </label>

          <label>
            Color
            <input
              type="color"
              value={selectedAnchor.color}
              onChange={(e) => onAnchorChange({ color: e.target.value })}
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={selectedAnchor.isActive}
              onChange={(e) => onAnchorChange({ isActive: e.target.checked })}
            />
            Active
          </label>

          <label>
            Notes
            <textarea
              rows="3"
              value={selectedAnchor.notes}
              onChange={(e) => onAnchorChange({ notes: e.target.value })}
            />
          </label>
        </section>
      ) : null}

      {selectedWall ? (
        <section className="properties-section">
          <h2>Selected Wall</h2>

          <label>
            X1
            <input
              type="number"
              step="0.1"
              value={selectedWall.x1}
              onChange={(e) => onWallChange({ x1: toNumber(e.target.value, selectedWall.x1) })}
            />
          </label>

          <label>
            Y1
            <input
              type="number"
              step="0.1"
              value={selectedWall.y1}
              onChange={(e) => onWallChange({ y1: toNumber(e.target.value, selectedWall.y1) })}
            />
          </label>

          <label>
            X2
            <input
              type="number"
              step="0.1"
              value={selectedWall.x2}
              onChange={(e) => onWallChange({ x2: toNumber(e.target.value, selectedWall.x2) })}
            />
          </label>

          <label>
            Y2
            <input
              type="number"
              step="0.1"
              value={selectedWall.y2}
              onChange={(e) => onWallChange({ y2: toNumber(e.target.value, selectedWall.y2) })}
            />
          </label>

          <label>
            Thickness
            <input
              type="number"
              step="0.01"
              value={selectedWall.thickness}
              onChange={(e) =>
                onWallChange({ thickness: toNumber(e.target.value, selectedWall.thickness) })
              }
            />
          </label>

          <label>
            Material
            <input
              value={selectedWall.material}
              onChange={(e) => onWallChange({ material: e.target.value })}
            />
          </label>

          <label>
            Label
            <input
              value={selectedWall.label}
              onChange={(e) => onWallChange({ label: e.target.value })}
            />
          </label>
        </section>
      ) : null}

      {!selectedAnchor && !selectedWall ? (
        <section className="properties-section">
          <h2>Selection</h2>
          <p>Select a wall or an ESP to edit its properties.</p>
        </section>
      ) : null}
    </div>
  );
}