import os
from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
import argparse

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

    parser = argparse.ArgumentParser(description="Search for a phrase in OpenSearch transcripts")
    parser.add_argument("--query", "-q", help="Phrase to search in transcript text")
    args = parser.parse_args()

    if args.query:
        keyword_results = search_transcripts(client, INDEX_NAME, args.query)
        print(f"\nSearch results for '{args.query}':")
        for entry in keyword_results:
            print(f"[{entry['video_id']}] [{entry['start_time']:.2f}-{entry['end_time']:.2f}] {entry['text']}")
    else:
        print("Provide a search phrase with --query.")