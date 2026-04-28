import { useEffect, useMemo, useState, useReducer } from "react";
import { createDefaultState } from "./state/initialState";
import { layoutReducer } from "./state/layoutReducer";
import TopBar from "./components/TopBar";
import Toolbar from "./components/Toolbar";
import MapCanvas from "./components/MapCanvas";
import PropertiesPanel from "./components/PropertiesPanel";
import StatusBar from "./components/StatusBar";
import Header from "./components/Header";
import StatusCard from "./components/StatusCard";
import TagTable from "./components/TagTable";
import EventLog from "./components/EventLog";
import { getStatus, getTags, getEvents } from "./services/api";
import "./index.css";

export default function App() {
  const [state, dispatch] = useReducer(layoutReducer, undefined, createDefaultState);

  const selectedEntity = state.ui.selectedEntity;
  const selectedAnchor =
    selectedEntity?.type === "anchor"
      ? state.anchors.byId[selectedEntity.id]
      : null;

  const selectedWall =
    selectedEntity?.type === "wall"
      ? state.walls.byId[selectedEntity.id]
      : null;

  const [status, setStatus] = useState(null);
  const [tags, setTags] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  async function loadAll(showLoader = false) {
    try {
      setError("");
      if (showLoader) setLoading(true);
      setRefreshing(true);

      const [statusData, tagsData, eventsData] = await Promise.all([
        getStatus(),
        getTags(),
        getEvents(50),
      ]);

      setStatus(statusData);
      setTags(tagsData);
      setEvents(eventsData);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll(true);
    const interval = setInterval(() => loadAll(false), 2000);
    return () => clearInterval(interval);
  }, []);

  const latestEvent = useMemo(() => {
    if (!events.length) return "—";
    return `${events[0].type} (${events[0].tag_id})`;
  }, [events]);

  const avgRssi = useMemo(() => {
    if (!tags.length) return "—";
    const sum = tags.reduce((acc, tag) => acc + tag.rssi, 0);
    return Math.round(sum / tags.length);
  }, [tags]);

  const selectedLabel = useMemo(() => {
    if (selectedAnchor) return selectedAnchor.name || selectedAnchor.anchorId;
    if (selectedWall) return selectedWall.label || selectedWall.id;
    return "";
  }, [selectedAnchor, selectedWall]);

  function handleExport() {
    const exportState = {
      ...state,
      ui: {
        ...state.ui,
        pendingWallStart: null,
        selectedEntity: null,
      },
    };

    const blob = new Blob([JSON.stringify(exportState, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.mapMeta.name.replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function handleImport(layout) {
    dispatch({ type: "LOAD_LAYOUT", payload: layout });
  }

  function handleReset() {
    const confirmed = window.confirm("Create a new layout? Unsaved changes will be lost.");
    if (!confirmed) return;
    dispatch({ type: "RESET_LAYOUT" });
  }

  return (
    <div className="app-shell">
      {/* DASHBOARD */}
      <Header
        lastUpdated={lastRefresh}
        backendOnline={!error}
        onRefresh={() => loadAll(false)}
        refreshing={refreshing}
      />

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="loading-screen">Loading dashboard...</div>
      ) : (
        <>
          <div className="status-grid">
            <StatusCard
              title="ESP32"
              value={status?.esp32_connected ? "Connected" : "Disconnected"}
              tone={status?.esp32_connected ? "good" : "bad"}
            />
            <StatusCard
              title="WRAP260"
              value={status?.wrap260_connected ? "Connected" : "Not used / Disconnected"}
              tone={status?.wrap260_connected ? "good" : "neutral"}
            />
            <StatusCard
              title="Channel"
              value={status?.channel ?? "—"}
              tone="neutral"
            />
            <StatusCard
              title="Tags Detected"
              value={status?.tags_detected ?? 0}
              subtitle={`Average RSSI: ${avgRssi}`}
              tone="info"
            />
            <StatusCard
              title="Latest Event"
              value={latestEvent}
              tone="info"
            />
            <StatusCard
              title="Last Backend Update"
              value={
                status?.last_update
                  ? new Date(status.last_update).toLocaleTimeString()
                  : "—"
              }
              tone="neutral"
            />
          </div>

          <div className="dashboard-searchbar">
            <input
              type="text"
              placeholder="Search by tag, event, source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="content-grid">
            <TagTable tags={tags} search={search} />
            <EventLog events={events} />
          </div>
        </>
      )}

      {/* SEPARADOR */}
      <div className="section-divider" />

      {/* LAYOUT EDITOR */}
      <TopBar
        mapName={state.mapMeta.name}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
      />

      <Toolbar
        activeTool={state.ui.activeTool}
        onToolChange={(tool) => dispatch({ type: "SET_TOOL", payload: tool })}
        onDeleteSelected={() => dispatch({ type: "DELETE_SELECTED" })}
        onToggleGrid={() => dispatch({ type: "TOGGLE_GRID" })}
        onToggleSnap={() => dispatch({ type: "TOGGLE_SNAP" })}
        showGrid={state.ui.showGrid}
        snapToGrid={state.ui.snapToGrid}
      />

      <div className="editor-layout">
        <div className="canvas-panel">
          <MapCanvas
            state={state}
            onMouseWorldChange={(world) =>
              dispatch({ type: "SET_MOUSE_WORLD", payload: world })
            }
            onAddWall={(wall) => dispatch({ type: "ADD_WALL", payload: wall })}
            onSetPendingWallStart={(point) =>
              dispatch({ type: "SET_PENDING_WALL_START", payload: point })
            }
            onAddAnchor={(point) =>
              dispatch({ type: "ADD_ANCHOR", payload: point })
            }
            onSelectEntity={(entity) =>
              dispatch({ type: "SET_SELECTED_ENTITY", payload: entity })
            }
            onMoveAnchor={(id, pos) =>
              dispatch({
                type: "UPDATE_ANCHOR",
                payload: { id, changes: pos },
              })
            }
            onPanChange={(pan) =>
              dispatch({ type: "SET_PAN", payload: pan })
            }
          />
        </div>

        <PropertiesPanel
          mapMeta={state.mapMeta}
          selectedAnchor={selectedAnchor}
          selectedWall={selectedWall}
          environmentProfiles={state.environmentProfiles}
          onMapMetaChange={(changes) =>
            dispatch({ type: "UPDATE_MAP_META", payload: changes })
          }
          onAnchorChange={(changes) =>
            dispatch({
              type: "UPDATE_ANCHOR",
              payload: { id: selectedEntity?.id, changes },
            })
          }
          onWallChange={(changes) =>
            dispatch({
              type: "UPDATE_WALL",
              payload: { id: selectedEntity?.id, changes },
            })
          }
        />
      </div>

      <StatusBar
        activeTool={state.ui.activeTool}
        mouseWorld={state.ui.mouseWorld}
        selectedLabel={selectedLabel}
      />
    </div>
  );
}