#!/bin/bash

echo "=========================================================="
echo "MOCK API STATUS CHECKER"
echo "=========================================================="
echo "This script shows the current status of the Mock API container"

# Check container existence and status
echo "Container status:"
if docker ps | grep -q "crag-mock-api"; then
    echo "✅ RUNNING: Mock API container is running"
    docker ps --format "ID: {{.ID}} | Status: {{.Status}} | Ports: {{.Ports}}" | grep crag-mock-api
elif docker ps -a | grep -q "crag-mock-api"; then
    echo "❌ STOPPED: Mock API container exists but is not running"
    docker ps -a --format "ID: {{.ID}} | Status: {{.Status}} | Exited: {{.State}}" | grep crag-mock-api
else
    echo "❌ NOT FOUND: No Mock API container exists"
fi

# Get exit code and reason if stopped
if docker ps -a | grep -q "crag-mock-api" && ! docker ps | grep -q "crag-mock-api"; then
    echo ""
    echo "Exit information:"
    exit_code=$(docker inspect --format='{{.State.ExitCode}}' crag-mock-api 2>/dev/null)
    echo "Exit code: $exit_code"
    
    error=$(docker inspect --format='{{.State.Error}}' crag-mock-api 2>/dev/null)
    if [ -n "$error" ]; then
        echo "Error message: $error"
    else
        echo "No error message provided"
    fi
    
    oom=$(docker inspect --format='{{.State.OOMKilled}}' crag-mock-api 2>/dev/null)
    if [ "$oom" == "true" ]; then
        echo "⚠️ Container was killed due to out of memory (OOM)"
    fi
fi

# Check monitor log
echo ""
echo "Monitor log status:"
if [ -f "/tmp/mock_api_monitor.log" ]; then
    echo "Monitor log exists. Last 5 lines:"
    tail -5 /tmp/mock_api_monitor.log
else 
    echo "No monitor log found at /tmp/mock_api_monitor.log"
fi

# Show container logs if running
echo ""
echo "Container logs:"
if docker ps | grep -q "crag-mock-api"; then
    echo "Most recent log entries:"
    docker logs --tail 15 crag-mock-api 2>/dev/null
    
    # Check if the API is fully initialized
    if docker logs crag-mock-api 2>&1 | grep -q "Application startup complete"; then
        echo ""
        echo "✅ API is fully initialized and should be working"
    else
        echo ""
        echo "⚠️ API may still be initializing (initialization can take 5+ minutes)"
    fi
else
    echo "Container is not running, showing last logs before exit:"
    docker logs --tail 15 crag-mock-api 2>/dev/null || echo "No logs available"
fi

# Check Docker stats
echo ""
echo "Docker resources:"
docker stats crag-mock-api --no-stream --format "CPU: {{.CPUPerc}} | Memory: {{.MemUsage}} | Limit: {{.MemPerc}}" || echo "Cannot get stats - container may not be running"

echo ""
echo "ACTIONS YOU CAN TAKE:"
echo "1. Start stopped container: docker start crag-mock-api"
echo "2. Restart container: docker restart crag-mock-api" 
echo "3. View live logs: docker logs -f crag-mock-api"
echo "4. Fix crashed container: ./fix_mock_api_crashes.sh"
echo ""
