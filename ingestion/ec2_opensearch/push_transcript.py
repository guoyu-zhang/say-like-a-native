import os
from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
import json
from pathlib import Path
import shutil

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


def move_to_storage(transcript_path: Path):
    """
    Move a processed transcript file to the storage folder.
    Creates the storage folder if it doesn't exist.
    """
    # Get the storage directory (sibling to transcripts folder)
    storage_dir = transcript_path.parent.parent / "store"
    storage_dir.mkdir(exist_ok=True)
    
    # Move the file to storage
    destination = storage_dir / transcript_path.name
    shutil.move(str(transcript_path), str(destination))
    print(f"Moved processed transcript to: {destination}")
    return destination

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

    # If TRANSCRIPT_FILE is specified, process only that file
    if TRANSCRIPT_FILE:
        print(f"Processing specific file: {TRANSCRIPT_FILE}")
        try:
            payload = load_transcript_payload(TRANSCRIPT_FILE)
            store_transcript(
                client,
                INDEX_NAME,
                video_id=payload["video_id"],
                language_code=payload.get("language_code", "unknown"),
                transcript_entries=payload["entries"],
            )
            
            # Move to storage after successful processing
            transcript_path = Path(TRANSCRIPT_FILE)
            move_to_storage(transcript_path)
            print(f"Successfully processed and moved: {TRANSCRIPT_FILE}")
            
        except Exception as e:
            print(f"Error processing {TRANSCRIPT_FILE}: {e}")
    else:
        # Process all JSON files in the transcripts directory
        transcripts_dir = Path(__file__).resolve().parent.parent / "transcripts"
        if not transcripts_dir.exists():
            print(f"Transcripts directory not found: {transcripts_dir}")
            exit(1)
            
        json_files = list(transcripts_dir.glob("*.json"))
        if not json_files:
            print(f"No JSON files found in {transcripts_dir}")
            exit(1)
            
        print(f"Found {len(json_files)} transcript files to process...")
        
        processed_count = 0
        failed_count = 0
        
        for json_file in json_files:
            try:
                print(f"\nProcessing: {json_file.name}")
                
                # Load and validate the transcript
                with json_file.open("r", encoding="utf-8") as f:
                    payload = json.load(f)
                    
                if "entries" not in payload or "video_id" not in payload:
                    print(f"Skipping {json_file.name}: Missing required fields (entries, video_id)")
                    failed_count += 1
                    continue
                    
                payload.setdefault("language_code", "unknown")
                
                # Store in OpenSearch
                store_transcript(
                    client,
                    INDEX_NAME,
                    video_id=payload["video_id"],
                    language_code=payload.get("language_code", "unknown"),
                    transcript_entries=payload["entries"],
                )
                
                # Move to storage after successful processing
                move_to_storage(json_file)
                processed_count += 1
                print(f"✓ Successfully processed: {json_file.name}")
                
            except Exception as e:
                print(f"✗ Error processing {json_file.name}: {e}")
                failed_count += 1
                continue
        
        print(f"\n=== Processing Summary ===")
        print(f"Total files: {len(json_files)}")
        print(f"Successfully processed: {processed_count}")
        print(f"Failed: {failed_count}")
        print("Indexing complete.")
