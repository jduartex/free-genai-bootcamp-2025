#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'
BOLD='\033[1m'

clear
echo -e "${BOLD}=========================================================="
echo -e "              AGENTQNA CONTAINER DASHBOARD"
echo -e "==========================================================${NC}"

# Check if both containers are running
echo -e "\n${BOLD}CONTAINER STATUS${NC}"
echo -e "------------------------------------------------------------"

# Check minimal-agent
if docker ps | grep -q "minimal-agent"; then
    echo -e "${GREEN}✅ MINIMAL AGENT:${NC} Running"
    MINIMAL_AGENT_UPTIME=$(docker ps --format "{{.Status}}" | grep minimal-agent)
    MINIMAL_AGENT_ID=$(docker ps --format "{{.ID}}" | grep minimal-agent)
    echo -e "   ID: $MINIMAL_AGENT_ID"
    echo -e "   Status: $MINIMAL_AGENT_UPTIME"
    echo -e "   Access at: ${BLUE}http://localhost:8000${NC}"
else
    echo -e "${RED}❌ MINIMAL AGENT:${NC} Not running"
    if docker ps -a | grep -q "minimal-agent"; then
        echo -e "   Container exists but is stopped"
        echo -e "   To start: ${YELLOW}docker start minimal-agent${NC}"
    else
        echo -e "   Container does not exist"
        echo -e "   To create: ${YELLOW}./launch_minimal_agent.sh${NC}"
    fi
fi

# Check crag-mock-api
if docker ps | grep -q "crag-mock-api"; then
    echo -e "${GREEN}✅ MOCK API:${NC} Running"
    MOCK_API_UPTIME=$(docker ps --format "{{.Status}}" | grep crag-mock-api)
    MOCK_API_ID=$(docker ps --format "{{.ID}}" | grep crag-mock-api)
    echo -e "   ID: $MOCK_API_ID"
    echo -e "   Status: $MOCK_API_UPTIME"
    echo -e "   Port: 8080 -> 8000"
    
    # Check if the API is fully initialized
    if docker logs crag-mock-api 2>&1 | grep -q "Application startup complete"; then
        echo -e "   Initialization: ${GREEN}Complete${NC}"
    else
        echo -e "   Initialization: ${YELLOW}In progress${NC}"
    fi
else
    echo -e "${RED}❌ MOCK API:${NC} Not running"
    if docker ps -a | grep -q "crag-mock-api"; then
        echo -e "   Container exists but is stopped"
        echo -e "   To start: ${YELLOW}docker start crag-mock-api${NC}"
    else
        echo -e "   Container does not exist"
        echo -e "   To create: ${YELLOW}./fix_mock_api.sh${NC}"
    fi
fi

# Check connection between containers
echo -e "\n${BOLD}CONNECTIVITY STATUS${NC}"
echo -e "------------------------------------------------------------"
# Check if both containers are on the same network
if docker ps | grep -q "minimal-agent" && docker ps | grep -q "crag-mock-api"; then
    # See if they're on the same network
    NETWORK_COUNT=$(docker network inspect agentqna-network 2>/dev/null | grep -c "minimal-agent\|crag-mock-api")
    if [[ $NETWORK_COUNT -eq 2 ]]; then
        echo -e "${GREEN}✓ Network:${NC} Both containers on shared network"
    else
        echo -e "${YELLOW}⚠️ Network:${NC} Containers may not be on the same network"
        echo -e "   To fix: ${YELLOW}./fix_docker_networking.sh${NC}"
    fi
    
    # Test if the minimal-agent can access the mock-api
    echo -e "\n${BOLD}CONNECTION TEST${NC}"
    echo -e "Testing connection from minimal-agent to crag-mock-api..."
    MOCK_API_REACHABLE=$(docker exec minimal-agent curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://crag-mock-api:8000/ 2>/dev/null || echo "failed")
    if [[ "$MOCK_API_REACHABLE" == "failed" ]]; then
        echo -e "${YELLOW}⚠️ Connection:${NC} minimal-agent cannot reach crag-mock-api directly"
    elif [[ "$MOCK_API_REACHABLE" -ge 200 && "$MOCK_API_REACHABLE" -lt 500 ]]; then
        echo -e "${GREEN}✓ Connection:${NC} minimal-agent can reach crag-mock-api directly (HTTP $MOCK_API_REACHABLE)"
    else
        echo -e "${YELLOW}⚠️ Connection:${NC} crag-mock-api responded with HTTP $MOCK_API_REACHABLE"
    fi
else
    echo -e "${YELLOW}⚠️ Connection test skipped:${NC} Both containers must be running to test connectivity"
fi

# Test API endpoints
if docker ps | grep -q "minimal-agent"; then
    echo -e "\n${BOLD}API ENDPOINT TEST${NC}"
    echo -e "------------------------------------------------------------"
    echo -e "Testing chat API endpoint..."
    CHAT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"message":"test"}' http://localhost:8000/api/chat)
    if [[ "$CHAT_RESPONSE" == "200" ]]; then
        echo -e "${GREEN}✓ Chat API:${NC} Endpoint is responding (HTTP 200)"
    else
        echo -e "${YELLOW}⚠️ Chat API:${NC} Endpoint returned HTTP $CHAT_RESPONSE"
    fi
    
    echo -e "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
    if [[ "$HEALTH_RESPONSE" == "200" ]]; then
        echo -e "${GREEN}✓ Health API:${NC} Endpoint is responding (HTTP 200)"
    else
        echo -e "${YELLOW}⚠️ Health API:${NC} Endpoint returned HTTP $HEALTH_RESPONSE"
    fi
fi

# Resource usage
echo -e "\n${BOLD}RESOURCE USAGE${NC}"
echo -e "------------------------------------------------------------"
echo -e "Current container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | grep -E 'minimal-agent|crag-mock-api|NAME' | sort

# Show menu of actions
echo -e "\n${BOLD}COMMON ACTIONS${NC}"
echo -e "------------------------------------------------------------"
echo -e "1. View minimal-agent logs          ${YELLOW}docker logs -f minimal-agent${NC}"
echo -e "2. View Mock API logs               ${YELLOW}docker logs -f crag-mock-api${NC}"
echo -e "3. Restart minimal-agent            ${YELLOW}docker restart minimal-agent${NC}"
echo -e "4. Restart Mock API                 ${YELLOW}docker restart crag-mock-api${NC}"
echo -e "5. Run connection test              ${YELLOW}./test_chat_connection.sh${NC}"
echo -e "6. Fix networking issues            ${YELLOW}./fix_docker_networking.sh${NC}"
echo -e "7. Access chat interface            ${BLUE}http://localhost:8000${NC}"
echo -e "8. Fix Mock API crashes             ${YELLOW}./fix_mock_api_crashes.sh${NC}"
echo -e "9. Stop all containers              ${YELLOW}docker stop minimal-agent crag-mock-api${NC}"
echo -e "10. Restart all containers          ${YELLOW}docker restart minimal-agent crag-mock-api${NC}"
echo -e "\n${BOLD}To run this dashboard again: ./container_dashboard.sh${NC}"
echo -e "To run it every 5 seconds: watch -n5 ./container_dashboard.sh\n"
