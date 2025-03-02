import os
import json
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

class JLPTClassifier:
    """Class for classifying Japanese text by JLPT level and extracting grammar points."""
    
    def __init__(self):
        # Load grammar point dictionaries if available
        self.grammar_points = self._load_grammar_points()
        
    def _load_grammar_points(self):
        """Load JLPT grammar point reference data."""
        grammar_points = {}
        grammar_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                               "../data/jlpt_grammar_points.json")
        
        try:
            if os.path.exists(grammar_file):
                with open(grammar_file, 'r', encoding='utf-8') as f:
                    grammar_points = json.load(f)
        except Exception as e:
            print(f"Error loading grammar points: {e}")
            # Create default empty structure
            grammar_points = {
                "N5": [],
                "N4": [],
                "N3": [],
                "N2": [],
                "N1": []
            }
        
        return grammar_points
    
    def classify_text(self, text):
        """Classify Japanese text by JLPT level."""
        try:
            # Use OpenAI to classify the text
            prompt = f"""
            以下の日本語テキストを分析し、どのJLPTレベル（N5、N4、N3、N2、N1）に最も適しているかを評価してください。
            また、テキスト内の主要な文法ポイントとN5〜N1レベルの単語をリストアップしてください。
            
            テキスト:
            {text}
            
            以下の形式でJSON形式で回答してください:
            {{
                "estimated_jlpt_level": "N4",  # 全体的な推定JLPTレベル
                "grammar_points": [  # テキストに出現する主な文法ポイント
                    {{"pattern": "〜てしまう", "level": "N4", "explanation": "表す意味と使い方の簡単な説明"}}
                ],
                "vocabulary": [  # テキスト内の重要な単語 (単語、レベル、意味)
                    {{"word": "勉強", "reading": "べんきょう", "level": "N5", "meaning": "study"}}
                ],
                "reason": "このテキストをこのレベルに分類した理由"  # レベル判定の根拠
            }}
            """
            
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            return result
            
        except Exception as e:
            print(f"Error classifying text: {e}")
            return {
                "estimated_jlpt_level": "Unknown",
                "grammar_points": [],
                "vocabulary": [],
                "reason": f"Error during classification: {str(e)}"
            }
    
    def extract_grammar_points(self, text, jlpt_level=None):
        """Extract grammar points from text that match the given JLPT level."""
        try:
            # Use LLM to extract grammar points
            prompt = f"""
            以下の日本語テキストから、{'JLPT ' + jlpt_level + 'レベルの' if jlpt_level else ''}文法ポイントを抽出してください。
            各文法ポイントについて、そのパターン、レベル、説明、テキスト内の例文を提供してください。
            
            テキスト:
            {text}
            
            以下の形式でJSON形式で回答してください:
            {{
                "grammar_points": [
                    {{
                        "pattern": "〜てしまう",
                        "level": "N4",
                        "explanation": "表す意味と使い方の簡単な説明",
                        "example": "テキストから抽出した例文"
                    }}
                ]
            }}
            """
            
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            return result.get("grammar_points", [])
            
        except Exception as e:
            print(f"Error extracting grammar points: {e}")
            return []
    
    def suggest_questions_by_level(self, text, jlpt_level, question_count=3):
        """Generate questions appropriate for the specified JLPT level."""
        # This is a wrapper around the question generation functionality
        # that ensures questions match the specified JLPT level
        try:
            analysis = self.classify_text(text)
            estimated_level = analysis.get("estimated_jlpt_level", "N5")
            
            # Check if requested level is appropriate
            level_map = {"N5": 5, "N4": 4, "N3": 3, "N2": 2, "N1": 1}
            estimated_value = level_map.get(estimated_level, 5)
            requested_value = level_map.get(jlpt_level, 5)
            
            # If requested level is more advanced than estimated content level,
            # add a note about this in the prompt
            level_note = ""
            if requested_value < estimated_value:
                level_note = f"""
                注意: このテキストは{estimated_level}レベルと推定されていますが、
                より高度な{jlpt_level}レベルの問題を作成するように求められています。
                可能な限り、テキストの内容に基づいて{jlpt_level}レベルに適した問題を作成してください。
                必要に応じて、より高度な語彙や文法を使用して問題を作成しても構いません。
                """
            
            # Generate questions
            prompt = f"""
            以下は日本語のテキストです。このテキストに基づいて、JLPT {jlpt_level} レベルの聴解問題を {question_count} 問作成してください。
            
            テキスト:
            {text}
            
            {level_note}
            
            各問題は以下の形式で提供してください:
            - 質問文
            - 4つの選択肢 (1つの正解と3つの不正解)
            - 正解
            - 文法や語彙に関する簡潔な説明 (JLPT {jlpt_level} レベルの文法・語彙に注目)
            
            JSON形式で出力してください。
            """
            
            response = openai.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            questions_data = json.loads(content)
            
            return questions_data
            
        except Exception as e:
            print(f"Error generating level-specific questions: {e}")
            return {"error": str(e)}

# Example usage
if __name__ == "__main__":
    classifier = JLPTClassifier()
    
    # Example Japanese text
    text = "私は毎日日本語を勉強しています。来年、日本に旅行に行きたいです。日本の文化にとても興味があります。"
    
    # Classify the text
    result = classifier.classify_text(text)
    print(f"Estimated JLPT Level: {result['estimated_jlpt_level']}")
    print("Grammar Points:")
    for point in result.get('grammar_points', []):
        print(f"- {point['pattern']} ({point['level']}): {point['explanation']}")
    
    # Extract grammar points
    grammar_points = classifier.extract_grammar_points(text, "N4")
    print("\nExtracted N4 Grammar Points:")
    for point in grammar_points:
        print(f"- {point['pattern']}: {point['explanation']}")
        print(f"  Example: {point['example']}")
    
    # Generate questions
    questions = classifier.suggest_questions_by_level(text, "N4", 2)
    print("\nGenerated Questions:")
    for i, question in enumerate(questions.get('questions', []), 1):
        print(f"Q{i}: {question.get('question')}")
        print(f"Options: {question.get('options')}")
        print(f"Answer: {question.get('answer')}")
        print(f"Explanation: {question.get('explanation')}")
