#!/bin/bash

# Make sure script is executable when created
chmod +x "$(dirname "$0")/test_logging.sh"

echo "Testing AgentQnA logging functionality..."

# Define the path to the logs directory
LOGS_DIR="../logs"
PROJECT_ROOT=$(dirname $(dirname "$0"))
PYTHON_PATH="$PROJECT_ROOT"

# Ensure logs directory exists
mkdir -p "$PROJECT_ROOT/logs"

# Create a temporary Python script to test logging
TEST_SCRIPT="$PROJECT_ROOT/scripts/temp_log_test.py"

cat > "$TEST_SCRIPT" << 'EOL'
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the logging utilities
from backend.utils.logging_config import (
    get_agent_logger,
    get_error_logger,
    get_api_logger,
    get_performance_logger
)

def test_logging():
    """Function to test all loggers"""
    print("Testing AgentQnA loggers...")
    
    # Get all loggers
    agent_log = get_agent_logger()
    error_log = get_error_logger()
    api_log = get_api_logger()
    perf_log = get_performance_logger()
    
    # Log test messages
    agent_log.debug("Debug agent message")
    agent_log.info("Info agent message")
    agent_log.warning("Warning agent message")
    
    error_log.error("Test error message")
    error_log.critical("Critical error test message")
    
    api_log.info("API request test: GET /api/query")
    api_log.info("API response test: 200 OK")
    
    perf_log.info("Performance test: Query processing time: 0.45s")
    
    print("Logging test completed. Check the logs directory for log files.")

if __name__ == "__main__":
    test_logging()
EOL

# Execute the test script
echo "Executing logging test script..."
python "$TEST_SCRIPT"

# Check if log files were created
echo "Checking log files..."
for log_file in agent_activity.log agent_errors.log api_requests.log performance.log; do
    LOG_PATH="$PROJECT_ROOT/logs/$log_file"
    if [ -f "$LOG_PATH" ]; then
        echo "✓ $log_file created successfully"
        echo "  Last few lines:"
        tail -n 3 "$LOG_PATH"
        echo ""
    else
        echo "✗ $log_file was not created"
    fi
done

# Clean up the temporary test script
rm "$TEST_SCRIPT"

echo "Logging test complete."
