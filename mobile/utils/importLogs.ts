// mobile/utils/importLogs.ts
// JSON 파일을 선택해서 서버로 복원 요청

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

export async function importLogsFromJSON() {
    try {
        // ✅ 파일 선택 요청
        const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });

        // ✅ 사용자 취소 처리
        if (result.canceled) return;

        // ✅ 실제 선택된 파일 정보 추출 (배열로 들어있음)
        const file = result.assets?.[0];
        if (!file || !file.uri) {
            Alert.alert("파일 오류", "선택된 파일이 올바르지 않습니다.");
            return;
        }

        // ✅ 파일 내용 읽기
        const content = await FileSystem.readAsStringAsync(file.uri);
        const parsed = JSON.parse(content); // Log[] 예상

        // ✅ 서버 전송
        const res = await fetch("http://10.0.2.2:8000/logs/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ logs: parsed }),
        });

        if (!res.ok) throw new Error("업로드 실패");

        Alert.alert("복원 성공", "로그를 불러왔습니다.");
    } catch (err) {
        console.error("❌ 복원 실패:", err);
        Alert.alert("복원 실패", "파일을 읽거나 업로드하는 데 실패했습니다.");
    }
}
