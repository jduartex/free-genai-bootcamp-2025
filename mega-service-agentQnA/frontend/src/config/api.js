/**
 * Configuration for backend API endpoints
 * Updated for the full agent setup
 */

// Base URL for the agent container
export const AGENT_BASE_URL = process.env.REACT_APP_AGENT_URL || 'http://localhost:8000';

// API endpoints based on the full agent service
export const API_ENDPOINTS = {
  chat: '/api/chat',    // Full agent uses standard REST endpoint
  health: '/health',    // Health check endpoint
  query: '/api/query',  // Query endpoint for document questions
  upload: '/api/upload' // Upload endpoint for documents
};

// Format payload for the full agent
export const formatPayload = (message, type = 'chat') => {
  switch(type) {
    case 'chat':
      return { messages: [{ role: 'user', content: message }] };
    case 'query':
      return { query: message };
    default:
      return { message: message };
  }
};
