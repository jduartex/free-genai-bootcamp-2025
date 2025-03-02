import os
import numpy as np
from typing import List, Union, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import torch
from transformers import AutoTokenizer, AutoModel
import fugashi
import ipadic
import re
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class JapaneseEmbeddingService:
    """Service for generating and managing embeddings specifically optimized for Japanese text"""
    
    # Models particularly good for Japanese text
    MODELS = {
        "multilingual-e5-large": "intfloat/multilingual-e5-large", # Good for multilingual including Japanese
        "japanese-bart": "ku-nlp/bart-base-japanese", # Japanese-specific
        "xlm-roberta-japanese": "cl-tohoku/bert-base-japanese-v3", # Japanese BERT
        "default": "intfloat/multilingual-e5-large" # Default model
    }
    
    def __init__(self, model_name: str = "default", device: str = None):
        """
        Initialize the embedding service with specified model
        
        Args:
            model_name: Name of the embedding model to use
            device: Device to run the model on (cuda, cpu, etc.) - if None, will use cuda if available
        """
        self.model_name = model_name
        
        # Set device automatically if not specified
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device
            
        logger.info(f"Using device: {self.device} for Japanese embeddings")
        
        # Get the actual model path
        model_path = self.MODELS.get(model_name, self.MODELS["default"])
        logger.info(f"Loading model: {model_path}")
        
        # Load the model - use SentenceTransformer for most cases as it's optimized for embeddings
        self.model = SentenceTransformer(model_path, device=self.device)
        
        # Initialize Japanese tokenizer with fallback
        try:
            self.tokenizer = fugashi.Tagger('-Owakati')  # Simpler initialization
        except RuntimeError:
            logger.warning("Failed to initialize MeCab tokenizer. Using basic tokenization.")
            self.tokenizer = None
            
        logger.info("Japanese embedding service initialized")
    
    def preprocess_japanese_text(self, text: str) -> str:
        """
        Preprocess Japanese text for better embedding quality
        
        Args:
            text: Japanese text to preprocess
            
        Returns:
            Preprocessed text
        """
        if not text or not isinstance(text, str):
            return ""
            
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Convert full-width characters to half-width when appropriate
        text = text.translate(str.maketrans({
            '！': '!', '？': '?', '：': ':', '；': ';',
            '（': '(', '）': ')', '［': '[', '］': ']',
            '｛': '{', '｝': '}', '　': ' '
        }))
        
        # Handle Japanese-specific preprocessing if needed
        # This is a simple example - more sophisticated preprocessing could be added
        
        return text
    
    def tokenize_japanese(self, text: str) -> List[str]:
        """
        Tokenize Japanese text with fallback
        
        Args:
            text: Japanese text to tokenize
            
        Returns:
            List of tokenized words
        """
        if self.tokenizer:
            try:
                return self.tokenizer.parse(text).split()
            except Exception as e:
                logger.warning(f"MeCab tokenization failed: {str(e)}")
        
        # Fallback: basic whitespace tokenization
        return text.split()
    
    def generate_embeddings(self, texts: Union[str, List[str]], 
                           batch_size: int = 32,
                           preprocess: bool = True,
                           normalize: bool = True) -> np.ndarray:
        """
        Generate embeddings for Japanese text(s)
        
        Args:
            texts: Single text or list of texts to embed
            batch_size: Size of batches for processing
            preprocess: Whether to apply preprocessing
            normalize: Whether to normalize embeddings to unit length
            
        Returns:
            Numpy array of embeddings (2D if input is list, 1D if input is string)
        """
        is_single = isinstance(texts, str)
        
        # Convert to list if single string
        if is_single:
            texts = [texts]
            
        # Preprocess texts if needed
        if preprocess:
            texts = [self.preprocess_japanese_text(text) for text in texts]
            
        # Generate embeddings
        try:
            # Use the model to generate embeddings
            embeddings = self.model.encode(texts, batch_size=batch_size, 
                                         normalize_embeddings=normalize,
                                         show_progress_bar=len(texts) > 100)
            
            # Return single embedding if input was single string
            if is_single:
                return embeddings[0]
                
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            # Return empty array with correct shape
            if is_single:
                return np.zeros(self.model.get_sentence_embedding_dimension())
            else:
                return np.zeros((len(texts), self.model.get_sentence_embedding_dimension()))
    
    def semantic_search(self, query: Union[str, np.ndarray], 
                       corpus: List[Union[str, np.ndarray]],
                       top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Perform semantic search with a query against a corpus
        
        Args:
            query: Query text or embedding
            corpus: List of texts or embeddings to search against
            top_k: Number of top results to return
            
        Returns:
            List of dictionaries with corpus_id and score
        """
        # Check if we have strings or embeddings
        if isinstance(query, str):
            query_embedding = self.generate_embeddings(query)
        else:
            query_embedding = query
            
        corpus_embeddings = None
        
        if corpus and isinstance(corpus[0], str):
            corpus_embeddings = self.generate_embeddings(corpus)
        else:
            corpus_embeddings = np.vstack(corpus)
            
        # Calculate cosine similarities
        similarities = cosine_similarity(query_embedding, corpus_embeddings)
        
        # Get top k results
        top_results = []
        sorted_indices = np.argsort(similarities)[::-1][:top_k]
        
        for idx in sorted_indices:
            top_results.append({
                "corpus_id": int(idx),
                "score": float(similarities[idx])
            })
            
        return top_results
    
    def get_embedding_dimension(self) -> int:
        """
        Get the dimension of the embeddings
        
        Returns:
            Dimension size
        """
        return self.model.get_sentence_embedding_dimension()
    
    @staticmethod
    def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """
        Calculate cosine similarity between two vectors
        
        Args:
            a: First vector
            b: Second vector
            
        Returns:
            Cosine similarity score
        """
        if len(a.shape) == 1:
            a = a.reshape(1, -1)
            
        if len(b.shape) == 1:
            b = b.reshape(1, -1)
            
        a_norm = np.linalg.norm(a, axis=1, keepdims=True)
        b_norm = np.linalg.norm(b, axis=1, keepdims=True)
        
        # Avoid division by zero
        a_norm = np.where(a_norm == 0, 1e-8, a_norm)
        b_norm = np.where(b_norm == 0, 1e-8, b_norm)
        
        a_normalized = a / a_norm
        b_normalized = b / b_norm
        
        # Calculate similarity
        if len(b_normalized.shape) == 2 and b_normalized.shape[0] > 1:
            # Multiple vectors in b
            similarities = np.dot(a_normalized, b_normalized.T)[0]
        else:
            # Single vector in b
            similarities = np.dot(a_normalized, b_normalized.T)[0][0]
            
        return similarities


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> Union[float, np.ndarray]:
    """
    Calculate cosine similarity between two vectors or sets of vectors
    
    Args:
        a: First vector or matrix (if matrix, each row is a vector)
        b: Second vector or matrix (if matrix, each row is a vector)
        
    Returns:
        Cosine similarity score(s)
    """
    # Reshape if needed
    if len(a.shape) == 1:
        a = a.reshape(1, -1)
        
    if len(b.shape) == 1:
        b = b.reshape(1, -1)
        
    # Normalize vectors
    a_norm = np.linalg.norm(a, axis=1, keepdims=True)
    b_norm = np.linalg.norm(b, axis=1, keepdims=True)
    
    # Avoid division by zero
    a_norm = np.where(a_norm == 0, 1e-8, a_norm)
    b_norm = np.where(b_norm == 0, 1e-8, b_norm)
    
    a_normalized = a / a_norm
    b_normalized = b / b_norm
    
    # Calculate similarity
    if a.shape[0] == 1 and b.shape[0] == 1:
        # Single vectors
        return float(np.dot(a_normalized, b_normalized.T)[0][0])
    elif a.shape[0] == 1:
        # One query vector against multiple corpus vectors
        return np.dot(a_normalized, b_normalized.T)[0]
    else:
        # Multiple queries against multiple corpus vectors
        return np.dot(a_normalized, b_normalized.T)


# Example usage
if __name__ == "__main__":
    # Test the embedding service
    service = JapaneseEmbeddingService()
    
    # Example Japanese texts
    texts = [
        "日本語のリスニング練習をするのは大切です。",
        "毎日少しずつ練習しましょう。",
        "日本語の勉強は楽しいです。",
        "東京に旅行に行きたいです。"
    ]
    
    # Generate embeddings
    embeddings = service.generate_embeddings(texts)
    print(f"Generated {len(embeddings)} embeddings with dimension {embeddings[0].shape}")
    
    # Perform semantic search
    query = "日本語を勉強することは大事です。"
    results = service.semantic_search(query, texts)
    
    print("\nSemantic search results:")
    for i, result in enumerate(results):
        print(f"{i+1}. {texts[result['corpus_id']]} (Score: {result['score']:.4f})")
