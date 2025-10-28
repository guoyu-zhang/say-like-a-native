from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
from pydantic import BaseModel
import os
import json
from datetime import datetime
from pathlib import Path

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

@app.get("/autocomplete")
def autocomplete(q: str, size: int = 5):
    if len(q.strip()) < 2:  # Don't suggest for very short queries
        return {"query": q, "suggestions": []}
    
    def do_autocomplete():
        # Use match_phrase_prefix for fast prefix matching
        body = {
            "query": {
                "match_phrase_prefix": {
                    "text": {
                        "query": q,
                        "max_expansions": 10
                    }
                }
            },
            "size": size * 2,  # Get more results to deduplicate
            "_source": ["text", "video_id", "start_time", "end_time"],  # Include timing info
            "timeout": "500ms"  # Fast timeout for autocomplete
        }
        return client.search(index="youtube-transcripts", body=body)

    try:
        resp = executor.submit(do_autocomplete).result(timeout=2)
        suggestions = []
        seen_texts = set()
        
        for hit in resp["hits"]["hits"]:
            text = hit["_source"].get("text", "").strip()
            if text and text not in seen_texts and len(suggestions) < size:
                # Extract the relevant phrase around the match
                words = text.split()
                if len(words) > 10:  # Truncate long texts
                    text = " ".join(words[:10]) + "..."
                
                suggestions.append({
                    "text": text,
                    "video_id": hit["_source"].get("video_id"),
                    "start_time": hit["_source"].get("start_time"),
                    "end_time": hit["_source"].get("end_time"),
                    "score": hit.get("_score")
                })
                seen_texts.add(text)
        
        return {"query": q, "suggestions": suggestions}
    except Exception as e:
        return {"query": q, "suggestions": [], "error": str(e)}

@app.get("/video-search")
def video_search(video_id: str, q: str = "", size: int = 25, single_result: bool = False):
    def do_video_search():
        # Build query for specific video
        if q.strip():
            # Search for text within the specific video
            body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"video_id": video_id}},
                            {"match": {"text": q}}
                        ]
                    }
                },
                "size": 1 if single_result else size
            }
        else:
            # Get all segments from the video
            body = {
                "query": {"term": {"video_id": video_id}},
                "size": 1 if single_result else size,
                "sort": [{"start_time": {"order": "asc"}}]
            }
        
        return client.search(index="youtube-transcripts", body=body)

    try:
        resp = executor.submit(do_video_search).result(timeout=10)
        results = []
        
        for hit in resp["hits"]["hits"]:
            src = hit["_source"]
            
            # Find previous segment for context
            prev_body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"video_id": src.get("video_id")}},
                            {"range": {"end_time": {"lt": src.get("start_time", 0)}}}
                        ]
                    }
                },
                "sort": [{"end_time": {"order": "desc"}}],
                "size": 1
            }
            
            try:
                prev_resp = client.search(index="youtube-transcripts", body=prev_body)
                previous = None
                if prev_resp["hits"]["hits"]:
                    prev_src = prev_resp["hits"]["hits"][0]["_source"]
                    previous = {
                        "start_time": prev_src.get("start_time"),
                        "end_time": prev_src.get("end_time"),
                        "text": prev_src.get("text"),
                        "language_code": prev_src.get("language_code")
                    }
            except:
                previous = None
            
            results.append({
                "video_id": src.get("video_id"),
                "language_code": src.get("language_code"),
                "start_time": src.get("start_time"),
                "end_time": src.get("end_time"),
                "text": src.get("text"),
                "score": hit.get("_score"),
                "previous": previous
            })
        
        return {"video_id": video_id, "query": q, "results": results}
    except Exception as e:
        return {"video_id": video_id, "query": q, "results": [], "error": str(e)}

# Waitlist data model
class WaitlistEntry(BaseModel):
    email: str

# Waitlist file path
WAITLIST_FILE = Path("data/waitlist.json")

def ensure_data_directory():
    WAITLIST_FILE.parent.mkdir(exist_ok=True)

def load_waitlist():
    ensure_data_directory()
    
    if not WAITLIST_FILE.exists():
        return []
    
    try:
        with open(WAITLIST_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading waitlist file: {e}")
        return []

def save_waitlist(waitlist):
    ensure_data_directory()
    
    try:
        with open(WAITLIST_FILE, 'w') as f:
            json.dump(waitlist, f, indent=2)
    except Exception as e:
        print(f"Error saving waitlist file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save waitlist data")

@app.post("/waitlist")
def add_to_waitlist(entry: WaitlistEntry):
    try:
        email = entry.email.strip().lower()
        
        # Basic email validation
        if not email or '@' not in email:
            raise HTTPException(status_code=400, detail="Valid email address is required")
        
        waitlist = load_waitlist()
        
        # Check if email already exists
        existing_entry = next((item for item in waitlist if item['email'] == email), None)
        if existing_entry:
            return {"message": "Email already registered"}
        
        # Add new entry
        new_entry = {
            "email": email,
            "timestamp": datetime.now().isoformat(),
            "id": str(int(datetime.now().timestamp() * 1000))
        }
        
        waitlist.append(new_entry)
        save_waitlist(waitlist)
        
        return {"message": "Successfully added to waitlist"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/waitlist")
def get_waitlist():
    waitlist = load_waitlist()
    return {
        "count": len(waitlist),
        "emails": [{"email": entry["email"], "timestamp": entry["timestamp"]} for entry in waitlist]
    }
