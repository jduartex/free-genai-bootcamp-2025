#!/bin/bash
# Script to launch the multi-agent system for AgentQnA

# Define working directory if not already set
if [ -z "$WORKDIR" ]; then
  WORKDIR=/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA
fi

# Ensure we're in the right directory
cd $WORKDIR/GenAIComps

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

echo "Launching the multi-agent system..."

# Start the retrieval tool service
echo "Starting DocIndexRetriever service..."
cd $WORKDIR/GenAIComps/examples/AgentQnA/retrieval_tool
bash launch_retrieval_tool.sh &
RETRIEVAL_PID=$!
echo "DocIndexRetriever service started (PID: $RETRIEVAL_PID)"

# Wait briefly for the retrieval service to initialize
sleep 5

# Launch the supervisor agent
echo "Launching supervisor agent..."
cd $WORKDIR/GenAIComps/examples/AgentQnA
bash launch_supervisor.sh &
SUPERVISOR_PID=$!
echo "Supervisor agent started (PID: $SUPERVISOR_PID)"

# Wait briefly for the supervisor to initialize
sleep 5

# Launch worker agents
echo "Launching worker agents..."
cd $WORKDIR/GenAIComps/examples/AgentQnA
bash launch_workers.sh &
WORKERS_PID=$!
echo "Worker agents started (PID: $WORKERS_PID)"

# Wait briefly for workers to initialize
sleep 5

# Start the main application
echo "Starting AgentQnA application..."
cd $WORKDIR/GenAIComps
python examples/AgentQnA/app.py

echo "AgentQnA system is now running!"
echo "You can access the application at http://localhost:8000"
echo ""
echo "To stop all services, use: kill $RETRIEVAL_PID $SUPERVISOR_PID $WORKERS_PID"
