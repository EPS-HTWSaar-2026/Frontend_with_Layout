function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function eventClass(type) {
  if (type === "button") return "badge-danger";
  if (type === "heartbeat") return "badge-info";
  if (type === "detected") return "badge-success";
  return "badge-neutral";
}

export default function EventLog({ events }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Recent Events</h2>
        <span>{events.length} items</span>
      </div>

      <div className="event-list">
        {events.length === 0 ? (
          <div className="empty-state">No events available</div>
        ) : (
          events.map((event) => (
            <div className="event-item" key={`${event.id}-${event.time}`}>
              <div className="event-top">
                <span className="mono">{event.tag_id}</span>
                <span className={`badge ${eventClass(event.type)}`}>{event.type}</span>
              </div>

              <div className="event-details">
                <span>RSSI: {event.rssi}</span>
                <span>Channel: {event.channel}</span>
                <span>Source: {event.source}</span>
              </div>

              <div className="event-time">{formatDate(event.time)}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}