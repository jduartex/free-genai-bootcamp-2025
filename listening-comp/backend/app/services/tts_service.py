import logging
from typing import Dict, Optional
import os
import boto3
from google.cloud import texttospeech

class TTSService:
    def __init__(self):
        self.status = "offline"
        self.error_message = None
        self.aws_client = None
        self.google_client = None
        self.initialize_services()

    def initialize_services(self):
        """Initialize TTS services and set status"""
        try:
            # Try AWS Polly
            if os.getenv('AWS_ACCESS_KEY_ID') and os.getenv('AWS_SECRET_ACCESS_KEY'):
                self.aws_client = boto3.client('polly')
                
            # Try Google TTS
            if os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
                self.google_client = texttospeech.TextToSpeechClient()
                
            if self.aws_client or self.google_client:
                self.status = "online"
                self.error_message = None
            else:
                self.error_message = "No TTS services configured. Check AWS or Google credentials."
                
        except Exception as e:
            self.error_message = f"TTS initialization failed: {str(e)}"
            logging.error(self.error_message)

    async def check_status(self) -> Dict:
        """Check TTS service health"""
        try:
            services = {
                "aws": bool(self.aws_client),
                "google": bool(self.google_client)
            }
            return {
                "status": self.status,
                "message": self.error_message,
                "services": services
            }
        except Exception as e:
            logging.error(f"TTS status check failed: {str(e)}")
            return {"status": "error", "message": str(e)}

    async def synthesize(self, text: str) -> Optional[bytes]:
        """Synthesize speech from text"""
        status = await self.check_status()
        if status["status"] != "online":
            raise Exception(status["message"])
            
        try:
            # Try AWS Polly first
            if self.aws_client:
                response = self.aws_client.synthesize_speech(
                    Text=text,
                    OutputFormat='mp3',
                    VoiceId='Mizuki',
                    LanguageCode='ja-JP'
                )
                return response['AudioStream'].read()
                
            # Fallback to Google TTS
            if self.google_client:
                synthesis_input = texttospeech.SynthesisInput(text=text)
                voice = texttospeech.VoiceSelectionParams(
                    language_code='ja-JP',
                    ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
                )
                audio_config = texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.MP3
                )
                response = self.google_client.synthesize_speech(
                    input=synthesis_input,
                    voice=voice,
                    audio_config=audio_config
                )
                return response.audio_content
                
            raise Exception("No TTS service available")
            
        except Exception as e:
            logging.error(f"Speech synthesis failed: {str(e)}")
            raise

tts_service = TTSService()
