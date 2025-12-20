import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def get_transcript(video_id):
    try:
        # Try instantiating (for older version 1.2.3)
        try:
            api = YouTubeTranscriptApi()
            fetched_transcript = api.fetch(video_id)
        except:
             fetched_transcript = YouTubeTranscriptApi.get_transcript(video_id)

    except Exception as e:
        print(json.dumps({"error": f"Failed: {str(e)}"}))
        return

    # Format: [MM:SS] Text
    formatted_transcript = []
    try:
        for entry in fetched_transcript:
            # Handle object or dict
            if hasattr(entry, 'start'):
                start = entry.start
                text = entry.text
            else:
                start = entry.get('start')
                text = entry.get('text')
                
            if start is not None and text:
                minutes = int(float(start) // 60)
                seconds = int(float(start) % 60)
                timestamp = f"[{minutes}:{seconds:02d}]"
                formatted_transcript.append(f"{timestamp} {text}")
        
        print(json.dumps({"transcript": "\n".join(formatted_transcript)}))
    except Exception as e:
        print(json.dumps({"error": f"Formatting failed: {str(e)}"}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        video_id = sys.argv[1]
        get_transcript(video_id)
    else:
        print(json.dumps({"error": "No video ID provided"}))
