// mobile/utils/groupLogsByDate.ts
// 날짜별 SectionList용 그룹핑 함수

import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { Log } from "../types/log"; // 로그 타입 정의

// ✅ dayjs에 플러그인 등록 (오늘/어제 비교 기능 사용 가능)
dayjs.extend(isToday);
dayjs.extend(isYesterday);

// ✅ 로그 배열을 날짜별로 그룹화하여 SectionList 형식으로 반환하는 함수
export function groupLogsByDate(logs: Log[]): { title: string; data: Log[] }[] {
    // ✅ reduce를 통해 그룹핑 처리
    const grouped = logs.reduce((acc, log) => {
        const date = dayjs(log.createdAt); // 로그의 생성 시간

        // ✅ 오늘/어제면 특수 라벨 사용, 그 외에는 날짜 문자열 사용
        let label = date.format("YYYY-MM-DD");
        if (date.isToday()) label = "오늘";
        else if (date.isYesterday()) label = "어제";

        // ✅ 해당 라벨 키가 없으면 초기화 후 배열에 추가
        if (!acc[label]) acc[label] = [];
        acc[label].push(log);

        return acc;
    }, {} as Record<string, Log[]>); // 타입 명시: 키는 날짜 라벨, 값은 로그 배열

    // ✅ 객체를 SectionList 형식으로 변환하여 반환
    return Object.entries(grouped).map(([title, data]) => ({
        title, // 섹션 제목
        data, // 섹션에 포함된 로그 리스트
    }));
}
