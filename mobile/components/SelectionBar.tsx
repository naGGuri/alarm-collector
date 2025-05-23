// mobile/components/SelectionBar.tsx
// 다중 선택 시 나타나는 툴바

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

// ✅ 컴포넌트에 전달될 props 타입 정의
interface Props {
    selectedCount: number; // 현재 선택된 항목 수
    onSelectAll: () => void; // 전체 선택 버튼 클릭 시 실행되는 함수
    onDeleteSelected: () => void; // 선택 항목 일괄 삭제 시 실행되는 함수
}

// ✅ 선택바 UI 컴포넌트 정의
const SelectionBar: React.FC<Props> = ({ selectedCount, onSelectAll, onDeleteSelected }) => {
    return (
        <View
            style={{
                flexDirection: "row", // 버튼들을 가로 방향으로 배치
                marginBottom: 12, // 아래 여백
            }}
        >
            {/* ✅ 전체 선택 버튼 */}
            <TouchableOpacity onPress={onSelectAll} style={{ marginRight: 12 }}>
                <Text style={{ fontSize: 16 }}>✅ 전체선택</Text>
            </TouchableOpacity>

            {/* ✅ 선택 항목 삭제 버튼 */}
            <TouchableOpacity onPress={onDeleteSelected}>
                <Text
                    style={{
                        fontSize: 16,
                        color: selectedCount ? "red" : "gray", // 선택된 항목이 없으면 비활성색
                    }}
                >
                    🗑️ 선택삭제({selectedCount})
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default SelectionBar;
