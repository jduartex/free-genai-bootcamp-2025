import React, { useEffect, useState } from 'react';

const LetterDisplay = ({ letter, accuracy }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Add animation effect when letter changes
  useEffect(() => {
    if (letter) {
      setShowAnimation(true);
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [letter]);

  if (!letter) {
    return (
      <div className="w-full max-w-3xl mb-4 flex justify-center">
        <div className="bg-gray-200 rounded-full px-8 py-2 text-gray-500 text-lg font-medium">
          Make a sign to detect a letter
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mb-4 flex justify-center">
      <div className={`
        bg-blue-600 text-white 
        rounded-full px-8 py-2 
        flex items-center 
        shadow-lg
        ${showAnimation ? 'animate-pulse' : ''}
      `}>
        <span className="text-3xl font-bold">{letter}</span>
        <div className="ml-4 bg-white/20 rounded-full px-3 py-1">
          {Math.round(accuracy)}%
        </div>
      </div>
    </div>
  );
};

export default LetterDisplay;
