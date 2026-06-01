// components/TagTable.jsx

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (e) {
    return "Invalid Date";
  }
}

function statusClass(status) {
  const s = status?.toLowerCase();
  if (s === "online" || s === "active") return "badge-online";
  if (s === "stale" || s === "warning") return "badge-stale";
  return "badge-offline";
}

export default function TagTable({ tags, search }) {
  // 1. 过滤逻辑增加防御性判断
  const filteredTags = tags.filter((tag) => {
    const q = search?.trim().toLowerCase();
    if (!q) return true;

    // 适配多种可能的 ID 字段名
    const id = (tag.tag_id || tag.tag_mac || tag.id || "").toLowerCase();
    const event = (tag.last_event || "").toLowerCase();
    const source = (tag.source || "").toLowerCase();

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
                {/* 修正 colSpan 为 7 (与表头数量一致) */}
                <td colSpan="7" className="empty-state">
                  No tags found
                </td>
              </tr>
            ) : (
              filteredTags.map((tag) => {
                // 2. 生成唯一的 Key 和 显示用的 ID
                const displayId = tag.tag_id || tag.tag_mac || tag.id || "Unknown";
                const rowKey = tag.tag_mac || tag.tag_id || tag.id || Math.random();

                return (
                  <tr key={rowKey}>
                    <td className="mono">{displayId}</td>
                    {/* 3. 增加默认值判断 */}
                    <td>{tag.rssi ?? "—"}</td>
                    <td>
                      <span className={`badge ${statusClass(tag.status || "offline")}`}>
                        {tag.status || "offline"}
                      </span>
                    </td>
                    <td>{tag.last_event || "N/A"}</td>
                    <td>{tag.channel || "—"}</td>
                    <td>{tag.source || "System"}</td>
                    <td>{formatDate(tag.last_seen || tag.timestamp)}</td>
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