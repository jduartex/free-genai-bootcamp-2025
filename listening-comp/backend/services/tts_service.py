"""
Text-to-Speech (TTS) service for Japanese language learning.
Provides high-quality Japanese speech synthesis with configurable parameters
optimized for language learning.
"""
import os
import tempfile
import uuid
import json
from enum import Enum
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

# AWS Polly
import boto3
from botocore.exceptions import BotoCoreError, ClientError

# Google TTS
from google.cloud import texttospeech
from google.oauth2 import service_account

# Audio processing
import soundfile as sf
import numpy as np
from pydub import AudioSegment

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

class VoiceGender(str, Enum):
    """Voice gender options."""
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"

class SpeakingStyle(str, Enum):
    """Japanese speaking style options."""
    FORMAL = "formal"
    CASUAL = "casual"
    POLITE = "polite"  # Teineigo (丁寧語)
    HUMBLE = "humble"  # Kenjougo (謙譲語)
    RESPECTFUL = "respectful"  # Sonkeigo (尊敬語)

class RegionalAccent(str, Enum):
    """Japanese regional accent options."""
    STANDARD = "standard"  # Tokyo dialect (標準語)
    KANSAI = "kansai"      # Kansai dialect (関西弁)
    TOHOKU = "tohoku"      # Tohoku dialect (東北弁)
    KYUSHU = "kyushu"      # Kyushu dialect (九州弁)

class TTSProvider(str, Enum):
    """Available TTS providers."""
    AWS_POLLY = "aws_polly"
    GOOGLE_TTS = "google_tts"

