import sys
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import JSONFormatter

def validate_youtube_transcript_api():
    """Validate that the YouTube Transcript API is working correctly."""
    print("🔍 Validating YouTube Transcript API...")
    
    # Test videos with Japanese transcripts
    test_video_ids = [
        "aPfIx4yzcSk",  # Japanese learning video with transcript
        "JBF6xtJAv3I"   # Backup Japanese video with transcript
    ]
    
    for video_id in test_video_ids:
        try:
            # Try to get transcripts for the test video
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            
            # Check if Japanese transcript is available
            japanese_transcript = None
            for transcript in transcript_list:
                if transcript.language_code.startswith('ja'):
                    japanese_transcript = transcript
                    break
                    
            if japanese_transcript:
                # Fetch the Japanese transcript
                transcript_data = japanese_transcript.fetch()
                
                # Check if transcript contains valid Japanese text
                if transcript_data and len(transcript_data) > 0:
                    sample_text = transcript_data[0].get('text', '')
                    if any(ord(c) > 0x3000 for c in sample_text):  # Check for Japanese characters
                        print(f"✅ Successfully fetched Japanese transcript for video {video_id}")
                        print(f"✅ Sample text: {sample_text}")
                        return True
                    else:
                        print(f"⚠️ Transcript for {video_id} doesn't contain Japanese characters")
                else:
                    print(f"⚠️ Empty transcript for {video_id}")
            else:
                print(f"⚠️ No Japanese transcript found for {video_id}")
                
        except Exception as e:
            print(f"❌ Error fetching transcript for {video_id}: {str(e)}")
    
    print("❌ Failed to validate YouTube Transcript API for Japanese content")
    return False

def test_transcript_processing():
    """Test transcript processing functionality."""
    print("🔍 Testing transcript processing...")
    
    try:
        # Create a sample transcript
        sample_transcript = [
            {'text': 'こんにちは、元気ですか？', 'start': 0.0, 'duration': 2.0},
            {'text': '日本語を勉強しています。', 'start': 2.0, 'duration': 2.5},
            {'text': 'がんばってください！', 'start': 4.5, 'duration': 2.0}
        ]
        
        # Test JSON formatting
        formatter = JSONFormatter()
        json_formatted = formatter.format_transcript(sample_transcript)
        
        if json_formatted and isinstance(json_formatted, str):
            print("✅ Transcript JSON formatting successful")
            return True
        else:
            print("❌ Transcript formatting failed")
            return False
            
    except Exception as e:
        print(f"❌ Transcript processing test failed: {str(e)}")
        return False

if __name__ == "__main__":
    # Run tests
    api_valid = validate_youtube_transcript_api()
    processing_valid = test_transcript_processing()
    
    if api_valid and processing_valid:
        print("✅ YouTube Transcript API validation successful")
        sys.exit(0)
    else:
        print("❌ YouTube Transcript API validation failed")
        sys.exit(1)
