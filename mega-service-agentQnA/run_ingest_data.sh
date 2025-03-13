#!/bin/bash
# Script to ingest data into the vector database for AgentQnA

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

# Run the ingestion script
echo "Starting document ingestion..."
python examples/AgentQnA/ingest.py

echo "Document ingestion complete. Vector database has been updated."
