from flask import Flask, request, jsonify, send_file
import os
import json
import tempfile
from youtube_transcript_api import YouTubeTranscriptApi
import openai
from dotenv import load_dotenv
from flask_cors import CORS
import werkzeug

# Import the new speech recognition components
from speech_recognition import JapaneseSpeechRecognition
from pronunciation_analysis import JapanesePronunciationAnalyzer

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize speech recognition and pronunciation components
speech_recognizer = JapaneseSpeechRecognition(use_local_model=False)
pronunciation_analyzer = JapanesePronunciationAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Simple endpoint to check if the API is running"""
    return jsonify({"status": "ok", "message": "Backend API is running"})

@app.route('/fetch-transcript', methods=['POST'])
def fetch_transcript():
    """Fetch Japanese transcripts from YouTube videos"""
    data = request.json
    if not data or 'video_url' not in data:
        return jsonify({"error": "Missing video_url parameter"}), 400
    
    video_url = data['video_url']
    try:
        # Extract video ID from URL
        if "youtube.com" in video_url:
            video_id = video_url.split("v=")[1].split("&")[0]
        elif "youtu.be" in video_url:
            video_id = video_url.split("/")[-1].split("?")[0]
        else:
            return jsonify({"error": "Invalid YouTube URL format"}), 400
        
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
def generate_questions():
    """Generate comprehension questions based on Japanese transcript"""
    data = request.json
    if not data or 'transcript' not in data:
        return jsonify({"error": "Missing transcript parameter"}), 400
    
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
def text_to_speech():
    """Convert Japanese text to speech"""
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"error": "Missing text parameter"}), 400
    
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
def speech_to_text():
    """Convert spoken Japanese audio to text"""
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        
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
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    app.run(debug=True)
