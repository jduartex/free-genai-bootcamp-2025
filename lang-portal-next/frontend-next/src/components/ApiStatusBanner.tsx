'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Renders a dismissable banner warning about API server unavailability.
 *
 * This component checks the API health endpoint immediately on mount and every 30 seconds thereafter.
 * When the health check fails within a 2000ms timeout, it displays a banner indicating that fallback data is used,
 * which may limit certain features. Users can dismiss the banner by clicking the provided dismiss button.
 *
 * @remarks
 * The API endpoint is derived from the environment variable NEXT_PUBLIC_API_URL (defaulting to '/api/health'),
 * and the component ensures proper cleanup by clearing the interval on unmount.
 */
export default function ApiStatusBanner() {
  const [isApiAvailable, setIsApiAvailable] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/health` || '/api/health', {
          timeout: 2000,
        });
        setIsApiAvailable(true);
        setIsVisible(false);
      } catch (error) {
        setIsApiAvailable(false);
        setIsVisible(true);
      }
    };
    
    // Check immediately
    checkApiStatus();
    
    // Then check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;
  
  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 fixed bottom-4 right-4 max-w-sm shadow-lg rounded z-50">
      <div className="flex items-center">
        <div className="py-1">
          <svg className="h-6 w-6 text-yellow-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="font-bold">API Server Unavailable</p>
          <p className="text-sm">
            Using fallback data. Some features may be limited.
          </p>
          <button 
            className="mt-2 px-2 py-1 bg-yellow-200 text-xs rounded hover:bg-yellow-300"
            onClick={() => setIsVisible(false)}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
