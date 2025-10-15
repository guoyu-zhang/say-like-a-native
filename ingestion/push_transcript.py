import os
import boto3
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST")
REGION = os.getenv("REGION")

def get_opensearch_client(host, region):
    service = "es"
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        region,
        service,
        session_token=credentials.token
    )

    return OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection
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
                "text": {"type": "text"}
            }
        }
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
            "text": entry["text"]
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
        }
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]

if __name__ == "__main__":
    INDEX_NAME = "youtube-transcripts"

    client = get_opensearch_client(OPENSEARCH_HOST, REGION)
    create_index_if_not_exists(client, INDEX_NAME)

    example_transcript = [
        {"start": 0.5, "duration": 2.0, "text": "Welcome to the video"},
        {"start": 2.5, "duration": 3.0, "text": "This is an example transcript"}
    ]

    store_transcript(client, INDEX_NAME, video_id="abc123", language_code="en", transcript_entries=example_transcript)

    results = search_transcripts(client, INDEX_NAME, query_text="example")
    print("Search Results:", results)
