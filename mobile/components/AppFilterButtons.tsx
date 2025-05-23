// mobile/components/AppFilterButtons.tsx
// 앱 이름별 필터 버튼

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

// ✅ 컴포넌트에 전달되는 props 타입 정의
interface Props {
    appNames: string[]; // 필터링 가능한 앱 이름 배열
    selectedApp: string | null; // 현재 선택된 앱 이름 (선택 해제 시 null)
    onSelectApp: (appName: string | null) => void; // 앱 선택 시 호출되는 콜백 함수
}

// ✅ 앱 필터 버튼들을 렌더링하는 함수형 컴포넌트
const AppFilterButtons: React.FC<Props> = ({ appNames, selectedApp, onSelectApp }) => {
    return (
        <View
            style={{
                flexDirection: "row", // 버튼들을 가로 방향으로 배치
                flexWrap: "wrap", // 공간 부족 시 다음 줄로 넘김
                marginBottom: 12, // 아래쪽 여백
            }}
        >
            {/* ✅ "전체 앱" 보기 버튼 */}
            <TouchableOpacity
                onPress={() => onSelectApp(null)} // 누르면 선택 상태를 null로 만들어 전체 보기로 설정
                style={{
                    padding: 8, // 내부 여백
                    marginRight: 8, // 오른쪽 간격
                    marginBottom: 8, // 아래쪽 간격
                    backgroundColor: selectedApp === null ? "#2ecc71" : "#888", // 선택되었을 때 초록색, 아니면 회색
                    borderRadius: 6, // 모서리 둥글게
                }}
            >
                <Text style={{ color: "white" }}>전체 앱</Text>
            </TouchableOpacity>

            {/* ✅ 개별 앱 필터 버튼들 렌더링 */}
            {appNames.map((name) => (
                <TouchableOpacity
                    key={name} // 리스트 렌더링 시 고유 key 필요
                    onPress={() =>
                        // 이미 선택된 앱을 다시 누르면 선택 해제(null), 아니면 해당 앱 선택
                        onSelectApp(selectedApp === name ? null : name)
                    }
                    style={{
                        padding: 8,
                        marginRight: 8,
                        marginBottom: 8,
                        backgroundColor: selectedApp === name ? "#2980b9" : "#bdc3c7", // 선택 시 파란색, 미선택 시 회색
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
