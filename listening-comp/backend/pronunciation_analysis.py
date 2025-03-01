import os
import json
import difflib
import re
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import openai
from dotenv import load_dotenv

from .speech_recognition import JapaneseSpeechRecognition

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
if openai_api_key:
    openai.api_key = openai_api_key

class JapanesePronunciationAnalyzer:
    """Class for analyzing Japanese pronunciation and providing feedback."""
    
    def __init__(self):
        """Initialize the pronunciation analyzer."""
        self.speech_recognition = JapaneseSpeechRecognition(use_local_model=False)
        
        # Common Japanese pronunciation challenges
        self.common_issues = {
            "長音": "Long vowels (e.g., おかあさん vs おかさん)",
            "促音": "Glottal stops/small tsu (e.g., きって vs きて)",
            "撥音": "N sounds (e.g., せんせい vs せせい)",
            "アクセント": "Pitch accent patterns",
            "混同母音": "Similar vowels (e.g., e/i, o/u)",
            "子音強さ": "Consonant strength (e.g., t/d, k/g)",
            "リズム": "Rhythm and timing",
            "イントネーション": "Sentence intonation"
        }
    
    def compare_text(self, expected: str, actual: str) -> Dict[str, Any]:
        """
        Compare expected text with actual transcribed text.
        
        Args:
            expected: Expected Japanese text
            actual: Actual transcribed Japanese text
            
        Returns:
            Dictionary with comparison results
        """
        # Normalize both texts for comparison
        expected_norm = self._normalize_japanese(expected)
        actual_norm = self._normalize_japanese(actual)
        
        # Get similarity score
        similarity = self._calculate_similarity(expected_norm, actual_norm)
        
        # Find differences
        matcher = difflib.SequenceMatcher(None, expected_norm, actual_norm)
        diff = []
        
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                diff.append({
                    'type': 'equal',
                    'expected': expected_norm[i1:i2],
                    'actual': actual_norm[j1:j2]
                })
            elif tag == 'replace':
                diff.append({
                    'type': 'replace',
                    'expected': expected_norm[i1:i2],
                    'actual': actual_norm[j1:j2]
                })
            elif tag == 'delete':
                diff.append({
                    'type': 'delete',
                    'expected': expected_norm[i1:i2],
                    'actual': ''
                })
            elif tag == 'insert':
                diff.append({
                    'type': 'insert',
                    'expected': '',
                    'actual': actual_norm[j1:j2]
                })
        
        return {
            'similarity': similarity,
            'differences': diff,
            'expected': expected_norm,
            'actual': actual_norm
        }
    
    def _normalize_japanese(self, text: str) -> str:
        """
        Normalize Japanese text for comparison.
        
        Args:
            text: Japanese text to normalize
            
        Returns:
            Normalized text
        """
        # Convert to hiragana/katakana only (no kanji)
        # This would normally use a library like pykakasi, but we'll use a placeholder
        # In a real implementation, you'd convert kanji to hiragana here
        
        # Remove whitespace and punctuation
        text = re.sub(r'[\s.,!?、。！？「」『』()（）［］]', '', text)
        
        # Normalize long vowels (e.g., おうさま -> おおさま)
        # This is a simplified approach
        text = re.sub(r'おう', 'おお', text)
        text = re.sub(r'えい', 'ええ', text)
        
        return text.lower()
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two text strings.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        matcher = difflib.SequenceMatcher(None, text1, text2)
        return matcher.ratio()
    
    def analyze_audio_pronunciation(self, audio_data: Any, expected_text: str) -> Dict[str, Any]:
        """
        Analyze pronunciation in audio compared to expected text.
        
        Args:
            audio_data: Audio data (file path, bytes, or base64)
            expected_text: Expected Japanese text
            
        Returns:
            Dictionary with pronunciation analysis results
        """
        # Transcribe the audio
        transcription_result = self.speech_recognition.process_audio_data(audio_data)
        
        if "error" in transcription_result:
            return {"error": transcription_result["error"]}
        
        actual_text = transcription_result.get("text", "")
        
        # Compare with expected text
        comparison = self.compare_text(expected_text, actual_text)
        
        # Get pronunciation confidence
        confidence = self.speech_recognition.get_pronunciation_confidence(transcription_result)
        
        # Identify specific pronunciation issues
        issues = self._identify_pronunciation_issues(expected_text, actual_text, comparison)
        
        # Get a score based on similarity and confidence
        score = (comparison['similarity'] * 0.7) + (confidence * 0.3)
        score = round(score * 100)
        
        # Format the result
        result = {
            'expected_text': expected_text,
            'transcribed_text': actual_text,
            'similarity': round(comparison['similarity'] * 100),
            'confidence': round(confidence * 100),
            'score': score,
            'issues': issues,
            'differences': comparison['differences'],
            'feedback': self._generate_feedback(score, issues)
        }
        
        return result
    
    def _identify_pronunciation_issues(self, expected: str, actual: str, comparison: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Identify specific pronunciation issues.
        
        Args:
            expected: Expected text
            actual: Actual text
            comparison: Comparison result
            
        Returns:
            List of identified issues
        """
        issues = []
        
        # Look for common Japanese pronunciation issues
        if '長音' in expected and '長音' not in actual:
            issues.append({
                'type': '長音',
                'description': 'Long vowel sounds missing or incorrect',
                'severity': 'high'
            })
        
        if 'っ' in expected and 'っ' not in actual:
            issues.append({
                'type': '促音',
                'description': 'Glottal stops (small tsu) missing or incorrect',
                'severity': 'high'
            })
        
        if 'ん' in expected and 'ん' not in actual:
            issues.append({
                'type': '撥音',
                'description': 'N sounds missing or incorrect',
                'severity': 'medium'
            })
        
        # Check for common vowel confusions
        if re.search(r'[いえ]', expected) and comparison['similarity'] < 0.9:
            issues.append({
                'type': '混同母音',
                'description': 'Similar vowel sounds confused (e.g., i/e)',
                'severity': 'medium'
            })
        
        # When similarity is low but there are few specific issues, it might be accent
        if comparison['similarity'] < 0.8 and len(issues) < 2:
            issues.append({
                'type': 'アクセント',
                'description': 'Pitch accent pattern may be incorrect',
                'severity': 'low'
            })
        
        # If nothing specific is found but similarity is low
        if not issues and comparison['similarity'] < 0.7:
            issues.append({
                'type': 'リズム',
                'description': 'General rhythm and timing issues',
                'severity': 'medium'
            })
        
        return issues
    
    def _generate_feedback(self, score: int, issues: List[Dict[str, str]]) -> str:
        """
        Generate human-readable feedback based on score and issues.
        
        Args:
            score: Pronunciation score
            issues: List of identified issues
            
        Returns:
            Feedback string
        """
        if score >= 90:
            feedback = "すばらしい発音です！ほぼネイティブレベルです。"
        elif score >= 80:
            feedback = "とても良い発音です。いくつかの小さな問題がありますが、よく理解できます。"
        elif score >= 70:
            feedback = "良い発音です。いくつかの改善点があります。"
        elif score >= 50:
            feedback = "理解できる発音ですが、いくつかの重要な問題があります。"
        else:
            feedback = "発音に問題があります。もう少し練習しましょう。"
        
        # Add specific issue feedback
        if issues:
            feedback += " 特に注意すべき点：\n"
            for issue in issues:
                severity = {
                    'high': '重要',
                    'medium': '注意',
                    'low': '小さな問題'
                }.get(issue.get('severity', 'medium'), '')
                
                feedback += f"- {severity}: {issue['description']}\n"
        
        return feedback
    
    def get_detailed_feedback_llm(self, expected: str, actual: str, audio_data: Optional[Any] = None) -> Dict[str, Any]:
        """
        Get more detailed pronunciation feedback using LLM.
        
        Args:
            expected: Expected text
            actual: Actual text
            audio_data: Optional audio data for additional analysis
            
        Returns:
            Detailed feedback from LLM
        """
        try:
            # Basic comparison
            comparison = self.compare_text(expected, actual)
            
            # Prepare prompt for LLM
            prompt = f"""
            あなたは日本語の発音を評価する専門家です。以下の発音を評価してください：

            期待されるテキスト：{expected}
            実際に言ったテキスト：{actual}
            類似度：{comparison['similarity'] * 100:.1f}%

            特に以下の点について分析し、日本語と英語で具体的なアドバイスを提供してください：
            1. 長音（おおきい vs おきい など）
            2. 促音（小さい「っ」）
            3. 撥音（ん）
            4. アクセントのパターン
            5. 混同しやすい音（い/え、す/つ など）
            6. 全体的な流暢さ

            改善のための具体的な練習方法も提案してください。
            """
            
            # Generate LLM feedback
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
            )
            
            feedback = response.choices[0].message.content
            
            # Separate Japanese and English feedback if possible
            japanese_feedback = feedback
            english_feedback = feedback
            
            # Try to split feedback by language
            jp_section_match = re.search(r'([\s\S]*?)(?:English|英語|In English):([\s\S]*)', feedback)
            if jp_section_match:
                japanese_feedback = jp_section_match.group(1).strip()
                english_feedback = jp_section_match.group(2).strip()
            
            return {
                'similarity': comparison['similarity'],
                'japanese_feedback': japanese_feedback,
                'english_feedback': english_feedback,
                'full_feedback': feedback
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'feedback': "詳細なフィードバックを生成できませんでした。/ Could not generate detailed feedback."
            }
    
    def generate_pitch_pattern_visualization(self, text: str) -> Dict[str, Any]:
        """
        Generate a visualization of pitch accent patterns for text.
        
        Args:
            text: Japanese text
            
        Returns:
            Dictionary with pitch pattern visualization info
        """
        try:
            # In a real implementation, this would use a dictionary or
            # API for Japanese pitch accent patterns
            # This is a placeholder implementation
            
            # For educational purposes, we'll generate some mock data
            words = re.findall(r'\w+', text)
            patterns = []
            
            for word in words:
                # Mock pitch pattern (would be real data in production)
                pattern = []
                length = len(word)
                
                # Randomly assign high/low pattern for demonstration
                # In reality this would use a pitch accent dictionary
                if length > 1:
                    # Common Japanese patterns (simplified)
                    pattern_type = np.random.choice(['heiban', 'atamadaka', 'nakadaka', 'odaka'])
                    
                    if pattern_type == 'heiban':  # Flat pattern (LHHH...)
                        pattern = ['L'] + ['H'] * (length - 1)
                    elif pattern_type == 'atamadaka':  # First mora high (HLLL...)
                        pattern = ['H'] + ['L'] * (length - 1)
                    elif pattern_type == 'nakadaka':  # Middle drop
                        drop_pos = min(length - 1, 2)
                        pattern = ['L'] + ['H'] * drop_pos + ['L'] * (length - drop_pos - 1)
                    else:  # odaka - final drop (LHHL)
                        pattern = ['L'] + ['H'] * (length - 2) + ['L']
                else:
                    pattern = ['H']  # Single mora words are typically high
                
                patterns.append({
                    'word': word,
                    'pattern': pattern,
                    'type': pattern_type if length > 1 else 'tanmora'
                })
            
            return {
                'text': text,
                'patterns': patterns,
                'visualization': self._create_pitch_visualization(patterns),
                'note': "This is an approximation. For accurate pitch patterns, consult a Japanese pitch accent dictionary."
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'text': text
            }
    
    def _create_pitch_visualization(self, patterns: List[Dict[str, Any]]) -> str:
        """
        Create a text-based visualization of pitch patterns.
        
        Args:
            patterns: List of word patterns
            
        Returns:
            ASCII visualization of pitch patterns
        """
        result = ""
        
        for word_data in patterns:
            word = word_data['word']
            pattern = word_data['pattern']
            
            # Create top line (high positions)
            high_line = ""
            for i, p in enumerate(pattern):
                if p == 'H':
                    high_line += "○ "
                else:
                    high_line += "  "
            
            # Create bottom line (low positions)
            low_line = ""
            for i, p in enumerate(pattern):
                if p == 'L':
                    low_line += "○ "
                else:
                    low_line += "  "
            
            # Create middle line (word with spaces)
            word_line = " ".join(word) + " "
            
            # Add connecting lines
            connect_line = ""
            for i in range(len(pattern) - 1):
                if pattern[i] != pattern[i+1]:
                    connect_line += "/ "
                else:
                    connect_line += "  "
            connect_line += "  "
            
            result += f"{high_line}\n{word_line}\n{low_line}\n{connect_line}\n"
        
        return result


# Example usage
if __name__ == "__main__":
    analyzer = JapanesePronunciationAnalyzer()
    
    # Example comparison
    expected = "こんにちは、元気ですか？"
    actual = "こにちは、げんきですか"
    
    comparison = analyzer.compare_text(expected, actual)
    print(f"Similarity: {comparison['similarity'] * 100:.1f}%")
    
    print("\nDifferences:")
    for diff in comparison['differences']:
        if diff['type'] != 'equal':
            print(f"- Expected: '{diff['expected']}', Actual: '{diff['actual']}'")
    
    # Example pitch pattern visualization
    print("\nPitch pattern visualization:")
    pitch_info = analyzer.generate_pitch_pattern_visualization("こんにちは")
    print(pitch_info['visualization'])
