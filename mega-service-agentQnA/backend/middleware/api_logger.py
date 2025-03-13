import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from backend.utils import get_api_logger, get_performance_logger

class APILoggerMiddleware(BaseHTTPMiddleware):
    """Middleware for logging API requests and responses"""
    
    async def dispatch(self, request: Request, call_next):
        # Get the API logger
        api_logger = get_api_logger()
        perf_logger = get_performance_logger()
        
        # Record request start time
        start_time = time.time()
        
        # Log the request
        api_logger.info(f"Request: {request.method} {request.url.path}")
        
        # Process the request
        try:
            response = await call_next(request)
            
            # Calculate request processing time
            process_time = time.time() - start_time
            
            # Log the response
            api_logger.info(f"Response: {request.method} {request.url.path} - Status: {response.status_code}")
            perf_logger.info(f"Request processing time: {request.method} {request.url.path} - {process_time:.4f}s")
            
            return response
        except Exception as e:
            # Log any exceptions
            error_logger = get_error_logger()
            error_logger.error(f"Error processing request {request.method} {request.url.path}: {str(e)}")
            raise
