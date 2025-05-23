// mobile/hooks/useLogs.ts
// 로그 상태, 필터, 그룹화 관리

import { useState } from "react";
import { Log } from "../types/log"; // 로그 객체 타입 정의
import { groupLogsByDate } from "../utils/groupLogsByDate"; // 날짜 기준 그룹화 유틸리티 함수

const limit = 30; // 한 번에 로드할 로그 개수 제한

// ✅ 로그 관련 상태 및 동작을 제공하는 커스텀 훅 정의
export default function useLogs() {
    const [logs, setLogs] = useState<Log[]>([]); // 전체 로그 목록 상태
    const [skip, setSkip] = useState(0); // 페이징을 위한 현재 skip 수치 (몇 개 건너뛰었는지)
    const [hasMore, setHasMore] = useState(true); // 더 로딩할 데이터가 있는지 여부
    const [keyword, setKeyword] = useState(""); // 사용자 입력 키워드 상태
    const [isFetchingMore, setIsFetchingMore] = useState(false); // 현재 추가 로딩 중인지 여부

    // 필터 조건들
    const [filterType, setFilterType] = useState("전체"); // 타입 필터: "전체", "에러", "정보", 등
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false); // 즐겨찾기만 보기 여부
    const [selectedApp, setSelectedApp] = useState<string | null>(null); // 선택된 앱 이름

    // ✅ 서버에서 추가 로그 로딩
    const fetchMoreLogs = async () => {
        // 더 이상 로딩할 것이 없거나 현재 로딩 중이면 종료
        if (!hasMore || isFetchingMore) return;

        setIsFetchingMore(true); // 로딩 상태 true 설정

        try {
            // 백엔드로부터 로그 데이터 요청 (페이징 처리)
            const res = await fetch(`http://10.0.2.2:8000/logs?skip=${skip}&limit=${limit}`);
            const newLogs: Log[] = await res.json();

            // 새 로그에 isFavorite 속성 보정 (null일 경우 false로 설정)
            const enriched = newLogs.map((log) => ({
                ...log,
                isFavorite: log.isFavorite ?? false,
            }));

            // 받아온 로그 개수가 limit보다 작으면 더 이상 데이터 없음으로 간주
            if (enriched.length < limit) setHasMore(false);

            // 기존 로그에 새 로그를 추가
            setLogs((prev) => [...prev, ...enriched]);
            // 다음 요청을 위한 skip 수치 증가
            setSkip((prev) => prev + enriched.length);
        } catch (e) {
            console.error("❌ 추가 로딩 실패:", e);
        } finally {
            setIsFetchingMore(false); // 로딩 상태 종료
        }
    };

    // ✅ 현재 설정된 필터 조건에 맞게 로그 필터링
    const filteredLogs = logs.filter((log) => {
        const byFavorite = !showFavoritesOnly || log.isFavorite; // 즐겨찾기 필터
        const byApp = !selectedApp || log.appName === selectedApp; // 앱 이름 필터
        const byKeyword = !keyword || log.content.includes(keyword) || log.appName.includes(keyword); // 검색어 필터 (내용 또는 앱이름)
        return byFavorite && byApp && byKeyword;
    });

    // ✅ 필터링된 로그를 날짜 기준으로 그룹화하여 SectionList에 사용
    const sections = groupLogsByDate(filteredLogs);

    // ✅ 로그들에 존재하는 앱 이름을 추출하여 정렬된 배열 생성 (중복 제거)
    const appNames = Array.from(new Set(logs.map((log) => log.appName).filter((name) => !!name))).sort();

    // ✅ appName 갯수 카운트 함수
    const appCounts: Record<string, number> = {};
    logs.forEach((log) => {
        if (!log.appName) return;
        appCounts[log.appName] = (appCounts[log.appName] || 0) + 1;
    });

    return {
        logs,
        setLogs,
        skip,
        fetchMoreLogs,
        isFetchingMore,
        hasMore,
        sections,
        appNames,
        filterType,
        setFilterType,
        showFavoritesOnly,
        setShowFavoritesOnly,
        selectedApp,
        setSelectedApp,
        keyword,
        setKeyword,
        appCounts,
    };
}
