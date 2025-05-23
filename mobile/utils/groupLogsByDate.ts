import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { Log } from "../types/log";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

export function groupLogsByDate(logs: Log[]): { title: string; data: Log[] }[] {
    const grouped = logs.reduce((acc, log) => {
        const date = dayjs(log.createdAt);
        let label = date.format("YYYY-MM-DD");
        if (date.isToday()) label = "오늘";
        else if (date.isYesterday()) label = "어제";

        if (!acc[label]) acc[label] = [];
        acc[label].push(log);
        return acc;
    }, {} as Record<string, Log[]>);

    return Object.entries(grouped).map(([title, data]) => ({
        title,
        data,
    }));
}
