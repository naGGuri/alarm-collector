// mobile/utils/exportLogs.ts
// 로그 JSON 백업 및 공유 기능

import { Alert } from "react-native"; // 사용자에게 메시지 표시용
import * as FileSystem from "expo-file-system"; // 파일 저장을 위한 Expo 모듈
import * as Sharing from "expo-sharing"; // 공유 기능을 위한 Expo 모듈
import dayjs from "dayjs"; // 시간 포맷을 위한 라이브러리
import { Log } from "../types/log"; // 로그 타입 정의

// ✅ 로그 배열을 JSON으로 내보내고 공유하는 함수
export async function exportLogsToJSON(logs: Log[]) {
    // ✅ 로그가 비어 있을 경우 사용자에게 알림 후 함수 종료
    if (!logs.length) {
        Alert.alert("백업할 로그가 없습니다.");
        return;
    }

    try {
        // ✅ 로그 배열을 JSON 문자열로 변환 (가독성을 위한 들여쓰기 2칸 포함)
        const jsonString = JSON.stringify(logs, null, 2);

        // ✅ 현재 날짜/시간 기반 파일 이름 생성 (예: logs_backup_20250523_145321.json)
        const fileName = `logs_backup_${dayjs().format("YYYYMMDD_HHmmss")}.json`;

        // ✅ 저장 경로 구성 (iOS/Android에서 쓰기 가능한 디렉토리 경로)
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        // ✅ 파일 쓰기 (UTF-8 인코딩으로 저장)
        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        // ✅ 공유 기능이 사용 가능한지 확인 (일부 시뮬레이터/환경에서는 지원되지 않음)
        if (!(await Sharing.isAvailableAsync())) {
            Alert.alert("공유 기능이 지원되지 않습니다.");
            return;
        }

        // ✅ JSON 파일을 공유 앱으로 전달 (사용자가 내보낼 앱 선택 가능)
        await Sharing.shareAsync(fileUri);
    } catch (err) {
        // ✅ 예외 발생 시 콘솔 로그 및 사용자 알림
        console.error("❌ 백업 실패:", err);
        Alert.alert("백업 실패", "파일 저장 중 오류 발생");
    }
}
