// mobile/types/log.ts

// ✅ 로그 객체의 타입 정의
export interface Log {
    id: string;
    type: string;
    content: string;
    appName: string;
    time: string;
    createdAt: string;
    isFavorite?: boolean;
}
