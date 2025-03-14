#!/bin/bash

# Enable verbose output for debugging
set -x

echo "=========================================================="
echo "MOCK API CRASH RESOLVER"
echo "=========================================================="
echo "This script will fix the crashing Mock API container"

# Check if the script was called in status check mode
if [[ "$1" == *"status"* ]]; then
    echo "Running in status check mode..."
    echo "Detailed container status:"
    docker ps -a | grep crag-mock-api || echo "No container found"
    
    echo ""
    echo "Container details:"
    docker inspect crag-mock-api 2>/dev/null || echo "Cannot inspect container - it may not exist"
    
    echo ""
    echo "Last 20 log lines:"
    docker logs --tail 20 crag-mock-api 2>/dev/null || echo "Cannot retrieve logs - container may not exist or logs may be empty"
    
    echo ""
    echo "Docker daemon status:"
    docker info | grep -E "Containers:|Running:|Paused:|Stopped:" || echo "Cannot retrieve Docker info"
    
    echo ""
    echo "Docker disk usage:"
    docker system df || echo "Cannot retrieve Docker disk usage"
    
    echo ""
    echo "System resources:"
    echo "Memory:"
    free -h || echo "free command not available"
    echo "Disk:"
    df -h || echo "df command not available"
    
    # Exit after displaying status
    exit 0
fi

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

echo "Docker version:"
docker --version || echo "Cannot retrieve Docker version"

# Function to check container status - enhanced with full output
check_container() {
    echo "Checking container status with 'docker ps'..."
    docker ps | grep crag-mock-api
    local running=$?
    
    echo "Checking all containers with 'docker ps -a'..."
    docker ps -a | grep crag-mock-api
    local exists=$?
    
    if [ $running -eq 0 ]; then
        echo "✅ Mock API container is currently running"
        return 0
    elif [ $exists -eq 0 ]; then
        echo "⚠️ Mock API container exists but is not running"
        return 1
    else
        echo "❌ Mock API container does not exist"
        return 2
    fi
}

# Function to check container logs for error pattern
check_logs_for_errors() {
    echo "Checking container logs for error patterns..."
    
    echo "Retrieving logs with 'docker logs'..."
    docker logs crag-mock-api >/tmp/crag_logs.txt 2>&1 || echo "Failed to retrieve logs"
    
    if grep -q "out of memory" /tmp/crag_logs.txt; then
        echo "❌ Container stopped due to memory issues"
        return 1
    elif grep -q "Killed" /tmp/crag_logs.txt; then
        echo "❌ Container was killed by the system (likely OOM)"
        return 2
    elif grep -q "exited with code" /tmp/crag_logs.txt; then
        echo "❌ Container exited with an error code"
        return 3
    else
        echo "⚠️ No specific error pattern found in logs"
        echo "Last 10 lines of logs:"
        tail -10 /tmp/crag_logs.txt
        return 0
    fi
}

# Function to get container exit code and reason
get_exit_info() {
    echo "Getting container details with 'docker inspect'..."
    
    # Get the exit code
    local exit_code=$(docker inspect --format='{{.State.ExitCode}}' crag-mock-api 2>/dev/null)
    if [ -z "$exit_code" ]; then
        echo "⚠️ Could not get exit code - container may not exist"
    else
        echo "Container exit code: $exit_code"
    fi
    
    # Get the error message if available
    local error=$(docker inspect --format='{{.State.Error}}' crag-mock-api 2>/dev/null)
    if [ -n "$error" ]; then
        echo "Error message: $error"
    fi
    
    # Check OOM status
    local oom=$(docker inspect --format='{{.State.OOMKilled}}' crag-mock-api 2>/dev/null)
    if [ "$oom" == "true" ]; then
        echo "❌ Container was killed due to out of memory (OOM)"
    fi
    
    # Get container status
    local status=$(docker inspect --format='{{.State.Status}}' crag-mock-api 2>/dev/null)
    echo "Container status: $status"
}

# Create a dedicated network if it doesn't exist
echo "Creating a dedicated Docker network..."
docker network create agentqna-network 2>/dev/null || true

# Check if API container is running or exists
check_container
container_status=$?

if [ $container_status -eq 0 ]; then
    echo "Mock API container is already running. Monitoring for stability..."
    echo "Container details:"
    docker inspect --format='{{.State.Status}} | Started: {{.State.StartedAt}}' crag-mock-api
elif [ $container_status -eq 1 ]; then
    echo "Found stopped Mock API container. Checking exit reason..."
    get_exit_info
    check_logs_for_errors
    
    echo "Removing crashed container..."
    docker rm crag-mock-api || echo "Failed to remove container"
    container_status=2  # Set to not exist so we recreate it
fi

