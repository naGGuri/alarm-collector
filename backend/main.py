# backend/main.py

# from fastapi import  WebSocket, WebSocketDisconnect
from fastapi import FastAPI, HTTPException, Path, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from uuid import uuid4
from datetime import datetime
import json

from db import collection  # ✅ MongoDB 컬렉션 객체 불러오기


# ✅ FastAPI 앱 초기화
app = FastAPI()

# ✅ CORS 설정 (모든 프론트엔드 Origin 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ 연결된 WebSocket 클라이언트 추적용 리스트
# connections = []

# ✅ WebSocket 엔드포인트: 실시간 로그 수신 및 브로드캐스트
# @app.websocket("/ws/logs")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     print("🟢 클라이언트 연결됨")
#     connections.append(websocket)

#     try:
#         while True:
#             # ✅ 클라이언트로부터 메시지 수신
#             data = await websocket.receive_text()
#             print("📩 수신한 메시지:", data)

#             try:
#                 parsed = json.loads(data)  # JSON 파싱
#                 now = datetime.utcnow()
#             except Exception as e:
#                 print("❌ JSON 파싱 실패:", e)
#                 continue  # 파싱 실패 시 무시하고 다음 메시지 대기

#             # ✅ 로그 객체 생성
#             log = {
#                 "id": str(uuid4()),
#                 "content": parsed.get("content", ""),
#                 "time": datetime.now().strftime("%H:%M:%S"),
#                 "appName": parsed.get("appName", ""),
#                 "createdAt": now,
#                 "isFavorite": False  # ✅ 기본 즐겨찾기 상태 false
#             }

#             # ✅ MongoDB에 로그 저장
#             collection.insert_one(log)
#             print("💾 MongoDB에 저장:", log)

#             # ✅ 브로드캐스트용 JSON 안전 사본 생성
#             safe_log = log.copy()
#             safe_log["createdAt"] = now.isoformat()
#             safe_log.pop("_id", None)  # MongoDB 내부 ID 제거

#             # ✅ 연결된 클라이언트 모두에게 전송
#             for conn in connections:
#                 try:
#                     await conn.send_text(json.dumps(safe_log))
#                 except Exception as e:
#                     print("⚠️ 전송 실패:", e)

#     except WebSocketDisconnect:
#         print("🔌 연결 종료")
#         connections.remove(websocket)  # 끊긴 소켓 제거


# ✅ 로그 목록 조회 API (최신순, skip/limit 기반 페이징)
@app.get("/logs")
async def get_logs(
    skip: int = Query(0, ge=0, description="건너뛸 로그 수"),
    limit: int = Query(30, ge=1, le=100, description="가져올 최대 로그 수 (1~100)")
):
    cursor = collection.find().sort("createdAt", -1).skip(skip).limit(limit)
    logs = []

    for log in cursor:
        logs.append({
            "id": log["id"],
            "content": log["content"],
            "appName": log.get("appName"),
            "time": log["time"],
            "createdAt": log["createdAt"].isoformat(),
            "isFavorite": log.get("isFavorite", False)
        })

    return JSONResponse(content=logs)


# ✅ 특정 로그 즐겨찾기 상태 토글 API
@app.patch("/logs/{log_id}/favorite")
async def update_favorite(
    log_id: str = Path(..., description="로그 UUID"),
    payload: dict = Body(..., description="예: { 'isFavorite': true }")
):
    is_fav = payload.get("isFavorite")
    if is_fav is None or not isinstance(is_fav, bool):
        raise HTTPException(status_code=400, detail="isFavorite 필드는 boolean 타입이어야 합니다.")

    result = collection.update_one(
        {"id": log_id},
        {"$set": {"isFavorite": is_fav}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="로그를 찾을 수 없습니다.")

    return {"id": log_id, "isFavorite": is_fav}


# ✅ 단일 로그 삭제 API
@app.delete("/logs/{log_id}")
async def delete_log(
    log_id: str = Path(..., description="삭제할 로그 UUID")
):
    result = collection.delete_one({"id": log_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="삭제할 로그를 찾을 수 없습니다.")

    return {"id": log_id, "deleted": True}


# ✅ 다중 로그 삭제 API (POST로 ID 배열 받음)
@app.post("/logs/bulk-delete")
async def delete_logs_bulk(
    payload: dict = Body(..., description="예: { 'ids': [uuid1, uuid2, ...] }")
):
    ids = payload.get("ids")

    if not ids or not isinstance(ids, list):
        raise HTTPException(status_code=400, detail="삭제할 ID 목록이 유효하지 않습니다.")

    result = collection.delete_many({"id": {"$in": ids}})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="삭제할 로그를 찾을 수 없습니다.")

    return {
        "deletedCount": result.deleted_count,
        "deletedIds": ids
    }
