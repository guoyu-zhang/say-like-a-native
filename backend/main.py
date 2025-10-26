from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
import os

app = FastAPI()

load_dotenv()

# Get allowed origins from environment variable for production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=4)

EC2_OPENSEARCH_HOST = os.getenv("EC2_OPENSEARCH_HOST", "localhost")
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
        fetch_size = max(size * 3, size)
        body = {"query": {"match": {"text": q}}, "size": fetch_size}
        return client.search(index="youtube-transcripts", body=body)

    try:
        resp = executor.submit(do_search).result(timeout=15)
        seen = set()
        results = []
        for hit in resp["hits"]["hits"]:
            src = hit["_source"]
            vid = src.get("video_id")
            if not vid or vid in seen:
                continue
            seen.add(vid)

            # Find the immediately previous segment for this video (same language if available)
            prev = None
            try:
                lang = src.get("language_code")
                start = src.get("start_time")
                if isinstance(start, (int, float)):
                    prev_query = {
                        "query": {
                            "bool": {
                                "must": [{"term": {"video_id": vid}}] + ([{"term": {"language_code": lang}}] if lang else []),
                                "filter": [{"range": {"start_time": {"lt": start}}}],
                            }
                        },
                        "sort": [{"start_time": {"order": "desc"}}],
                        "size": 1,
                    }
                    prev_resp = client.search(index="youtube-transcripts", body=prev_query)
                    prev_hits = prev_resp.get("hits", {}).get("hits", [])
                    if prev_hits:
                        prev_src = prev_hits[0].get("_source", {})
                        prev = {
                            "start_time": prev_src.get("start_time"),
                            "end_time": prev_src.get("end_time"),
                            "text": prev_src.get("text"),
                            "language_code": prev_src.get("language_code"),
                        }
            except Exception:
                prev = None

            results.append({
                "video_id": vid,
                "language_code": src.get("language_code"),
                "start_time": src.get("start_time"),
                "end_time": src.get("end_time"),
                "text": src.get("text"),
                "score": hit.get("_score"),
                "previous": prev,
            })
            if len(results) >= size:
                break
        return {"query": q, "count": len(results), "results": results}
    except Exception as e:
        return {"query": q, "error": str(e), "results": []}
