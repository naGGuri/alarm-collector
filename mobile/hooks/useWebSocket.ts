import { useEffect, useRef, useState } from "react";
import { Log } from "../types/log";

export default function useWebSocket(onNewLog: (log: Log) => void): {
    isConnected: boolean;
    connect: () => void;
    send: (payload: any) => void;
} {
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const isReconnecting = useRef(false);

    const connect = () => {
        if (ws.current) ws.current.close();

        ws.current = new WebSocket("ws://10.0.2.2:8000/ws/logs");

        ws.current.onopen = () => {
            console.log("🟢 WebSocket 연결됨");
            setIsConnected(true);
            isReconnecting.current = false;
        };

        ws.current.onmessage = (event) => {
            const newLog: Log = {
                ...JSON.parse(event.data),
                isFavorite: false,
            };
            onNewLog(newLog);
        };

        ws.current.onerror = (e) => {
            console.error("❌ WebSocket 오류:", e);
            setIsConnected(false);
        };

        ws.current.onclose = () => {
            console.log("🔴 WebSocket 연결 종료됨");
            setIsConnected(false);
        };
    };

    const send = (payload: any) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
        ws.current.send(JSON.stringify(payload));
    };

    useEffect(() => {
        connect();
        return () => {
            ws.current?.close();
        };
    }, []);

    return { isConnected, connect, send };
}
