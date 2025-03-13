import logging
import os
from typing import Dict, List, Any, Optional
from langchain.llms import OpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        # Initialize LLM
        self.llm = OpenAI(temperature=0, openai_api_key=self.api_key)
        
        # Initialize embeddings
        self.embeddings = OpenAIEmbeddings(openai_api_key=self.api_key)
        
        # Initialize vector store
        self.db_directory = "db"
        self.vector_db = self._initialize_vector_db()
        
        logger.info("LLM Service initialized successfully")
    
    def _initialize_vector_db(self):
        """Initialize and return the vector database."""
        try:
            # Check if vector store exists
            if os.path.exists(self.db_directory):
                return Chroma(persist_directory=self.db_directory, embedding_function=self.embeddings)
            else:
                logger.warning(f"Vector database directory {self.db_directory} not found")
                return None
        except Exception as e:
            logger.error(f"Error initializing vector database: {str(e)}")
            return None
    
    def generate_answer(self, question: str, include_sources: bool = False) -> Dict[str, Any]:
        """Generate an answer for the given question using RAG."""
        try:
            if not self.vector_db:
                return {
                    "answer": "I don't have any knowledge base to answer from. Please upload documents first.",
                    "sources": []
                }
            
            # Create QA chain
            qa_template = """
            You are a helpful assistant that answers questions based on the provided context.
            
            Context:
            {context}
            
            Question:
            {question}
            
            Please provide a detailed and accurate answer based only on the context provided:
            """
            PROMPT = PromptTemplate(
                template=qa_template,
                input_variables=["context", "question"]
            )
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vector_db.as_retriever(search_kwargs={"k": 3}),
                chain_type_kwargs={"prompt": PROMPT},
                return_source_documents=include_sources
            )
            
            # Get answer
            result = qa_chain({"query": question})
            
            # Format response
            response = {
                "answer": result["result"]
            }
            
            # Include sources if requested
            if include_sources and "source_documents" in result:
                sources = []
                for doc in result["source_documents"]:
                    sources.append({
                        "text": doc.page_content,
                        "metadata": doc.metadata
                    })
                response["sources"] = sources
            
            return response
        
        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}")
            return {
                "answer": f"Error generating answer: {str(e)}",
                "sources": []
            }
