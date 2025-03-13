#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Parse command line arguments
SUBSET=""
if [ "$1" = "--subset" ] && [ -n "$2" ]; then
    SUBSET="--subset $2"
    echo "Using subset: $2"
fi

# Define the correct path to the ingest script using an absolute path
INGEST_SCRIPT="/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA/backend/ingest.py"

# Check if the ingest script exists
if [ ! -f "$INGEST_SCRIPT" ]; then
    echo "ERROR: Ingest script not found at $INGEST_SCRIPT"
    echo "Please ensure the file exists and try again."
    exit 1
fi

# Define working directory if not already set
if [ -z "$WORKDIR" ]; then
  WORKDIR=/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA
fi

# Ensure we're in the right directory
cd $WORKDIR/GenAIComps

# Activate virtual environment if it exists
if [ -d "./venv" ]; then
    source ./venv/bin/activate
elif [ -d "./GenAIComps/venv" ]; then
    source ./GenAIComps/venv/bin/activate
else
    echo "WARNING: No virtual environment found. Using system Python."
fi

echo "Starting document ingestion..."

# Run the ingest script with appropriate parameters
python "$INGEST_SCRIPT" $SUBSET

# Check the exit status
if [ $? -eq 0 ]; then
    echo "Document ingestion complete. Vector database has been updated."
else
    echo "ERROR: Document ingestion failed."
    exit 1
fi

# Deactivate virtual environment if activated
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi
