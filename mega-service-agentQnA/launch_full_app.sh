#!/bin/bash

echo "Launching the full AgentQnA application..."

# Launch the backend container
./launch_minimal_agent.sh

# Change to the frontend directory and start the React app
echo "Starting the frontend application..."
cd frontend
npm install
npm start

# The frontend will be available at http://localhost:3000
# It will proxy API requests to http://localhost:8000
