#!/bin/bash
# Script to set up the AgentQnA environment using the OPEA GenAIComps repository

# Define working directory
WORKDIR=/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print section headers
print_section() {
    echo ""
    echo "=============================="
    echo "$1"
    echo "=============================="
}

# Create necessary directories if they don't exist
print_section "Creating directories"
for dir in data db logs; do
    if [ ! -d "$WORKDIR/$dir" ]; then
        mkdir -p "$WORKDIR/$dir"
        echo "Created directory: $WORKDIR/$dir"
    else
        echo "Directory already exists: $WORKDIR/$dir"
    fi
done

# Set environment variables
print_section "Setting up environment variables"

# Get host IP address - macOS compatible way
if command_exists ipconfig; then
    # macOS approach
    export host_ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
elif command_exists hostname; then
    # Try Linux approach as fallback
    export host_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

if [ -z "$host_ip" ]; then
    echo "WARNING: Could not automatically detect host IP, using 127.0.0.1"
    export host_ip="127.0.0.1"
else
    echo "Host IP detected as: $host_ip"
fi

# Tool and model paths
export TOOLSET_PATH=$WORKDIR/GenAIComps/examples/AgentQnA/tools/

# Clone the GenAIComps repository if not already cloned
print_section "Checking GenAIComps repository"
if [ ! -d "$WORKDIR/GenAIComps" ]; then
    echo "Cloning the OPEA GenAIComps repository..."
    cd $WORKDIR
    git clone https://github.com/opea-project/GenAIComps.git
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to clone repository."
        echo "Please check your internet connection and try again."
    else
        echo "Repository cloned successfully."
    fi
else
    echo "GenAIComps repository already exists."
fi

cd $WORKDIR

# Set up Python environment if not already set up
print_section "Setting up Python environment"
PYTHON_VERSION="3.10"
PYTHON_CMD=""

# Check for Python 3.10 specifically
for cmd in python3.10 python3 python; do
    if command_exists $cmd; then
        # Check if this is Python 3.10.x
        version=$($cmd --version 2>&1 | awk '{print $2}')
        major_minor=$(echo $version | cut -d. -f1,2)
        if [ "$major_minor" = "3.10" ]; then
            PYTHON_CMD=$cmd
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo "❌ ERROR: Python 3.10 is not installed or not in PATH."
    echo "Please install Python 3.10 specifically and try again."
    echo "Visit https://www.python.org/downloads/ for installation."
    echo "On macOS, you can use: brew install python@3.10"
else
    echo "✅ Python 3.10 is installed: $($PYTHON_CMD --version)"
    
    if [ ! -d "$WORKDIR/GenAIComps/venv" ]; then
        echo "Creating virtual environment using Python 3.10..."
        cd $WORKDIR/GenAIComps
        $PYTHON_CMD -m venv venv
        
        if [ -f "venv/bin/activate" ]; then
            source venv/bin/activate
            echo "Installing dependencies..."
            pip install --upgrade pip
            pip install -e .
            pip install -r requirements.txt
        else
            echo "ERROR: Failed to create virtual environment."
        fi
    else
        echo "Virtual environment already exists."
        cd $WORKDIR/GenAIComps
        source venv/bin/activate 2>/dev/null
    fi
fi

# Prepare SQL database
print_section "Setting up Chinook SQLite database"
if [ ! -f "$WORKDIR/GenAIComps/examples/AgentQnA/tests/Chinook_Sqlite.sqlite" ]; then
    if [ ! -d "$WORKDIR/chinook-database" ]; then
        cd $WORKDIR
        echo "Cloning Chinook database repository..."
        git clone https://github.com/lerocha/chinook-database.git
    else
        echo "Chinook database repository already exists."
    fi
    
    mkdir -p $WORKDIR/GenAIComps/examples/AgentQnA/tests/
    if [ -f "$WORKDIR/chinook-database/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite" ]; then
        cp "$WORKDIR/chinook-database/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite" \
           "$WORKDIR/GenAIComps/examples/AgentQnA/tests/"
        echo "Chinook SQLite database copied successfully."
    else
        echo "ERROR: Chinook SQLite database file not found."
    fi
else
    echo "Chinook SQLite database already set up."
fi

# Check if Docker is running
print_section "Checking Docker"
if ! command_exists docker; then
    echo "WARNING: Docker is not installed or not in PATH."
    echo "Please install Docker Desktop for macOS from https://www.docker.com/products/docker-desktop/"
    DOCKER_AVAILABLE=false
else
    # Check if Docker daemon is running
    docker info >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "WARNING: Docker daemon is not running."
        echo "Please start Docker Desktop and run this script again for Docker-related steps."
        DOCKER_AVAILABLE=false
    else
        echo "Docker is running: $(docker --version)"
        DOCKER_AVAILABLE=true
    fi
fi

