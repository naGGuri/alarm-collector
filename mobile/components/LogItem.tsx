// mobile/components/LogItem.tsx
// 단일 로그 카드 (삭제/즐겨찾기/선택)

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Log } from "../types/log"; // Log 타입 정의를 외부 모듈에서 가져옴

// ✅ 컴포넌트 props 타입 정의
interface Props {
    log: Log; // 렌더링할 로그 데이터
    isSelected: boolean; // 현재 로그 항목이 선택되어 있는지 여부
    isSelectionMode: boolean; // 전체 선택 모드 활성화 여부
    onToggleSelect: (id: string) => void; // 선택 토글 콜백
    onToggleFavorite: (id: string) => void; // 즐겨찾기 토글 콜백
    onDelete: (id: string) => void; // 삭제 콜백
}

// ✅ 로그 항목을 렌더링하는 함수형 컴포넌트
const LogItem: React.FC<Props> = ({ log, isSelected, isSelectionMode, onToggleSelect, onToggleFavorite, onDelete }) => {
    return (
        <View
            style={{
                padding: 8, // 내부 여백
                backgroundColor: isSelected ? "#cce5ff" : "#eee", // 선택된 항목은 파란색 배경
                marginBottom: 6, // 아래쪽 간격
                flexDirection: "row", // 요소를 가로로 배치
                justifyContent: "space-between", // 좌우 끝에 배치
                alignItems: "center", // 세로 가운데 정렬
            }}
        >
            {/* ✅ 선택 모드가 켜져 있을 때만 체크박스 표시 */}
            {isSelectionMode && (
                <TouchableOpacity onPress={() => onToggleSelect(log.id)}>
                    {/* 선택 상태에 따라 다른 아이콘 표시 */}
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{isSelected ? "☑️" : "⬜️"}</Text>
                </TouchableOpacity>
            )}

            {/* ✅ 로그의 시간, 타입, 내용 표시 */}
            <View style={{ flex: 1 }}>
                <Text>
                    {log.time} - {log.appName}
                </Text>
                <Text>{log.content}</Text>
            </View>

            {/* ✅ 즐겨찾기 토글 버튼 */}
            <TouchableOpacity onPress={() => onToggleFavorite(log.id)}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>{log.isFavorite ? "⭐" : "☆"}</Text>
            </TouchableOpacity>

            {/* ✅ 삭제 버튼 */}
            <TouchableOpacity onPress={() => onDelete(log.id)}>
                <Text style={{ fontSize: 18, color: "red" }}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LogItem;
