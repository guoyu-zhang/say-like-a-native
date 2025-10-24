import os
from dotenv import load_dotenv
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig
import json
from pathlib import Path

def load_environment():
    load_dotenv()
    api_key = os.getenv("YOUTUBE_API_KEY")
    proxy_username = os.getenv("PROXY_USERNAME")
    proxy_password = os.getenv("PROXY_PASSWORD")
    return api_key, proxy_username, proxy_password

def get_youtube_service(api_key):
    return build("youtube", "v3", developerKey=api_key)

def get_latest_video_id(youtube, channel_id):
    response = youtube.search().list(
        part="id",
        channelId=channel_id,
        maxResults=1,
        order="date",
        type="video"
    ).execute()
    items = response.get("items")
    if not items:
        raise ValueError("No videos found for this channel.")
    return items[0]["id"]["videoId"]

def get_video_info(youtube, video_id):
    response = youtube.videos().list(
        part="snippet,contentDetails,statistics",
        id=video_id
    ).execute()
    return response["items"][0]

def print_video_info(video_info):
    snippet = video_info["snippet"]
    stats = video_info.get("statistics", {})
    content = video_info["contentDetails"]

    print("Title:", snippet["title"])
    print("Published at:", snippet["publishedAt"])
    print("Audio language:", snippet.get("defaultAudioLanguage"))
    print("View count:", stats.get("viewCount"))
    print("Duration (ISO 8601):", content["duration"])
    print("Captions available:", content.get("caption") == "true")

def fetch_transcript(video_id, proxy_username, proxy_password):
    ytt_api = YouTubeTranscriptApi(
        proxy_config=WebshareProxyConfig(
            proxy_username=proxy_username,
            proxy_password=proxy_password
        )
    )
    transcript = ytt_api.fetch(video_id)
    return transcript.to_raw_data()

# Save transcript entries to a JSON file alongside video metadata

def save_transcript_to_file(video_id, transcript_entries, language_code=None, output_dir=None):
    # Default output directory under ingestion/transcripts
    base_dir = Path(__file__).resolve().parent
    transcripts_dir = Path(output_dir) if output_dir else base_dir / "transcripts"
    transcripts_dir.mkdir(parents=True, exist_ok=True)

    payload = {
        "video_id": video_id,
        "language_code": language_code or "unknown",
        "entries": transcript_entries,
    }

    out_path = transcripts_dir / f"{video_id}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Saved transcript to: {out_path}")
    return str(out_path)


if __name__ == "__main__":
    API_KEY, PROXY_USERNAME, PROXY_PASSWORD = load_environment()
    CHANNEL_ID = "UCftwRNsjfRo08xYE31tkiyw"

    youtube = build("youtube", "v3", developerKey=API_KEY)
    latest_video_id = get_latest_video_id(youtube, CHANNEL_ID)
    print(f"Latest video ID: {latest_video_id}")

    video_info = get_video_info(youtube, latest_video_id)
    print_video_info(video_info)

    transcript = fetch_transcript(latest_video_id, PROXY_USERNAME, PROXY_PASSWORD)
    # Persist transcript to file for later ingestion
    save_transcript_to_file(latest_video_id, transcript, language_code=(video_info["snippet"].get("defaultAudioLanguage") or "unknown"))
