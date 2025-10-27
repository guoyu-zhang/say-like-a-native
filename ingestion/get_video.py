import os
import re
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

def read_channel_ids(file_path="channels.txt"):
    channels = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    channels.append(line)
        return channels
    except FileNotFoundError:
        print(f"Warning: {file_path} not found. Using default channel.")
        return []

def is_long_form_video(duration_iso):
    duration = duration_iso[2:]
    
    hours = re.search(r'(\d+)H', duration)
    minutes = re.search(r'(\d+)M', duration)
    seconds = re.search(r'(\d+)S', duration)
    
    total_seconds = 0
    if hours:
        total_seconds += int(hours.group(1)) * 3600
    if minutes:
        total_seconds += int(minutes.group(1)) * 60
    if seconds:
        total_seconds += int(seconds.group(1))
    
    return total_seconds > 180

def get_youtube_service(api_key):
    return build("youtube", "v3", developerKey=api_key)

def get_latest_video_id(youtube, channel_id):
    response = youtube.search().list(
        part="id",
        channelId=channel_id,
        maxResults=10,  
        order="date",
        type="video"
    ).execute()
    items = response.get("items")
    if not items:
        raise ValueError("No videos found for this channel.")
    
    for item in items:
        video_id = item["id"]["videoId"]
        video_details = youtube.videos().list(
            part="contentDetails",
            id=video_id
        ).execute()
        
        if video_details["items"]:
            duration = video_details["items"][0]["contentDetails"]["duration"]
            if is_long_form_video(duration):
                return video_id
    
    raise ValueError("No long-form videos found for this channel (only shorts available).")

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

def fetch_transcript(video_id, proxy_username, proxy_password):
    try:
        ytt_api = YouTubeTranscriptApi(
            proxy_config=WebshareProxyConfig(
                proxy_username=proxy_username,
                proxy_password=proxy_password
            )
        )
        transcript = ytt_api.fetch(video_id)
        print("Transcripts available: True")
        return transcript.to_raw_data()
    except Exception as e:
        print(f"Transcripts available: False - {str(e)}")
        return None


def save_transcript_to_file(video_id, transcript_entries, language_code=None, output_dir=None):
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
    api_key, proxy_username, proxy_password = load_environment()
    
    channel_ids = read_channel_ids()
    
    if not channel_ids:
        channel_ids = ["UCftwRNsjfRo08xYE31tkiyw"]  
    
    print(f"Processing {len(channel_ids)} channel(s)...")
    
    for i, channel_id in enumerate(channel_ids, 1):
        print(f"\n--- Processing Channel {i}/{len(channel_ids)}: {channel_id} ---")
        
        try:
            youtube = build("youtube", "v3", developerKey=api_key)
            latest_video_id = get_latest_video_id(youtube, channel_id)
            print(f"Latest video ID: {latest_video_id}")
            
            video_info = get_video_info(youtube, latest_video_id)
            print_video_info(video_info)
            
            transcript = fetch_transcript(latest_video_id, proxy_username, proxy_password)
            
            if transcript is not None:
                save_transcript_to_file(latest_video_id, transcript, language_code=(video_info["snippet"].get("defaultAudioLanguage") or "unknown"))
                print(f"Transcript saved for video {latest_video_id}")
            else:
                print(f"No transcripts available for video {latest_video_id}. Skipping transcript save.")
                
        except Exception as e:
            print(f"Error processing channel {channel_id}: {e}")
            continue  # Continue with next channel even if one fails
    
    print(f"\nCompleted processing all channels.")
