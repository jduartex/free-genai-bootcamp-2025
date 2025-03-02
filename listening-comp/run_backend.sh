#!/bin/bash

# Check if Flask is installed
if ! python -c "import flask" &> /dev/null; then
    echo "Error: Flask is not installed. Please run './install_dependencies.sh' first."
    echo "Or install dependencies manually with: pip install -r requirements.txt"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Create the backend and data directories if they don't exist
mkdir -p backend
mkdir -p data

# Make sure the database is initialized
echo "Initializing database..."
python backend/init_db.py

# Start the backend API server
echo "Starting backend API server..."
python backend/api.py
