# Tech Specs: AgentQnA Megaservice

## Local Development Environment

*   **Operating System:** macOS Sequoia 15.3.2
*   **Hardware:**
    *   MacBook Pro
    *   Apple M2 Pro Chip
    *   16 GB Memory

## System Requirements

*   **Python:** 3.10 (specifically)
*   **Node.js:** 18.0.0+
*   **Memory:** Minimum 8GB, recommended 16GB
*   **Storage:** At least 2GB of free space
*   **GPU:** Optional but recommended for faster processing

## System Architecture

*   **Frontend:** React-based user interface
*   **Backend:** FastAPI service for handling requests
*   **AI Engine:** 
    *   LangChain for agent orchestration
    *   Retrieval Augmented Generation (RAG) system
    *   LLM integration (OpenAI, Anthropic, or local models)
*   **Vector Database:** ChromaDB for storing embeddings
*   **Document Processing:** Pipeline for ingesting and processing knowledge base documents

## Model Selection

*   **Primary LLM Options:**
    *   OpenAI's gpt-3.5-turbo (balanced performance and cost)
    *   Llama 2 7B (lightweight local option)
    *   Mistral 7B (good performance on lightweight hardware)
*   **Embedding Models:**
    *   OpenAI's text-embedding-ada-002 (if using OpenAI)
    *   all-MiniLM-L6-v2 from sentence-transformers (lightweight local option)

## Document Support

*   **Supported Formats:** PDF files only
*   **Parser:** PyPDF2 for PDF parsing
*   **Maximum File Size:** 10MB per document

## Environment Variables

*   **Core Variables:**
    ```bash
    # Host IP address - automatically detected
    export host_ip=$(hostname -I | awk '{print $1}')
    
    # Tool and model paths
    export TOOLSET_PATH=$WORKDIR/GenAIComps/examples/AgentQnA/tools/
    
    # OpenAI API (if using OpenAI models)
    export OPENAI_API_KEY=your_openai_api_key
    ```

*   **For Open-Source Models:**
    ```bash
    # HuggingFace token for accessing models
    export HUGGINGFACEHUB_API_TOKEN=your_huggingface_token
    
    # Cache directory for models
    export HF_CACHE_DIR=directory_for_model_caching
    ```

*   **Proxy Settings (if needed):**
    ```bash
    export http_proxy="your_http_proxy"
    export https_proxy="your_https_proxy"
    export no_proxy="localhost,127.0.0.1,your_host_ip"
    ```

## Containerization

*   **Technology:** Docker
*   **Usage:** All components of the AgentQnA megaservice, excluding the local development environment, will be containerized using Docker.

*   **OPEA Agent Docker Image:**
    ```bash
    # Build the OPEA agent Docker image (for both supervisor and worker agents)
    cd $WORKDIR/GenAIComps
    docker build -t opea/agent:latest \
      --build-arg https_proxy=$https_proxy \
      --build-arg http_proxy=$http_proxy \
      -f comps/agent/src/Dockerfile .
    ```

*   **AgentQnA Service Docker Configuration:**
    ```bash
    # Build the AgentQnA service Docker image
    cd $WORKDIR/GenAIComps
    docker build -t agentqna:latest -f Dockerfile.agentqna .
    
    # Run the AgentQnA container with macOS-compatible settings
    docker run -d -p 8000:8000 \
      -v "$(pwd)/data:/app/data" \
      -v "$(pwd)/db:/app/db" \
      --env-file .env \
      --platform linux/arm64 \
      --name agentqna agentqna:latest
    ```

## Data Persistence

*   **Vector Database:** ChromaDB with persistent storage
*   **Storage Location:** `/db` directory mounted as a volume
*   **Backup Strategy:** Regular backups of the `/db` directory
*   **Data Schema:**
    ```
    /db
    ├── chroma.sqlite3
    └── embeddings
        └── ...
    ```

## Data Storage

*   **Vector Database:** ChromaDB for storing embeddings
    *   Used for semantic search and retrieval from unstructured documents
    *   Storage Location: `/db` directory mounted as a volume

*   **SQL Database:** Chinook SQLite
    *   Used for structured data queries and demonstrations
    *   Location: `/GenAIComps/examples/AgentQnA/tests/Chinook_Sqlite.sqlite`
    *   Schema: Music store data including artists, albums, tracks, invoices, etc.

## Testing Strategy

*   **Test Framework:** pytest for backend, Jest for frontend
*   **Testing Levels:**
    *   Unit tests for helper functions and utilities
    *   Integration tests for API endpoints
    *   Basic smoke tests for the UI
*   **Test Data:** Sample PDFs in `/tests/data`
*   **Manual Testing Checklist:**
    * Document upload functionality
    * Question answering accuracy
    * Response generation time
    * Error handling

## Monitoring and Logging

*   **Logging:**
    *   Python `logging` module with rotating file handler
    *   Log levels: ERROR, WARNING, INFO, DEBUG
    *   Log location: `/logs` directory
