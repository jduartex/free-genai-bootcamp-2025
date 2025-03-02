#!/bin/bash

echo "Installing required Python packages..."
pip install -r requirements.txt

echo "Checking installation..."
python -c "import flask; print(f'Flask {flask.__version__} installed successfully')"
python -c "import openai; print(f'OpenAI {openai.__version__} installed successfully')"
python -c "import youtube_transcript_api; print('YouTube Transcript API installed successfully')"

echo "Installation complete! You can now run the backend with './run_backend.sh'"
