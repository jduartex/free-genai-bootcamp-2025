#!/bin/zsh
# Script to set up Python 3.10 environment for the Japanese Listening Comprehension app
# Specifically designed for zsh on macOS

echo "===== Setting up Python 3.10 environment with zsh ====="

# Install Python 3.10 using Homebrew (if not already installed)
if ! command -v python3.10 &> /dev/null; then
    echo "Installing Python 3.10 using Homebrew..."
    brew install python@3.10
    
    echo "Setting up Python 3.10 links..."
    brew link --force python@3.10
    
    echo "✅ Python 3.10 installed"
else
    echo "✅ Python 3.10 is already installed"
fi

# Verify Python 3.10 is available
python3.10 --version

# Create a new virtual environment with Python 3.10
echo "Creating Python 3.10 virtual environment..."
python3.10 -m venv venv310
source venv310/bin/activate

# Upgrade pip and setuptools
pip install --upgrade pip setuptools wheel

# Install basic dependencies first
pip install python-dotenv numpy

# Install backend dependencies
echo "Installing backend requirements..."
pip install -r backend/requirements_py310.txt

# Create necessary directories
mkdir -p backend/data backend/audio_cache

# Update .zshrc to make activation easier (optional)
echo "\n# Add Python 3.10 virtual environment activation alias for Japanese Listening Comp app" >> ~/.zshrc
echo "alias activate_japanese_app='source ${PWD}/venv310/bin/activate'" >> ~/.zshrc

echo "===== Setup completed ====="
echo "Your Python 3.10 environment is now ready!"
echo "To activate it in the future, run one of these commands:"
echo "source venv310/bin/activate"
echo "# or use the new alias (after restarting your terminal or running 'source ~/.zshrc'):"
echo "activate_japanese_app"

echo "\nTo start the backend server:"
echo "cd backend"
echo "python run_backend.py"
