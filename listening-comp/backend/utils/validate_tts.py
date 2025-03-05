import os
import sys
import boto3
from google.cloud import texttospeech
import soundfile as sf
import numpy as np
import io
from dotenv import load_dotenv

# Try to load environment variables from .env file
load_dotenv()

def test_aws_polly():
    """Test AWS Polly TTS implementation for Japanese."""
    try:
        # Check for AWS credentials
        if not os.environ.get("AWS_ACCESS_KEY_ID") or not os.environ.get("AWS_SECRET_ACCESS_KEY"):
            print("❌ AWS credentials not found in environment variables")
            print("ℹ️ To use AWS Polly, set up credentials by:")
            print("  1. Creating a .env file in the project root with your AWS credentials:")
            print("     AWS_ACCESS_KEY_ID=your_access_key_here")
            print("     AWS_SECRET_ACCESS_KEY=your_secret_key_here")
            print("     AWS_REGION=us-east-1 (or your preferred region)")
            print("  2. Or set environment variables directly in your terminal:")
            print("     export AWS_ACCESS_KEY_ID=your_access_key_here")
            print("     export AWS_SECRET_ACCESS_KEY=your_secret_key_here")
            print("     export AWS_REGION=us-east-1")
            print("ℹ️ If you don't plan to use AWS Polly, you can ignore this warning and use Google TTS instead.")
            return None  # Return None instead of False to indicate non-critical failure
        
        # Initialize Polly client
        region = os.environ.get("AWS_REGION", "us-east-1")  # Default to us-east-1 if not specified
        polly_client = boto3.client('polly', region_name=region)
        
        # Test with Japanese text
        japanese_text = "こんにちは、日本語のテストです。"
        
        # Define voices with their required engine types
        voices = [
            {"id": "Takumi", "engine": "standard"}, 
            {"id": "Mizuki", "engine": "standard"}, 
            # Kazuha requires neural engine
            {"id": "Kazuha", "engine": "neural"}
        ]
        
        results = []
        
        for voice in voices:
            try:
                response = polly_client.synthesize_speech(
                    Text=japanese_text,
                    OutputFormat='mp3',
                    VoiceId=voice["id"],
                    Engine=voice["engine"],
                    LanguageCode='ja-JP'
                )
                
                if 'AudioStream' in response:
                    print(f"✅ AWS Polly successfully synthesized Japanese speech with voice: {voice['id']} (engine: {voice['engine']})")
                    results.append(True)
                else:
                    print(f"❌ AWS Polly failed to synthesize speech with voice: {voice['id']}")
                    results.append(False)
            except Exception as e:
                print(f"❌ Error with AWS Polly voice {voice['id']}: {str(e)}")
                # If the error is about the voice not being available in the region, log helpful message
                if "voice is not available" in str(e).lower():
                    print(f"   ℹ️ The '{voice['id']}' voice might not be available in region '{region}'.")
                    print(f"   ℹ️ Try changing AWS_REGION in your .env file to one of: us-east-1, us-west-2")
                results.append(False)
        
        if not results:
            return False
        # If at least one voice works, consider the test passed
        return any(results)
    except Exception as e:
        print(f"❌ AWS Polly test failed: {str(e)}")
        return False

def test_google_tts():
    """Test Google TTS implementation for Japanese."""
    try:
        # Check for Google credentials
        creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if not creds_path:
            print("❌ GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
            print("ℹ️ To use Google TTS, set up credentials by:")
            print("  1. Download a service account JSON key file from Google Cloud Console")
            print("  2. Add to your .env file:")
            print("     GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/your/credentials.json")
            return None  # Return None instead of False to indicate non-critical failure
            
        # Check if the credentials file exists
        if not os.path.exists(creds_path):
            print(f"❌ Google credentials file not found at: {creds_path}")
            # Check if using placeholder path
            if "path/to/your" in creds_path:
                print("ℹ️ You're using the placeholder path from .env.example!")
                print("ℹ️ Please replace it with the actual path to your Google credentials file")
            else:
                print("ℹ️ Please check that the file path is correct and the file exists")
            return None
            
        # Initialize Google TTS client
        client = texttospeech.TextToSpeechClient()
        
        # Test with Japanese text
        japanese_text = "こんにちは、日本語のテストです。"
        
        synthesis_input = texttospeech.SynthesisInput(text=japanese_text)
        
        # Configure voice parameters for Japanese
        voice = texttospeech.VoiceSelectionParams(
            language_code="ja-JP",
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        
        # Configure audio parameters
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        # Perform TTS request
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        if response.audio_content:
            print("✅ Google TTS successfully synthesized Japanese speech")
            return True
        else:
            print("❌ Google TTS failed to synthesize Japanese speech")
            return False
    except Exception as e:
        print(f"❌ Google TTS test failed: {str(e)}")
        if "credentials" in str(e).lower():
            print("ℹ️ This appears to be a credentials issue. Make sure:")
            print("  1. Your service account has Text-to-Speech API access enabled")
            print("  2. The JSON file contains valid credentials")
            print("  3. The project has Text-to-Speech API enabled in Google Cloud Console")
        return False

def test_tts_pitch_accent():
    """Test if TTS implementation handles Japanese pitch accent correctly."""
    # This is a simplified test and would need actual audio analysis to be comprehensive
    print("ℹ️ Testing pitch accent would require audio analysis - manual verification recommended")
    print("ℹ️ Sample words with different pitch accents:")
    print("   - 橋 (hashi, bridge): high-low pitch")
    print("   - 箸 (hashi, chopsticks): low-high pitch")
    return None
