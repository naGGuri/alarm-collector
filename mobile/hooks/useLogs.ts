// useLogs.ts

import { useState } from "react";
import { Log } from "../types/log";
import { groupLogsByDate } from "../utils/groupLogsByDate";

const limit = 30;

export default function useLogs() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [filterType, setFilterType] = useState("전체");
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedApp, setSelectedApp] = useState<string | null>(null);

    // ✅ 서버에서 로그 추가 로딩
    const fetchMoreLogs = async () => {
        if (!hasMore || isFetchingMore) return;

        setIsFetchingMore(true);

        try {
            const res = await fetch(`http://10.0.2.2:8000/logs?skip=${skip}&limit=${limit}`);
            const newLogs: Log[] = await res.json();
            const enriched = newLogs.map((log) => ({
                ...log,
                isFavorite: log.isFavorite ?? false,
            }));

            if (enriched.length < limit) setHasMore(false);

            setLogs((prev) => [...prev, ...enriched]);
            setSkip((prev) => prev + enriched.length);
        } catch (e) {
            console.error("❌ 추가 로딩 실패:", e);
        } finally {
            setIsFetchingMore(false);
        }
    };

    // ✅ 필터링 적용
    const filteredLogs = logs.filter((log) => {
        const byType = filterType === "전체" || log.type === filterType;
        const byFavorite = !showFavoritesOnly || log.isFavorite;
        const byApp = !selectedApp || log.appName === selectedApp;
        return byType && byFavorite && byApp;
    });

    // ✅ 날짜 기준으로 그룹화
    const sections = groupLogsByDate(filteredLogs);

    const appNames = Array.from(new Set(logs.map((log) => log.appName).filter((name) => !!name))).sort();

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
    };
}
