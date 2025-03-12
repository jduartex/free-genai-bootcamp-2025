import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import * as tf from '@tensorflow/tfjs';
import { recognizeVowel } from '../utils/vowelClassifier';

const CameraView = ({ onVowelRecognized }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize the handleHandResults function to prevent re-creation on every render
  const handleHandResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Draw hand landmarks
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections
        for (let i = 0; i < landmarks.length; i++) {
          const landmark = landmarks[i];
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        // Recognize vowel based on hand position
        const { vowel, confidence } = recognizeVowel(landmarks);
        if (vowel && confidence > 0.7) {
          onVowelRecognized(vowel, confidence);
        }
      }
    } else {
      // Just show the video feed when no hands are detected
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  }, [onVowelRecognized]);

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
        
        // Create a simpler version using direct MediaPipe configurations
        handDetection = new Hands({
          locateFile: (file) => {
            // Important: Make sure all the files have exact matching URLs on CDN
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
        
        // Start detection loop after initialization is complete
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
        setError(`Error: ${err.message}. Please try refreshing the page.`);
        console.error("Initialization error:", err);
        setIsLoading(false);
      }
    };
    
    // Start initialization with a short delay to ensure component mounting
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
  }, [handleHandResults]);
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-700">
          <p>Initializing camera...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 p-4 text-center">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
      />
      
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 text-xs rounded">
        Camera active
      </div>
    </div>
  );
};

export default CameraView;
