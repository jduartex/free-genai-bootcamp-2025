#!/usr/bin/env python3
"""
Setup environment variables for the Japanese Listening Comprehension backend.
This script helps users create and configure the necessary .env file.
"""
import os
import sys
import shutil
from pathlib import Path

def create_env_file():
    """Create a .env file from the .env.example template"""
    script_dir = Path(__file__).parent
    example_env_path = script_dir / '.env.example'
    env_path = script_dir / '.env'
    
    # Check if .env.example exists
    if not example_env_path.exists():
        print("❌ Error: .env.example file not found.")
        return False
        
    # Check if .env already exists
    if env_path.exists():
        overwrite = input("A .env file already exists. Overwrite? (y/n): ").lower()
        if overwrite != 'y':
            print("Keeping existing .env file.")
            return True
    
    # Copy .env.example to .env
    shutil.copy(example_env_path, env_path)
    print("✅ Created .env file from template.")
    print(f"📝 Please open {env_path} and fill in your API keys and credentials.")
    return True

def check_aws_credentials():
    """Check if AWS credentials are set in environment variables"""
    aws_key = os.environ.get("AWS_ACCESS_KEY_ID")
    aws_secret = os.environ.get("AWS_SECRET_ACCESS_KEY")
    
    if aws_key and aws_secret:
        print("✅ AWS credentials found in environment variables.")
        return True
    else:
        print("❌ AWS credentials not found in environment variables.")
        print("ℹ️ For AWS Polly TTS service, you need to set the following environment variables:")
        print("   AWS_ACCESS_KEY_ID")
        print("   AWS_SECRET_ACCESS_KEY")
        print("   AWS_REGION (optional, defaults to us-east-1)")
        print("\n  Add these to your .env file or set them directly in your terminal:")
        print("  export AWS_ACCESS_KEY_ID=your_access_key")
        print("  export AWS_SECRET_ACCESS_KEY=your_secret_key")
        print("  export AWS_REGION=your_region")
        return False

def check_google_credentials():
    """Check if Google credentials are configured"""
    google_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    
    if google_creds:
        if os.path.exists(google_creds):
            print(f"✅ Google credentials file found at: {google_creds}")
            return True
        else:
            print(f"❌ Google credentials file not found at: {google_creds}")
            return False
    else:
        print("❌ GOOGLE_APPLICATION_CREDENTIALS environment variable not set.")
        print("ℹ️ For Google TTS service, you need to:")
        print("   1. Download a service account JSON key file from Google Cloud Console")
        print("   2. Set GOOGLE_APPLICATION_CREDENTIALS to the path of this JSON file in your .env")
        return False

def check_openai_key():
    """Check if OpenAI API key is set"""
    openai_key = os.environ.get("OPENAI_API_KEY")
    
    if openai_key:
        print("✅ OpenAI API key found in environment variables.")
        return True
    else:
        print("❌ OpenAI API key not found in environment variables.")
        print("ℹ️ You need an OpenAI API key for the question generation component.")
        print("   Add OPENAI_API_KEY=your_key to your .env file or set it directly:")
        print("   export OPENAI_API_KEY=your_key")
        return False

if __name__ == "__main__":
    print("🔧 Setting up environment for Japanese Listening Comprehension backend...")
    
    # Try to load .env file
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("✅ Loaded environment variables from .env file.")
    except ImportError:
        print("❌ python-dotenv not installed. Installing...")
        os.system(f"{sys.executable} -m pip install python-dotenv")
        from dotenv import load_dotenv
        load_dotenv()
    
    # Create .env file if needed
    create_env_file()
    
    # Check credentials
    print("\n📊 Checking configuration...")
    openai_ok = check_openai_key()
    aws_ok = check_aws_credentials()
    google_ok = check_google_credentials()
    
    # Summary
    print("\n📋 Configuration Summary:")
    print(f"OpenAI API: {'✅' if openai_ok else '❌'} {'(required)' if not openai_ok else ''}")
    print(f"AWS Polly TTS: {'✅' if aws_ok else '❌'}")
    print(f"Google TTS: {'✅' if google_ok else '❌'}")
    
    if not (aws_ok or google_ok):
        print("\n⚠️ Warning: Neither AWS Polly nor Google TTS is configured!")
        print("   At least one TTS service is required for the application to function properly.")
    
    if not openai_ok:
        print("\n❌ Error: OpenAI API key is required but not configured!")
    
    print("\nNext steps:")
    if openai_ok and (aws_ok or google_ok):
        print("✅ Your environment is ready! You can now run the validation script:")
        print("   python validate.py")
    else:
        print("1. Edit your .env file to add missing credentials")
        print("2. Restart this setup script to verify your changes")
        print("3. When all required credentials are set, run the validation script")
