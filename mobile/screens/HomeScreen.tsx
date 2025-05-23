// mobile/screens/HomeScreen.tsx

import React, { useState, useEffect } from "react";
import { View, SafeAreaView, Text, TouchableOpacity } from "react-native";
import AppFilterButtons from "../components/AppFilterButtons";
import LogItem from "../components/LogItem";
import SelectionBar from "../components/SelectionBar";
import useLogs from "../hooks/useLogs";
import useWebSocket from "../hooks/useWebSocket";
import { exportLogsToJSON } from "../utils/exportLogs";
import { SectionList } from "react-native";

export default function HomeScreen() {
    // ✅ 상태 정의
    // const [input, setInput] = useState(""); // 전송용 텍스트 입력값
    const [isSelectionMode, setIsSelectionMode] = useState(false); // 다중 선택 모드 여부
    const [selectedIds, setSelectedIds] = useState<string[]>([]); // 선택된 로그 ID 목록

    // ✅ 커스텀 훅 사용
    const {
        logs,
        setLogs,
        sections,
        appNames,
        selectedApp,
        setSelectedApp,
        showFavoritesOnly,
        setShowFavoritesOnly,
        fetchMoreLogs,
        isFetchingMore,
    } = useLogs(); // 로그 조회 및 필터링 기능 제공

    const { isConnected } = useWebSocket((newLog) => {
        setLogs((prev) => [newLog, ...prev]); // 새 로그를 맨 위에 추가
    });

    useEffect(() => {
        fetchMoreLogs();
    }, []);

    // const sendMessage = () => {
    //     if (!input.trim()) return;
    //     send({ type: "앱알림", content: input }); // WebSocket 전송
    //     setInput(""); // 입력 초기화
    // };

    // ✅ 선택 기능 제어 함수
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    const toggleSelectAll = () => {
        const visibleIds = sections.flatMap((s) => s.data.map((log) => log.id));
        const allSelected = visibleIds.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected ? [] : visibleIds); // 전체선택 또는 해제
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode((prev) => !prev);
        setSelectedIds([]);
    };

    // ✅ 즐겨찾기 추가 / 삭제 함수
    const toggleFavorite = (id: string) => {
        const target = logs.find((log) => log.id === id);
        if (!target) return;

        const newStatus = !target.isFavorite;

        fetch(`http://10.0.2.2:8000/logs/${id}/favorite`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isFavorite: newStatus }),
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, isFavorite: newStatus } : log)));
            })
            .catch(() => {
                console.error("❌ 즐겨찾기 변경 실패");
            });
    };

    const deleteLog = (id: string) => {
        fetch(`http://10.0.2.2:8000/logs/${id}`, {
            method: "DELETE",
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                setLogs((prev) => prev.filter((log) => log.id !== id));
            })
            .catch(() => {
                console.error("❌ 삭제 실패");
            });
    };

    const deleteSelectedLogs = () => {
        if (selectedIds.length === 0) return;

        fetch("http://10.0.2.2:8000/logs/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedIds }),
        })
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(({ deletedIds }) => {
                setLogs((prev) => prev.filter((log) => !deletedIds.includes(log.id)));
                setSelectedIds([]);
            })
            .catch(() => {
                console.error("❌ 일괄 삭제 실패");
            });
    };

    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            {/* 연결생타 확인 컴포넌트 */}
            <Text style={{ color: isConnected ? "green" : "red" }}>{isConnected ? "🟢 연결됨" : "🔴 연결 끊김"}</Text>
            {/* 앱 이름 별로 구분하는 버튼 컴포넌트 */}
            <AppFilterButtons appNames={appNames} selectedApp={selectedApp} onSelectApp={setSelectedApp} />
            {/* 즐겨찾기 선택된 알람만 보기 */}
            <TouchableOpacity onPress={() => setShowFavoritesOnly((prev) => !prev)} style={{ marginBottom: 10 }}>
                <Text
                    style={{
                        color: "white",
                        backgroundColor: showFavoritesOnly ? "#f39c12" : "#888",
                        padding: 8,
                        borderRadius: 6,
                    }}
                >
                    {showFavoritesOnly ? "⭐ 즐겨찾기만" : "☆ 전체보기"}
                </Text>
            </TouchableOpacity>
            {/* 백업기능 컴포넌트 */}
            <TouchableOpacity
                onPress={() => exportLogsToJSON(logs)}
                style={{ backgroundColor: "#3498db", padding: 10, borderRadius: 6, marginBottom: 12 }}
            >
                <Text style={{ color: "white" }}>📤 백업하기</Text>
            </TouchableOpacity>
            {/* 선택기능 활성화 컴포넌트 */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ marginRight: 8 }}>✔️ 선택 활성화</Text>
                <TouchableOpacity onPress={toggleSelectionMode}>
                    <Text style={{ fontSize: 18 }}>{isSelectionMode ? "☑️" : "⬜️"}</Text>
                </TouchableOpacity>
            </View>
            {isSelectionMode && (
                <SelectionBar
                    selectedCount={selectedIds.length}
                    onSelectAll={toggleSelectAll}
                    onDeleteSelected={deleteSelectedLogs}
                />
            )}
            {/* 알람 로그 화면(무한스크롤) */}
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                onEndReached={fetchMoreLogs}
                onEndReachedThreshold={0.2}
                ListFooterComponent={
                    isFetchingMore ? <Text style={{ textAlign: "center", padding: 12 }}>불러오는 중...</Text> : null
                }
                renderItem={({ item }) => (
                    <LogItem
                        log={item}
                        isSelected={selectedIds.includes(item.id)}
                        isSelectionMode={isSelectionMode}
                        onToggleSelect={toggleSelect}
                        onToggleFavorite={toggleFavorite}
                        onDelete={deleteLog}
                    />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <Text style={{ fontWeight: "bold", paddingVertical: 6 }}>{title}</Text>
                )}
            />
            {/* 
            <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="알림 내용 입력"
                style={{ borderWidth: 1, padding: 10, marginTop: 10 }}
            />
            <Button title="보내기" onPress={sendMessage} /> */}
        </SafeAreaView>
    );
}
