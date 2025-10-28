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
    
    return 120 < total_seconds <= 1800

def get_youtube_service(api_key):
    return build("youtube", "v3", developerKey=api_key)

def load_processed_video_ids(file_path="processed_videos.txt"):
    processed_ids = set()
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                video_id = line.strip()
                if video_id:
                    processed_ids.add(video_id)
        print(f"Loaded {len(processed_ids)} previously processed video IDs")
    except FileNotFoundError:
        print(f"No previous processed videos file found at {file_path}. Starting fresh.")
    return processed_ids

def save_processed_video_id(video_id, file_path="processed_videos.txt"):
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(f"{video_id}\n")

def get_multiple_videos(youtube, channel_id, max_videos=10):
    """Get up to max_videos long-form videos from a channel"""
    long_form_videos = []
    next_page_token = None
    search_limit = 50  # Search through more videos to find long-form ones
    
    while len(long_form_videos) < max_videos:
        # Search for videos from the channel
        search_params = {
            "part": "id",
            "channelId": channel_id,
            "maxResults": min(search_limit, 50),  # YouTube API limit is 50
            "order": "date",
            "type": "video"
        }
        
        if next_page_token:
            search_params["pageToken"] = next_page_token
            
        response = youtube.search().list(**search_params).execute()
        items = response.get("items", [])
        
        if not items:
            break
            
        # Get video IDs for batch processing
        video_ids = [item["id"]["videoId"] for item in items]
        
        # Get video details in batch
        video_details_response = youtube.videos().list(
            part="contentDetails,snippet",
            id=",".join(video_ids)
        ).execute()
        
        # Filter for long-form videos
        for video_detail in video_details_response.get("items", []):
            if len(long_form_videos) >= max_videos:
                break
                
            duration = video_detail["contentDetails"]["duration"]
            if is_long_form_video(duration):
                long_form_videos.append({
                    "video_id": video_detail["id"],
                    "title": video_detail["snippet"]["title"],
                    "published_at": video_detail["snippet"]["publishedAt"]
                })
        
        # Check if there are more pages
        next_page_token = response.get("nextPageToken")
        if not next_page_token:
            break
    
    if not long_form_videos:
        raise ValueError("No long-form videos found for this channel (only shorts available).")
    
    return long_form_videos

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
    
    # Load previously processed video IDs
    processed_video_ids = load_processed_video_ids()
    
    print(f"Processing {len(channel_ids)} channel(s)...")
    print(f"Target: Up to 10 videos per channel (2-30 minutes duration)")
    
    # Overall statistics
    total_videos_found = 0
    total_transcripts_saved = 0
    successful_channels = 0
    
    for i, channel_id in enumerate(channel_ids, 1):
        print(f"\n--- Processing Channel {i}/{len(channel_ids)}: {channel_id} ---")
        
        try:
            youtube = build("youtube", "v3", developerKey=api_key)
            videos = get_multiple_videos(youtube, channel_id, max_videos=10)
            print(f"Found {len(videos)} long-form videos for this channel")
            total_videos_found += len(videos)
            
            successful_downloads = 0
            for j, video_data in enumerate(videos, 1):
                video_id = video_data["video_id"]
                print(f"\n  Processing video {j}/{len(videos)}: {video_id}")
                print(f"  Title: {video_data['title']}")
                print(f"  Published: {video_data['published_at']}")
                
                # Check if video has already been processed
                if video_id in processed_video_ids:
                    print(f"  ⏭ Video {video_id} already processed. Skipping.")
                    continue
                
                try:
                    video_info = get_video_info(youtube, video_id)
                    print_video_info(video_info)
                    
                    transcript = fetch_transcript(video_id, proxy_username, proxy_password)
                    
                    if transcript is not None:
                        save_transcript_to_file(video_id, transcript, language_code=(video_info["snippet"].get("defaultAudioLanguage") or "unknown"))
                        # Add video ID to processed list
                        save_processed_video_id(video_id)
                        processed_video_ids.add(video_id)
                        print(f"  ✓ Transcript saved for video {video_id}")
                        successful_downloads += 1
                        total_transcripts_saved += 1
                    else:
                        print(f"  ✗ No transcripts available for video {video_id}. Skipping transcript save.")
                        
                except Exception as video_error:
                    print(f"  ✗ Error processing video {video_id}: {video_error}")
                    continue  # Continue with next video even if one fails
            
            print(f"\nChannel {channel_id} summary: {successful_downloads}/{len(videos)} videos processed successfully")
            if successful_downloads > 0:
                successful_channels += 1
                
        except Exception as e:
            print(f"Error processing channel {channel_id}: {e}")
            continue  # Continue with next channel even if one fails
    
    print(f"\n" + "="*60)
    print(f"FINAL SUMMARY:")
    print(f"Channels processed: {len(channel_ids)}")
    print(f"Channels with successful downloads: {successful_channels}")
    print(f"Total long-form videos found: {total_videos_found}")
    print(f"Total transcripts saved: {total_transcripts_saved}")
    print(f"Success rate: {(total_transcripts_saved/total_videos_found*100):.1f}%" if total_videos_found > 0 else "No videos found")
    print(f"="*60)
