import React from 'react';

const ResultDisplay = ({ vowel, accuracy }) => {
  return (
    <div className="mt-8 text-center">
      <h2 className="text-xl text-gray-700 mb-2">Recognized Vowel:</h2>
      
      {vowel ? (
        <div className="flex flex-col items-center">
          <div className="text-8xl font-bold text-blue-600 mb-4">{vowel}</div>
          <div className="flex items-center">
            <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full" 
                style={{ width: `${accuracy}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-600">{Math.round(accuracy)}%</span>
          </div>
        </div>
      ) : (
        <div className="text-2xl text-gray-400">
          Show your hand making an LSE vowel sign
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
