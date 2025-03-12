import React, { useState, useEffect } from 'react';
import CameraView from './components/CameraView';
import ResultDisplay from './components/ResultDisplay';
import FallbackDetection from './components/FallbackDetection';

function App() {
  const [recognizedVowel, setRecognizedVowel] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [useFallback, setUseFallback] = useState(false);
  
  const handleVowelRecognized = (vowel, confidenceScore) => {
    setRecognizedVowel(vowel);
    setAccuracy(confidenceScore * 100);
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
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600">LSE Finger Spelling Recognition</h1>
        <p className="text-gray-600">Show vowels (A, E, I, O, U) using Spanish Sign Language</p>
      </header>
      
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
        {useFallback ? (
          <FallbackDetection onVowelSelected={handleVowelRecognized} />
        ) : (
          <CameraView 
            onVowelRecognized={handleVowelRecognized} 
            onError={() => setUseFallback(true)}
          />
        )}
      </div>
      
      <ResultDisplay vowel={recognizedVowel} accuracy={accuracy} />
      
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>All processing is done locally on your device. No data is sent to any server.</p>
      </footer>
    </div>
  );
}

export default App;
