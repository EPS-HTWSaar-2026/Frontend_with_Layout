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

import { getStatus, getTags, getPackets } from "./services/api";
import useWebSocket from "./hooks/useWebSocket";
import "./App.css";

const STORAGE_KEY = "rtls_layout_data";

export default function App() {
  const [state, dispatch] = useReducer(
    layoutReducer,
    undefined,
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : createDefaultState();
      } catch {
        return createDefaultState();
      }
    }
  );

  const [status, setStatus] = useState(null);
  const [tags, setTags] = useState([]);
  const [recentPackets, setRecentPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  const mouseWorld = state?.ui?.mouseWorld ?? { x: 0, y: 0 };

  async function loadAll() {
    try {
      setLoading(true);
      setError("");
      const [s, t, p] = await Promise.all([
        getStatus(),
        getTags(),
        getPackets({ limit: 50 }),
      ]);
      setStatus(s);
      setTags(t);
      setRecentPackets(p);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Subscribe to the "locations" channel — receives trilaterated {tag_mac, x, y, rmse, ...}
  const { connected } = useWebSocket(
    "ws://192.168.100.75:8765",
    "locations",
    (data) => {
      if (!data?.tag_mac) return;

      setTags((prev) => {
        const map = new Map(prev.map((t) => [t.tag_mac, t]));
        const existing = map.get(data.tag_mac) || {};
        map.set(data.tag_mac, {
          ...existing,
          ...data,
          id: data.tag_mac,
          lastSeen: Date.now(),
        });
        return Array.from(map.values());
      });
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // quota exceeded — silently ignore
    }
  }, [state]);

  if (!state || !state.ui) return <div>Loading state...</div>;

  return (
    <div className="app-shell">
      <Header
        lastUpdated={lastRefresh}
        backendOnline={connected}
        onRefresh={loadAll}
      />

      <div className="main-layout">
        <Toolbar
          activeTool={state.ui.activeTool}
          onSetTool={(tool) => dispatch({ type: "SET_TOOL", payload: tool })}
        />

        <div className="canvas-container">
          {error && <div className="error-banner">{error}</div>}

          <MapCanvas
            state={state}
            tags={tags}
            onMouseWorldChange={(w) =>
              dispatch({ type: "SET_MOUSE_WORLD", payload: w })
            }
            onPanChange={(p) => dispatch({ type: "SET_PAN", payload: p })}
            onSelectEntity={(e) =>
              dispatch({ type: "SET_SELECTED_ENTITY", payload: e })
            }
            onAddAnchor={(pos) =>
              dispatch({ type: "ADD_ANCHOR", payload: pos })
            }
            onMoveAnchor={(id, pos) =>
              dispatch({ type: "UPDATE_ANCHOR", payload: { id, changes: pos } })
            }
            onAddWall={(wall) => dispatch({ type: "ADD_WALL", payload: wall })}
            onSetPendingWallStart={(pos) =>
              dispatch({ type: "SET_PENDING_WALL_START", payload: pos })
            }
          />
        </div>

        <PropertiesPanel
          selectedEntity={state.ui.selectedEntity}
          state={state}
          dispatch={dispatch}
        />
      </div>

      <div className="data-overlays">
        {loading ? (
          <div className="loading-state">Loading data...</div>
        ) : (
          <>
            <div className="status-grid">
              <StatusCard
                title="Backend"
                value={status?.message ? "Online" : "Offline"}
                tone={status?.message ? "good" : "bad"}
              />
              <StatusCard
                title="WS Feed"
                value={connected ? "Live" : "Offline"}
                tone={connected ? "good" : "bad"}
              />
              <StatusCard title="Tags Tracked" value={tags.length} />
              <StatusCard
                title="Last Refresh"
                value={lastRefresh || "—"}
              />
            </div>

            <TagTable tags={tags} search={search} />
          </>
        )}
      </div>

      <StatusBar
        activeTool={state.ui.activeTool}
        mouseWorld={mouseWorld}
      />
    </div>
  );
}
