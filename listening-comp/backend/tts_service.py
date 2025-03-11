import os
import asyncio
import time
import uuid
from typing import List, Dict, Any, Optional
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class TTSService:
    """Text-to-Speech service for Japanese language"""
    
    def __init__(self, output_dir: str = "audio_cache"):
        """
        Initialize TTS service with available providers
        
        Args:
            output_dir: Directory to store generated audio files
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Track available TTS services
        self.available_services = {}
        self.default_service = None
        
        # Try to initialize Amazon Polly
        try:
            import boto3
            self.polly_client = boto3.client('polly')
            self.available_services['polly'] = True
            self.default_service = 'polly'
            logger.info("Amazon Polly service initialized")
        except (ImportError, Exception) as e:
            logger.warning(f"Amazon Polly not available: {str(e)}")
            self.available_services['polly'] = False
            
        # Don't attempt Google or OpenAI TTS for now
        logger.info("Using Amazon Polly as primary TTS service")
            
        # Define Japanese voice mappings
        self.voice_mappings = self._define_voice_mappings()
    
    async def synthesize(self, 
                         text: str, 
                         voice_id: str = "Mizuki", 
                         engine: str = "neural",
                         speed: float = 1.0,
                         pitch_accent: bool = False) -> Dict[str, Any]:
        """
        Convert text to speech with enhanced control options
        
        Args:
            text: Japanese text to convert to speech
            voice_id: Voice identifier
            engine: TTS engine type
            speed: Playback speed (0.5 to 2.0)
            pitch_accent: Whether to generate pitch accent visualization
            
        Returns:
            Dictionary containing:
            - audio_path: Path to the generated audio file
            - pitch_data: Pitch accent visualization data (if requested)
        """
        if not self.available_services.get('polly', False):
            raise Exception("No TTS services are available")
            
        try:
            response = self.polly_client.synthesize_speech(
                Text=text,
                OutputFormat='mp3',
                VoiceId=voice_id,
                Engine=engine
            )
            
            # Get the audio stream
            if "AudioStream" in response:
                filename = f"{self.output_dir}/polly_{voice_id}_{uuid.uuid4().hex}.mp3"
                with open(filename, "wb") as file:
                    file.write(response["AudioStream"].read())
                return {
                    "audio_path": filename,
                    "pitch_data": None
                }
            else:
                raise Exception("No audio data in response")
                
        except Exception as e:
            logger.error(f"TTS synthesis failed: {str(e)}")
            raise

    async def list_voices(self) -> List[Dict[str, Any]]:
        """List available voices"""
        voices = []
        
        if self.available_services.get('polly', False):
            try:
                response = await asyncio.to_thread(self.polly_client.describe_voices, LanguageCode="ja-JP")
                voices.extend([{
                    "id": voice["Id"],
                    "name": voice["Name"],
                    "gender": voice["Gender"],
                    "service": "polly"
                } for voice in response["Voices"]])
            except Exception as e:
                logger.error(f"Failed to get Polly voices: {str(e)}")
        
        return voices

    def get_service_status(self) -> Dict[str, bool]:
        """Get status of available TTS services"""
        return self.available_services
    
    def _define_voice_mappings(self) -> Dict[str, List[str]]:
        """Define mappings of voice IDs to services"""
        return {
            "polly": [
                "Mizuki",    # Female Japanese
                "Takumi",    # Male Japanese
                "Kazuha"     # Female Japanese (Neural)
            ]
        }
