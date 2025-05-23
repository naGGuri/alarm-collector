import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Log } from "../types/log"; // Log 타입 정의 분리 시 사용

interface Props {
    log: Log;
    isSelected: boolean;
    isSelectionMode: boolean;
    onToggleSelect: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
}

const LogItem: React.FC<Props> = ({ log, isSelected, isSelectionMode, onToggleSelect, onToggleFavorite, onDelete }) => {
    return (
        <View
            style={{
                padding: 8,
                backgroundColor: isSelected ? "#cce5ff" : "#eee",
                marginBottom: 6,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            {/* ✅ 체크박스는 선택모드일 때만 */}
            {isSelectionMode && (
                <TouchableOpacity onPress={() => onToggleSelect(log.id)}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{isSelected ? "☑️" : "⬜️"}</Text>
                </TouchableOpacity>
            )}

            {/* 알림 본문 */}
            <View style={{ flex: 1 }}>
                <Text>
                    {log.time} - {log.type}
                </Text>
                <Text>{log.content}</Text>
            </View>

            {/* 즐겨찾기 / 삭제 */}
            <TouchableOpacity onPress={() => onToggleFavorite(log.id)}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>{log.isFavorite ? "⭐" : "☆"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(log.id)}>
                <Text style={{ fontSize: 18, color: "red" }}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );
};

export default LogItem;