# Launch external tools and APIs if Docker is available
if [ "$DOCKER_AVAILABLE" = true ]; then
    print_section "Setting up Docker containers"
    
    # Check if Mock API container already exists
    if docker ps -a | grep -q "crag-mock-api"; then
        echo "Meta CRAG KDD Challenge Mock API container already exists."
        
        # Check if it's running
        if ! docker ps | grep -q "crag-mock-api"; then
            echo "Starting existing container..."
            docker start crag-mock-api
        else
            echo "Container is already running."
        fi
    else
        echo "Launching Meta CRAG KDD Challenge Mock API..."
        docker pull docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
        docker run -d -p=8080:8000 --name crag-mock-api docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
        echo "Mock API started on port 8080"
    fi
    
    # Check for required build tools before attempting to build
    print_section "Checking for Docker build dependencies"
    BUILD_DEPS_AVAILABLE=true
    
    if ! command_exists git; then
        echo "WARNING: git is not installed or not in PATH."
        echo "This is required for building the OPEA agent Docker image."
        echo "Install it with: brew install git"
        BUILD_DEPS_AVAILABLE=false
    fi
    
    # Build the OPEA agent Docker image if it doesn't exist and deps are available
    if [ "$BUILD_DEPS_AVAILABLE" = true ]; then
        if ! docker images | grep -q "opea/agent"; then
            print_section "Building OPEA agent Docker image"
            echo "Building the OPEA agent Docker image (this may take a while)..."
            cd $WORKDIR/GenAIComps
            
            # Attempt to build with error handling
            docker build -t opea/agent:latest \
              --build-arg https_proxy=$https_proxy \
              --build-arg http_proxy=$http_proxy \
              -f comps/agent/src/Dockerfile . || {
                echo ""
                echo "WARNING: Docker build failed. This is likely due to missing dependencies."
                echo "Common issues:"
                echo "  1. Missing development tools (git, gcc, cmake)"
                echo "  2. Network issues with downloading dependencies"
                echo ""
                echo "Alternative options:"
                echo "  - Try installing the required dependencies: brew install git cmake"
                echo "  - Use the pre-built OPEA agent image instead:"
                echo "    docker pull opea/agent:latest"
                echo ""
            }
        else
            echo "OPEA agent Docker image already exists."
        fi
    else
        echo "Skipping OPEA agent Docker image build due to missing dependencies."
        echo "You can build it later after installing the required tools."
    fi
else
    echo "WARNING: Docker setup steps skipped due to Docker not being available."
    echo "Please install and start Docker to complete these steps later."
fi

# Create .env file template if it doesn't exist
print_section "Setting up environment files"
if [ ! -f "$WORKDIR/GenAIComps/.env" ]; then
    echo "Creating .env template..."
    cat > $WORKDIR/GenAIComps/.env.example << EOL
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
    cp $WORKDIR/GenAIComps/.env.example $WORKDIR/GenAIComps/.env
    echo "Please edit the .env file to add your API keys and customize settings."
else
    echo ".env file already exists. To reset, delete the file and run setup again."
fi

# Make all shell scripts executable
print_section "Setting script permissions"
for script_file in \
    "$WORKDIR/docker-build-simplified.sh" \
    "$WORKDIR/launch_agents.sh" \
    "$WORKDIR/launch_openai_agents.sh" \
    "$WORKDIR/run_ingest_data.sh" \
    "$WORKDIR/setup.sh" \
    "$WORKDIR/validate_agents.sh" \
    "$WORKDIR/validate_services.sh"
do
    if [ -f "$script_file" ]; then
        echo "Setting executable permission for $(basename $script_file)"
        chmod +x "$script_file"
    fi
done

print_section "Setup Summary"

# Check which components were successfully set up
echo "✅ Directories created/verified"
fi

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "✅ Docker is available"
    
    if docker ps | grep -q "crag-mock-api"; then
        echo "✅ Mock API container running"
    else
        echo "❌ Mock API container not running"
    fi
    
    if docker images | grep -q "opea/agent"; then
        echo "✅ OPEA agent Docker image built"
    else
        echo "❌ OPEA agent Docker image missing"
        echo "   Try: docker pull opea/agent:latest (to use pre-built image)"
    fi
else
    echo "❌ Docker not available"
fi

if [ -f "$WORKDIR/GenAIComps/.env" ]; then
    echo "✅ Environment file created"
else
    echo "❌ Environment file missing"
fi

print_section "Troubleshooting"
echo "If you encountered errors building Docker images, you can try these alternative approaches:"
echo "1. Use pre-built images (when available): docker pull opea/agent:latest"
echo "2. Install additional dependencies: brew install git cmake"
echo "3. Skip Docker steps and use local Python environment where possible"
echo ""

print_section "Next Steps"
echo "1. Edit the .env file to add your API keys and customize settings:"
echo "   $WORKDIR/GenAIComps/.env"
echo ""
echo "2. Place PDF documents in the data directory:"
echo "   $WORKDIR/data/"
echo ""
echo "3. Ingest documents into the vector database:"
echo "   cd $WORKDIR/GenAIComps/examples/AgentQnA && bash run_ingest_data.sh"
echo ""
echo "4. Start the retrieval service:"
echo "   cd $WORKDIR/GenAIComps/examples/AgentQnA/retrieval_tool && bash launch_retrieval_tool.sh"
echo ""
echo "5. Launch with OpenAI models:"
echo "   cd $WORKDIR/GenAIComps/examples/AgentQnA/docker_compose/intel/cpu/xeon && bash launch_agent_service_openai.sh"
echo ""
echo "6. Start the application:"
echo "   python examples/AgentQnA/app.py"
echo ""
echo "7. Access the application at http://localhost:8000"
