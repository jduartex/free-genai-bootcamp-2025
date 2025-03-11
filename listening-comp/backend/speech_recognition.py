import os
import asyncio
from typing import Dict, Any, Optional
import logging
from dotenv import load_dotenv
import tempfile
import subprocess
import json
import time
import base64
from typing import Dict, Any, Optional, Union, Tuple, List
import numpy as np
import openai
from pydub import AudioSegment
import whisper

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    openai.api_key = openai_api_key

class JapaneseSpeechRecognition:
    """Japanese-specific speech recognition using Whisper."""
    
    def __init__(self, use_local_model: bool = False, model_size: str = "base"):
        """
        Initialize speech recognition with Whisper model.
        
        Args:
            use_local_model: Whether to use a local model or download from Whisper
            model_size: Size of the Whisper model to use ("tiny", "base", "small", "medium", "large")
        """
        self.model_size = model_size
        self.use_local_model = use_local_model
        
        # Initialize Whisper model
        try:
            if use_local_model:
                model_path = os.path.join(os.path.dirname(__file__), "models", f"whisper-{model_size}")
                if os.path.exists(model_path):
                    self.model = whisper.load_model(model_path)
                else:
                    logger.warning(f"Local model not found at {model_path}. Downloading from Whisper...")
                    self.model = whisper.load_model(model_size)
            else:
                self.model = whisper.load_model(model_size)
                
            logger.info(f"Initialized Whisper model ({model_size})")
            
        except Exception as e:
            logger.error(f"Error initializing Whisper model: {str(e)}")
            raise
    
    def process_audio_data(self, audio_path: str) -> Dict[str, Any]:
        """
        Process audio file and return transcription.
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Dictionary containing transcription and metadata
        """
        try:
            # Convert audio to WAV format if needed
            audio_path = self._ensure_wav_format(audio_path)
            
            # Transcribe audio with Japanese-specific settings
            result = self.model.transcribe(
                audio_path,
                language="ja",  # Force Japanese language
                task="transcribe",
                initial_prompt="以下は日本語の音声です。",  # Hint that input is Japanese
                word_timestamps=True,  # Get word-level timing
                no_speech_threshold=0.5,
                compression_ratio_threshold=2.4
            )
            
            # Process the result
            processed_result = {
                "text": result.get("text", ""),
                "language": result.get("language", "ja"),
                "segments": result.get("segments", []),
                "word_timestamps": [
                    {
                        "word": segment.get("text", ""),
                        "start": segment.get("start", 0),
                        "end": segment.get("end", 0),
                        "confidence": segment.get("confidence", 0)
                    }
                    for segment in result.get("segments", [])
                ],
                "confidence": self._calculate_average_confidence(result)
            }
            
            # Clean up temporary WAV file if it was created
            if audio_path != audio_path and os.path.exists(audio_path):
                os.remove(audio_path)
            
            return processed_result
            
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            raise
    
    def _ensure_wav_format(self, audio_path: str) -> str:
        """
        Convert audio file to WAV format if needed.
        
        Args:
            audio_path: Path to the input audio file
            
        Returns:
            Path to WAV file (either original or converted)
        """
        try:
            # Check if file is already WAV
            if audio_path.lower().endswith('.wav'):
                return audio_path
            
            # Load audio file
            audio = AudioSegment.from_file(audio_path)
            
            # Create temporary WAV file
            temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            temp_wav_path = temp_wav.name
            temp_wav.close()
            
            # Export as WAV
            audio.export(temp_wav_path, format='wav')
            
            return temp_wav_path
            
        except Exception as e:
            logger.error(f"Error converting audio format: {str(e)}")
            raise
    
    def _calculate_average_confidence(self, result: Dict[str, Any]) -> float:
        """Calculate average confidence score from segments."""
        segments = result.get("segments", [])
        if not segments:
            return 0.0
            
        confidences = [segment.get("confidence", 0) for segment in segments]
        return sum(confidences) / len(confidences)
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model."""
        return {
            "model_size": self.model_size,
            "is_local": self.use_local_model,
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "language": "ja",
            "supports_word_timestamps": True
        }

class SpeechRecognizer:
    def __init__(self, model_name: str = "base"):
        """
        Initialize the speech recognizer with Whisper model.
        
        Args:
            model_name: Name of the Whisper model to use
        """
        try:
            self.model = whisper.load_model(model_name)
            logger.info(f"Loaded Whisper model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {str(e)}")
            raise

    async def transcribe(self, audio_path: str, language: str = "ja") -> Dict[str, Any]:
        """
        Transcribe audio file to text.
        
        Args:
            audio_path: Path to audio file
            language: Target language (default: Japanese)
            
        Returns:
            Dictionary containing transcription and metadata
        """
        try:
            # Load and transcribe audio
            result = self.model.transcribe(
                audio_path,
                language=language,
                task="transcribe"
            )
            
            return {
                "text": result["text"],
                "segments": result["segments"],
                "language": result.get("language", language),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }

    async def process_audio_stream(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Process audio data from a stream.
        
        Args:
            audio_data: Raw audio data bytes
            
        Returns:
            Transcription results
        """
        try:
            # Create temporary file to store audio data
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_file.write(audio_data)
                temp_path = temp_file.name

            # Transcribe the temporary file
            result = await self.transcribe(temp_path)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            return result
            
        except Exception as e:
            logger.error(f"Stream processing failed: {str(e)}")
            return {
                "status": "error",
                "error": str(e)
            }

# Example usage
if __name__ == "__main__":
    recognizer = JapaneseSpeechRecognition()
    print("Model info:", recognizer.get_model_info())
    
    # Example: Process an audio file
    test_audio = "path/to/test.mp3"
    if os.path.exists(test_audio):
        result = recognizer.process_audio_data(test_audio)
        print("Transcription:", result["text"])
        print("Confidence:", result["confidence"])
