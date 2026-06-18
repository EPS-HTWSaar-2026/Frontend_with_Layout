// components/TagTable.jsx

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "Invalid Date";
  }
}

function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "—";
}

function hasPosition(tag) {
  return Number.isFinite(Number(tag?.x)) && Number.isFinite(Number(tag?.y));
}

function statusClass(status, tag) {
  const s = String(status ?? "").toLowerCase();

  if (s === "online" || s === "active" || hasPosition(tag)) {
    return "badge-online";
  }
  if (s === "stale" || s === "warning") {
    return "badge-stale";
  }
  return "badge-offline";
}


export default function TagTable({ tags = [], search = "" }) {

  console.log("TAGS:", tags);

  const filteredTags = tags.filter((tag) => {
    const q = String(search).trim().toLowerCase();
    if (!q) return true;

    const id = String(tag?.tag_id ?? tag?.id ?? "").toLowerCase();
    const event = String(tag?.last_event ?? "").toLowerCase();
    const source = String(tag?.source ?? "").toLowerCase();

    return id.includes(q) || event.includes(q) || source.includes(q);
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
              <th>Position</th>
              <th>Last Seen</th>
            </tr>
          </thead>

          <tbody>
            {filteredTags.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No tags found
                </td>
              </tr>
            ) : (
              filteredTags.map((tag, index) => {

                const displayId =
                  tag?.tag_id ?? tag?.id ?? "—";

                const rowKey =
                  tag?.tag_id ?? tag?.id ?? index;

                const displayStatus =
                  tag?.status ?? (hasPosition(tag) ? "online" : "offline");

                return (
                  <tr key={rowKey}>

                    {/* ID */}
                    <td className="mono">{displayId}</td>

                    {/* POSITION */}
                    <td>
                      {hasPosition(tag)
                        ? `X: ${formatNumber(tag.x)} | Y: ${formatNumber(tag.y)}`
                        : "—"}
                    </td>

                    {/* LAST SEEN */}
                    <td>
                      {formatDate(
                        tag?.last_seen ??
                        tag?.lastSeen ??
                        tag?.timestamp
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>
    </section>
  );
}