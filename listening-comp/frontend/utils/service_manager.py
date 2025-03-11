import requests
import streamlit as st
from typing import Optional, List, Dict, Any, Union
import logging
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default endpoints to try in order if the configured one fails
FALLBACK_ENDPOINTS = ["/api/health", "/health", "/", "/api", "/status"]

def check_backend_service(base_url: str, health_endpoint: str = "/api/health") -> Dict[str, Any]:
    """
    Check if backend service is available.
    
    Args:
        base_url: Base URL of the backend service
        health_endpoint: Health check endpoint path
        
    Returns:
        Dict with status information
    """
    url = f"{base_url.rstrip('/')}{health_endpoint}"
    try:
        logger.info(f"Checking backend health at: {url}")
        response = requests.get(url, timeout=5)
        response.raise_for_status()  # Raise an exception for 4XX/5XX responses
        return {
            "available": True,
            "status_code": response.status_code,
            "message": "Service is available"
        }
    except requests.exceptions.RequestException as e:
        logger.error(f"Backend health check failed: {str(e)}")
        return {
            "available": False,
            "status_code": getattr(e.response, "status_code", None) if hasattr(e, "response") else None,
            "error": str(e),
            "message": "Service is unavailable"
        }

def try_fallback_endpoints(base_url: str, endpoints: List[str]) -> Dict[str, Any]:
    """Try multiple health endpoints until one succeeds."""
    for endpoint in endpoints:
        result = check_backend_service(base_url, endpoint)
        if result["available"]:
            # Store the working endpoint for future use
            st.session_state.health_endpoint = endpoint
            return result
    return result  # Return the last failed result

def initialize_backend(force: bool = False) -> bool:
    """
    Initialize backend connection and store state.
    
    Args:
        force: Force re-initialization even if already initialized
        
    Returns:
        bool: True if backend is available, False otherwise
    """
    # Skip if already initialized and not forced
    if not force and st.session_state.get('backend_initialized', False):
        return st.session_state.get('backend_available', False)
    
    # Initialize default values if not present
    if 'api_base_url' not in st.session_state:
        st.session_state.api_base_url = 'http://localhost:8000'
    
    if 'health_endpoint' not in st.session_state:
        st.session_state.health_endpoint = '/api/health'
        
    # Get the configured health endpoint
    health_endpoint = st.session_state.get('health_endpoint')
    base_url = st.session_state.api_base_url
    
    # First try the configured endpoint
    result = check_backend_service(base_url, health_endpoint)
    
    # If configured endpoint fails but backend is running, try fallback endpoints
    if not result["available"] and "404 Not Found" in str(result.get("error", "")):
        # Server is running but endpoint is not found - try alternatives
        logger.info("Trying fallback health endpoints")
        result = try_fallback_endpoints(base_url, FALLBACK_ENDPOINTS)
    
    # Store results in session state
    st.session_state.backend_available = result["available"]
    st.session_state.backend_status = result.get("status_code")
    st.session_state.backend_error = result.get("error", None)
    st.session_state.backend_initialized = True
    
    # Manual override option
    if not result["available"] and st.session_state.get("manual_override", False):
        st.session_state.backend_available = True
        logger.warning("Backend availability manually overridden")
    
    return st.session_state.backend_available
