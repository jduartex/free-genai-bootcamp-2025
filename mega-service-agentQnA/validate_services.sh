#!/bin/bash
# Script to validate that AgentQnA services are running correctly

echo "Validating AgentQnA services..."
echo "===============================\n"

# Define a function to check container logs for success message
check_container() {
  local container_name=$1
  local display_name=$2
  
  echo "Checking $display_name container logs..."
  
  if ! docker ps | grep -q $container_name; then
    echo "❌ ERROR: $display_name container is not running!"
    echo "     Try starting it with: docker start $container_name"
    return 1
  fi
  
  if docker logs $container_name | grep -q "HTTP server setup successful"; then
    echo "✅ SUCCESS: $display_name is running properly."
  else
    echo "⚠️ WARNING: $display_name may not be initialized correctly."
    echo "     Check full logs with: docker logs $container_name"
    return 1
  fi
  
  echo ""
  return 0
}

# Check RAG agent
check_container "rag-agent-endpoint" "RAG Worker Agent"

# Check SQL agent
check_container "sql-agent-endpoint" "SQL Worker Agent"

# Check Supervisor agent
check_container "react-agent-endpoint" "Supervisor Agent"

# Check CRAG Mock API
if docker ps | grep -q "crag-mock-api"; then
  echo "✅ SUCCESS: Meta CRAG Mock API is running."
else
  echo "❌ ERROR: Meta CRAG Mock API is not running!"
  echo "     Try starting it with: docker start crag-mock-api"
fi
echo ""

# Overall status
if check_container "rag-agent-endpoint" "RAG Worker Agent" >/dev/null && \
   check_container "sql-agent-endpoint" "SQL Worker Agent" >/dev/null && \
   check_container "react-agent-endpoint" "Supervisor Agent" >/dev/null && \
   docker ps | grep -q "crag-mock-api"; then
  echo "🎉 All services appear to be running correctly!"
else
  echo "⚠️ Some services need attention. Please check the messages above."
fi

# Check if AgentQnA application is accessible
echo "\nChecking AgentQnA web application..."
if curl -s http://localhost:8000/health >/dev/null; then
  echo "✅ SUCCESS: AgentQnA application is responding at http://localhost:8000"
else
  echo "❌ ERROR: AgentQnA application is not responding."
  echo "     Check if the application is running with: ps aux | grep 'examples/AgentQnA/app.py'"
fi
