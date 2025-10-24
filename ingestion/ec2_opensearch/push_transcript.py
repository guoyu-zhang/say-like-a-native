import os
from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
import json
from pathlib import Path

# Load environment variables from a .env file if present
load_dotenv()

EC2_OPENSEARCH_HOST = os.getenv("EC2_OPENSEARCH_HOST")
EC2_OPENSEARCH_PORT = int(os.getenv("EC2_OPENSEARCH_PORT", "9200"))
EC2_OPENSEARCH_USERNAME = os.getenv("EC2_OPENSEARCH_USERNAME")
EC2_OPENSEARCH_PASSWORD = os.getenv("EC2_OPENSEARCH_PASSWORD")
EC2_OPENSEARCH_USE_SSL = os.getenv("EC2_OPENSEARCH_USE_SSL", "false").lower() == "true"
EC2_OPENSEARCH_VERIFY_CERTS = os.getenv("EC2_OPENSEARCH_VERIFY_CERTS", "false").lower() == "true"
TRANSCRIPT_FILE = os.getenv("TRANSCRIPT_FILE")


def get_opensearch_client(host, port, username, password, use_ssl=False, verify_certs=False):
    return OpenSearch(
        hosts=[{"host": host, "port": port}],
        http_auth=(username, password) if username and password else None,
        use_ssl=use_ssl,
        verify_certs=verify_certs,
        connection_class=RequestsHttpConnection,
    )


def create_index_if_not_exists(client, index_name="youtube-transcripts"):
    index_body = {
        "settings": {"number_of_shards": 1},
        "mappings": {
            "properties": {
                "video_id": {"type": "keyword"},
                "language_code": {"type": "keyword"},
                "start_time": {"type": "float"},
                "end_time": {"type": "float"},
                "text": {"type": "text"},
            }
        },
    }

    if not client.indices.exists(index=index_name):
        client.indices.create(index=index_name, body=index_body)
        print(f"Created index: {index_name}")
    else:
        print(f"Index already exists: {index_name}")


def store_transcript(client, index_name, video_id, language_code, transcript_entries):
    for entry in transcript_entries:
        doc = {
            "video_id": video_id,
            "language_code": language_code,
            "start_time": entry["start"],
            "end_time": entry["start"] + entry["duration"],
            "text": entry["text"],
        }
        client.index(index=index_name, body=doc)
    print(f"Stored {len(transcript_entries)} transcript entries for video {video_id}")



# Load transcript JSON from disk

def load_transcript_payload(file_path: str = None):
    if file_path:
        path = Path(file_path)
    else:
        # Default to the latest JSON under ingestion/transcripts
        transcripts_dir = Path(__file__).resolve().parent.parent / "transcripts"
        if not transcripts_dir.exists():
            raise FileNotFoundError(f"Transcripts directory not found: {transcripts_dir}")
        candidates = sorted(transcripts_dir.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not candidates:
            raise FileNotFoundError(f"No transcript JSON files found in {transcripts_dir}")
        path = candidates[0]

    with path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    # Validate minimal fields
    if "entries" not in payload or "video_id" not in payload:
        raise ValueError("Transcript payload missing required fields: entries, video_id")
    payload.setdefault("language_code", "unknown")
    print(f"Loaded transcript file: {path}")
    return payload


if __name__ == "__main__":
    INDEX_NAME = "youtube-transcripts"

    client = get_opensearch_client(
        EC2_OPENSEARCH_HOST,
        EC2_OPENSEARCH_PORT,
        EC2_OPENSEARCH_USERNAME,
        EC2_OPENSEARCH_PASSWORD,
        use_ssl=EC2_OPENSEARCH_USE_SSL,
        verify_certs=EC2_OPENSEARCH_VERIFY_CERTS,
    )
    create_index_if_not_exists(client, INDEX_NAME)

    # Load transcript payload from file (env TRANSCRIPT_FILE or latest in transcripts dir)
    payload = load_transcript_payload(TRANSCRIPT_FILE)

    store_transcript(
        client,
        INDEX_NAME,
        video_id=payload["video_id"],
        language_code=payload.get("language_code", "unknown"),
        transcript_entries=payload["entries"],
    )

    print("Indexing complete.")