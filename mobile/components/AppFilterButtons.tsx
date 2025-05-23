// AppFilterButtons.tsx

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface Props {
    appNames: string[];
    selectedApp: string | null;
    onSelectApp: (appName: string | null) => void;
}

const AppFilterButtons: React.FC<Props> = ({ appNames, selectedApp, onSelectApp }) => {
    return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
            {/* ✅ 전체 앱 보기 버튼 */}
            <TouchableOpacity
                onPress={() => onSelectApp(null)}
                style={{
                    padding: 8,
                    marginRight: 8,
                    marginBottom: 8,
                    backgroundColor: selectedApp === null ? "#2ecc71" : "#888",
                    borderRadius: 6,
                }}
            >
                <Text style={{ color: "white" }}>전체 앱</Text>
            </TouchableOpacity>

            {/* ✅ 개별 앱 필터 버튼 */}
            {appNames.map((name) => (
                <TouchableOpacity
                    key={name}
                    onPress={() => onSelectApp(selectedApp === name ? null : name)}
                    style={{
                        padding: 8,
                        marginRight: 8,
                        marginBottom: 8,
                        backgroundColor: selectedApp === name ? "#2980b9" : "#bdc3c7",
                        borderRadius: 6,
                    }}
                >
                    <Text style={{ color: "white" }}>{name}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default AppFilterButtons;
