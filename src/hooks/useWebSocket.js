// src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from "react";

export default function useWebSocket(url, onMessage) {
    const wsRef = useRef(null);
    const reconnectRef = useRef(null);
    const [connected, setConnected] = useState(false);

    // 1. 使用 Ref 保持对回调函数的引用，避免每次渲染都重连
    const onMessageRef = useRef(onMessage);
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const connect = useCallback(() => {
        // 如果已经有连接，先清理
        if (wsRef.current) {
            wsRef.current.onclose = null; // 屏蔽之前的关闭事件
            wsRef.current.close();
        }

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("✅ [WS] 已连接到:", url);
            setConnected(true);
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessageRef.current?.(data);
            } catch (err) {
                // 如果后端发的不是 JSON（虽然你的 Python 发的是 JSON）
                onMessageRef.current?.(event.data);
            }
        };

        ws.onclose = () => {
            setConnected(false);
            console.warn("🔌 [WS] 连接断开，3秒后尝试重连...");
            // 避免重复设置定时器
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            reconnectRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (err) => {
            // 发生错误时，依靠 onclose 处理重连
            console.error("❌ [WS] 错误:", err);
        };
    }, [url]);

    // 2. 初始化与清理
    useEffect(() => {
        connect();
        return () => {
            console.log("🧹 [WS] 组件卸载，关闭连接");
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null; // 关键：卸载时不要触发重连逻辑
                wsRef.current.close();
            }
        };
    }, [connect]);

    // 3. 发送消息方法
    const send = useCallback((msg) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } else {
            console.error("🚫 [WS] 发送失败：连接未开启");
        }
    }, []);

    return { connected, send };
}