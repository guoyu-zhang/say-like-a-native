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

def read_transcript_by_video(client, index_name, video_id):
    response = client.search(
        index=index_name,
        body={
            "query": {"term": {"video_id": video_id}},
            "size": 1000
        }
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]

def search_transcripts(client, index_name, query_text):
    response = client.search(
        index=index_name,
        body={
            "query": {"match": {"text": query_text}},
            "size": 100
        }
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]

if __name__ == "__main__":
    INDEX_NAME = "youtube-transcripts"

    client = get_opensearch_client(OPENSEARCH_HOST, REGION)

    video_transcripts = read_transcript_by_video(client, INDEX_NAME, "abc123")
    print("Transcripts for video abc123:")
    for entry in video_transcripts:
        print(f"[{entry['start_time']:.2f}-{entry['end_time']:.2f}] {entry['text']}")

    keyword_results = search_transcripts(client, INDEX_NAME, "example")
    print("\nSearch results for 'example':")
    for entry in keyword_results:
        print(f"[{entry['video_id']}] [{entry['start_time']:.2f}-{entry['end_time']:.2f}] {entry['text']}")
