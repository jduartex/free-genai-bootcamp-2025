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
        # Validate speed parameter
        speed = max(0.5, min(2.0, speed))
        
        # Get pitch accent data if requested
        pitch_data = None
        if pitch_accent:
            pitch_data = await self._analyze_pitch_accent(text)
        
        # Select appropriate TTS service and synthesize
        audio_path = None
        if voice_id in self.voice_mappings["polly"] and self.polly_available:
            audio_path = await self._synthesize_with_polly(text, voice_id, engine, speed)
        elif voice_id in self.voice_mappings["google"] and self.google_tts_available:
            audio_path = await self._synthesize_with_google(text, voice_id, speed)
        elif voice_id in self.voice_mappings["openai"] and self.openai_tts_available:
            audio_path = await self._synthesize_with_openai(text, voice_id, speed)
        
        return {
            "audio_path": audio_path,
            "pitch_data": pitch_data
        }

    async def _analyze_pitch_accent(self, text: str) -> Dict[str, Any]:
        """
        Analyze and generate pitch accent visualization data for Japanese text
        
        Uses OpenAI API to get pitch accent patterns and generates visualization data
        """
        try:
            # Use OpenAI to analyze pitch accent
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4",
                messages=[{
                    "role": "system",
                    "content": "You are a Japanese pitch accent analyzer. For the given text, provide the pitch accent pattern for each word in JSON format. Include mora-by-mora breakdown and accent position."
                }, {
                    "role": "user",
                    "content": f"Analyze pitch accent for: {text}"
                }],
                response_format={"type": "json_object"}
            )
            
            pitch_data = json.loads(response.choices[0].message.content)
            
            # Process the pitch data into a visualization-friendly format
            visualization_data = self._process_pitch_data(pitch_data)
            
            return {
                "raw_data": pitch_data,
                "visualization": visualization_data,
                "text": text
            }
            
        except Exception as e:
            logger.error(f"Pitch accent analysis failed: {str(e)}")
            return None
    
    def _process_pitch_data(self, pitch_data: Dict) -> Dict[str, Any]:
        """
        Process raw pitch accent data into a format suitable for visualization
        """
        visualization = {
            "points": [],  # List of (x, y) coordinates for pitch line
            "mora_boundaries": [],  # X-coordinates for mora boundaries
            "word_boundaries": [],  # X-coordinates for word boundaries
            "labels": []  # Text labels for each mora
        }
        
        x_position = 0
        for word in pitch_data.get("words", []):
            word_start = x_position
            
            # Process each mora in the word
            moras = word.get("moras", [])
            for i, mora in enumerate(moras):
                # Add mora boundary
                visualization["mora_boundaries"].append(x_position)
                
                # Add pitch point
                y_position = 1 if i < word.get("accent_pos", len(moras)) else 0
                visualization["points"].append({"x": x_position, "y": y_position})
                
                # Add label
                visualization["labels"].append({
                    "x": x_position,
                    "text": mora.get("text", "")
                })
                
                x_position += 1
            
            # Add word boundary
            visualization["word_boundaries"].append({
                "x": word_start,
                "width": len(moras)
            })
        
        return visualization

    async def _synthesize_with_polly(self, text: str, voice_id: str, engine: str, speed: float) -> str:
        """Use Amazon Polly for speech synthesis with speed control"""
        try:
            filename = f"{self.output_dir}/polly_{voice_id}_{uuid.uuid4().hex}.mp3"
            
            # Convert speed to Polly's rate format
            speech_rate = f"{int(100 * speed)}%"
            
            # Add SSML tags for speed control
            ssml_text = f"""
            <speak>
                <prosody rate="{speech_rate}">
                    {text}
                </prosody>
            </speak>
            """
            
            response = await asyncio.to_thread(
                self.polly_client.synthesize_speech,
                Text=ssml_text,
                TextType="ssml",
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
            return await self._try_fallback_synthesis(text, speed)

    async def _synthesize_with_google(self, text: str, voice_id: str, speed: float) -> str:
        """Use Google Text-to-Speech for synthesis with speed control"""
        try:
            from google.cloud import texttospeech
            
            filename = f"{self.output_dir}/google_{voice_id}_{uuid.uuid4().hex}.mp3"
            
            # Add SSML tags for speed control
            ssml_text = f"""
            <speak>
                <prosody rate="{speed}">
                    {text}
                </prosody>
            </speak>
            """
            
            input_text = texttospeech.SynthesisInput(ssml=ssml_text)
            
            # Parse voice ID and configure voice
            parts = voice_id.split('-')
            language_code = f"{parts[0]}-{parts[1]}" if len(parts) >= 3 else "ja-JP"
            
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                name=voice_id
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3
            )
            
            response = await asyncio.to_thread(
                self.google_tts_client.synthesize_speech,
                input=input_text,
                voice=voice,
                audio_config=audio_config
            )
            
            with open(filename, "wb") as file:
                file.write(response.audio_content)
                
            return filename
            
        except Exception as e:
            logger.error(f"Google TTS synthesis failed: {str(e)}")
            return await self._try_fallback_synthesis(text, speed)

    async def _synthesize_with_openai(self, text: str, voice_id: str, speed: float) -> str:
        """Use OpenAI Text-to-Speech for synthesis with speed control"""
        try:
            filename = f"{self.output_dir}/openai_{voice_id}_{uuid.uuid4().hex}.mp3"
            
            response = await asyncio.to_thread(
                self.openai_client.audio.speech.create,
                model="tts-1",
                voice=voice_id,
                input=text,
                speed=speed
            )
            
            response.stream_to_file(filename)
            return filename
            
        except Exception as e:
            logger.error(f"OpenAI TTS synthesis failed: {str(e)}")
            return await self._try_fallback_synthesis(text, speed)

    async def _try_fallback_synthesis(self, text: str, speed: float) -> str:
        """Try fallback TTS services if primary service fails"""
        if self.polly_available:
            logger.info("Falling back to Amazon Polly")
            return await self._synthesize_with_polly(text, "Mizuki", "neural", speed)
        elif self.google_tts_available:
            logger.info("Falling back to Google TTS")
            return await self._synthesize_with_google(text, "ja-JP-Neural2-B", speed)
        elif self.openai_tts_available:
            logger.info("Falling back to OpenAI TTS")
            return await self._synthesize_with_openai(text, "alloy", speed)
        else:
            raise Exception("No TTS service available")

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
