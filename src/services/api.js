// services/api.js

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://192.168.100.75:8000"; // 你的 Python 后端 REST 地址

/**
 * 统一处理响应
 */
async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

/**
 * 获取系统状态
 */
export async function getStatus() {
  try {
    // 使用标准的 fetch 代替未定义的 get
    const response = await fetch(`${API_BASE}/api/status`);
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ getStatus 失败:", err.message);
    return { online: false, message: "Server unreachable" };
  }
}

/**
 * 获取所有标签（初始加载）
 */
export async function getTags() {
  try {
    const response = await fetch(`${API_BASE}/api/tags`);
    const data = await handleResponse(response);

    // 🔥 关键点：数据标准化
    // 确保 REST 返回的数据也将 tag_mac 映射为 id，这样 App.jsx 逻辑才统一
    if (Array.isArray(data)) {
      return data.map(tag => ({
        ...tag,
        id: tag.id || tag.tag_mac, // 优先使用 id，没有就用 mac
      }));
    }
    return [];
  } catch (err) {
    console.error("❌ getTags 失败:", err.message);
    return [];
  }
}

/**
 * 获取历史事件
 */
export async function getEvents(limit = 50) {
  try {
    const response = await fetch(
      `${API_BASE}/api/events?limit=${limit}`
    );
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ getEvents 失败:", err.message);
    return [];
  }
}