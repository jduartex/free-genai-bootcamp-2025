import os
import asyncio
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SpeechRecognizer:
    """
    Speech recognition module for Japanese audio processing
    with fallback options when Whisper isn't available
    """
    
    def __init__(self):
        """Initialize the speech recognizer with available engine"""
        self.whisper_available = False
        self.openai_available = False
        self.model = None
        
        # Try to import whisper
        try:
            import whisper
            self.whisper_available = True
            logger.info("Using local Whisper model for speech recognition")
            # Don't load model here - wait until first use
        except ImportError:
            logger.warning("Local Whisper not available. Will attempt to use OpenAI API for speech recognition.")
            
        # Check for OpenAI API as fallback
        try:
            import openai
            from dotenv import load_dotenv
            load_dotenv()
            
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.openai_client = openai.OpenAI(api_key=api_key)
                self.openai_available = True
                logger.info("OpenAI API available for speech recognition")
            else:
                logger.warning("OpenAI API key not found. Speech recognition will be limited.")
        except ImportError:
            logger.warning("OpenAI package not available. Speech recognition will be limited.")
    
    async def transcribe(self, audio_path: str, language: str = "ja") -> Dict[str, Any]:
        """
        Transcribe Japanese audio to text
        
        Args:
            audio_path: Path to the audio file
            language: Language code (default: 'ja' for Japanese)
            
        Returns:
            Dictionary with transcription and metadata
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        # Try local Whisper first if available
        if self.whisper_available:
            return await self._transcribe_with_local_whisper(audio_path, language)
            
        # Fall back to OpenAI API
        elif self.openai_available:
            return await self._transcribe_with_openai_api(audio_path, language)
            
        # No speech recognition available
        else:
            logger.error("No speech recognition engine available")
            return {
                "error": "Speech recognition unavailable",
                "message": "Neither local Whisper nor OpenAI API is available. Please install whisper or configure OpenAI API.",
                "installation_help": "For Python 3.13, try: pip install git+https://github.com/openai/whisper.git"
            }
    
    async def _transcribe_with_local_whisper(self, audio_path: str, language: str) -> Dict[str, Any]:
        """Use local Whisper model for transcription"""
        try:
            import whisper
            
            # Load model on first use
            if self.model is None:
                logger.info("Loading Whisper model (this may take a moment)...")
                self.model = await asyncio.to_thread(whisper.load_model, "base")
                
            # Perform transcription
            result = await asyncio.to_thread(
                self.model.transcribe,
                audio_path,
                language=language,
                fp16=False  # Avoid GPU-only features for compatibility
            )
            
            # Format result
            segments = []
            for segment in result.get("segments", []):
                segments.append({
                    "start": segment.get("start", 0),
                    "end": segment.get("end", 0),
                    "text": segment.get("text", ""),
                    "confidence": segment.get("confidence", 0)
                })
                
            return {
                "text": result.get("text", ""),
                "segments": segments,
                "language": result.get("language", language),
                "engine": "whisper-local"
            }
            
        except Exception as e:
            logger.error(f"Local Whisper transcription failed: {str(e)}")
            if self.openai_available:
                logger.info("Falling back to OpenAI API")
                return await self._transcribe_with_openai_api(audio_path, language)
            else:
                return {"error": str(e)}
    
    async def _transcribe_with_openai_api(self, audio_path: str, language: str) -> Dict[str, Any]:
        """Use OpenAI API for transcription"""
        try:
            with open(audio_path, "rb") as audio_file:
                result = await asyncio.to_thread(
                    self.openai_client.audio.transcriptions.create,
                    model="whisper-1",
                    file=audio_file,
                    language=language
                )
                
            return {
                "text": result.text,
                "segments": [],  # OpenAI API doesn't return segments in basic version
                "language": language,
                "engine": "openai-api"
            }
            
        except Exception as e:
            logger.error(f"OpenAI API transcription failed: {str(e)}")
            return {"error": str(e)}

    async def prepare_audio(self, audio_path: str) -> str:
        """
        Prepare audio for speech recognition (convert format, adjust volume, etc.)
        This is a placeholder for audio preprocessing
        """
        # This would use pydub or ffmpeg-python for audio processing
        # For now, just return the original path
        return audio_path


# Alternative install instructions to be shown to users when needed
INSTALL_HELP = """
Whisper installation issues with Python 3.13:

Option 1: Install from GitHub directly:
pip install git+https://github.com/openai/whisper.git

Option 2: Use Python 3.10 or 3.11 in a separate virtual environment:
python3.10 -m venv whisper-venv
source whisper-venv/bin/activate
pip install openai-whisper

Option 3: Use the OpenAI API only (requires API key)
"""