class JapaneseTTSService:
    """
    Japanese Text-to-Speech service with features optimized for language learning.
    Supports multiple providers, voice types, and configurable parameters.
    """
    
    def __init__(self, 
                 provider: TTSProvider = TTSProvider.AWS_POLLY,
                 output_dir: Optional[str] = None):
        """
        Initialize the TTS service.
        
        Args:
            provider: TTS provider to use (aws_polly or google_tts)
            output_dir: Directory to save audio files (default: system temp dir)
        """
        self.provider = provider
        self.output_dir = output_dir if output_dir else tempfile.gettempdir()
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize providers
        self._init_aws_polly()
        self._init_google_tts()
        
        # Cache available voices
        self._aws_voices = self._get_aws_voices()
        self._google_voices = self._get_google_voices()
    
    def _init_aws_polly(self):
        """Initialize AWS Polly client."""
        try:
            region = os.environ.get("AWS_REGION", "us-east-1")
            self.polly_client = boto3.client('polly', region_name=region)
        except Exception as e:
            self.polly_client = None
            print(f"Warning: AWS Polly initialization failed: {e}")
    
    def _init_google_tts(self):
        """Initialize Google TTS client."""
        try:
            creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            if creds_path and os.path.exists(creds_path):
                self.google_client = texttospeech.TextToSpeechClient()
            else:
                self.google_client = None
                print("Warning: Google TTS credentials not found")
        except Exception as e:
            self.google_client = None
            print(f"Warning: Google TTS initialization failed: {e}")
    
    def _get_aws_voices(self) -> Dict[str, Dict[str, Any]]:
        """
        Get available AWS Polly Japanese voices with their properties.
        
        Returns:
            Dictionary of voice ID to voice properties
        """
        if not self.polly_client:
            return {}
            
        voices = {}
        try:
            response = self.polly_client.describe_voices(LanguageCode='ja-JP')
            for voice in response.get('Voices', []):
                voice_id = voice.get('Id')
                # Determine gender
                gender = VoiceGender.NEUTRAL
                if voice.get('Gender') == 'Female':
                    gender = VoiceGender.FEMALE
                elif voice.get('Gender') == 'Male':
                    gender = VoiceGender.MALE
                    
                # Determine supported engines
                engines = voice.get('SupportedEngines', ['standard'])
                
                # Store voice with its properties
                voices[voice_id] = {
                    'gender': gender,
                    'engines': engines,
                    'name': voice_id,
                    # Default to standard style and accent
                    'style': SpeakingStyle.POLITE,  
                    'accent': RegionalAccent.STANDARD
                }
                
                # Set regional accent if applicable
                if voice_id in ['Mizuki', 'Takumi']:
                    voices[voice_id]['accent'] = RegionalAccent.STANDARD
                elif voice_id == 'Kazuha':  # Kazuha has a slightly more formal style
                    voices[voice_id]['style'] = SpeakingStyle.FORMAL
                
        except Exception as e:
            print(f"Error fetching AWS voices: {e}")
            
        # Map Japanese regional accents to specific voices
        VOICE_ACCENTS = {
            'Mizuki': RegionalAccent.STANDARD,  # Tokyo accent
            'Takumi': RegionalAccent.STANDARD,  # Tokyo accent
            'Kazuha': RegionalAccent.KANSAI,    # Kansai accent
        }
        
        for voice_id, properties in voices.items():
            if voice_id in VOICE_ACCENTS:
                properties['accent'] = VOICE_ACCENTS[voice_id]
            
        return voices

    def _get_google_voices(self) -> Dict[str, Dict[str, Any]]:
        """Get available Google TTS Japanese voices with their properties."""
        if not self.google_client:
            return {}
            
        voices = {}
        try:
            response = self.google_client.list_voices(language_code="ja-JP")
            for voice in response.voices:
                voice_id = voice.name
                
                # Determine gender
                gender = VoiceGender.NEUTRAL
                if voice.ssml_gender == texttospeech.SsmlVoiceGender.FEMALE:
                    gender = VoiceGender.FEMALE
                elif voice.ssml_gender == texttospeech.SsmlVoiceGender.MALE:
                    gender = VoiceGender.MALE
                
                # Store voice with its properties
                voices[voice_id] = {
                    'gender': gender,
                    'name': voice_id,
                    'style': SpeakingStyle.POLITE,  # Default style
                    'accent': RegionalAccent.STANDARD  # Default accent
                }
                
                # WaveNet and Neural2 voices typically sound more natural
                voices[voice_id]['is_neural'] = 'WaveNet' in voice_id or 'Neural2' in voice_id
                
        except Exception as e:
            print(f"Error fetching Google voices: {e}")
            
        return voices

    def get_available_voices(self) -> List[Dict[str, Any]]:
        """
        Get list of all available Japanese voices across providers.
        
        Returns:
            List of voice information dictionaries with provider, id, gender, etc.
        """
        voices = []
            
        # AWS Polly voices
        for voice_id, properties in self._aws_voices.items():
            voices.append({
                'provider': TTSProvider.AWS_POLLY,
                'id': voice_id,
                'gender': properties['gender'],
                'style': properties['style'],
                'accent': properties['accent'],
                'is_neural': 'neural' in properties.get('engines', [])
            })
        
        # Google TTS voices
        for voice_id, properties in self._google_voices.items():
            voices.append({
                'provider': TTSProvider.GOOGLE_TTS,
                'id': voice_id,
                'gender': properties['gender'],
                'style': properties['style'],
                'accent': properties['accent'],
                'is_neural': properties.get('is_neural', False)
            })
            
        return voices

    def _apply_regional_accent(self, text: str, accent: RegionalAccent) -> str:
        """
        Apply regional accent characteristics to the text using SSML.
        
        Args:
            text: Japanese text to modify
            accent: Regional accent to apply
        
        Returns:
            SSML text with accent characteristics
        """
        if accent == RegionalAccent.STANDARD:
            return text
            
        # Define accent-specific modifications
        accent_patterns = {
            RegionalAccent.KANSAI: {
                'です': 'どす',
                'ます': 'まんねん',
                'ください': 'くださいな',
                'なければ': 'なあかん',
            },
            RegionalAccent.TOHOKU: {
                # Tohoku dialect characteristics
                'です': 'でがす',
                'ます': 'まず',
                'ない': 'ねぇ',
            },
            RegionalAccent.KYUSHU: {
                # Kyushu dialect characteristics
                'です': 'ばい',
                'ます': 'もす',
                'ください': 'くれんね',
            }
        }
        
        # Apply accent-specific patterns
        modified_text = text
        if accent in accent_patterns:
            for standard, dialectal in accent_patterns[accent].items():
                modified_text = modified_text.replace(standard, dialectal)
        
        # Add accent-specific prosody
        prosody_params = {
            RegionalAccent.KANSAI: {'rate': '1.1', 'pitch': '+2st'},  # Slightly faster, higher pitch
            RegionalAccent.TOHOKU: {'rate': '0.95', 'pitch': '-1st'},  # Slower, lower pitch
            RegionalAccent.KYUSHU: {'rate': '1.05', 'pitch': '+1st'}   # Moderate adjustments
        }
        
        if accent in prosody_params:
            params = prosody_params[accent]
            modified_text = f'<prosody rate="{params["rate"]}" pitch="{params["pitch"]}">{modified_text}</prosody>'
        
        return f'<speak>{modified_text}</speak>'

    def synthesize_speech(self,
                         text: str,
                         voice_id: str = None,
                         provider: TTSProvider = None,
                         speaking_rate: float = 1.0,
                         pitch: float = 0.0,
                         volume: float = 0.0,
                         accent: RegionalAccent = RegionalAccent.STANDARD,
                         speaking_style: SpeakingStyle = SpeakingStyle.POLITE,
                         emphasize_pitch_accent: bool = False,
                         save_to_file: bool = True) -> Tuple[str, bytes]:
        """Enhanced synthesize_speech with regional accent support."""
        
        # Apply regional accent if specified
        if accent != RegionalAccent.STANDARD:
            text = self._apply_regional_accent(text, accent)
            ssml = True
        else:
            ssml = False
        
        provider = provider or self.provider
        
        if provider == TTSProvider.AWS_POLLY:
            return self._synthesize_aws_polly(
                text=text,
                voice_id=voice_id,
                speaking_rate=speaking_rate,
                pitch=pitch,
                volume=volume,
                save_to_file=save_to_file,
                ssml=ssml
            )
        elif provider == TTSProvider.GOOGLE_TTS:
            return self._synthesize_google_tts(
                text=text,
                voice_id=voice_id,
                speaking_rate=speaking_rate,
                pitch=pitch,
                volume=volume,
                save_to_file=save_to_file,
                ssml=ssml
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def _synthesize_aws_polly(self, 
                             text: str,
                             voice_id: str = None,
                             speaking_rate: float = 1.0,
                             pitch: float = 0.0,
                             volume: float = 0.0,
                             save_to_file: bool = True,
                             ssml: bool = False) -> Tuple[str, bytes]:
        """Synthesize speech using AWS Polly."""
        if not self.polly_client:
            raise RuntimeError("AWS Polly client not initialized")
            
        # Default to Mizuki if no voice specified
        voice_id = voice_id or "Mizuki"
        
        # Check if voice exists and get its properties
        voice_props = self._aws_voices.get(voice_id)
        if not voice_props:
            raise ValueError(f"Voice ID not found: {voice_id}")
        
        # Determine which engine to use (neural if available, otherwise standard)
        engine = "neural" if "neural" in voice_props.get('engines', []) else "standard"
        
        # Apply SSML for pitch, rate and volume adjustments if needed
        if (speaking_rate != 1.0 or pitch != 0.0 or volume != 0.0) and not ssml:
            # Convert to SSML with prosody
            ssml_text = f'<speak><prosody rate="{speaking_rate*100:.0f}%" pitch="{pitch:+.1f}st" volume="{volume:+.1f}dB">{text}</prosody></speak>'
            text = ssml_text
            ssml = True
            
        try:
            # Call AWS Polly API
            kwargs = {
                'Text': text,
                'OutputFormat': 'mp3',
                'VoiceId': voice_id,
                'Engine': engine,
                'LanguageCode': 'ja-JP',
                'TextType': 'ssml' if ssml else 'text'
            }
            
            response = self.polly_client.synthesize_speech(**kwargs)
            
            # Get audio content
            audio_content = response.get('AudioStream').read()
            
            # Save to file if requested
            file_path = ""
            if save_to_file and audio_content:
                file_path = os.path.join(self.output_dir, f"{uuid.uuid4()}.mp3")
                with open(file_path, 'wb') as file:
                    file.write(audio_content)
                    
            return file_path, audio_content
            
        except (BotoCoreError, ClientError) as error:
            raise RuntimeError(f"AWS Polly synthesis failed: {error}")
    
    def _synthesize_google_tts(self,
                              text: str,
                              voice_id: str = None,
                              speaking_rate: float = 1.0,
                              pitch: float = 0.0,
                              volume: float = 0.0,
                              save_to_file: bool = True,
                              ssml: bool = False) -> Tuple[str, bytes]:
        """Synthesize speech using Google TTS."""
        if not self.google_client:
            raise RuntimeError("Google TTS client not initialized")
            
        # Default to a standard Japanese voice if none specified
        # Find first available WaveNet voice or fall back to standard
        if not voice_id:
            for v_id, props in self._google_voices.items():
                if "WaveNet" in v_id:
                    voice_id = v_id
                    break
            if not voice_id and self._google_voices:
                voice_id = next(iter(self._google_voices.keys()))
                
        # Apply SSML for volume adjustment if needed (Google TTS supports rate and pitch directly)
        if volume != 0.0 and not ssml:
            # Convert to SSML with prosody for volume
            ssml_text = f'<speak><prosody volume="{volume:+.1f}dB">{text}</prosody></speak>'
            text = ssml_text
            ssml = True
        
        try:
            # Configure input text
            if ssml:
                synthesis_input = texttospeech.SynthesisInput(ssml=text)
            else:
                synthesis_input = texttospeech.SynthesisInput(text=text)
                
            # Configure voice
            voice_params = texttospeech.VoiceSelectionParams(
                language_code='ja-JP',
                name=voice_id
            )
            
            # Configure audio parameters
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate,
                pitch=pitch
            )
            
            # Call Google TTS API
            response = self.google_client.synthesize_speech(
                input=synthesis_input,
                voice=voice_params,
                audio_config=audio_config
            )
            
            # Get audio content
            audio_content = response.audio_content
            
            # Save to file if requested
            file_path = ""
            if save_to_file and audio_content:
                file_path = os.path.join(self.output_dir, f"{uuid.uuid4()}.mp3")
                with open(file_path, 'wb') as file:
                    file.write(audio_content)
                    
            return file_path, audio_content
            
        except Exception as error:
            raise RuntimeError(f"Google TTS synthesis failed: {error}")
    
    def add_furigana_ssml(self, text: str, furigana_pairs: List[Tuple[str, str]]) -> str:
        """
        Convert text with furigana annotations to SSML with phoneme tags.
        
        Args:
            text: Base Japanese text
            furigana_pairs: List of (kanji, reading) tuples
        
        Returns:
            SSML text with phoneme tags
        """
        ssml_text = text
        for kanji, reading in furigana_pairs:
            # Replace kanji with phoneme-annotated version
            phoneme_tag = f'<phoneme alphabet="ipa" ph="{reading}">{kanji}</phoneme>'
            ssml_text = ssml_text.replace(kanji, phoneme_tag)
            
        return f"<speak>{ssml_text}</speak>"

    def slow_down_for_beginners(self, text: str, jlpt_level: str) -> Tuple[str, float]:
        """
        Add pauses and determine appropriate speed based on JLPT level.
        
        Args:
            text: Japanese text
            jlpt_level: JLPT level (N5-N1)
        
        Returns:
            Tuple of (modified text with pauses, speaking rate)
        """
        # Determine speaking rate based on JLPT level
        rates = {
            "N5": 0.75,  # Slowest for beginners
            "N4": 0.85,
            "N3": 0.95,
            "N2": 1.0,
            "N1": 1.05   # Native speed for advanced
        }
        rate = rates.get(jlpt_level, 1.0)
        
        # Only add pauses for beginner levels
        if jlpt_level in ["N5", "N4"]:
            # Add pauses after punctuation marks for better comprehension
            text = text.replace("。", "。<break time='500ms'/>")
            text = text.replace("、", "、<break time='300ms'/>")
            text = text.replace("！", "！<break time='500ms'/>")
            text = text.replace("？", "？<break time='500ms'/>")
            
            # Wrap in SSML tags if not already
            if not text.startswith("<speak>"):
                text = f"<speak>{text}</speak>"
                
        return text, rate
    
    def emphasize_pitch_accent(self, text: str, accent_patterns: List[Tuple[str, str]]) -> str:
        """
        Create SSML that emphasizes pitch accent patterns for learning.
        
        Args:
            text: Japanese text
            accent_patterns: List of (word, accent_pattern) where accent_pattern is like "LHH" for low-high-high
        
        Returns:
            SSML with pitch and emphasis adjustment
        """
        ssml_text = text
        for word, pattern in accent_patterns:
            # Example pattern: "LHL" (low-high-low)
            parts = []
            for i, char in enumerate(word):
                if i < len(pattern):
                    if pattern[i] == "H":
                        # High pitch
                        parts.append(f'<prosody pitch="+2st">{char}</prosody>')
                    elif pattern[i] == "L":
                        # Low pitch
                        parts.append(f'<prosody pitch="-2st">{char}</prosody>')
                    else:
                        parts.append(char)
                else:
                    parts.append(char)
                    
            emphasized = ''.join(parts)
            ssml_text = ssml_text.replace(word, emphasized)
            
        return f"<speak>{ssml_text}</speak>"

    def optimize_for_learner_level(self, text: str, jlpt_level: str, style: SpeakingStyle = SpeakingStyle.POLITE) -> Tuple[str, float, Dict]:
        """
        Optimize speech parameters for different Japanese learner levels.
        
        Args:
            text: Japanese text to optimize
            jlpt_level: JLPT level (N5-N1)
            style: Speaking style to use
        
        Returns:
            Tuple of (modified text with SSML, speaking rate, additional parameters)
        """
        # Add pauses and adjust speed based on level
        modified_text, rate = self.slow_down_for_beginners(text, jlpt_level)
        
        # Adjust parameters based on level
        params = {
            'pitch': 0.0,
            'volume': 0.0,
            'emphasize_pitch_accent': jlpt_level in ['N5', 'N4'],  # Emphasize pitch for beginners
            'speaking_style': style
        }
        
        # Add pitch accent markers for beginners
        if jlpt_level in ['N5', 'N4']:
            params['pitch'] = -1.0  # Slightly lower pitch for clarity
            
        return modified_text, rate, params