*   **Monitoring:**
    *   FastAPI built-in `/metrics` endpoint
    *   Simple health check endpoint at `/health`
    *   Response time tracking
    *   Error rate monitoring

## Setup Instructions

1. **Clone the GenAIComps Repository:**
   ```bash
   export WORKDIR=/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/mega-service-agentQnA
   cd $WORKDIR
   git clone https://github.com/opea-project/GenAIComps.git
   cd GenAIComps
   ```

2. **Environment Setup:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -e .
   pip install -r requirements.txt
   ```

3. **API Key Configuration:**
   - Create a `.env` file in the project root
   - Add the necessary API keys and environment variables:
     ```
     # API Keys
     OPENAI_API_KEY=your_openai_api_key
     HUGGINGFACEHUB_API_TOKEN=your_huggingface_token
     
     # Environment settings
     HOST_IP=your_host_ip
     TOOLSET_PATH=path_to_tools_directory
     HF_CACHE_DIR=path_for_model_caching
     ```

4. **Prepare SQL Database:**
   ```bash
   cd $WORKDIR
   git clone https://github.com/lerocha/chinook-database.git
   mkdir -p $WORKDIR/GenAIComps/examples/AgentQnA/tests/
   cp chinook-database/ChinookDatabase/DataSources/Chinook_Sqlite.sqlite $WORKDIR/GenAIComps/examples/AgentQnA/tests/
   ```

5. **Knowledge Base Preparation:**
   - Place PDF documents in the `/data` directory
   - Run the document ingestion script:
     ```bash
     cd $WORKDIR/GenAIComps/examples/AgentQnA
     bash run_ingest_data.sh
     ```

6. **Launch External APIs and Tools:**
   ```bash
   # Launch the Meta CRAG KDD Challenge Mock API
   docker run -d -p=8080:8000 docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
   ```

7. **Build the OPEA Agent Docker Image:**
   ```bash
   docker build -t opea/agent:latest \
     --build-arg https_proxy=$https_proxy \
     --build-arg http_proxy=$http_proxy \
     -f comps/agent/src/Dockerfile .
   ```

## Running the Service

1. **Deploy the DocIndexRetriever Mega-service:**
   ```bash
   cd $WORKDIR/GenAIComps/examples/AgentQnA/retrieval_tool
   bash launch_retrieval_tool.sh
   ```

2. **Start AgentQnA Service:**
   ```bash
   cd $WORKDIR/GenAIComps
   python examples/AgentQnA/app.py
   ```

3. **Access the Application:** 
   Open http://localhost:8000 in your browser

## Multi-Agent System

*   **LLM Engine:** OpenAI models via API calls
    *   Selected for compatibility with macOS environment
    *   Recommended model: gpt-3.5-turbo for balanced performance and cost
    *   Alternative: gpt-4 for more complex reasoning (higher cost)

*   **Agent Configuration:**
    *   **Supervisor Agent:** Orchestrates the overall system
    *   **Worker Agents:** Specialized for different tools and data sources

## Running the Multi-Agent System

1. **Launch the Agent Service with OpenAI Models:**
   ```bash
   # Ensure your OpenAI API key is set
   export OPENAI_API_KEY=your_openai_api_key
   
   # Launch the agent service using the OpenAI configuration
   cd $WORKDIR/GenAIComps/examples/AgentQnA/docker_compose/intel/cpu/xeon
   bash launch_agent_service_openai.sh
   ```

2. **Deploy the DocIndexRetriever Mega-service:**
   ```bash
   cd $WORKDIR/GenAIComps/examples/AgentQnA/retrieval_tool
   bash launch_retrieval_tool.sh
   ```

3. **Start the AgentQnA Service:**
   ```bash
   cd $WORKDIR/GenAIComps
   python examples/AgentQnA/app.py
   ```

4. **Access the Application:** 
   Open http://localhost:8000 in your browser

## External Tools and APIs

*   **Meta CRAG KDD Challenge Mock API:**
    *   Provides mock knowledge graph APIs for enhanced context
    *   Docker container: `docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0`
    *   Runs on port 8080 (accessible at http://localhost:8080)
    *   Used to demonstrate how agents can leverage knowledge graph data

## API and Interfaces

*   **REST API Endpoints:**
    - `/api/query` - For direct questions to the agent
    - `/api/chat` - For maintaining chat context
    - `/api/upload` - For adding documents to the knowledge base

*   **WebSocket Interface:** Available for real-time streaming responses

## Security Considerations

*   **Authentication:** API key-based authentication only
*   **API Key Storage:** Keys stored in .env file (gitignored)
*   **Rate Limiting:** Basic rate limiting on API endpoints

## Notes

*   The local development environment is specifically configured for macOS with an M2 Pro chip to optimize development and testing.
*   Docker will ensure consistency across different environments (development, staging, production).
*   Regular updates to the knowledge base are recommended to keep the agent's responses current.
*   Performance testing should be conducted with various document sizes and query complexities.
*   The same OPEA agent Docker image is used for both supervisor and worker agents, with different strategies and tools specified at launch time.