# backend/db.py

from pymongo import MongoClient
from dotenv import load_dotenv
import os

# ✅ .env 파일 로드
load_dotenv()

# ✅ MongoDB 연결 URI (예: mongodb://localhost:27017)
mongo_uri = os.getenv("MONGODB_URI")
if not mongo_uri:
    raise RuntimeError("환경 변수 'MONGODB_URI'가 설정되지 않았습니다.")  # ✅ 누락 시 예외 처리

# ✅ 사용할 DB 이름
mongo_db = os.getenv("MONGODB_DB", "alert_logger")  # 기본값 지정 가능
# ✅ 사용할 컬렉션 이름
mongo_collection = os.getenv("MONGODB_COLLECTION", "logs")  # 기본값 지정 가능

# ✅ MongoDB 클라이언트 및 컬렉션 객체 생성
client = MongoClient(mongo_uri)
db = client[mongo_db]
collection = db[mongo_collection]
