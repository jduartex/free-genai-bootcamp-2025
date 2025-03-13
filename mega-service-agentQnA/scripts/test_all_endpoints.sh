#!/bin/bash

echo "==================== Testing AgentQnA API Endpoints ===================="

# 1. Test health endpoint
echo -e "\n\033[1;34m1. Testing health endpoint\033[0m"
curl -s http://localhost:8080/health | jq || curl -s http://localhost:8080/health

# 2. Test metrics endpoint
echo -e "\n\033[1;34m2. Testing metrics endpoint\033[0m"
curl -s http://localhost:8080/metrics | jq || curl -s http://localhost:8080/metrics

# 3. Test query endpoint
echo -e "\n\033[1;34m3. Testing query endpoint\033[0m"
curl -s -X POST http://localhost:8080/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the main feature of AgentQnA?"}' | jq || \
  curl -X POST http://localhost:8080/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the main feature of AgentQnA?"}'

# 4. Test chat endpoint
echo -e "\n\033[1;34m4. Testing chat endpoint\033[0m"
curl -s -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tell me about the multi-agent system"}]}' | jq || \
  curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tell me about the multi-agent system"}]}'

# 5. Display container logs
echo -e "\n\033[1;34m5. Recent application logs\033[0m"
docker-compose logs --tail=20

echo -e "\n\033[1;32mAll tests completed!\033[0m"
