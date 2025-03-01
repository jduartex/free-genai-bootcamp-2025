import re
import asyncio
from typing import List, Dict, Any, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptAvailable
import langdetect

class YouTubeTranscriptFetcher:
    """
    Fetches and processes Japanese transcripts from YouTube videos
    """
    
    def __init__(self):
        self.transcript_cache = {}  # Simple in-memory cache
    
    async def fetch_transcript(self, video_id: str, language_code: str = 'ja') -> Dict[str, Any]:
        """
        Fetch transcript for a YouTube video, prioritizing Japanese language
        
        Args:
            video_id: The YouTube video ID
            language_code: Preferred language code (default: 'ja' for Japanese)
            
        Returns:
            Dictionary with transcript data and metadata
        """
        # Check cache first
        cache_key = f"{video_id}:{language_code}"
        if cache_key in self.transcript_cache:
            return self.transcript_cache[cache_key]
        
        try:
            # First try to get transcript in the specified language
            transcript_list = await asyncio.to_thread(
                YouTubeTranscriptApi.list_transcripts,
                video_id
            )
            
            # Try to get Japanese transcript first
            try:
                transcript = await asyncio.to_thread(
                    transcript_list.find_transcript, 
                    [language_code]
                )
            except NoTranscriptAvailable:
                # Fall back to any available transcript
                transcript = transcript_list.find_generated_transcript(['ja', 'en', 'auto'])
            
            # Fetch the actual transcript data
            transcript_data = await asyncio.to_thread(transcript.fetch)
            
            # Process the transcript
            processed_transcript = await self._process_transcript(transcript_data)
            
            # Add metadata
            result = {
                'video_id': video_id,
                'language': transcript.language,
                'language_code': transcript.language_code,
                'is_generated': transcript.is_generated,
                'processed_transcript': processed_transcript,
                'raw_transcript': transcript_data
            }
            
            # Cache the result
            self.transcript_cache[cache_key] = result
            
            return result
            
        except (TranscriptsDisabled, NoTranscriptAvailable) as e:
            raise Exception(f"No transcript available for video {video_id}: {str(e)}")
        except Exception as e:
            raise Exception(f"Error fetching transcript: {str(e)}")
    
    async def _process_transcript(self, transcript_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process raw transcript data to make it more suitable for Japanese language learning
        
        Args:
            transcript_data: Raw transcript data from YouTube API
            
        Returns:
            Processed transcript with full text and segments
        """
        # Extract text and create segments with proper timestamps
        full_text = ""
        segments = []
        
        for i, item in enumerate(transcript_data):
            text = item.get('text', '')
            
            # Clean up text: remove special characters but keep Japanese punctuation
            text = re.sub(r'[\u2000-\u206F]', '', text)  # Remove Unicode formatting chars
            text = re.sub(r'[[#*_]', '', text)  # Remove markdown-like formatting
            
            # Skip segments that are likely not Japanese (music notes, sound effects)
            if re.match(r'^\[.*\]$', text) or text.strip() == '':
                continue
                
            # Detect if the segment is likely Japanese
            try:
                if len(text) > 3:  # Only check longer segments
                    lang = langdetect.detect(text)
                    if lang != 'ja' and language_code == 'ja':
                        # Mark non-Japanese segments for review
                        text = f"[Non-Japanese: {text}]"
            except:
                pass  # If language detection fails, keep the text as is
            
            start = item.get('start', 0)
            duration = item.get('duration', 0)
            
            segment = {
                'id': i,
                'start': start,
                'end': start + duration,
                'text': text
            }
            
            segments.append(segment)
            full_text += text + " "
        
        # Create sentence-level segments for better learning experience
        sentence_segments = await self._create_sentence_segments(segments)
        
        return {
            'full_text': full_text.strip(),
            'segments': segments,
            'sentence_segments': sentence_segments
        }
    
    async def _create_sentence_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Create sentence-level segments from word/phrase level segments
        
        This helps create more natural learning units based on complete sentences
        """
        sentence_segments = []
        current_sentence = ""
        current_start = 0
        sentence_id = 0
        
        # Japanese sentence-ending punctuation
        sentence_endings = ['。', '！', '？', '…']
        
        for segment in segments:
            text = segment['text']
            
            if not current_sentence:
                current_start = segment['start']
                
            current_sentence += text + " "
            
            # Check if this segment ends with sentence-ending punctuation
            if any(text.endswith(ending) for ending in sentence_endings):
                sentence_segments.append({
                    'id': sentence_id,
                    'start': current_start,
                    'end': segment['end'],
                    'text': current_sentence.strip()
                })
                sentence_id += 1
                current_sentence = ""
        
        # Add any remaining text as a segment
        if current_sentence.strip():
            sentence_segments.append({
                'id': sentence_id,
                'start': current_start,
                'end': segments[-1]['end'] if segments else 0,
                'text': current_sentence.strip()
            })
        
        return sentence_segments
