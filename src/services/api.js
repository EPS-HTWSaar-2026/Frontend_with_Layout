// src/services/api.js

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://192.168.100.75:8000";

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

// ── Health ────────────────────────────────────────────────────────────────

/**
 * GET /
 * Returns { message, version, docs }
 */
export async function getStatus() {
  try {
    const response = await fetch(`${API_BASE}/`);
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ getStatus failed:", err.message);
    return { online: false, message: "Server unreachable" };
  }
}

// ── Tags ──────────────────────────────────────────────────────────────────

/**
 * GET /api/tags
 * Returns [{ tag_mac, x, y }]
 */
export async function getTags() {
  try {
    const response = await fetch(`${API_BASE}/api/tags`);
    const data = await handleResponse(response);
    return Array.isArray(data)
      ? data.map((t) => ({ ...t, id: t.tag_mac }))
      : [];
  } catch (err) {
    console.error("❌ getTags failed:", err.message);
    return [];
  }
}

/**
 * GET /api/tags/:tag_mac
 * Returns { tag_mac, x, y }
 */
export async function getTag(tag_mac) {
  try {
    const response = await fetch(`${API_BASE}/api/tags/${encodeURIComponent(tag_mac)}`);
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ getTag failed:", err.message);
    return null;
  }
}

/**
 * PATCH /api/tags/:tag_mac
 * Body: { x?, y? }
 * Returns updated { tag_mac, x, y }
 */
export async function updateTag(tag_mac, { x, y }) {
  try {
    const response = await fetch(`${API_BASE}/api/tags/${encodeURIComponent(tag_mac)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ updateTag failed:", err.message);
    return null;
  }
}

/**
 * DELETE /api/tags/:tag_mac
 */
export async function deleteTag(tag_mac) {
  try {
    const response = await fetch(`${API_BASE}/api/tags/${encodeURIComponent(tag_mac)}`, {
      method: "DELETE",
    });
    if (response.status === 204) return true;
    await handleResponse(response);
    return true;
  } catch (err) {
    console.error("❌ deleteTag failed:", err.message);
    return false;
  }
}

// ── Listeners ─────────────────────────────────────────────────────────────

/**
 * GET /api/listeners
 * Returns [{ esp_mac, rssi_ref, channel, x, y }]
 */
export async function getListeners() {
  try {
    const response = await fetch(`${API_BASE}/api/listeners`);
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ getListeners failed:", err.message);
    return [];
  }
}

/**
 * GET /api/listeners/:esp_mac
 */
export async function getListener(esp_mac) {
  try {
    const response = await fetch(`${API_BASE}/api/listeners/${encodeURIComponent(esp_mac)}`);
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ getListener failed:", err.message);
    return null;
  }
}

/**
 * POST /api/listeners
 * Body: { esp_mac, rssi_ref, channel, x?, y? }
 */
export async function createListener({ esp_mac, rssi_ref, channel = 6, x, y }) {
  try {
    const response = await fetch(`${API_BASE}/api/listeners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ esp_mac, rssi_ref, channel, x, y }),
    });
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ createListener failed:", err.message);
    return null;
  }
}

/**
 * PATCH /api/listeners/:esp_mac
 * Body: { rssi_ref?, channel?, x?, y? }
 */
export async function updateListener(esp_mac, { rssi_ref, channel, x, y }) {
  try {
    const response = await fetch(`${API_BASE}/api/listeners/${encodeURIComponent(esp_mac)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rssi_ref, channel, x, y }),
    });
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ updateListener failed:", err.message);
    return null;
  }
}

/**
 * DELETE /api/listeners/:esp_mac
 */
export async function deleteListener(esp_mac) {
  try {
    const response = await fetch(`${API_BASE}/api/listeners/${encodeURIComponent(esp_mac)}`, {
      method: "DELETE",
    });
    if (response.status === 204) return true;
    await handleResponse(response);
    return true;
  } catch (err) {
    console.error("❌ deleteListener failed:", err.message);
    return false;
  }
}

// ── Packets ───────────────────────────────────────────────────────────────

/**
 * GET /api/packets?tag_mac=&limit=
 * Returns [{ id, tag_mac, esp_mac, rssi, raw_packet, rx_ctrl, timestamp }]
 */
export async function getPackets({ tag_mac, limit = 100 } = {}) {
  try {
    const params = new URLSearchParams();
    if (tag_mac) params.set("tag_mac", tag_mac);
    params.set("limit", limit);
    const response = await fetch(`${API_BASE}/api/packets?${params}`);
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ getPackets failed:", err.message);
    return [];
  }
}

/**
 * GET /api/packets/:id
 */
export async function getPacket(id) {
  try {
    const response = await fetch(`${API_BASE}/api/packets/${id}`);
    return await handleResponse(response);
  } catch (err) {
    console.error("❌ getPacket failed:", err.message);
    return null;
  }
}

/**
 * DELETE /api/packets/:id
 */
export async function deletePacket(id) {
  try {
    const response = await fetch(`${API_BASE}/api/packets/${id}`, {
      method: "DELETE",
    });
    if (response.status === 204) return true;
    await handleResponse(response);
    return true;
  } catch (err) {
    console.error("❌ deletePacket failed:", err.message);
    return false;
  }
}
