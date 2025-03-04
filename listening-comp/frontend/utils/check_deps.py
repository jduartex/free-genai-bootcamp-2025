import importlib.metadata
import sys
from typing import Dict, List, Tuple

def check_dependencies() -> bool:
    """Check if all required packages are installed with correct versions"""
    required_packages = {
        'streamlit': '1.24.0',
        'aiohttp': '3.8.5',
        'pandas': '1.5.3',
        'numpy': '1.23.5',
        'requests': '2.31.0',
        'python-dotenv': '1.0.0'
    }
    
    missing: List[str] = []
    version_mismatch: List[str] = []
    
    for package, version in required_packages.items():
        try:
            installed = importlib.metadata.version(package)
            if installed != version:
                version_mismatch.append(
                    f"{package} version {installed} is installed but version {version} is required"
                )
        except importlib.metadata.PackageNotFoundError:
            missing.append(package)
    
    if missing:
        print("Missing packages:")
        for package in missing:
            print(f"  - {package}")
            
    if version_mismatch:
        print("\nVersion mismatches:")
        for msg in version_mismatch:
            print(f"  - {msg}")
            
    if not (missing or version_mismatch):
        print("All dependencies are correctly installed!")
        
    return not (missing or version_mismatch)

if __name__ == "__main__":
    check_dependencies()