if [ $container_status -eq 2 ]; then
    echo "Creating new Mock API container with improved stability settings..."
    
    # Check available system memory before starting
    echo "Checking available system memory..."
    free -h || echo "free command not available"
    
    echo "Executing docker run command..."
    docker run -d \
        --name crag-mock-api \
        --network agentqna-network \
        -p 8080:8000 \
        --memory=2g \
        --restart=on-failure:5 \
        docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
    
    run_status=$?
    if [ $run_status -ne 0 ]; then
        echo "❌ Failed to start Mock API container (exit code: $run_status)"
        
        echo "Trying alternate approach without memory limit..."
        docker run -d \
            --name crag-mock-api \
            --network agentqna-network \
            -p 8080:8000 \
            --restart=on-failure:5 \
            docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
            
        if [ $? -ne 0 ]; then
            echo "❌ Still failed to start container. Your system might not have enough resources."
            exit 1
        else
            echo "✅ Container started without memory limit"
        fi
    else
        echo "✅ Created new container with crash recovery settings"
    fi
    
    echo "Container status after creation:"
    docker ps | grep crag-mock-api || echo "Container not visible in docker ps"
fi

# Create a monitoring script that will run in the background
MONITOR_SCRIPT=$(mktemp)
echo "Creating monitoring script at $MONITOR_SCRIPT"
cat > $MONITOR_SCRIPT << 'EOL'
#!/bin/bash

# This script monitors the crag-mock-api container and restarts it if it crashes
CONTAINER="crag-mock-api"
LOG_FILE="/tmp/mock_api_monitor.log"

echo "Starting monitor for $CONTAINER at $(date)" >> "$LOG_FILE"

while true; do
    if ! docker ps | grep -q "$CONTAINER"; then
        echo "Container $CONTAINER is not running at $(date). Attempting to restart..." >> "$LOG_FILE"
        
        # Check if it exists but is stopped
        if docker ps -a | grep -q "$CONTAINER"; then
            exit_code=$(docker inspect --format='{{.State.ExitCode}}' "$CONTAINER")
            echo "Container exit code: $exit_code" >> "$LOG_FILE"
            
            # Start the container again
            docker start "$CONTAINER" >> "$LOG_FILE" 2>&1
            restart_result=$?
            echo "Restart attempt completed at $(date) with result $restart_result" >> "$LOG_FILE"
            
            if [ $restart_result -ne 0 ]; then
                echo "Failed to restart container. It might be corrupted." >> "$LOG_FILE"
                echo "Attempting to recreate container..." >> "$LOG_FILE"
                
                # Remove and recreate
                docker rm "$CONTAINER" >> "$LOG_FILE" 2>&1
                docker run -d \
                    --name "$CONTAINER" \
                    --network agentqna-network \
                    -p 8080:8000 \
                    --restart=on-failure:5 \
                    docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0 >> "$LOG_FILE" 2>&1
                
                echo "Container recreation attempt completed at $(date)" >> "$LOG_FILE"
            fi
        else
            echo "Container $CONTAINER no longer exists! Recreation needed." >> "$LOG_FILE"
            
            # Create new container
            docker run -d \
                --name "$CONTAINER" \
                --network agentqna-network \
                -p 8080:8000 \
                --restart=on-failure:5 \
                docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0 >> "$LOG_FILE" 2>&1
                
            echo "Container creation attempt completed at $(date)" >> "$LOG_FILE"
        fi
    fi
    
    # Check every 10 seconds
    sleep 10
done
EOL

chmod +x $MONITOR_SCRIPT

echo "Starting monitor script to keep the API container running..."
nohup $MONITOR_SCRIPT > /dev/null 2>&1 &
MONITOR_PID=$!

echo "✅ Monitor started with PID $MONITOR_PID"
echo "The monitor will continuously check if the container is running and restart it if needed."

# Show the current status of the container
echo ""
echo "===== CURRENT CONTAINER STATUS ====="
docker ps --format "{{.ID}} | {{.Names}} | {{.Status}} | {{.Ports}}" | grep crag-mock-api || echo "Container not found in running containers"
echo ""

# Create a status-only script for future use
STATUS_SCRIPT="/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA/check_mock_api_status.sh"
echo "Creating a dedicated status check script at $STATUS_SCRIPT"
cat > "$STATUS_SCRIPT" << 'EOL'
#!/bin/bash

echo "Mock API Container Status:"
docker ps -a | grep crag-mock-api || echo "No container found"

echo "Monitor log file contents:"
cat /tmp/mock_api_monitor.log 2>/dev/null || echo "No monitor log file found"

echo "Last 10 container log lines:"
docker logs --tail 10 crag-mock-api 2>/dev/null || echo "No container logs available"
EOL

chmod +x "$STATUS_SCRIPT"

echo ""
echo "IMPORTANT: The Mock API needs time to initialize. Wait at least 5 minutes before trying to use it."
echo ""
echo "Showing the API container logs to track initialization progress:"
docker logs --tail 10 crag-mock-api 2>/dev/null || echo "No logs available yet"

echo ""
echo "To monitor initialization progress: docker logs -f crag-mock-api"
echo "To check container status: $STATUS_SCRIPT"
echo "To stop the monitor script later: pkill -f $(basename $MONITOR_SCRIPT)"
echo ""
echo "If the container continues to crash, it may indicate that your system lacks sufficient"
echo "resources to run the Mock API. Consider using the minimal agent without the Mock API,"
echo "or allocating more resources to Docker."

# Disable verbose output
set +x

# Final status check
echo ""
echo "Final container status:"
docker ps | grep crag-mock-api || echo "Container not running"
