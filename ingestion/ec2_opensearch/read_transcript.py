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


def read_transcript_by_video(client, index_name, video_id):
    response = client.search(
        index=index_name,
        body={
            "query": {"term": {"video_id": video_id}},
            "size": 1000,
        },
    )
    return [hit["_source"] for hit in response["hits"]["hits"]]


def search_transcripts(client, index_name, query_text):
    response = client.search(
        index=index_name,
        body={"query": {"match": {"text": query_text}}, "size": 100},
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

    video_transcripts = read_transcript_by_video(client, INDEX_NAME, "abc123")
    print("Transcripts for video abc123:")
    for entry in video_transcripts:
        print(f"[{entry['start_time']:.2f}-{entry['end_time']:.2f}] {entry['text']}")

    keyword_results = search_transcripts(client, INDEX_NAME, "example")
    print("\nSearch results for 'example':")
    for entry in keyword_results:
        print(f"[{entry['video_id']}] [{entry['start_time']:.2f}-{entry['end_time']:.2f}] {entry['text']}")