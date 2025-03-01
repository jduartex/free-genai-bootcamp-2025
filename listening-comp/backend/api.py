from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
from functools import wraps
import os
import json
import tempfile
from youtube_transcript_api import YouTubeTranscriptApi
import openai
from dotenv import load_dotenv
import werkzeug
from jsonschema import validate, ValidationError
import re

# Import the new speech recognition components
from speech_recognition import JapaneseSpeechRecognition
from pronunciation_analysis import JapanesePronunciationAnalyzer

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Configure caching
cache_config = {
    "DEBUG": True,
    "CACHE_TYPE": "SimpleCache",
    "CACHE_DEFAULT_TIMEOUT": 300
}
app.config.from_mapping(cache_config)
cache = Cache(app)

# Initialize speech recognition and pronunciation components
speech_recognizer = JapaneseSpeechRecognition(use_local_model=False)
pronunciation_analyzer = JapanesePronunciationAnalyzer()

# Request validation schemas
SCHEMAS = {
    'fetch_transcript': {
        'type': 'object',
        'properties': {
            'video_url': {
                'type': 'string',
                'pattern': r'^(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[a-zA-Z0-9_-]+(\?.*)?$'
            }
        },
        'required': ['video_url']
    },
    'generate_questions': {
        'type': 'object',
        'properties': {
            'transcript': {'type': 'string', 'minLength': 1},
            'jlpt_level': {'type': 'string', 'enum': ['N5', 'N4', 'N3', 'N2', 'N1']},
            'question_count': {'type': 'integer', 'minimum': 1, 'maximum': 10}
        },
        'required': ['transcript']
    },
    'text_to_speech': {
        'type': 'object',
        'properties': {
            'text': {'type': 'string', 'minLength': 1},
            'voice': {'type': 'string', 'enum': ['male', 'female']},
            'speed': {'type': 'number', 'minimum': 0.5, 'maximum': 2.0}
        },
        'required': ['text']
    }
}

def validate_json(schema_name):
    """Decorator for JSON payload validation"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            try:
                if not request.is_json:
                    return jsonify({"error": "Content-Type must be application/json"}), 415
                
                validate(request.json, SCHEMAS[schema_name])
                return f(*args, **kwargs)
            except ValidationError as e:
                return jsonify({"error": "Validation error", "details": str(e)}), 400
        return wrapper
    return decorator

def error_handler(func):
    """Decorator for consistent error handling"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except werkzeug.exceptions.HTTPException as e:
            return jsonify({"error": e.description}), e.code
        except Exception as e:
            app.logger.error(f"Error in {func.__name__}: {str(e)}")
            return jsonify({"error": "Internal server error"}), 500
    return wrapper

@app.route('/health', methods=['GET'])
@limiter.exempt  # No rate limiting for health checks
@cache.cached(timeout=60)  # Cache health check for 1 minute
def health_check():
    """Simple endpoint to check if the API is running"""
    return jsonify({"status": "ok", "message": "Backend API is running"})

@app.route('/fetch-transcript', methods=['POST'])
@limiter.limit("30/minute")  # Specific rate limit for transcript fetching
@validate_json('fetch_transcript')
@error_handler
@cache.memoize(timeout=3600)  # Cache transcript results for 1 hour
def fetch_transcript():
    """Fetch Japanese transcripts from YouTube videos"""
    video_url = request.json['video_url']
    
    # Extract video ID from URL using regex
    video_id_match = re.search(r'(?:v=|/)([a-zA-Z0-9_-]{11})', video_url)
    if not video_id_match:
        return jsonify({"error": "Invalid YouTube URL format"}), 400
    
    video_id = video_id_match.group(1)
    
    try:
        # Fetch transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['ja'])
        
        # Extract Japanese text and metadata
        full_transcript = " ".join([item['text'] for item in transcript_list])
        metadata = {
            "video_id": video_id,
            "duration": sum([item['duration'] for item in transcript_list]),
            "timestamps": [(item['start'], item['start'] + item['duration']) for item in transcript_list]
        }
        
        return jsonify({
            "transcript": full_transcript,
            "metadata": metadata
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate-questions', methods=['POST'])
@limiter.limit("20/minute")  # Specific rate limit for question generation
@validate_json('generate_questions')
@error_handler
@cache.memoize(timeout=3600)  # Cache question results for 1 hour
def generate_questions():
    """Generate comprehension questions based on Japanese transcript"""
    data = request.json
    transcript = data['transcript']
    jlpt_level = data.get('jlpt_level', 'N5')
    question_count = int(data.get('question_count', 5))
    
    try:
        # Use OpenAI to generate questions
        prompt = f"""
        以下は日本語のテキストです。このテキストに基づいて、JLPT {jlpt_level} レベルの聴解問題を {question_count} 問作成してください。
        
        テキスト:
        {transcript}
        
        各問題は以下の形式で提供してください:
        - 質問文
        - 4つの選択肢 (1つの正解と3つの不正解)
        - 正解
        - 文法や語彙に関する簡潔な説明
        
        JSON形式で出力してください。
        """
        
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        questions_data = json.loads(content)
        
        return jsonify(questions_data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/text-to-speech', methods=['POST'])
@limiter.limit("50/minute")  # Specific rate limit for TTS
@validate_json('text_to_speech')
@error_handler
def text_to_speech():
    """Convert Japanese text to speech"""
    data = request.json
    japanese_text = data['text']
    voice = data.get('voice', 'female')
    speed = float(data.get('speed', 1.0))
    
    try:
        # Use OpenAI TTS
        response = openai.audio.speech.create(
            model="tts-1",
            voice="shimizu" if voice == "female" else "yoshi",
            input=japanese_text,
            speed=speed
        )
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        temp_file_path = temp_file.name
        temp_file.close()
        
        # Write audio to file
        with open(temp_file_path, 'wb') as f:
            f.write(response.read())
        
        return send_file(
            temp_file_path,
            mimetype='audio/mpeg', 
            download_name='speech.mp3',
            as_attachment=True
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# New routes for speech recognition
@app.route('/speech-to-text', methods=['POST'])
@limiter.limit("30/minute")  # Specific rate limit for STT
@error_handler
def speech_to_text():
    """Convert spoken Japanese audio to text"""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files['audio']
    
    # Validate file type
    allowed_extensions = {'wav', 'mp3', 'webm', 'ogg'}
    if not audio_file.filename or '.' not in audio_file.filename or \
       audio_file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"error": "Invalid audio file format"}), 400
    
    # Save audio to a temporary file
    temp_dir = tempfile.mkdtemp()
    audio_path = os.path.join(temp_dir, 'audio.webm')
    audio_file.save(audio_path)
    
    # Process audio with ASR
    transcription = speech_recognizer.process_audio_data(audio_path)
    
    # Clean up temp file
    os.unlink(audio_path)
    os.rmdir(temp_dir)
    
    # Extract relevant data from transcription
    result = {
        "transcript": transcription.get("text", "")
    }
    
    return jsonify(result)

# Error handlers for common HTTP errors
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": "Rate limit exceeded", 
                   "description": e.description}), 429

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    app.run(debug=True)
