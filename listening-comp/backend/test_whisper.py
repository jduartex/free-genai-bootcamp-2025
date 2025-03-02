"""
Simple test script to verify that Whisper is working correctly
"""
import os
import whisper
import logging
import pytest
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_whisper():
    """Test whisper model loading and basic functionality."""
    try:
        model = whisper.load_model("tiny")
        assert model is not None, "Failed to load whisper model"
        assert model.device is not None, "Model device not set"
        assert model.is_multilingual, "Model should be multilingual"
    except Exception as e:
        pytest.fail(f"Failed to initialize whisper: {str(e)}")

if __name__ == "__main__":
    print("Testing Whisper installation...")
    success = test_whisper()
    if success:
        print("\nWhisper is installed correctly! You can now start the backend server.")
    else:
        print("\nThere was an issue with the Whisper installation.")
