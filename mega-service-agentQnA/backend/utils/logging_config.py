import os
import logging
from logging.handlers import RotatingFileHandler
import sys
from pathlib import Path

# Create logs directory if it doesn't exist
logs_dir = Path(__file__).parents[2] / "logs"
logs_dir.mkdir(exist_ok=True)

# Default log level
DEFAULT_LOG_LEVEL = "INFO"

def get_log_level():
    """Get log level from environment variable or use default"""
    log_level_str = os.environ.get("LOG_LEVEL", DEFAULT_LOG_LEVEL).upper()
    return getattr(logging, log_level_str, logging.INFO)

def setup_logger(name, log_file, level=None, format_string=None):
    """Set up a logger that logs to both file and console"""
    if level is None:
        level = get_log_level()
    
    if format_string is None:
        format_string = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Create formatter
    formatter = logging.Formatter(format_string)
    
    # Create file handler
    file_path = logs_dir / log_file
    file_handler = RotatingFileHandler(
        file_path, 
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Get logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Add handlers if not already added
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger

# Create default loggers
agent_logger = setup_logger('agent', 'agent_activity.log')
error_logger = setup_logger('error', 'agent_errors.log')
api_logger = setup_logger('api', 'api_requests.log')
performance_logger = setup_logger('performance', 'performance.log')

def get_agent_logger():
    return agent_logger

def get_error_logger():
    return error_logger

def get_api_logger():
    return api_logger

def get_performance_logger():
    return performance_logger
