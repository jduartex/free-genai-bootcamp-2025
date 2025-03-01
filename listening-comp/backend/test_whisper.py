"""
Simple test script to verify that Whisper is working correctly
"""
import os
import whisper
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_whisper():
    """Test that the Whisper model is loading correctly"""
    try:
        logger.info("Loading Whisper model (this may take a moment)...")
        model = whisper.load_model("base")
        logger.info(f"✅ Whisper model loaded successfully: {model.device}")
        return True
    except Exception as e:
        logger.error(f"❌ Error loading Whisper model: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing Whisper installation...")
    success = test_whisper()
    if success:
        print("\nWhisper is installed correctly! You can now start the backend server.")
    else:
        print("\nThere was an issue with the Whisper installation.")
