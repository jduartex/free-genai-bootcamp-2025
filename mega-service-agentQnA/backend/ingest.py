"""
Document ingestion script for AgentQnA.
This script processes PDF documents and adds them to the vector database.
"""

import os
import sys
import argparse
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_argparse():
    """Configure command line argument parsing."""
    parser = argparse.ArgumentParser(description='Ingest documents into the vector database.')
    parser.add_argument('--subset', type=str, default=None, 
                       help='Specify a subset of documents to ingest (e.g., minimal)')
    return parser.parse_args()

def get_document_path(args):
    """Determine the document path based on arguments."""
    base_path = Path(__file__).parent.parent
    
    if args.subset:
        doc_path = base_path / "data" / args.subset
        if not doc_path.exists():
            logger.error(f"Subset directory not found: {doc_path}")
            sys.exit(1)
    else:
        doc_path = base_path / "data"
        
    logger.info(f"Using document path: {doc_path}")
    return doc_path

def ingest_documents(doc_path):
    """Process and ingest documents from the specified path."""
    try:
        # Count PDF files in the directory
        pdf_files = list(doc_path.glob("*.pdf"))
        if not pdf_files:
            logger.warning(f"No PDF files found in {doc_path}")
            return False
            
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        # Here you would add your actual document processing logic
        # For example:
        # 1. Extract text from PDFs
        # 2. Split into chunks
        # 3. Create embeddings
        # 4. Store in vector database
        
        # Placeholder for actual processing
        for pdf_file in pdf_files:
            logger.info(f"Processing {pdf_file.name}")
            # Your processing code here
        
        return True
    except Exception as e:
        logger.error(f"Error during document ingestion: {str(e)}")
        return False

def main():
    """Main execution function."""
    args = setup_argparse()
    doc_path = get_document_path(args)
    
    success = ingest_documents(doc_path)
    
    if not success:
        logger.error("Document ingestion failed")
        sys.exit(1)
    
    logger.info("Document ingestion completed successfully")

if __name__ == "__main__":
    main()
