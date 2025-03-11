import numpy as np
import logging
from typing import Optional, List, Dict
import os
import requests
from sentence_transformers import SentenceTransformer
import fugashi
import romkan

logger = logging.getLogger(__name__)

class JapaneseEmbeddings:
    """Service for creating embeddings from Japanese text with kana/romaji conversion"""
    
    def __init__(self, model_name: str = "intfloat/multilingual-e5-small"):
        """Initialize the embedding model"""
        self.model_name = model_name
        try:
            # Load the model
            self.model = SentenceTransformer(model_name)
            # Initialize Japanese tokenizer
            self.tokenizer = fugashi.Tagger()
            self.initialized = True
            logger.info(f"Embedding model {model_name} initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {e}")
            self.initialized = False
    
    def get_embeddings(self, text: str) -> Optional[np.ndarray]:
        """Create embeddings for Japanese text"""
        if not self.initialized:
            logger.error("Embedding model not initialized")
            return None
            
        try:
            # Create embedding
            embedding = self.model.encode(text, normalize_embeddings=True)
            return embedding
        except Exception as e:
            logger.error(f"Failed to create embedding: {e}")
            return None
    
    def kanji_to_kana(self, text: str) -> str:
        """Convert kanji to hiragana/katakana"""
        if not self.initialized:
            return text
            
        try:
            result = ""
            for word in self.tokenizer(text):
                # Get the reading (kana) of the word
                result += word.feature.kana if word.feature.kana else word.surface
            return result
        except Exception as e:
            logger.error(f"Failed to convert kanji to kana: {e}")
            return text
    
    def kana_to_romaji(self, kana: str) -> str:
        """Convert hiragana/katakana to romaji"""
        try:
            return romkan.to_roma(kana)
        except Exception as e:
            logger.error(f"Failed to convert kana to romaji: {e}")
            return kana
    
    def process_japanese_text(self, text: str) -> Dict[str, str]:
        """Process Japanese text to get kanji, kana, and romaji forms"""
        kanji = text  # Original text
        kana = self.kanji_to_kana(text)
        romaji = self.kana_to_romaji(kana)
        
        return {
            "kanji": kanji,
            "kana": kana,
            "romaji": romaji
        }
