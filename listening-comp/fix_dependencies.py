"""
Dependency checker and installer for the Japanese Listening Comprehension App.

This script checks if critical dependencies are installed and attempts to install
any missing ones. Run this script if you encounter import errors.
"""

import sys
import subprocess
import os
from pathlib import Path

def check_install_package(package_name, version=None):
    """Check if a package is installed and install it if needed."""
    package_spec = f"{package_name}=={version}" if version else package_name
    
    try:
        # Try to import the package
        __import__(package_name)
        print(f"✓ {package_name} is already installed")
        return True
    except ImportError:
        print(f"✗ {package_name} is not installed. Installing...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package_spec])
            print(f"✓ Successfully installed {package_spec}")
            return True
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {package_spec}: {e}")
            return False

def main():
    print("Checking and installing critical dependencies...")
    
    # Critical dependencies with versions
    dependencies = {
        "streamlit": "1.33.0",
        "requests": "2.31.0",
        "numpy": "1.26.4",
        "pandas": "2.1.1",
        "torch": "2.1.0",
        "torchaudio": "2.1.0",
        "openai": "1.0.0",
        "youtube_transcript_api": "0.6.2",
        "sounddevice": "0.4.6",
        "soundfile": "0.12.1"
    }
    
    # Check and install each dependency
    all_installed = True
    for package, version in dependencies.items():
        if not check_install_package(package, version):
            all_installed = False
    
    # Check if packages are importable
    if all_installed:
        print("\nVerifying imports...")
        try:
            import streamlit
            import requests
            import numpy
            import pandas
            import torch
            import openai
            print("\n✓ All critical packages can be imported successfully!")
        except ImportError as e:
            print(f"\n✗ Import error: {e}")
            print("Some packages may not be properly installed. Try reinstalling manually:")
            print(f"pip install {' '.join([f'{k}=={v}' for k,v in dependencies.items()])}")
    
    # Final message
    print("\nIf you're still having issues, try running the setup script:")
    print("bash setup.sh")

if __name__ == "__main__":
    main()
