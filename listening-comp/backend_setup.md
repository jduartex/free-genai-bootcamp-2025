# Backend Setup Instructions for Japanese Listening Comprehension App

This document provides instructions on how to set up and run the backend components of the Japanese Listening Comprehension App separately from the Streamlit frontend.

## Prerequisites

1. Python 3.10 or higher
2. API keys for:
   - OpenAI (for GPT-4o)
   - AWS (if using Amazon Polly)
   - Google Cloud (if using Google TTS)

## Environment Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables by creating a `.env` file in the root directory:
```
OPENAI_API_KEY=your_openai_key
AWS_ACCESS_KEY_ID=your_aws_key  # If using Amazon Polly
AWS_SECRET_ACCESS_KEY=your_aws_secret  # If using Amazon Polly
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json  # If using Google TTS
```

## Running Individual Backend Components

### 1. Initialize the Vector Database

```bash
python backend/init_db.py
```

This will create and initialize the SQLite database with vector extension support for Japanese content.

### 2. Start the Backend API Server

```bash
python backend/api.py
```

This runs a Flask API server that exposes endpoints for:
- Fetching YouTube transcripts
- Generating questions via the LLM
- Text-to-Speech conversion
- ASR (if enabled)

By default, the API server runs on port 5000 (http://localhost:5000).

### 3. Testing the Backend API

You can test individual endpoints using curl commands:

```bash
# Test YouTube transcript fetching
curl -X POST http://localhost:5000/fetch-transcript -H "Content-Type: application/json" -d '{"video_url": "https://www.youtube.com/watch?v=EXAMPLE"}'

# Test question generation
curl -X POST http://localhost:5000/generate-questions -H "Content-Type: application/json" -d '{"transcript": "Japanese text here", "jlpt_level": "N5", "question_count": 3}'

# Test TTS
curl -X POST http://localhost:5000/text-to-speech -H "Content-Type: application/json" -d '{"text": "日本語の文章", "voice": "female"}'
```

## Running the Complete Backend Stack

For convenience, a script is provided to run all backend components:

```bash
./run_backend.sh
```

Or on Windows:

```bash
run_backend.bat
```

## Backend API Documentation

### Endpoints

#### 1. `/fetch-transcript` (POST)
- Fetches Japanese transcripts from YouTube videos
- Request body: `{"video_url": "YouTube URL"}`
- Response: `{"transcript": "Japanese transcript", "metadata": {...}}`

#### 2. `/generate-questions` (POST)
- Generates comprehension questions based on Japanese transcript
- Request body: `{"transcript": "Japanese text", "jlpt_level": "N5", "question_count": 5}`
- Response: `{"questions": [{"question": "...", "options": [...], "answer": "...", "explanation": "..."}]}`

#### 3. `/text-to-speech` (POST)
- Converts Japanese text to speech
- Request body: `{"text": "日本語の文章", "voice": "female", "speed": 1.0}`
- Response: Audio file (binary)

#### 4. `/speech-to-text` (POST)
- Converts spoken Japanese to text (if ASR is enabled)
- Request body: Audio file (multipart form)
- Response: `{"transcript": "認識されたテキスト", "confidence": 0.95}`

## Troubleshooting

- **Database Connection Issues**: Ensure SQLite with vector extensions is properly installed
- **API Key Errors**: Verify your API keys are correctly set in the `.env` file
- **Japanese Character Encoding**: Make sure all files are saved with UTF-8 encoding
