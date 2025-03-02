"""
Diagnostic script to check Python environment and imports
"""
import sys
import os
import subprocess
import importlib.util

def check_module_installation(module_name):
    """Check if a module is installed and available"""
    spec = importlib.util.find_spec(module_name)
    if spec is not None:
        module = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(module)
            print(f"✅ {module_name} is installed and working (Version: {getattr(module, '__version__', 'Unknown')})")
            return True
        except Exception as e:
            print(f"❌ {module_name} is installed but has issues: {str(e)}")
            return False
    else:
        print(f"❌ {module_name} is not installed or cannot be found")
        return False

def get_installed_modules():
    """Get all installed modules using pip"""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip", "list"], 
            capture_output=True, 
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.SubprocessError:
        return "Failed to get installed packages"

def main():
    print("="*60)
    print("Python Environment and Package Diagnostic")
    print("="*60)
    
    # Python version and path
    print(f"\nPython version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print(f"Current working directory: {os.getcwd()}")
    
    # Virtual environment
    venv = os.environ.get('VIRTUAL_ENV')
    if venv:
        print(f"Active virtual environment: {venv}")
    else:
        print("No active virtual environment detected")
    
    # Check important modules
    print("\nChecking required modules:")
    modules_to_check = [
        'openai', 
        'fastapi', 
        'uvicorn', 
        'sentence_transformers', 
        'youtube_transcript_api', 
        'pydantic',
        'whisper'
    ]
    
    for module in modules_to_check:
        check_module_installation(module)
    
    # Show sys.path
    print("\nPython module search paths (sys.path):")
    for path in sys.path:
        print(f"  - {path}")
    
    # Check environment variables
    print("\nChecking environment variables:")
    env_vars = ["PYTHONPATH", "PATH"]
    for var in env_vars:
        print(f"  {var}: {os.environ.get(var, 'Not set')}")
    
    # Show installed packages
    print("\nInstalled packages (pip list):")
    print(get_installed_modules())
    
    # VSCode specific information
    print("\nVSCode integration tips:")
    print("1. Make sure the Python extension is installed in VSCode")
    print("2. Select the correct Python interpreter in VSCode:")
    print("   - Press Ctrl+Shift+P (Cmd+Shift+P on Mac)")
    print("   - Type 'Python: Select Interpreter'")
    print("   - Choose the interpreter from your virtual environment")
    print("3. You may need to restart VSCode after changing environments")
    
    print("\nTo fix the openai import issue:")
    print("1. Try reinstalling the package:")
    print("   pip uninstall openai")
    print("   pip install openai==1.12.0")
    print("2. Check your .env file has valid OPENAI_API_KEY")
    print("3. Restart your code editor")
    
    print("\nTroubleshooting import issues:")
    print("- If using VSCode, the Python extension might need to be updated")
    print("- Try running 'pip install -e .' in the project root if it's a package")
    print("- Pylance settings in VSCode might need configuration")
    
    print("="*60)

if __name__ == "__main__":
    main()
