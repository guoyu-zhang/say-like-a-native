import os
from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

EC2_OPENSEARCH_HOST = os.getenv("EC2_OPENSEARCH_HOST")
EC2_OPENSEARCH_PORT = int(os.getenv("EC2_OPENSEARCH_PORT", "9200"))
EC2_OPENSEARCH_USERNAME = os.getenv("EC2_OPENSEARCH_USERNAME")
EC2_OPENSEARCH_PASSWORD = os.getenv("EC2_OPENSEARCH_PASSWORD")
EC2_OPENSEARCH_USE_SSL = os.getenv("EC2_OPENSEARCH_USE_SSL", "false").lower() == "true"
EC2_OPENSEARCH_VERIFY_CERTS = os.getenv("EC2_OPENSEARCH_VERIFY_CERTS", "false").lower() == "true"


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


def search_transcripts(client, index_name, query_text):
    response = client.search(
        index=index_name,
        body={
            "query": {
                "match": {
                    "text": query_text
                }
            }
        },
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]


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

    example_transcript = [
        {"start": 0.5, "duration": 2.0, "text": "Welcome to the video"},
        {"start": 2.5, "duration": 3.0, "text": "This is an example transcript"},
    ]

    store_transcript(
        client,
        INDEX_NAME,
        video_id="abc123",
        language_code="en",
        transcript_entries=example_transcript,
    )

    results = search_transcripts(client, INDEX_NAME, query_text="example")
    print("Search Results:", results)