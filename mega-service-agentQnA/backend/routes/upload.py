from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import sys
import os

# Add parent directory to path so imports work correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Fix the import path
from backend.utils import get_api_logger, get_error_logger

# Get loggers
api_logger = get_api_logger()
error_logger = get_error_logger()

# Define router
router = APIRouter()

@router.post("/")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload documents to the knowledge base
    """
    api_logger.info(f"Received {len(files)} files for upload")
    try:
        # Placeholder for actual file processing
        processed_files = []
        for file in files:
            api_logger.info(f"Processing file: {file.filename}")
            processed_files.append(file.filename)
        
        return {
            "status": "success",
            "message": f"Successfully processed {len(processed_files)} files",
            "processed_files": processed_files
        }
    except Exception as e:
        error_msg = f"Error uploading files: {str(e)}"
        error_logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
