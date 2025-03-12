import React, { useState } from 'react';

const FallbackDetection = ({ onVowelSelected }) => {
  const [activeVowel, setActiveVowel] = useState(null);
  
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  
  const handleVowelClick = (vowel) => {
    setActiveVowel(vowel);
    onVowelSelected(vowel, 0.95); // High confidence for manual selection
  };
  
  return (
    <div className="p-4">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium text-gray-700">
          Hand detection not available. Please select vowels manually:
        </h3>
      </div>
      
      <div className="flex justify-center space-x-4">
        {vowels.map(vowel => (
          <button
            key={vowel}
            className={`text-2xl font-bold py-4 px-6 rounded-lg ${
              activeVowel === vowel 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handleVowelClick(vowel)}
          >
            {vowel}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FallbackDetection;
