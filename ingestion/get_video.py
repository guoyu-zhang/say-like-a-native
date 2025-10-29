import os
import re
import argparse
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

def read_video_ids(file_path="video_ids.txt"):
    video_ids = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    video_id = extract_video_id(line)
                    if video_id:
                        video_ids.append(video_id)
        return video_ids
    except FileNotFoundError:
        print(f"Warning: {file_path} not found.")
        return []

def extract_video_id(url_or_id):
    """Extract video ID from YouTube URL or return as-is if already an ID"""
    # If it's already a video ID (11 characters, alphanumeric + - and _)
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_id):
        return url_or_id
    
    # Extract from various YouTube URL formats
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com/watch\?.*v=([a-zA-Z0-9_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    
    print(f"Warning: Could not extract video ID from: {url_or_id}")
    return None

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

def process_specific_videos(youtube, video_ids):
    if not video_ids:
        return []
    
    processed_videos = []
    
    # Process videos in batches of 50 (YouTube API limit)
    batch_size = 50
    for i in range(0, len(video_ids), batch_size):
        batch_ids = video_ids[i:i + batch_size]
        
        try:
            # Get video details in batch
            video_details_response = youtube.videos().list(
                part="contentDetails,snippet",
                id=",".join(batch_ids)
            ).execute()
            
            # Process each video in the batch
            for video_detail in video_details_response.get("items", []):
                video_data = {
                    "video_id": video_detail["id"],
                    "title": video_detail["snippet"]["title"],
                    "published_at": video_detail["snippet"]["publishedAt"],
                    "duration": video_detail["contentDetails"]["duration"]
                }
                processed_videos.append(video_data)
                
        except Exception as e:
            print(f"Error processing batch {i//batch_size + 1}: {e}")
            continue
    
    return processed_videos

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


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Download YouTube video transcripts from channels or specific video IDs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python get_video.py                    # Process both video_ids.txt and channels.txt (default)
  python get_video.py --videos-only      # Only process video_ids.txt
  python get_video.py --channels-only    # Only process channels.txt
        """
    )
    
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        '--videos-only',
        action='store_true',
        help='Only process specific video IDs from video_ids.txt'
    )
    group.add_argument(
        '--channels-only',
        action='store_true',
        help='Only process channels from channels.txt'
    )
    
    return parser.parse_args()


if __name__ == "__main__":
    # Parse command-line arguments
    args = parse_arguments()
    
    api_key, proxy_username, proxy_password = load_environment()
    youtube = get_youtube_service(api_key)
    processed_video_ids = load_processed_video_ids()
    
    total_videos_processed = 0
    
    # Process specific video IDs if requested or if no flags are specified
    if not args.channels_only:
        video_ids_file = Path("video_ids.txt")
        if video_ids_file.exists():
            print("Processing specific video IDs from video_ids.txt...")
            video_ids = read_video_ids()
            if video_ids:
                videos = process_specific_videos(youtube, video_ids)
                
                videos_processed_from_ids = 0
                for video_data in videos:
                    video_id = video_data['video_id']
                    if video_id in processed_video_ids:
                        print(f"Skipping {video_id} - already processed")
                        continue
                    
                    # Get full video info for print_video_info
                    video_info = get_video_info(youtube, video_id)
                    print_video_info(video_info)
                    
                    transcript_text = fetch_transcript(video_id, proxy_username, proxy_password)
                    if transcript_text:
                        file_path = save_transcript_to_file(video_id, transcript_text)
                        print(f"Transcript saved to: {file_path}")
                        processed_video_ids.add(video_id)
                        save_processed_video_id(video_id)
                        videos_processed_from_ids += 1
                        total_videos_processed += 1
                    else:
                        print(f"Failed to fetch transcript for video {video_id}")
                    
                    print("-" * 50)
                
                print(f"Processed {videos_processed_from_ids} specific videos from video_ids.txt")
            else:
                print("No valid video IDs found in video_ids.txt")
        elif args.videos_only:
            print("Error: --videos-only flag specified but video_ids.txt not found")
            exit(1)
    
    # Process channels if requested or if no flags are specified
    if not args.videos_only:
        channel_ids = read_channel_ids()
        if not channel_ids:
            if args.channels_only:
                print("Error: --channels-only flag specified but no channel IDs found in channels.txt")
                exit(1)
            elif not args.videos_only:
                print("No channel IDs found in channels.txt")
        else:
            print("\nProcessing channels from channels.txt...")
            
            for channel_id in channel_ids:
                print(f"\nProcessing channel: {channel_id}")
                videos = get_multiple_videos(youtube, channel_id, max_videos=10)
                
                if not videos:
                    print(f"No videos found for channel {channel_id}")
                    continue
                
                print(f"Found {len(videos)} long-form videos (>= 10 minutes)")
                
                videos_processed_this_channel = 0
                
                for video_data in videos:
                    video_id = video_data['video_id']
                    if video_id in processed_video_ids:
                        print(f"Skipping {video_id} - already processed")
                        continue
                    
                    # Get full video info for print_video_info
                    video_info = get_video_info(youtube, video_id)
                    print_video_info(video_info)
                    
                    transcript_text = fetch_transcript(video_id, proxy_username, proxy_password)
                    if transcript_text:
                        file_path = save_transcript_to_file(video_id, transcript_text)
                        print(f"Transcript saved to: {file_path}")
                        processed_video_ids.add(video_id)
                        save_processed_video_id(video_id)
                        videos_processed_this_channel += 1
                        total_videos_processed += 1
                    else:
                        print(f"Failed to fetch transcript for video {video_id}")
                    
                    print("-" * 50)
                
                print(f"Processed {videos_processed_this_channel} videos from channel {channel_id}")
    
    print(f"\nTotal videos processed: {total_videos_processed}")
