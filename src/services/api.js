const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

export async function getStatus() {
  const response = await fetch(`${API_BASE}/api/status`);
  return handleResponse(response);
}

export async function getTags() {
  const response = await fetch(`${API_BASE}/api/tags`);
  return handleResponse(response);
}

export async function getEvents(limit = 50) {
  const response = await fetch(`${API_BASE}/api/events?limit=${limit}`);
  return handleResponse(response);
}