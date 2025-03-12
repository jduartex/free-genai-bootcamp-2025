import React, { useState } from 'react';
import { getLettersByCategory, getCategories } from '../utils/letterClassifier';

const FallbackDetection = ({ onLetterSelected }) => {
  const [activeLetter, setActiveLetter] = useState(null);
  const [activeCategory, setActiveCategory] = useState('vowel');
  
  const categories = getCategories();
  const letters = getLettersByCategory(activeCategory);
  
  const handleLetterClick = (letter) => {
    setActiveLetter(letter);
    onLetterSelected(letter, 0.95); // High confidence for manual selection
  };
  
  return (
    <div className="p-4">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Hand detection not available. Please select letters manually:
        </h3>
        
        {/* Category selector */}
        <div className="flex justify-center space-x-2 mb-4">
          {categories.map(category => (
            <button
              key={category}
              className={`px-4 py-2 rounded ${
                activeCategory === category 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}s
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        {letters.map(letter => (
          <button
            key={letter}
            className={`text-2xl font-bold w-14 h-14 rounded-lg ${
              activeLetter === letter 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => handleLetterClick(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FallbackDetection;
