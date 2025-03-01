import os
import asyncio
from typing import Dict, Any, Optional
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class SpeechRecognizer:
    """
    Speech recognition module for Japanese audio processing
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
                "message": "Neither local Whisper nor OpenAI API is available. Please install whisper or configure OpenAI API."
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

    async def analyze_pronunciation(self, reference_text: str, spoken_audio_path: str) -> Dict[str, Any]:
        """
        Analyze Japanese pronunciation by comparing reference text to spoken audio
        
        Args:
            reference_text: The expected Japanese text
            spoken_audio_path: Path to the audio file containing user's pronunciation
            
        Returns:
            Dictionary with pronunciation analysis results
        """
        # Get transcription of spoken audio
        transcription_result = await self.transcribe(spoken_audio_path)
        
        if "error" in transcription_result:
            return {"error": transcription_result["error"]}
            
        spoken_text = transcription_result.get("text", "")
        
        # Basic scoring - this would be more sophisticated in a real implementation
        # using phoneme-level alignment, prosody analysis, etc.
        similarity_score = self._compute_text_similarity(reference_text, spoken_text)
        
        return {
            "reference_text": reference_text,
            "transcribed_text": spoken_text,
            "similarity_score": similarity_score,
            "feedback": self._generate_pronunciation_feedback(reference_text, spoken_text)
        }
    
    def _compute_text_similarity(self, reference: str, spoken: str) -> float:
        """Simple text similarity metric"""
        # This is a very basic implementation
        # A real one would use phonetic comparison algorithms
        
        # Normalize both strings
        reference = reference.lower().strip()
        spoken = spoken.lower().strip()
        
        # If perfect match
        if reference == spoken:
            return 1.0
            
        # Extremely simple scoring based on character overlap
        # This should be replaced with a proper Japanese phonetic comparison
        ref_chars = set(reference)
        spoken_chars = set(spoken)
        
        if not ref_chars:
            return 0.0
            
        overlap = len(ref_chars.intersection(spoken_chars))
        return overlap / len(ref_chars)
    
    def _generate_pronunciation_feedback(self, reference: str, spoken: str) -> str:
        """Generate human-readable feedback on pronunciation"""
        # This would be more sophisticated in a real implementation
        similarity = self._compute_text_similarity(reference, spoken)
        
        if similarity > 0.9:
            return "発音はとても良いです！ (Your pronunciation is very good!)"
        elif similarity > 0.7:
            return "発音は良いですが、もう少し練習しましょう。 (Your pronunciation is good, but let's practice a bit more.)"
        elif similarity > 0.5:
            return "発音を改善するために練習が必要です。 (Practice is needed to improve your pronunciation.)"
        else:
            return "もっと練習しましょう。 (Let's practice more.)"

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
Whisper installation issues with Python 3.10:

Option 1: Install from GitHub directly:
pip install git+https://github.com/openai/whisper.git

Option 2: Use Python 3.10 or 3.11 in a separate virtual environment:
python3.10 -m venv whisper-venv
source whisper-venv/bin/activate
pip install openai-whisper

Option 3: Use the OpenAI API only (requires API key)
"""
