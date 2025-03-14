import os
import logging
import glob
from typing import List, Dict, Any
import PyPDF2
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/ingestion.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DocumentIngester:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.embeddings = OpenAIEmbeddings(openai_api_key=self.api_key)
        self.data_dir = "data"
        self.db_dir = "db"
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
    
    def load_pdf(self, file_path: str) -> List[Document]:
        """Load and parse a PDF file."""
        try:
            logger.info(f"Processing PDF: {file_path}")
            
            # Check file size
            file_size = os.path.getsize(file_path) / (1024 * 1024)  # Size in MB
            if file_size > 10:
                logger.warning(f"File {file_path} exceeds 10MB limit ({file_size:.2f}MB). Skipping.")
                return []
            
            # Extract text from PDF
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                # Process each page
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n\n"
            
            # Create metadata
            metadata = {
                "source": os.path.basename(file_path),
                "file_path": file_path
            }
            
            # Create document
            doc = Document(page_content=text, metadata=metadata)
            
            # Split text into chunks
            docs = self.text_splitter.split_documents([doc])
            
            logger.info(f"Extracted {len(docs)} chunks from {file_path}")
            return docs
        
        except Exception as e:
            logger.error(f"Error processing {file_path}: {str(e)}")
            return []
    
    def ingest_documents(self) -> None:
        """Ingest all PDF documents in the data directory."""
        try:
            # Get all PDF files
            pdf_files = glob.glob(os.path.join(self.data_dir, "**", "*.pdf"), recursive=True)
            
            if not pdf_files:
                logger.warning(f"No PDF files found in {self.data_dir}")
                return
            
            logger.info(f"Found {len(pdf_files)} PDF files to process")
            
            # Process all PDF files
            all_docs = []
            for pdf_file in pdf_files:
                docs = self.load_pdf(pdf_file)
                all_docs.extend(docs)
            
            if not all_docs:
                logger.warning("No documents were successfully processed")
                return
            
            # Create or update vector store
            logger.info(f"Creating vector store with {len(all_docs)} documents")
            vector_db = Chroma.from_documents(
                documents=all_docs,
                embedding=self.embeddings,
                persist_directory=self.db_dir
            )
            
            # Persist the database
            vector_db.persist()
            
            logger.info(f"Successfully ingested {len(all_docs)} document chunks into the vector database")
        
        except Exception as e:
            logger.error(f"Error during document ingestion: {str(e)}")

if __name__ == "__main__":
    ingester = DocumentIngester()
    ingester.ingest_documents()
