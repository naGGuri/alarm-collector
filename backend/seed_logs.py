from pymongo import MongoClient
from uuid import uuid4
from datetime import datetime, timedelta
import random
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# MongoDB 연결
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
db_name = os.getenv("MONGO_DB", "alarm-db")
client = MongoClient(mongo_uri)
db = client[db_name]
collection = db["logs"]

# 타입 및 앱 이름 정의
APPS = ["카카오톡", "인스타그램", "페이스북", "유튜브"]

now = datetime.utcnow()
logs = []

for i in range(200):
    log = {
        "id": str(uuid4()),
        "appName": random.choice(APPS),
        "content": f"샘플 로그 메시지 {i + 1}",
        "time": (now - timedelta(seconds=i * 10)).strftime("%H:%M:%S"),
        "createdAt": now - timedelta(seconds=i * 10),
        "isFavorite": random.choice([True, False])
    }
    logs.append(log)

collection.insert_many(logs)
print(f"✅ {len(logs)}개의 샘플 로그가 삽입되었습니다.")
