from pymongo import MongoClient
from uuid import uuid4
from datetime import datetime, timedelta
import random

# ✅ MongoDB 연결
client = MongoClient("mongodb://localhost:27017")
db = client["alarm-db"]
collection = db["logs"]

# ✅ 테스트용 로그 타입
TYPES = ["전화", "SMS", "앱알림"]
APPS = ["카카오톡", "인스타그램", "페이스북", "유튜브"]

# ✅ 샘플 생성
logs = []
now = datetime.utcnow()

for i in range(200):  # 원하는 개수만큼 조절
    log = {
        "id": str(uuid4()),
        "type": random.choice(TYPES),
        "content": f"샘플 로그 메시지 {i + 1}",
        "time": (now - timedelta(seconds=i * 10)).strftime("%H:%M:%S"),
        "createdAt": now - timedelta(seconds=i * 10),
        "isFavorite": random.choice([True, False])
    }
    logs.append(log)

# ✅ MongoDB 삽입
collection.insert_many(logs)
print(f"✅ {len(logs)}개의 샘플 로그가 삽입되었습니다.")
