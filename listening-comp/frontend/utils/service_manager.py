import requests
import streamlit as st
from typing import Tuple, Optional

def check_backend_service(url: str) -> Tuple[bool, Optional[str]]:
    """Check backend service availability and return status and error message."""
    endpoints = ['/api/health', '/health', '/ping']
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{url}{endpoint}", timeout=3)
            if response.status_code == 200:
                return True, None
        except requests.ConnectionError:
            continue
        except Exception as e:
            return False, str(e)
    
    return False, "Could not connect to backend service"

def initialize_backend(force: bool = False) -> bool:
    """Initialize and verify backend connection."""
    if not force and st.session_state.get('backend_initialized', False):
        return st.session_state.get('backend_available', False)

    url = st.session_state.get('api_base_url', 'http://localhost:8000')
    available, error = check_backend_service(url)
    
    st.session_state.backend_available = available
    st.session_state.backend_error = error
    st.session_state.backend_initialized = True
    
    return available
