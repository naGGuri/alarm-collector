from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Path, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from uuid import uuid4
from datetime import datetime
import json

from db import collection  # MongoDB 컬렉션 불러오기


# ✅ FastAPI 앱 초기화
app = FastAPI()

# ✅ CORS 설정 (모든 Origin 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프론트엔드 개발 시 편의 목적
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ WebSocket 연결된 클라이언트 목록
connections = []

# ✅ 실시간 로그 수신 및 브로드캐스트용 WebSocket 엔드포인트
@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🟢 클라이언트 연결됨")
    connections.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            print("📩 수신한 메시지:", data)

            try:
                parsed = json.loads(data)
                now = datetime.utcnow()
            except Exception as e:
                print("❌ JSON 파싱 실패:", e)
                continue  # JSON 파싱 실패 시 무시

            # ✅ 로그 객체 생성
            log = {
                "id": str(uuid4()),
                "type": parsed.get("type", "기타"),
                "content": parsed.get("content", ""),
                "time": datetime.now().strftime("%H:%M:%S"),
                "appName": log.get("appName", ""),  # ✅ 필드 추가됨
                "createdAt": now,
                "isFavorite": False  # ✅ 새로 추가 (즐겨찾기 상태 기본값)
            }

            # ✅ MongoDB에 저장
            collection.insert_one(log)
            print("💾 MongoDB에 저장:", log)

            # ✅ 브로드캐스트용 복사본 (직렬화 가능한 필드만 유지)
            safe_log = log.copy()
            safe_log["createdAt"] = now.isoformat()
            safe_log.pop("_id", None)  # MongoDB ObjectId 제거

            # ✅ 연결된 클라이언트에 전송
            for conn in connections:
                try:
                    print("📡 브로드캐스트 중 전송 중...")
                    await conn.send_text(json.dumps(safe_log))
                    print("📡 브로드캐스트 전송 완료!")
                except Exception as e:
                    print("⚠️ 전송 실패:", e)
                    # (선택) 연결 실패한 클라이언트는 제거할 수도 있음

    except WebSocketDisconnect:
        print("🔌 연결 종료")
        connections.remove(websocket)

# ✅ 전체 로그 조회 API
@app.get("/logs")
async def get_logs(
    skip: int = Query(0, ge=0, description="건너띌 로그 수"), # 시작 위치: 기본 0
    limit: int = Query(30, ge=1, le=100, description="가져올 로그 수(최대 100)") # 한번에 가져올 개수: 최대 100
):
    """
    저장된 로그들을 최신순으로 정렬한 뒤,
    skip/limit 기반으로 일부만 페이징해서 반환합니다.

    예: /logs?skip=0&limit=30 → 최근 30개  
        /logs?skip=30&limit=30 → 그 다음 30개
    """
    
    # MongoDB에서 로그를 createdAt 기준 최신순으로 정렬
    logs_cursor = collection.find().sort("createdAt", -1).skip(skip).limit(limit)
    logs = []

    for log in logs_cursor:
        logs.append({
            "id": log["id"],
            "type": log["type"],
            "content": log["content"],
            "appName": log.get("appName", ""),  # ✅ 필드 추가됨
            "time": log["time"],
            "createdAt": log["createdAt"].isoformat(), # datetime -> ISO 문자열
            "isFavorite": log.get("isFavorite", False)  # 없으면 False
        })
    # JSON으로 반환
    return JSONResponse(content=logs)

# ✅ 즐겨찾기 상태 변경 API
@app.patch("/logs/{log_id}/favorite")
async def update_favorite(
    log_id: str = Path(..., description="즐겨찾기를 변경할 로그의 UUID"),
    payload: dict = Body(..., description="예: {'isFavorite': true}")
):
    """
    특정 로그의 즐겨찾기 상태를 true 또는 false로 변경합니다.
    """

    # ✅ 요청 유효성 검사
    is_fav = payload.get("isFavorite")
    if is_fav is None or not isinstance(is_fav, bool):
        raise HTTPException(status_code=400, detail="isFavorite 필드는 boolean 타입이어야 합니다.")

    # ✅ MongoDB에 상태 반영
    result = collection.update_one(
        {"id": log_id},
        {"$set": {"isFavorite": is_fav}}
    )

    # ✅ 대상 문서가 없을 경우 예외 반환
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="로그를 찾을 수 없습니다.")

    return {"id": log_id, "isFavorite": is_fav}

# ✅ 로그 삭제 API
@app.delete("/logs/{log_id}")
async def delete_log(
    log_id: str = Path(..., description="삭제할 로그의 UUID")):
    """
    지정된 ID를 가진 로그를 MongoDB에서 삭제합니다.
    """
    
    # MongoDB에서 해당 로그 삭제 시도
    result = collection.delete_one({"id": log_id})
    
    # 삭제된 로그가 없을 경우 예외 처리
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="삭제할 로그를 찾을 수 없습니다.")
    
    # 성공 메시지 반환
    return {"id": log_id, "deleted": True}

# ✅ 수정된 버전: dict 구조 받음
@app.post("/logs/bulk-delete")  # ← 경로도 명확히
async def delete_logs_bulk(payload: dict = Body(...)):
    ids = payload.get("ids")

    print("🧪 삭제 요청 받은 ID들:", ids)

    if not ids or not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="삭제할 ID 목록이 유효하지 않습니다.")

    result = collection.delete_many({"id": {"$in": ids}})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="삭제할 로그를 찾을 수 없습니다.")

    return {
        "deletedCount": result.deleted_count,
        "deletedIds": ids
    }
