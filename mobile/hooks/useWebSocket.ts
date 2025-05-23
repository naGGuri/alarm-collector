// mobile/hooks/useWebSocket.ts
// WebSocket 연결 및 로그 수신 관리

import { useEffect, useRef, useState } from "react";
import { Log } from "../types/log";

// ✅ WebSocket을 통한 로그 수신용 커스텀 훅
export default function useWebSocket(
    onNewLog: (log: Log) => void // 새 로그 수신 시 실행할 콜백 함수
): {
    isConnected: boolean; // 연결 상태 여부
    connect: () => void; // 수동 재연결 함수
    send: (payload: any) => void; // 서버로 메시지 전송 함수
} {
    // ✅ 현재 WebSocket 연결 여부
    const [isConnected, setIsConnected] = useState(false);

    // ✅ WebSocket 인스턴스 참조 보관용 ref (컴포넌트 리렌더링과 무관하게 유지)
    const ws = useRef<WebSocket | null>(null);

    // ✅ 재연결 중인지 여부를 추적 (추후 자동 재연결 구현 시 유용)
    const isReconnecting = useRef(false);

    // ✅ WebSocket 연결 및 이벤트 핸들링 설정
    const connect = () => {
        // 기존 연결이 있다면 먼저 닫기
        if (ws.current) ws.current.close();

        // 새로운 WebSocket 연결 생성
        ws.current = new WebSocket("ws://10.0.2.2:8000/ws/logs");

        // 연결 성공 시
        ws.current.onopen = () => {
            console.log("🟢 WebSocket 연결됨");
            setIsConnected(true);
            isReconnecting.current = false; // 재연결 상태 해제
        };

        // 메시지 수신 시 로그 파싱 후 콜백 호출
        ws.current.onmessage = (event) => {
            const newLog: Log = {
                ...JSON.parse(event.data),
                isFavorite: false, // 수신된 로그는 기본적으로 즐겨찾기 아님
            };
            onNewLog(newLog);
        };

        // 오류 발생 시 상태 업데이트
        ws.current.onerror = (e) => {
            console.error("❌ WebSocket 오류:", e);
            setIsConnected(false);
        };

        // 연결 종료 시 상태 업데이트
        ws.current.onclose = () => {
            console.log("🔴 WebSocket 연결 종료됨");
            setIsConnected(false);
        };
    };

    // ✅ 서버로 데이터 전송 (연결 상태 확인 후 실행)
    const send = (payload: any) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
        ws.current.send(JSON.stringify(payload));
    };

    // ✅ 컴포넌트가 마운트될 때 자동 연결 수행
    useEffect(() => {
        connect(); // 최초 1회 연결

        // 컴포넌트 언마운트 시 연결 종료 처리
        return () => {
            ws.current?.close();
        };
    }, []);

    // ✅ 외부에서 사용할 수 있도록 상태 및 함수 반환
    return { isConnected, connect, send };
}
