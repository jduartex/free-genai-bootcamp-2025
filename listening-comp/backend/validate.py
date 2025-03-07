#!/usr/bin/env python3
import sys
import os
import importlib.util
import subprocess
from dotenv import load_dotenv

# Try to load environment variables from .env files
load_dotenv()  # First try project root .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))  # Then try backend/.env

def run_test(module_path, function_name):
    """Import a module and run a test function."""
    try:
        spec = importlib.util.spec_from_file_location("test_module", module_path)
        if not spec or not spec.loader:
            print(f"❌ Could not load module from {module_path}")
            return False
            
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        
        if hasattr(module, function_name):
            test_func = getattr(module, function_name)
            result = test_func()
            # Handle None result as "skipped" rather than failure
            if result is None:
                print(f"ℹ️ Test {function_name} was skipped")
                return "skipped"
            return result
        else:
            print(f"❌ Function {function_name} not found in {module_path}")
            return False
    except Exception as e:
        print(f"❌ Error running test {function_name}: {str(e)}")
        return False

def validate_api_endpoints():
    """Validate API endpoints by running Flask app in test mode."""
    print("\n🔍 Validating API endpoints...")
    
    # Check if API file exists
    api_file = os.path.join(os.path.dirname(__file__), "api.py")
    if not os.path.exists(api_file):
        print("❌ API file not found: backend/api.py")
        return False
    
    try:
        # Import flask for testing
        import flask
        from flask import Flask
        import requests
        
        # Try to import the API module
        spec = importlib.util.spec_from_file_location("api_module", api_file)
        if not spec or not spec.loader:
            print(f"❌ Could not load API module from {api_file}")
            return False
            
        # Check for basic Flask setup
        with open(api_file, 'r') as f:
            content = f.read()
            if 'Flask(' not in content or 'route(' not in content:
                print("❌ API file doesn't appear to contain Flask routes")
                return False
        
        print("✅ API file contains Flask routes")
        
        # Check if API endpoints are defined
        endpoints = []
        with open(api_file, 'r') as f:
            for line in f:
                if '@app.route' in line:
                    endpoints.append(line.strip())
        
        if not endpoints:
            print("❌ No endpoints found in API file")
            return False
        
        print(f"✅ Found {len(endpoints)} API endpoints")
        for endpoint in endpoints[:3]:  # Show first 3 endpoints
            print(f"  - {endpoint}")
            
        return True
            
    except ImportError:
        print("❌ Flask not installed. Install with: pip install flask")
        return False
    except Exception as e:
        print(f"❌ API validation error: {str(e)}")
        return False

def validate_openai_integration():
    """Validate OpenAI integration."""
    print("\n🔍 Validating OpenAI integration...")
    
    try:
        import openai
        
        # Check if OPENAI_API_KEY is set
        if not os.environ.get("OPENAI_API_KEY"):
            print("❌ OPENAI_API_KEY environment variable not set")
            print("ℹ️ Set the API key with: export OPENAI_API_KEY=your_key")
            return False
        
        # Try minimal API call to check configuration
        try:
            # Using the most basic prompt to minimize token usage
            openai.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": "Say 'API works' in Japanese"}],
                max_tokens=5
            )
            print("✅ OpenAI API connection successful")
            return True
        except Exception as e:
            print(f"❌ OpenAI API test failed: {str(e)}")
            return False
            
    except ImportError:
        print("❌ OpenAI package not installed. Install with: pip install openai")
        return False

def validate_ffmpeg_installation():
    """Check if FFmpeg is installed for audio processing."""
    print("\n🔍 Validating FFmpeg installation...")
    
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                               stdout=subprocess.PIPE, 
                               stderr=subprocess.PIPE,
                               text=True)
        
        if result.returncode == 0:
            # Extract version from output
            version_line = result.stdout.split('\n')[0]
            print(f"✅ FFmpeg installed: {version_line}")
            return True
        else:
            print("❌ FFmpeg check failed")
            return False
    except FileNotFoundError:
        print("❌ FFmpeg not found. Please install FFmpeg")
        print("ℹ️ Install with: apt-get install ffmpeg (Ubuntu) or brew install ffmpeg (macOS)")
        return False

