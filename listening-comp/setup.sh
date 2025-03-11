#!/bin/bash

# Japanese Listening Comprehension App Setup Script

echo "Setting up Japanese Listening Comprehension App..."

# Detect virtual environment
if [[ -z "${VIRTUAL_ENV}" ]]; then
    echo "No active virtual environment detected."
    
    # Check for venv310 directory
    if [ -d "venv310" ]; then
        echo "Found venv310 directory. Activating..."
        source venv310/bin/activate
    elif [ -d "frontend/venv310" ]; then
        echo "Found frontend/venv310 directory. Activating..."
        source frontend/venv310/bin/activate
    else
        echo "Creating new virtual environment 'venv310'..."
        python3 -m venv venv310
        source venv310/bin/activate
    fi
    
    echo "Virtual environment activated: $VIRTUAL_ENV"
else
    echo "Using existing virtual environment: $VIRTUAL_ENV"
fi

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Function to check if package is installed
is_package_installed() {
    python -c "import pkgutil; exit(0 if pkgutil.find_loader('$1') else 1)" 2>/dev/null
    return $?
}

# Clean any conflicting installations first
echo "Checking for existing conflicting installations..."
if is_package_installed torch; then
    echo "Removing existing torch installation to avoid conflicts..."
    pip uninstall -y torch torchaudio
fi

if is_package_installed youtube_transcript_api; then
    echo "Removing existing youtube-transcript-api installation to avoid conflicts..."
    pip uninstall -y youtube-transcript-api
fi

if is_package_installed streamlit; then
    echo "Removing existing streamlit installation to avoid conflicts..."
    pip uninstall -y streamlit
fi

if is_package_installed streamlit_audiorecorder; then
    echo "Removing existing streamlit-audiorecorder installation to avoid conflicts..."
    pip uninstall -y streamlit-audiorecorder
fi

# Install dependencies with a specific order to avoid conflicts
echo "Installing core dependencies first..."
pip install streamlit==1.33.0 requests==2.31.0 youtube-transcript-api==0.6.2 torch==2.1.0 torchaudio==2.1.0 streamlit-audiorecorder==0.0.3

echo "Installing backend dependencies..."
pip install -r backend/requirements.txt --no-deps

echo "Installing frontend dependencies..."
pip install -r frontend/requirements.txt 

echo "Installing common dependencies..."
pip install -r requirements.txt --no-deps  # Avoid installing conflicting dependencies

# Verify critical installations
echo "Verifying critical package installations..."

# Verify torch installation
if ! python -c "import torch; print(f'PyTorch version: {torch.__version__}')" &> /dev/null; then
    echo "Installing PyTorch separately..."
    pip install torch==2.1.0 torchaudio==2.1.0
fi

# Verify youtube-transcript-api installation
if ! python -c "import youtube_transcript_api; print(f'youtube-transcript-api version: {youtube_transcript_api.__version__}')" &> /dev/null; then
    echo "Installing youtube-transcript-api separately..."
    pip install youtube-transcript-api==0.6.2
fi

# Verify streamlit-audiorecorder installation
if ! python -c "import streamlit_audiorecorder; print('streamlit-audiorecorder installed')" &> /dev/null; then
    echo "Installing streamlit-audiorecorder separately..."
    pip install streamlit-audiorecorder==0.0.3
fi

# Add specific verification for requests and streamlit
echo "Verifying critical imports..."
if ! python -c "import streamlit; print(f'Streamlit version: {streamlit.__version__}')" &> /dev/null; then
    echo "Installing streamlit separately..."
    pip install streamlit==1.33.0
fi

if ! python -c "import requests; print(f'Requests version: {requests.__version__}')" &> /dev/null; then
    echo "Installing requests separately..."
    pip install requests==2.31.0
fi

# Check for soundfile installation specifically
if ! python -c "import soundfile" &> /dev/null; then
    echo "Installing soundfile separately..."
    pip install soundfile
    
    # On macOS, we might need additional dependencies
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macOS detected, installing libsndfile with Homebrew if available..."
        if command -v brew &> /dev/null; then
            brew install libsndfile
        else
            echo "Homebrew not found. Please install libsndfile manually."
        fi
    fi
fi

echo "Setup complete! You can now run the app with: streamlit run app.py"
