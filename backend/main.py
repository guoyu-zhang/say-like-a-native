from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=4)

load_dotenv()
EC2_OPENSEARCH_HOST = os.getenv("EC2_OPENSEARCH_HOST", "")
EC2_OPENSEARCH_PORT = os.getenv("EC2_OPENSEARCH_PORT", "9200")
EC2_OPENSEARCH_USERNAME = os.getenv("EC2_OPENSEARCH_USERNAME", "admin")
EC2_OPENSEARCH_PASSWORD = os.getenv("EC2_OPENSEARCH_PASSWORD", "YourStrongPassword123!")
EC2_OPENSEARCH_USE_SSL = os.getenv("EC2_OPENSEARCH_USE_SSL", "false").lower() == "true"
EC2_OPENSEARCH_VERIFY_CERTS = os.getenv("EC2_OPENSEARCH_VERIFY_CERTS", "false").lower() == "true"

client = OpenSearch(
    hosts=[{"host": EC2_OPENSEARCH_HOST, "port": EC2_OPENSEARCH_PORT}],
    http_auth=(EC2_OPENSEARCH_USERNAME, EC2_OPENSEARCH_PASSWORD),
    use_ssl=EC2_OPENSEARCH_USE_SSL,
    verify_certs=EC2_OPENSEARCH_VERIFY_CERTS,
    connection_class=RequestsHttpConnection,
    timeout=10,
)

@app.get("/")
def read_root():
    return {"message": "FastAPI + OpenSearch connected successfully"}

@app.get("/search")
def search(q: str, size: int = 25):
    def do_search():
        body = {"query": {"match": {"text": q}}, "size": size}
        return client.search(index="youtube-transcripts", body=body)

    try:
        resp = executor.submit(do_search).result(timeout=15)
        results = [
            {
                "video_id": hit["_source"].get("video_id"),
                "language_code": hit["_source"].get("language_code"),
                "start_time": hit["_source"].get("start_time"),
                "end_time": hit["_source"].get("end_time"),
                "text": hit["_source"].get("text"),
                "score": hit.get("_score"),
            }
            for hit in resp["hits"]["hits"]
        ]
        return {"query": q, "count": len(results), "results": results}
    except Exception as e:
        return {"query": q, "error": str(e), "results": []}
