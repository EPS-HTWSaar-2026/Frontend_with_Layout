export default function Header({ lastUpdated, backendOnline, onRefresh, refreshing }) {
  return (
    <header className="header">
      <div>
        <h1>RTLS Monitoring Dashboard</h1>
        <p>ESP32 + FastAPI + SQLModel + SQLite</p>
      </div>

      <div className="header-actions">
        <div className={`backend-indicator ${backendOnline ? "ok" : "bad"}`}>
          {backendOnline ? "Backend Online" : "Backend Offline"}
        </div>

        <div className="last-updated">
          Last refresh: {lastUpdated ? lastUpdated : "—"}
        </div>

        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </header>
  );
}