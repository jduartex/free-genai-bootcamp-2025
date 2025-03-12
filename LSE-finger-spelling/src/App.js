import React, { useState, useEffect } from 'react';
import CameraView from './components/CameraView';
import ResultDisplay from './components/ResultDisplay';
import FallbackDetection from './components/FallbackDetection';
import LetterDisplay from './components/LetterDisplay';

function App() {
  const [recognizedLetter, setRecognizedLetter] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  const [letterHistory, setLetterHistory] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [words, setWords] = useState([]);
  
  const handleLetterRecognized = (letter, confidenceScore) => {
    setRecognizedLetter(letter);
    setAccuracy(confidenceScore * 100);
    
    // Add to history if it's a stable detection (high confidence)
    if (confidenceScore > 0.75 && 
        (letterHistory.length === 0 || 
         letterHistory[letterHistory.length - 1].letter !== letter)) {
      setLetterHistory(prev => [...prev, { letter, timestamp: Date.now() }]);
      
      // Add to current word
      setCurrentWord(prev => prev + letter);
    }
  };
  
  // Add a space to separate words
  const handleAddSpace = () => {
    if (currentWord.trim()) {
      setWords(prev => [...prev, currentWord.trim()]);
      setCurrentWord('');
    }
  };
  
  // Clear the current input
  const handleClear = () => {
    setLetterHistory([]);
    setCurrentWord('');
  };
  
  // If MediaPipe fails to load after 10 seconds, show the fallback UI
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if we have MediaPipe errors in console
      const errors = document.querySelectorAll('.text-red-700');
      if (errors.length > 0) {
        setUseFallback(true);
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <header className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-blue-600">LSE Finger Spelling Recognition</h1>
        <p className="text-gray-600">Show letters using Spanish Sign Language</p>
      </header>
      
      {/* Current letter being detected */}
      <LetterDisplay letter={recognizedLetter} accuracy={accuracy} />
      
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden mb-4">
        {useFallback ? (
          <FallbackDetection onLetterSelected={handleLetterRecognized} />
        ) : (
          <CameraView 
            onLetterRecognized={handleLetterRecognized} 
            onError={() => setUseFallback(true)}
          />
        )}
      </div>
      
      {/* Current word being formed */}
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-700">Current Spelling:</h2>
          <div className="space-x-2">
            <button 
              onClick={handleAddSpace} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Space
            </button>
            <button 
              onClick={handleClear} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="mt-2 p-3 bg-gray-100 rounded min-h-12 text-2xl">
          <span className="font-mono tracking-wide">{currentWord}</span>
          <span className="animate-blink text-gray-400">|</span>
        </div>
      </div>
      
      {/* Previously formed words */}
      {words.length > 0 && (
        <div className="w-full max-w-3xl bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-700 mb-2">Message:</h2>
          <div className="p-3 bg-gray-100 rounded min-h-12 text-xl">
            {words.join(' ')}
          </div>
        </div>
      )}
      
      {/* Recent letter history for reference */}
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-4 mb-4 overflow-hidden">
        <h2 className="text-lg font-medium text-gray-700 mb-2">Recent Letters:</h2>
        <div className="flex space-x-2 overflow-x-auto py-2">
          {letterHistory.slice(-10).map((item, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700"
            >
              {item.letter}
            </div>
          ))}
          {letterHistory.length === 0 && (
            <p className="text-gray-400 italic">No letters detected yet</p>
          )}
        </div>
      </div>
      
      <ResultDisplay />
      
      <footer className="mt-4 text-center text-sm text-gray-500">
        <p>All processing is done locally on your device. No data is sent to any server.</p>
      </footer>
    </div>
  );
}

export default App;