def validate_openai_integration():
    """Validate OpenAI integration."""
    try:
        import openai
        
        # Try minimal API call to check configuration
        completion = openai.chat.completions.create(
            model="gpt-4",  # Fixed model name
            messages=[{"role": "user", "content": "Say 'API works' in Japanese"}],
            max_tokens=5
        )
        return True
    except Exception as e:
        print(f"❌ OpenAI API test failed: {str(e)}")
        return False

# Example usage
if __name__ == "__main__":
    # Initialize TTS service
    tts = JapaneseTTSService()
    
    # List available voices
    voices = tts.get_available_voices()
    print(f"Found {len(voices)} Japanese voices")
    
    # Basic synthesis
    text = "こんにちは、日本語の勉強を手伝います。"
    file_path, _ = tts.synthesize_speech(text)
    print(f"Audio saved to: {file_path}")
    
    # Slow down for beginners
    text_with_pauses, rate = tts.slow_down_for_beginners(text, "N5")
    file_path, _ = tts.synthesize_speech(
        text=text_with_pauses,
        speaking_rate=rate,
        ssml=True
    )
    print(f"Slow audio for beginners saved to: {file_path}")
    
    # Add furigana
    furigana_text = tts.add_furigana_ssml("私の名前は田中です。", [("名前", "なまえ"), ("田中", "たなか")])
    file_path, _ = tts.synthesize_speech(furigana_text, ssml=True)
    print(f"Audio with furigana pronunciation saved to: {file_path}")