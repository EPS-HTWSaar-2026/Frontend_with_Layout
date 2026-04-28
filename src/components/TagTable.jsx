function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusClass(status) {
  if (status === "online") return "badge-online";
  if (status === "stale") return "badge-stale";
  return "badge-offline";
}

export default function TagTable({ tags, search }) {
  const filteredTags = tags.filter((tag) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    return (
      tag.tag_id.toLowerCase().includes(q) ||
      tag.last_event.toLowerCase().includes(q) ||
      tag.source.toLowerCase().includes(q)
    );
  });

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Detected Tags</h2>
        <span>{filteredTags.length} shown</span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tag ID</th>
              <th>RSSI</th>
              <th>Status</th>
              <th>Last Event</th>
              <th>Channel</th>
              <th>Source</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filteredTags.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No tags found
                </td>
              </tr>
            ) : (
              filteredTags.map((tag) => (
                <tr key={tag.tag_id}>
                  <td className="mono">{tag.tag_id}</td>
                  <td>{tag.rssi}</td>
                  <td>
                    <span className={`badge ${statusClass(tag.status)}`}>{tag.status}</span>
                  </td>
                  <td>{tag.last_event}</td>
                  <td>{tag.channel}</td>
                  <td>{tag.source}</td>
                  <td>{formatDate(tag.last_seen)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}