import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import * as tf from '@tensorflow/tfjs';
import { recognizeLetter } from '../utils/letterClassifier';

// Hand connections to draw lines between landmarks
const HAND_CONNECTIONS = [
  // Thumb connections
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger connections
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger connections
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger connections
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky finger connections
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [0, 5], [5, 9], [9, 13], [13, 17]
];

// Colors for different parts of the hand
const LANDMARK_COLORS = {
  thumb: 'rgba(255, 0, 0, 0.8)',        // Red
  indexFinger: 'rgba(0, 255, 0, 0.8)',  // Green
  middleFinger: 'rgba(0, 0, 255, 0.8)', // Blue
  ringFinger: 'rgba(255, 255, 0, 0.8)', // Yellow
  pinky: 'rgba(255, 0, 255, 0.8)'       // Magenta
};

const CameraView = ({ onLetterRecognized, onError }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detectedLetter, setDetectedLetter] = useState(null);
  const lastDetectionRef = useRef({ letter: null, timestamp: 0 });
  
  // Debounce letter recognition to prevent flickering
  // with enhanced stability for a better user experience
  const debouncedLetterRecognition = useCallback((letter, confidence) => {
    const now = Date.now();
    const lastDetection = lastDetectionRef.current;
    
    // For stability, if a new letter is detected, require higher confidence
    // or consistent detection over time (debouncing)
    if (letter !== lastDetection.letter) {
      if (confidence > 0.80 || (confidence > 0.70 && now - lastDetection.timestamp > 500)) {
        setDetectedLetter({ letter, confidence });
        onLetterRecognized(letter, confidence);
        lastDetectionRef.current = { letter, timestamp: now };
      }
    } else {
      // Same letter as last time, update confidence and refresh timestamp
      setDetectedLetter({ letter, confidence });
      if (confidence > 0.65) {
        onLetterRecognized(letter, confidence);
      }
      lastDetectionRef.current = { letter, timestamp: now };
    }
  }, [onLetterRecognized]);

  // Get color for a connection based on the finger it belongs to
  const getConnectionColor = (connection) => {
    if (connection[0] === 0 || connection[1] === 0) return "rgba(255, 255, 255, 0.8)"; // Palm connection
    if (connection[0] <= 4 || connection[1] <= 4) return LANDMARK_COLORS.thumb;
    if (connection[0] <= 8 || connection[1] <= 8) return LANDMARK_COLORS.indexFinger;
    if (connection[0] <= 12 || connection[1] <= 12) return LANDMARK_COLORS.middleFinger;
    if (connection[0] <= 16 || connection[1] <= 16) return LANDMARK_COLORS.ringFinger;
    return LANDMARK_COLORS.pinky;
  };

  // Draw the hand landmarks and connections
  const drawHandLandmarks = useCallback((ctx, landmarks, width, height) => {
    // Draw connections first so they're under the points
    for (const connection of HAND_CONNECTIONS) {
      const start = landmarks[connection[0]];
      const end = landmarks[connection[1]];
      
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.strokeStyle = getConnectionColor(connection);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw landmarks
    for (let i = 0; i < landmarks.length; i++) {
      const landmark = landmarks[i];
      
      // Choose color based on landmark position
      let color = "white";
      if (i === 0) color = "white"; // Wrist
      else if (i <= 4) color = LANDMARK_COLORS.thumb;
      else if (i <= 8) color = LANDMARK_COLORS.indexFinger;
      else if (i <= 12) color = LANDMARK_COLORS.middleFinger;
      else if (i <= 16) color = LANDMARK_COLORS.ringFinger;
      else color = LANDMARK_COLORS.pinky;
      
      // Draw the landmark point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        landmark.x * width,
        landmark.y * height,
        i === 0 ? 8 : 5, // Bigger circle for the wrist
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      // Add a black outline for better visibility
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, []);

  // Handle the results from MediaPipe
  const handleHandResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear the canvas and draw the video
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw the hand landmarks and connections
      drawHandLandmarks(ctx, landmarks, canvas.width, canvas.height);
      
      // Recognize letter based on hand position
      const { letter, confidence } = recognizeLetter(landmarks);
      if (letter) {
        debouncedLetterRecognition(letter, confidence);
        
        // Show the detected letter on the canvas
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        ctx.strokeText(`${letter} (${Math.round(confidence * 100)}%)`, canvas.width / 2, 50);
        ctx.fillText(`${letter} (${Math.round(confidence * 100)}%)`, canvas.width / 2, 50);
      }
    } else {
      // If no hand is detected, clear the detected letter after a delay
      if (detectedLetter && Date.now() - lastDetectionRef.current.timestamp > 1000) {
        setDetectedLetter(null);
        lastDetectionRef.current = { letter: null, timestamp: Date.now() };
      }
    }
  }, [drawHandLandmarks, debouncedLetterRecognition, detectedLetter]);

  // Initialize the camera and hand detection
  useEffect(() => {
    let handDetection;
    let animationFrameId;
    const videoElement = videoRef.current;
    
    const initializeCamera = async () => {
      try {
        // Load TensorFlow.js model
        await tf.ready();
        
        // Set up camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setIsLoading(false);
          };
        }
        
        // Create MediaPipe Hands instance
        handDetection = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
          }
        });
        
        handDetection.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // Wait for MediaPipe to load
        await handDetection.initialize();
        
        handDetection.onResults(handleHandResults);
        
        // Start detection loop
        if (videoRef.current) {
          const detectHands = async () => {
            try {
              if (videoRef.current && videoRef.current.readyState === 4) {
                await handDetection.send({ image: videoRef.current });
              }
              animationFrameId = requestAnimationFrame(detectHands);
            } catch (err) {
              console.error("Hand detection error:", err);
              animationFrameId = requestAnimationFrame(detectHands);
            }
          };
          detectHands();
        }
      } catch (err) {
        const errorMessage = `Error: ${err.message}. Please try refreshing the page.`;
        setError(errorMessage);
        console.error("Initialization error:", err);
        setIsLoading(false);
        
        // Notify the parent component about the error
        if (onError) {
          onError(errorMessage);
        }
      }
    };
    
    // Add a small delay before initializing
    const timeoutId = setTimeout(() => {
      initializeCamera();
    }, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (handDetection) {
        handDetection.close();
      }
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [handleHandResults, onError]);
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-700">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
            <p>Initializing camera...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 text-center">
          <div>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-md shadow-inner"
      />
      
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 text-xs rounded-md flex items-center">
        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
        Camera active
      </div>
    </div>
  );
};

export default CameraView;
