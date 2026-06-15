// src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Connects to the backend WebSocket server on port 8765.
 *
 * The server requires a subscription message immediately after connecting:
 *   { "subscribe": "locations" }  — trilaterated tag positions
 *   { "subscribe": "packets" }    — raw packet arrivals
 *
 * @param {string} url        - e.g. "ws://192.168.100.75:8765"
 * @param {"locations"|"packets"} channel - which feed to subscribe to
 * @param {(data: object) => void} onMessage - called for every incoming message
 */
export default function useWebSocket(url, channel, onMessage) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Keep callback ref stable so we never re-trigger the connect effect
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`✅ [WS] Connected to ${url}, subscribing to '${channel}'`);
      // Send the required subscription handshake
      ws.send(JSON.stringify({ subscribe: channel }));
      setConnected(true);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch {
        // Fallback for non-JSON frames (shouldn't happen with this backend)
        onMessageRef.current?.(event.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.warn("🔌 [WS] Disconnected. Retrying in 3s...");
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error("❌ [WS] Error:", err);
    };
  }, [url, channel]);

  useEffect(() => {
    connect();
    return () => {
      console.log("🧹 [WS] Unmounting — closing connection");
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof msg === "string" ? msg : JSON.stringify(msg));
    } else {
      console.error("🚫 [WS] Cannot send — connection not open");
    }
  }, []);

  return { connected, send };
}
