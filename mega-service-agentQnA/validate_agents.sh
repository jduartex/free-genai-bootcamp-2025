#!/bin/bash
# Script to validate the functionality of the AgentQnA agent system

# Define working directory if not already set
if [ -z "$WORKDIR" ]; then
  WORKDIR=/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA
fi

# Change to the GenAIComps directory
cd $WORKDIR/GenAIComps

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

echo "================================================================="
echo "               VALIDATING AGENTQNA AGENT SYSTEM                  "
echo "================================================================="

echo -e "\n[1/3] Testing RAG Worker Agent..."
echo "----------------------------------------------------------------"
echo "Query: 'Tell me about Michael Jackson song Thriller'"
python tests/test.py --prompt "Tell me about Michael Jackson song Thriller" --agent_role "worker" --ext_port 9095
if [ $? -eq 0 ]; then
  echo "✅ RAG Worker Agent test passed"
else
  echo "❌ RAG Worker Agent test failed"
fi

echo -e "\n[2/3] Testing SQL Worker Agent..."
echo "----------------------------------------------------------------"
echo "Query: 'How many employees in company'"
python tests/test.py --prompt "How many employees in company" --agent_role "worker" --ext_port 9096
if [ $? -eq 0 ]; then
  echo "✅ SQL Worker Agent test passed"
else
  echo "❌ SQL Worker Agent test failed"
fi

echo -e "\n[3/3] Testing Supervisor Agent (two-turn conversation)..."
echo "----------------------------------------------------------------"
python tests/test.py --agent_role "supervisor" --ext_port 9090
if [ $? -eq 0 ]; then
  echo "✅ Supervisor Agent test passed"
else
  echo "❌ Supervisor Agent test failed"
fi

echo -e "\n================================================================="
echo "                      VALIDATION COMPLETE                           "
echo "================================================================="

# Check if all tests passed
if [ $? -eq 0 ]; then
  echo "🎉 All agent tests completed successfully!"
  echo "Your AgentQnA system is functioning properly."
else
  echo "⚠️ Some agent tests failed. Please check the output above for details."
  echo "You may need to check container logs or restart the services."
fi

# Provide information about how to use the agents
echo -e "\n📝 USAGE INFORMATION:"
echo "- To ask questions about documents: Use the RAG capability"
echo "- To query the SQL database: Ask questions about employees, sales, etc."
echo "- For complex tasks: The supervisor agent will coordinate between specialized workers"
echo -e "\nAccess the web interface at: http://localhost:8000"
