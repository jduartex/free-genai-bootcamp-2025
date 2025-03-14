import axios from 'axios';

/**
 * Utility function to check if the backend server is running
 * @returns {Promise<boolean>} True if backend is running
 */
export const isBackendRunning = async () => {
  try {
    await axios.get('http://localhost:8000/', { timeout: 2000 });
    return true;
  } catch (error) {
    console.error('Backend server check failed:', error.message);
    return false;
  }
};

/**
 * Gets the appropriate API URL based on environment
 * @param {string} endpoint - The API endpoint path (without leading slash)
 * @returns {string} The complete API URL
 */
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // In development, use the explicit backend URL
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:8000/${path}`;
  }
  
  // In production, assume API is on same origin
  return `/${path}`;
};
