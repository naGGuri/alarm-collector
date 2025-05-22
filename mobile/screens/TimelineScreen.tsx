import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, Button, SectionList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

// ✅ 로그 객체 타입 정의
interface Log {
    id: string;
    time: string;
    type: string;
    content: string;
    createdAt: string;
    isFavorite?: boolean;
}

const TYPES = ['전체', '전화', 'SMS', '앱알림'];

export default function App() {
    // ✅ 상태 정의
    const [logs, setLogs] = useState<Log[]>([]); // 전체 로그 상태
    const [input, setInput] = useState(''); // 입력창 텍스트
    const [selectedType, setSelectedType] = useState('앱알림'); // 입력할 로그의 타입
    const [filterType, setFilterType] = useState('전체'); // 필터링 기준 타입
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false); // 즐겨찾기 필터링 여부
    const [searchText, setSearchText] = useState(''); // 검색 텍스트
    const [isConnected, setIsConnected] = useState(false); // WebSocket 연결 여부
    const [selectedIds, setSelectedIds] = useState<string[]>([]); // 선택된 로그(들) ID 저장
    const [isSelectionMode, setIsSelectionMode] = useState(false); // 선택 모드 여부

    const ws = useRef<WebSocket | null>(null); // WebSocket 인스턴스를 저장하는 ref
    // const reconnectTimer = useRef<NodeJS.Timeout | null>(null); // 재연결 타이머 저장
    const isReconnecting = useRef(false); // 재연결 중인지 여부를 추적

    // ✅ 서버로부터 저장되어있던 로그를 가져오는 함수
    const fetchLogs = () => {
        fetch('http://10.0.2.2:8000/logs')
            .then((res) => res.json())
            .then((data: Log[]) => {
                // isFavorite 필드가 누락될 경우 false로 채움
                const enriched = data.map((log) => ({
                    ...log,
                    isFavorite: log.isFavorite ?? false,
                }));
                setLogs(enriched);
            })
            .catch((err) => console.error('❌ 초기 로그 불러오기 실패:', err));
    };

    // ✅ WebSocket 연결 및 이벤트 핸들링 함수
    const connectWebSocket = () => {
        if (ws.current) ws.current.close(); // 이전 연결이 있다면 종료

        ws.current = new WebSocket('ws://10.0.2.2:8000/ws/logs');

        ws.current.onopen = () => {
            console.log('🟢 WebSocket 연결됨');
            setIsConnected(true); // 연결 성공 → 상태 true
            isReconnecting.current = false; // 연결 성공 -> 재연결 상태 해제
        };

        ws.current.onmessage = (event) => {
            // 서버로부터 새 로그 수신 → JSON 파싱 후 로그 추가
            const newLog: Log = {
                ...JSON.parse(event.data),
                isFavorite: false,
            };
            setLogs((prev) => [newLog, ...prev]); // 기존 로그 앞에 추가
        };

        ws.current.onerror = (e) => {
            console.error('❌ WebSocket 오류:', e);
            setIsConnected(false); // 오류 발생 시 연결 끊김 처리
        };

        ws.current.onclose = () => {
            console.log('🔴 WebSocket 연결 종료됨');
            setIsConnected(false); // 연결 종료 표시
        };
    };

    // ✅ 처음 앱 로딩 시
    useEffect(() => {
        fetchLogs(); // 최초 1회 로그 목록 요청
        connectWebSocket(); // WebSocket 연결 시작

        return () => {
            ws.current?.close(); // 컴포넌트 언마운트 시 연결 해제
        };
    }, []);

    // ✅ 메시지 전송 함수
    const sendMessage = () => {
        if (!input.trim()) return; // 입력이 비어있으면 전송 안 함

        const payload = {
            type: selectedType,
            content: input,
        };

        // JSON 문자열로 변환 후 WebSocket으로 전송
        ws.current?.send(JSON.stringify(payload));
        setInput(''); // 전송 후 입력창 초기화
    };

    // ✅ 즐겨찾기 상태를 토글 및 서버에 반영하는 함수
    const toggleFavorite = async (id: string) => {
        const target = logs.find((log) => log.id === id);
        if (!target) return;

        const newStatus = !target.isFavorite;

        try {
            const res = await fetch(`http://10.0.2.2:8000/logs/${id}/favorite`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFavorite: newStatus }),
            });

            if (!res.ok) throw new Error();

            // 서버 반영 후 클라이언트 상태 업데이트
            setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, isFavorite: newStatus } : log)));
        } catch (err) {
            console.error('❌ 즐겨찾기 변경 실패:', err);
            Alert.alert('에러', '즐겨찾기 변경 실패');
        }
    };

    // ✅ 로그(단일) 삭제 서버 요청하는 함수
    const deleteLog = (id: string) => {
        Alert.alert('삭제 확인', '이 로그를 삭제하시겠습니까?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await fetch(`http://10.0.2.2:8000/logs/${id}`, {
                            method: 'DELETE',
                        });

                        if (!res.ok) throw new Error();

                        setLogs((prev) => prev.filter((log) => log.id !== id));
                    } catch (e) {
                        console.error('❌ 삭제 실패:', e);
                        Alert.alert('에러', '삭제 중 문제가 발생했습니다.');
                    }
                },
            },
        ]);
    };

    // ✅ 선택 항목 토글
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
    };

    // ✅ 현재 화면의 전체 선택/해제
    const toggleSelectAll = () => {
        const visibleIds = filteredLogs.map((log) => log.id);
        const allSelected = visibleIds.every((id) => selectedIds.includes(id));
        setSelectedIds(allSelected ? [] : visibleIds);
    };

    // ✅ 선택 항목 일괄 삭제 요청하는 함수
    const deleteSelectedLogs = () => {
        if (selectedIds.length === 0) {
            Alert.alert('선택된 로그가 없습니다.');
            return;
        }
        Alert.alert('삭제 확인', '선택한 로그를 모두 삭제할까요?', [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    console.log('🔥 전송할 ID 목록:', selectedIds); // ← 여기가 올바름

                    try {
                        const res = await fetch('http://10.0.2.2:8000/logs/bulk-delete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ ids: selectedIds }), // ✅ key 포함된 JSON 객체
                        });

                        if (!res.ok) throw new Error();

                        const { deletedIds } = await res.json();
                        console.log('에러체크2');
                        setLogs((prev) => prev.filter((log) => !deletedIds.includes(log.id)));
                        setSelectedIds([]);
                    } catch (e) {
                        console.error('❌ 삭제 실패:', e);
                        Alert.alert('에러', '일괄 삭제 실패');
                    }
                },
            },
        ]);
    };

    // ✅ 필터 + 검색 + 즐겨찾기
    let filteredLogs = logs;

    if (filterType !== '전체') {
        filteredLogs = filteredLogs.filter((log) => log.type === filterType);
    }

    if (showFavoritesOnly) {
        filteredLogs = filteredLogs.filter((log) => log.isFavorite);
    }

    if (searchText.trim()) {
        const lower = searchText.toLowerCase();
        filteredLogs = filteredLogs.filter(
            (log) => log.content.toLowerCase().includes(lower) || log.type.toLowerCase().includes(lower)
        );
    }

    // ✅ 날짜 기준으로 로그들을 그룹화하는 로직
    const grouped = filteredLogs.reduce((acc, log) => {
        const date = dayjs(log.createdAt);
        let label = date.format('YYYY-MM-DD');
        if (date.isToday()) label = '오늘';
        else if (date.isYesterday()) label = '어제';

        if (!acc[label]) acc[label] = [];
        acc[label].push(log);
        return acc;
    }, {} as Record<string, Log[]>);

    const sections = Object.entries(grouped).map(([title, data]) => ({
        title,
        data,
    }));

    // ✅ 선택 모드 토글 함수
    const toggleSelectionMode = () => {
        setIsSelectionMode((prev) => !prev); // 선택 모드 on/off 토글
        setSelectedIds([]); // 선택 모드 진입/해제 시 선택 초기화
    };

    // ✅ Expo용 백업 함수
    const exportLogsToJSON = async () => {
        if (!logs.length) {
            Alert.alert('백업할 로그가 없습니다.');
            return;
        }

        try {
            const jsonString = JSON.stringify(logs, null, 2);

            const fileName = `logs_backup_${dayjs().format('YYYYMMDD_HHmmss')}.json`;
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;

            // 1. 파일 쓰기
            await FileSystem.writeAsStringAsync(fileUri, jsonString, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            // 2. 공유 (파일 내보내기)
            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert('공유 기능이 지원되지 않습니다.');
                return;
            }

            await Sharing.shareAsync(fileUri);
        } catch (err) {
            console.error('❌ 백업 실패:', err);
            Alert.alert('백업 실패', '파일 저장 중 오류 발생');
        }
    };

    // ✅ 렌더링
    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            {/* 연결 상태 */}
            <Text style={{ marginBottom: 6, color: isConnected ? 'green' : 'red' }}>
                {isConnected ? '🟢 연결됨' : '🔴 연결 끊김'}
            </Text>

            {/* ✅ 선택 모드 체크박스 (토글 방식) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ marginRight: 8 }}>✔️ 선택 활성화</Text>
                <TouchableOpacity
                    onPress={() => {
                        setIsSelectionMode((prev) => !prev);
                        setSelectedIds([]); // 전환 시 선택 초기화
                    }}
                >
                    <Text style={{ fontSize: 18 }}>{isSelectionMode ? '☑️' : '⬜️'}</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ 선택 모드일 때만 전체선택/삭제 UI 보이기 */}
            {isSelectionMode && (
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <TouchableOpacity onPress={toggleSelectAll} style={{ marginRight: 12 }}>
                        <Text style={{ fontSize: 16 }}>✅ 전체선택</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deleteSelectedLogs}>
                        <Text style={{ fontSize: 16, color: selectedIds.length ? 'red' : 'gray' }}>
                            🗑️ 선택삭제({selectedIds.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 검색창 */}
            <TextInput
                placeholder="검색어 입력"
                value={searchText}
                onChangeText={setSearchText}
                style={{
                    borderWidth: 1,
                    borderColor: '#aaa',
                    padding: 8,
                    marginBottom: 10,
                    borderRadius: 4,
                }}
            />

            {/* 로그 입력 타입 선택 */}
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                {['전화', 'SMS', '앱알림'].map((t) => (
                    <TouchableOpacity
                        key={t}
                        onPress={() => setSelectedType(t)}
                        style={{
                            padding: 8,
                            marginRight: 8,
                            backgroundColor: selectedType === t ? 'blue' : 'gray',
                            borderRadius: 4,
                        }}
                    >
                        <Text style={{ color: 'white' }}>{t}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    onPress={exportLogsToJSON}
                    style={{ backgroundColor: '#3498db', padding: 10, borderRadius: 6 }}
                >
                    <Text style={{ color: 'white' }}>📤 백업하기</Text>
                </TouchableOpacity>
            </View>

            {/* 필터 및 즐겨찾기 */}
            <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                {TYPES.map((type) => (
                    <TouchableOpacity
                        key={type}
                        onPress={() => setFilterType(type)}
                        style={{
                            padding: 6,
                            marginRight: 8,
                            backgroundColor: filterType === type ? '#333' : '#aaa',
                            borderRadius: 4,
                        }}
                    >
                        <Text style={{ color: 'white' }}>{type}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    onPress={() => setShowFavoritesOnly((prev) => !prev)}
                    style={{
                        padding: 6,
                        backgroundColor: showFavoritesOnly ? '#f39c12' : '#888',
                        borderRadius: 4,
                    }}
                >
                    <Text style={{ color: 'white' }}>{showFavoritesOnly ? '⭐ 즐겨찾기만' : '☆ 전체보기'}</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ 알림 섹션 리스트 */}
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                        <View
                            style={{
                                padding: 8,
                                backgroundColor: isSelected ? '#cce5ff' : '#eee',
                                marginBottom: 6,
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            {/* ✅ 체크박스는 선택모드일 때만 */}
                            {isSelectionMode && (
                                <TouchableOpacity onPress={() => toggleSelect(item.id)}>
                                    <Text style={{ fontSize: 18, marginRight: 8 }}>{isSelected ? '☑️' : '⬜️'}</Text>
                                </TouchableOpacity>
                            )}

                            {/* 알림 본문 */}
                            <View style={{ flex: 1 }}>
                                <Text>
                                    {item.time} - {item.type}
                                </Text>
                                <Text>{item.content}</Text>
                            </View>

                            {/* 즐겨찾기 / 삭제 */}
                            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                                <Text style={{ fontSize: 20, marginRight: 10 }}>{item.isFavorite ? '⭐' : '☆'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteLog(item.id)}>
                                <Text style={{ fontSize: 18, color: 'red' }}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={{ paddingVertical: 6, backgroundColor: '#ccc' }}>
                        <Text style={{ fontWeight: 'bold' }}>{title}</Text>
                    </View>
                )}
            />

            {/* 메시지 입력창 */}
            <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="알림 내용 입력"
                style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            />
            <Button title="보내기" onPress={sendMessage} />
        </SafeAreaView>
    );
}
