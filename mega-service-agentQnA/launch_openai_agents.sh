#!/bin/bash
# Script to launch the multi-agent system for AgentQnA using OpenAI models

# Define working directory if not already set
if [ -z "$WORKDIR" ]; then
  WORKDIR=/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA
fi

# Ensure OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "ERROR: OPENAI_API_KEY environment variable is not set"
  echo "Please set your OpenAI API key first:"
  echo "export OPENAI_API_KEY=your_openai_api_key"
  exit 1
fi

# Ensure we're in the right directory
cd $WORKDIR/GenAIComps

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

echo "Launching the multi-agent system with OpenAI models..."

# Start the DocIndexRetriever service
echo "Starting DocIndexRetriever service..."
cd $WORKDIR/GenAIComps/examples/AgentQnA/retrieval_tool
bash launch_retrieval_tool.sh &
RETRIEVAL_PID=$!
echo "DocIndexRetriever service started (PID: $RETRIEVAL_PID)"

# Wait briefly for the retrieval service to initialize
sleep 5

# Launch the agent service with OpenAI configuration
echo "Launching agent service with OpenAI models..."
cd $WORKDIR/GenAIComps/examples/AgentQnA/docker_compose/intel/cpu/xeon
bash launch_agent_service_openai.sh &
AGENTS_PID=$!
echo "Agent service started (PID: $AGENTS_PID)"

# Wait briefly for agent service to initialize
sleep 10

# Start the main application
echo "Starting AgentQnA application..."
cd $WORKDIR/GenAIComps
python examples/AgentQnA/app.py

echo "AgentQnA system is now running!"
echo "You can access the application at http://localhost:8000"
echo ""
echo "To stop all services, use: kill $RETRIEVAL_PID $AGENTS_PID"
