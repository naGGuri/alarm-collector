import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";
import { Log } from "../types/log";

// ✅ 로그 배열을 JSON 파일로 저장하고 공유하는 함수
export async function exportLogsToJSON(logs: Log[]) {
    if (!logs.length) {
        Alert.alert("백업할 로그가 없습니다.");
        return;
    }

    try {
        const jsonString = JSON.stringify(logs, null, 2);
        const fileName = `logs_backup_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        if (!(await Sharing.isAvailableAsync())) {
            Alert.alert("공유 기능이 지원되지 않습니다.");
            return;
        }

        await Sharing.shareAsync(fileUri);
    } catch (err) {
        console.error("❌ 백업 실패:", err);
        Alert.alert("백업 실패", "파일 저장 중 오류 발생");
    }
}
