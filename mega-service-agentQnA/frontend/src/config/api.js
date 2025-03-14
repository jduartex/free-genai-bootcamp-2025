/**
 * Configuration for backend API endpoints
 * Adjust these settings based on your Docker setup
 */

// Base URL for the agent container
export const AGENT_BASE_URL = process.env.REACT_APP_AGENT_URL || 'http://localhost:8000';

// API endpoints based on the containerized minimal agent
export const API_ENDPOINTS = {
  chat: '/', // Root endpoint for chat functionality
  health: '/health', // May not be available in minimal agent
  query: '/', // Same as chat for minimal agent
};

// Format payload for different backends
export const formatPayload = (message, type = 'chat') => {
  // Default format for minimal agent container
  return { query: message };
  
  // Uncomment and adjust if using different container:
  /*
  switch(type) {
    case 'chat':
      return { message: message };
    case 'query':
      return { query: message };
    default:
      return { message: message };
  }
  */
};