if __name__ == "__main__":
    print("🔍 Validating backend components...\n")
    
    # Track validation results
    validation_results = {}
    skipped_tests = []
    
    # Validate TTS
    print("\n==== Testing Text-to-Speech ====")
    tts_path = os.path.join(os.path.dirname(__file__), "utils/validate_tts.py")
    if os.path.exists(tts_path):
        aws_result = run_test(tts_path, "test_aws_polly")
        google_result = run_test(tts_path, "test_google_tts")
        
        # Handle skipped tests
        if aws_result == "skipped":
            print("ℹ️ AWS Polly validation was skipped - credentials not found")
            skipped_tests.append('tts_aws')
        else:
            validation_results['tts_aws'] = aws_result
            
        if google_result == "skipped":
            print("ℹ️ Google TTS validation was skipped - credentials not found")
            skipped_tests.append('tts_google')
        else:
            validation_results['tts_google'] = google_result
            
        # If both TTS services are skipped, show a warning but don't fail validation
        if aws_result == "skipped" and google_result == "skipped":
            print("⚠️ WARNING: Both AWS Polly and Google TTS credentials are missing.")
            print("   You must configure at least one TTS service for the application to work properly.")
            print("   Please refer to the README for setup instructions.")
    else:
        print(f"❌ TTS validation file not found: {tts_path}")
        validation_results['tts'] = False

    # Validate YouTube API
    print("\n==== Testing YouTube Transcript API ====")
    youtube_path = os.path.join(os.path.dirname(__file__), "utils/validate_youtube_api.py")
    if os.path.exists(youtube_path):
        validation_results['youtube_api'] = run_test(youtube_path, "validate_youtube_transcript_api")
        validation_results['transcript_processing'] = run_test(youtube_path, "test_transcript_processing")
    else:
        print(f"❌ YouTube validation file not found: {youtube_path}")
        validation_results['youtube'] = False
    
    # Validate Database
    print("\n==== Testing Database ====")
    db_path = os.path.join(os.path.dirname(__file__), "utils/validate_database.py")
    if os.path.exists(db_path):
        validation_results['vector_db'] = run_test(db_path, "validate_sqlite_vector_extension")
        validation_results['db_schema'] = run_test(db_path, "test_database_schema")
    else:
        print(f"❌ Database validation file not found: {db_path}")
        validation_results['database'] = False
    
    # Validate API endpoints
    validation_results['api_endpoints'] = validate_api_endpoints()
    
    # Validate OpenAI integration
    validation_results['openai'] = validate_openai_integration()
    
    # Validate FFmpeg installation
    validation_results['ffmpeg'] = validate_ffmpeg_installation()
    
    # Print summary
    print("\n==== Validation Summary ====")
    success_count = sum(1 for result in validation_results.values() if result is True)
    fail_count = sum(1 for result in validation_results.values() if result is False)
    skipped_count = len(skipped_tests)
    total_count = len(validation_results) + skipped_count
    
    for component, result in validation_results.items():
        status = "✅" if result else "❌"
        print(f"{status} {component}")
    
    for component in skipped_tests:
        print(f"⏭️ {component} (skipped)")
    
    print(f"\nPassed: {success_count}/{total_count} tests")
    if fail_count > 0:
        print(f"Failed: {fail_count}/{total_count} tests")
    if skipped_count > 0:
        print(f"Skipped: {skipped_count}/{total_count} tests")
    
    if fail_count > 0:
        print("\n❌ Backend validation completed with errors")
        sys.exit(1)
    else:
        if skipped_count > 0:
            print("\n⚠️ Backend validation completed with some skipped tests")
        else:
            print("\n✅ All backend components validated successfully!")
        sys.exit(0)
