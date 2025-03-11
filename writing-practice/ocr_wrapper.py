import os
import sys
import warnings
import contextlib
import logging

# Completely silence warnings
logging.getLogger().setLevel(logging.ERROR)

# Configure PyTorch environment variables
os.environ["PYTORCH_JIT"] = "0"  # Disable JIT
os.environ["TORCH_WARN_ONCE"] = "1"  # Show warnings only once
os.environ["PYTHONWARNINGS"] = "ignore"
os.environ["CUDA_VISIBLE_DEVICES"] = ""  # Disable GPU to avoid more warnings

# Suppress specific warnings
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# More specific suppressions
warnings.filterwarnings("ignore", message=".*torch.*")
warnings.filterwarnings("ignore", message=".*cuda.*")
warnings.filterwarnings("ignore", message=".*__path__.*")
warnings.filterwarnings("ignore", message=".*instantiate.*")
warnings.filterwarnings("ignore", message=".*class.*")

# Wrapper to redirect stderr/stdout to null
@contextlib.contextmanager
def suppress_output():
    # Save original stdout/stderr
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    
    # Redirect to /dev/null
    null_device = open(os.devnull, 'w')
    sys.stdout = null_device
    sys.stderr = null_device
    
    try:
        yield
    finally:
        # Restore original stdout/stderr
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        null_device.close()

# Create a dummy OCR implementation as fallback
class DummyOcr:
    def __init__(self):
        pass
        
    def __call__(self, image):
        return "OCR module not available"

# Import MangaOcr with suppressed output
try:
    with suppress_output():
        # Prevent importing to print warnings
        from manga_ocr import MangaOcr as _MangaOcr
        
        class MangaOcr(_MangaOcr):
            def __init__(self, *args, **kwargs):
                with suppress_output():
                    super().__init__(*args, **kwargs)
            
            def __call__(self, image):
                with suppress_output():
                    return super().__call__(image)
except ImportError:
    # Use dummy OCR class
    MangaOcr = DummyOcr

# Create a wrapped OCR class with singleton pattern
class OCRWrapper:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            try:
                with suppress_output():
                    cls._instance = MangaOcr()
            except Exception as e:
                print(f"Error initializing MangaOcr: {e}")
                cls._instance = DummyOcr()
        return cls._instance
