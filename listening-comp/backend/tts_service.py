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
        self.polly_available = False
        self.google_tts_available = False
        self.openai_tts_available = False
        
        # Try to initialize Amazon Polly
        try:
            import boto3
            self.polly_client = boto3.client('polly')
            self.polly_available = True
            logger.info("Amazon Polly service initialized")
        except (ImportError, Exception) as e:
            logger.warning(f"Amazon Polly not available: {str(e)}")
            
        # Try to initialize Google TTS
        try:
            from google.cloud import texttospeech
            self.google_tts_client = texttospeech.TextToSpeechClient()
            self.google_tts_available = True
            logger.info("Google TTS service initialized")
        except (ImportError, Exception) as e:
            logger.warning(f"Google TTS not available: {str(e)}")
            
        # Try to initialize OpenAI TTS
        try:
            import openai
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.openai_client = openai.OpenAI(api_key=api_key)
                self.openai_tts_available = True
                logger.info("OpenAI TTS service initialized")
        except (ImportError, Exception) as e:
            logger.warning(f"OpenAI TTS not available: {str(e)}")
            
        # Check if any service is available
        if not any([self.polly_available, self.google_tts_available, self.openai_tts_available]):
            logger.warning("No TTS services available. Please configure at least one TTS provider.")
            
        # Define Japanese voice mappings
        self.voice_mappings = self._define_voice_mappings()
    
    async def synthesize(self, 
                         text: str, 
                         voice_id: str = "Mizuki", 
                         engine: str = "neural") -> str:
        """
        Convert text to speech and return audio file path
        
        Args:
            text: Japanese text to convert to speech
            voice_id: Voice identifier (e.g., "Mizuki", "Takumi")
            engine: TTS engine type (neural or standard)
            
        Returns:
            Path to the generated audio file
        """
        # Select appropriate TTS service
        if voice_id in self.voice_mappings["polly"] and self.polly_available:
            return await self._synthesize_with_polly(text, voice_id, engine)
        elif voice_id in self.voice_mappings["google"] and self.google_tts_available:
            return await self._synthesize_with_google(text, voice_id)
        elif voice_id in self.voice_mappings["openai"] and self.openai_tts_available:
            return await self._synthesize_with_openai(text, voice_id)
        else:
            # Fallback to any available service
            if self.polly_available:
                fallback_voice = "Mizuki"  # Default Japanese female voice
                return await self._synthesize_with_polly(text, fallback_voice, engine)
            elif self.google_tts_available:
                fallback_voice = "ja-JP-Neural2-B"  # Default Google Japanese voice
                return await self._synthesize_with_google(text, fallback_voice)
            elif self.openai_tts_available:
                fallback_voice = "alloy"  # Default OpenAI voice
                return await self._synthesize_with_openai(text, fallback_voice)
            else:
                raise Exception("No TTS service available")
    
    async def _synthesize_with_polly(self, text: str, voice_id: str, engine: str) -> str:
        """Use Amazon Polly for speech synthesis"""
        try:
            filename = f"{self.output_dir}/polly_{voice_id}_{uuid.uuid4().hex}.mp3"
            
            response = await asyncio.to_thread(
                self.polly_client.synthesize_speech,
                Text=text,
                OutputFormat="mp3",
                VoiceId=voice_id,
                Engine=engine
            )
            
            if "AudioStream" in response:
                with open(filename, "wb") as file:
                    file.write(response["AudioStream"].read())
                return filename
            else:
                raise Exception("No audio stream returned from Polly")
                
        except Exception as e:
            logger.error(f"Amazon Polly synthesis failed: {str(e)}")
            # Try fallback if available
            if self.google_tts_available:
                logger.info("Falling back to Google TTS")
                return await self._synthesize_with_google(text, "ja-JP-Neural2-B")
            elif self.openai_tts_available:
                logger.info("Falling back to OpenAI TTS")
                return await self._synthesize_with_openai(text, "alloy")
            else:
                raise Exception(f"TTS synthesis failed: {str(e)}")
    
    async def _synthesize_with_google(self, text: str, voice_id: str) -> str:
        """Use Google Text-to-Speech for synthesis"""
        try:
            from google.cloud import texttospeech
            
            filename = f"{self.output_dir}/google_{voice_id}_{uuid.uuid4().hex}.mp3"
            
            # Set input text and voice parameters
            input_text = texttospeech.SynthesisInput(text=text)
            
            # Parse voice ID format (e.g., "ja-JP-Neural2-B")
            parts = voice_id.split('-')
            if len(parts) >= 3:
                language_code = f"{parts[0]}-{parts[1]}"
                voice_name = voice_id
            else:
                # Default to Japanese
                language_code = "ja-JP"
                voice_name = voice_id
                
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_name
            )
            
            # Select audio encoding
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            
            # Generate speech
            response = await asyncio.to_thread(
                self.google_tts_client.synthesize_speech,
                input=input_text,
                voice=voice,
                audio_config=audio_config
            )
            
            # Write response to file
            with open(filename, "wb") as file:
                file.write(response.audio_content)
                
            return filename
            
        except Exception as e:
            logger.error(f"Google TTS synthesis failed: {str(e)}")
            
            # Try fallback if available
            if self.polly_available:
                logger.info("Falling back to Amazon Polly")
                return await self._synthesize_with_polly(text, "Mizuki", "neural")
            elif self.openai_tts_available:
                logger.info("Falling back to OpenAI TTS")
                return await self._synthesize_with_openai(text, "alloy")
            else:
                raise Exception(f"TTS synthesis failed: {str(e)}")
    
    async def _synthesize_with_openai(self, text: str, voice_id: str) -> str:
        """Use OpenAI Text-to-Speech for synthesis"""
        try:
            filename = f"{self.output_dir}/openai_{voice_id}_{uuid.uuid4().hex}.mp3"
            
            # Generate speech
            response = await asyncio.to_thread(
                self.openai_client.audio.speech.create,
                model="tts-1",
                voice=voice_id,
                input=text
            )
            
            # Save to file
            response.stream_to_file(filename)
                
            return filename
            
        except Exception as e:
            logger.error(f"OpenAI TTS synthesis failed: {str(e)}")
            
            # Try fallback if available
            if self.polly_available:
                logger.info("Falling back to Amazon Polly")
                return await self._synthesize_with_polly(text, "Mizuki", "neural")
            elif self.google_tts_available:
                logger.info("Falling back to Google TTS")
                return await self._synthesize_with_google(text, "ja-JP-Neural2-B")
            else:
                raise Exception(f"TTS synthesis failed: {str(e)}")
    
    async def list_voices(self) -> Dict[str, List[Dict[str, str]]]:
        """
        Get available Japanese voice options from all services
        
        Returns:
            Dictionary of available voices grouped by service
        """
        voices = {
            "polly": [],
            "google": [],
            "openai": []
        }
        
        # Get Amazon Polly voices
        if self.polly_available:
            try:
                response = await asyncio.to_thread(self.polly_client.describe_voices)
                
                # Filter for Japanese voices
                for voice in response.get("Voices", []):
                    if voice.get("LanguageCode", "").startswith("ja-"):
                        voices["polly"].append({
                            "id": voice.get("Id"),
                            "name": voice.get("Name"),
                            "gender": voice.get("Gender"),
                            "service": "Amazon Polly"
                        })
            except Exception as e:
                logger.error(f"Failed to get Polly voices: {str(e)}")
        
        # Get Google TTS voices
        if self.google_tts_available:
            try:
                from google.cloud import texttospeech
                
                response = await asyncio.to_thread(self.google_tts_client.list_voices)
                
                # Filter for Japanese voices
                for voice in response.voices:
                    for language_code in voice.language_codes:
                        if language_code.startswith("ja-"):
                            voices["google"].append({
                                "id": voice.name,
                                "name": voice.name,
                                "gender": texttospeech.SsmlVoiceGender(voice.ssml_gender).name,
                                "service": "Google TTS"
                            })
                            break
            except Exception as e:
                logger.error(f"Failed to get Google TTS voices: {str(e)}")
        
        # OpenAI TTS has fixed voices
        if self.openai_tts_available:
            voices["openai"] = [
                {"id": "alloy", "name": "Alloy", "gender": "NEUTRAL", "service": "OpenAI TTS"},
                {"id": "echo", "name": "Echo", "gender": "MALE", "service": "OpenAI TTS"},
                {"id": "fable", "name": "Fable", "gender": "FEMALE", "service": "OpenAI TTS"},
                {"id": "onyx", "name": "Onyx", "gender": "MALE", "service": "OpenAI TTS"},
                {"id": "nova", "name": "Nova", "gender": "FEMALE", "service": "OpenAI TTS"},
                {"id": "shimmer", "name": "Shimmer", "gender": "FEMALE", "service": "OpenAI TTS"}
            ]
        
        return voices
    
    def _define_voice_mappings(self) -> Dict[str, List[str]]:
        """Define mappings of voice IDs to services"""
        return {
            "polly": [
                "Mizuki",    # Female Japanese
                "Takumi",    # Male Japanese
                "Kazuha"     # Female Japanese (Neural)
            ],
            "google": [
                "ja-JP-Neural2-B",  # Female Japanese
                "ja-JP-Neural2-C",  # Male Japanese
                "ja-JP-Neural2-D",  # Female Japanese
                "ja-JP-Standard-A", # Female Japanese
                "ja-JP-Standard-B", # Female Japanese
                "ja-JP-Standard-C", # Male Japanese
                "ja-JP-Standard-D"  # Male Japanese
            ],
            "openai": [
                "alloy",
                "echo",
                "fable",
                "onyx",
                "nova",
                "shimmer"
            ]
        }
