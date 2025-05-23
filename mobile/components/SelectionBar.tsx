import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface Props {
    selectedCount: number;
    onSelectAll: () => void;
    onDeleteSelected: () => void;
}

const SelectionBar: React.FC<Props> = ({ selectedCount, onSelectAll, onDeleteSelected }) => {
    return (
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <TouchableOpacity onPress={onSelectAll} style={{ marginRight: 12 }}>
                <Text style={{ fontSize: 16 }}>✅ 전체선택</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDeleteSelected}>
                <Text style={{ fontSize: 16, color: selectedCount ? "red" : "gray" }}>
                    🗑️ 선택삭제({selectedCount})
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default SelectionBar;
