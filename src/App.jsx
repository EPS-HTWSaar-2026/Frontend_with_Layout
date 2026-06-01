import { useEffect, useMemo, useState, useReducer } from "react";

// 状态管理
import { createDefaultState } from "./state/initialState";
import { layoutReducer } from "./state/layoutReducer";

// 组件
import TopBar from "./components/TopBar";
import Toolbar from "./components/Toolbar";
import MapCanvas from "./components/MapCanvas";
import PropertiesPanel from "./components/PropertiesPanel";
import StatusBar from "./components/StatusBar";
import Header from "./components/Header";
import StatusCard from "./components/StatusCard";
import TagTable from "./components/TagTable";
import EventLog from "./components/EventLog";

// 逻辑支持
import { getStatus, getTags, getEvents } from "./services/api";
import useWebSocket from "./hooks/useWebSocket";
import "./App.css";

const STORAGE_KEY = "rtls_layout_data";

export default function App() {
  const [state, dispatch] = useReducer(
    layoutReducer,
    undefined,
    () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : createDefaultState();
    }
  );

  const [status, setStatus] = useState(null);
  const [tags, setTags] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  const mouseWorld = state?.ui?.mouseWorld ?? { x: 0, y: 0 };

  async function loadAll() {
    try {
      setLoading(true);
      const [s, t, e] = await Promise.all([
        getStatus(),
        getTags(),
        getEvents(50),
      ]);

      setStatus(s);
      setTags(t);
      setEvents(e);
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

  // 4. WebSocket 实时数据处理
  const { connected } = useWebSocket(
    "ws://192.168.100.75:8765",
    (data) => {
      if (!data) return;

      // --- 关键修改点：兼容你的 Python 数据格式 ---
      let incomingTags = [];

      // 情况 A: 数据是直接的 Tag 对象 (含有 tag_mac)
      if (data.tag_mac) {
        incomingTags = [data];
      }
      // 情况 B: 数据是包装过的 { type: "tags", payload: [...] }
      else if (data.type === "tags") {
        incomingTags = Array.isArray(data.payload) ? data.payload : [data.payload];
      }
      // 情况 C: 更新状态或事件
      else {
        if (data.type === "status") setStatus(data.payload);
        if (data.type === "events") setEvents(data.payload || []);
        return;
      }

      // 执行增量更新逻辑
      setTags((prev) => {
        const tagMap = new Map(prev.map(t => [t.id, t]));

        incomingTags.forEach(raw => {
          // 统一映射 tag_mac -> id
          const id = raw.tag_mac || raw.id;
          if (!id) return;

          const existing = tagMap.get(id) || {};

          tagMap.set(id, {
            ...existing,
            ...raw,
            id: id, // 强制确保有 id 字段供前端 key 使用
            x: raw.x,
            y: raw.y,
            lastSeen: Date.now()
          });
        });

        return Array.from(tagMap.values());
      });
    }
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const latestEvent = useMemo(() => {
    if (!events.length) return "—";
    return `${events[0].type || events[0].message || "Event"}`;
  }, [events]);

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
            onMouseWorldChange={(w) => dispatch({ type: "SET_MOUSE_WORLD", payload: w })}
            onPanChange={(p) => dispatch({ type: "SET_PAN", payload: p })}
            onSelectEntity={(e) => dispatch({ type: "SET_SELECTED_ENTITY", payload: e })}
            onAddAnchor={(pos) => dispatch({ type: "ADD_ANCHOR", payload: pos })}
            onMoveAnchor={(id, pos) => dispatch({ type: "UPDATE_ANCHOR", payload: { id, changes: pos } })}
            onAddWall={(wall) => dispatch({ type: "ADD_WALL", payload: wall })}
            onSetPendingWallStart={(pos) => dispatch({ type: "SET_PENDING_WALL_START", payload: pos })}
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
              <StatusCard title="WS Status" value={connected ? "Online" : "Offline"} color={connected ? "#52c41a" : "#ff4d4f"} />
              <StatusCard title="Total Tags" value={tags.length} />
              <StatusCard title="Last Event" value={latestEvent} />
            </div>
            <TagTable tags={tags} search={search} />
            <EventLog events={events} />
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