document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded with proper permissions policy and iframe sandboxing');
  
  // Add error handling for API requests
  const handleApiError = (endpoint, error) => {
    console.error(`Error with ${endpoint} API:`, error);
    document.getElementById('error-message')?.textContent = 
      `Failed to connect to ${endpoint}. Please try again later.`;
  };
  
  // Handle question generation
  const generateQuestions = async (videoId, level) => {
    try {
      const response = await fetch(`/api/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ video_id: videoId, jlpt_level: level })
      });
      
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (error) {
      handleApiError('question generation', error);
      return { questions: [] }; // Return empty questions array as fallback
    }
  };
  
  // Handle TTS synthesis
  const synthesizeSpeech = async (text, lang = 'ja') => {
    try {
      const response = await fetch(`/api/tts/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, language: lang })
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('TTS endpoint not found. Using browser TTS fallback.');
          useBrowserTTS(text, lang);
          return null;
        }
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      handleApiError('text-to-speech', error);
      useBrowserTTS(text, lang); // Use browser TTS as fallback
      return null;
    }
  };
  
  // Browser TTS fallback
  const useBrowserTTS = (text, lang) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Browser TTS not supported');
    }
  };

  // Add new functions for vector database interaction
  
  // Store transcript in vector database
  const storeTranscript = async (videoId, transcript, timestamp = 0, jlptLevel = 'N5') => {
    try {
      const response = await fetch(`/api/transcript/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_id: videoId,
          transcript: transcript,
          timestamp: timestamp,
          jlpt_level: jlptLevel
        })
      });
      
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (error) {
      handleApiError('transcript storage', error);
      return { success: false };
    }
  };
  
  // Search for similar transcripts
  const searchTranscripts = async (query, limit = 5) => {
    try {
      const response = await fetch(`/api/transcript/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, limit })
      });
      
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (error) {
      handleApiError('transcript search', error);
      return { success: false, results: [] };
    }
  };
  
  // Get all transcripts for a video
  const getVideoTranscripts = async (videoId) => {
    try {
      const response = await fetch(`/api/transcripts/${videoId}`);
      
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return await response.json();
    } catch (error) {
      handleApiError('transcript retrieval', error);
      return { success: false, transcripts: [] };
    }
  };
  
  // Make functions available globally
  window.appFunctions = {
    generateQuestions,
    synthesizeSpeech,
    storeTranscript,
    searchTranscripts,
    getVideoTranscripts
  };
});
