#!/bin/bash
# Script to set up the AgentQnA environment using the OPEA GenAIComps repository

# Define working directory
WORKDIR=/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA

# Create necessary directories
mkdir -p $WORKDIR/data $WORKDIR/db $WORKDIR/logs

# Set environment variables
echo "Setting up environment variables..."
# Get host IP address
export host_ip=$(hostname -I | awk '{print $1}')
echo "Host IP: $host_ip"

# Proxy settings - Comment out if not needed or modify as required
# export http_proxy="Your_HTTP_Proxy"
# export https_proxy="Your_HTTPs_Proxy"
# export no_proxy="localhost,127.0.0.1,$host_ip"

# Tool and model paths
export TOOLSET_PATH=$WORKDIR/GenAIComps/examples/AgentQnA/tools/
# Uncomment and set these if using HuggingFace models
# export HUGGINGFACEHUB_API_TOKEN="your-HF-token"
# export HF_CACHE_DIR="$WORKDIR/model_cache" # Directory for downloaded models

# Clone the GenAIComps repository
echo "Cloning the OPEA GenAIComps repository..."
cd $WORKDIR
git clone https://github.com/opea-project/GenAIComps.git
cd GenAIComps

# Set up Python environment
echo "Setting up Python virtual environment..."
python -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -e .
pip install -r requirements.txt

# Prepare SQL database
echo "Setting up Chinook SQLite database..."
cd $WORKDIR
git clone https://github.com/lerocha/chinook-database.git
mkdir -p $WORKDIR/GenAIComps/examples/AgentQnA/tests/
cp chinook-database/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite $WORKDIR/GenAIComps/examples/AgentQnA/tests/

# Launch external tools and APIs
echo "Launching Meta CRAG KDD Challenge Mock API..."
docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
docker run -d -p=8080:8000 --name crag-mock-api docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
echo "Mock API started on port 8080"

# Create .env file template with additional variables
echo "Creating .env file template..."
cat > .env.example << EOL
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Environment variables for AgentQnA
HOST_IP=$host_ip
# HTTP_PROXY=$http_proxy
# HTTPS_PROXY=$https_proxy
# NO_PROXY=$no_proxy
TOOLSET_PATH=$TOOLSET_PATH
# HUGGINGFACEHUB_API_TOKEN=your_huggingface_token
# HF_CACHE_DIR=$WORKDIR/model_cache

# Application Settings
LOG_LEVEL=INFO

# Database Paths
SQLITE_DB_PATH=$WORKDIR/GenAIComps/examples/AgentQnA/tests/Chinook_Sqlite.sqlite

# External APIs
CRAG_MOCK_API_URL=http://localhost:8080
EOL

echo "Creating .env file from template..."
cp .env.example .env
echo "Please edit .env file to add your API keys and customize settings."

# Build the OPEA agent Docker image
echo "Building the OPEA agent Docker image..."
docker build -t opea/agent:latest \
  --build-arg https_proxy=$https_proxy \
  --build-arg http_proxy=$http_proxy \
  -f comps/agent/src/Dockerfile .

echo "Setup complete! Next steps:"
echo "1. Edit the .env file to add your API keys and customize settings"
echo "2. Place PDF documents in the $WORKDIR/data directory"
echo "3. Run: cd $WORKDIR/GenAIComps/examples/AgentQnA && bash run_ingest_data.sh to ingest documents into the vector database"
echo "4. Run: cd $WORKDIR/GenAIComps/examples/AgentQnA/retrieval_tool && bash launch_retrieval_tool.sh to start the retrieval service"
echo "5. To launch with OpenAI models: cd $WORKDIR/GenAIComps/examples/AgentQnA/docker_compose/intel/cpu/xeon && bash launch_agent_service_openai.sh"
echo "6. Run: python examples/AgentQnA/app.py to start the application"
echo "7. Access the application at http://localhost:8000"
echo "8. The Mock Knowledge Graph API is available at http://localhost:8080"
