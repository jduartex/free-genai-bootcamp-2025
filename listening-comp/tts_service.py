import logging
from typing import Optional, Union
import os
import tempfile

logger = logging.getLogger(__name__)

class TTSService:
    """Text-to-Speech service that handles various TTS providers"""
    
    def __init__(self, provider: str = "gcloud"):
        self.provider = provider
        self.initialized = self._initialize_provider()
    
    def _initialize_provider(self) -> bool:
        """Initialize the selected TTS provider"""
        try:
            if self.provider == "gcloud":
                # Import Google Cloud TTS
                from google.cloud import texttospeech
                self.client = texttospeech.TextToSpeechClient()
                return True
            elif self.provider == "azure":
                # Import Azure Cognitive Services
                import azure.cognitiveservices.speech as speechsdk
                self.speech_config = speechsdk.SpeechConfig(
                    subscription=os.environ.get("AZURE_SPEECH_KEY"),
                    region=os.environ.get("AZURE_SPEECH_REGION")
                )
                return True
            else:
                logger.error(f"Unsupported TTS provider: {self.provider}")
                return False
        except Exception as e:
            logger.error(f"Failed to initialize TTS provider {self.provider}: {str(e)}")
            return False
    
    def synthesize(self, text: str, language: str = "ja-JP") -> Optional[Union[bytes, str]]:
        """Synthesize speech from text"""
        if not self.initialized:
            logger.error("TTS service not properly initialized")
            return None
        
        try:
            if self.provider == "gcloud":
                return self._synthesize_gcloud(text, language)
            elif self.provider == "azure":
                return self._synthesize_azure(text, language)
            else:
                logger.error(f"Unsupported TTS provider: {self.provider}")
                return None
        except Exception as e:
            logger.error(f"TTS synthesis failed: {str(e)}")
            return None
    
    def _synthesize_gcloud(self, text: str, language: str) -> Optional[bytes]:
        """Synthesize speech using Google Cloud TTS"""
        from google.cloud import texttospeech
        
        input_text = texttospeech.SynthesisInput(text=text)
        
        # Configure voice
        voice = texttospeech.VoiceSelectionParams(
            language_code=language,
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        
        # Audio config
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        # Perform synthesis
        response = self.client.synthesize_speech(
            input=input_text,
            voice=voice,
            audio_config=audio_config
        )
        
        return response.audio_content
    
    def _synthesize_azure(self, text: str, language: str) -> Optional[str]:
        """Synthesize speech using Azure Cognitive Services"""
        import azure.cognitiveservices.speech as speechsdk
        
        # Set speech synthesis language
        self.speech_config.speech_synthesis_language = language
        
        # Create a speech synthesizer
        speech_synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=self.speech_config,
            audio_config=None
        )
        
        # Use a temp file to store the audio
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_file.close()
        
        # Configure audio output to file
        audio_config = speechsdk.audio.AudioOutputConfig(filename=temp_file.name)
        speech_synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=self.speech_config, 
            audio_config=audio_config
        )
        
        # Synthesize speech
        result = speech_synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return temp_file.name
        else:
            logger.error(f"Azure TTS failed: {result.reason}")
            return None
