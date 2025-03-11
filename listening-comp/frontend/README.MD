# Frontend Documentation

## Prerequisites
- Python 3.10 (required)
  - Check your Python version:
    ```bash
    python --version
    ```
  - If Python 3.10 is not installed, download it from [python.org](https://www.python.org/downloads/release/python-3100/)

## Setup
1. Navigate to the frontend directory:
```bash
cd /Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/listening-comp/frontend
```

2. Create and activate virtual environment:
```bash
# Create virtual environment
# On macOS:
python3 -m venv venv
# On Windows:
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install streamlit
```

4. Run the frontend:
```bash
streamlit run app.py
```

## Structure
```
frontend/
├── app.py              # Main Streamlit application
├── components/         # Reusable UI components
├── pages/             # Additional pages
└── utils/             # Helper functions
```

## API Integration
The frontend communicates with the backend through REST APIs:
- `/api/transcript` - Fetch YouTube transcripts
- `/api/questions` - Generate comprehension questions
- `/api/tts` - Text-to-speech conversion
- `/api/asr` - Speech recognition (optional)

## Environment Variables
Create a `.env` file with:
```
BACKEND_URL=http://localhost:8000
OPENAI_API_KEY=your_key_here
```
