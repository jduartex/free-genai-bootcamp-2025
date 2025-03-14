# AgentQnA: Question Answering with Multi-Agent AI

AgentQnA is a RAG-based question answering service that leverages multiple AI agents, vector databases, and knowledge graphs to provide accurate and contextual answers to user queries.

## Current Status ✅

| Component              | Status      | Notes                                       |
|------------------------|-------------|---------------------------------------------|
| Backend API            | ✅ Working   | Accessible at http://localhost:8080         |
| Frontend UI            | ✅ Working   | Accessible at http://localhost:3030         |
| Query Endpoint         | ✅ Working   | Returns answers with sources                |
| Chat Endpoint          | ✅ Working   | Handles conversational interactions         |
| Health Endpoint        | ✅ Working   | System health monitoring                    |
| Metrics Endpoint       | ✅ Working   | Basic metrics implemented                   |
| Logging System         | ✅ Working   | Logs available in container and logs/ dir   |
| Docker Containerization| ✅ Working   | Services running in containers              |

## Hybrid Deployment Architecture

The AgentQnA system uses a hybrid approach that combines:

* **Local Development Components**:
  * Core AgentQnA application (frontend/backend)
  * Vector database for document storage
  * Development scripts and utilities

* **Containerized Components**:
  * OpenAI-based agent services
  * Mock Knowledge Graph API
  * Retrieval tools and services

This hybrid approach optimizes development experience on macOS while ensuring consistency and compatibility for environment-sensitive components.

## Key Features

* **Multi-Agent System**: Supervisor and worker agents collaborate to answer complex questions
* **Retrieval Augmented Generation (RAG)**: Enhances LLM responses with context from your documents
* **Document Ingestion**: Upload and process PDF documents for domain-specific knowledge
* **Knowledge Graph Integration**: Connect to external knowledge sources via APIs
* **SQL Database Access**: Query structured data from relational databases
* **OpenAI Integration**: Leverages powerful language models via API
* **Vector Search**: Semantic retrieval of relevant document passages
* **Chat Interface**: User-friendly conversational UI
* **Document Management**: Upload and organize knowledge base documents
* **API Access**: Programmatic interaction via RESTful endpoints

## System Requirements

* **Operating System**: macOS 15.3.2+ (optimized for Apple Silicon)
* **Hardware**: 
  * MacBook Pro or equivalent
  * 16 GB RAM recommended
  * 2+ GB free storage
* **Software**:
  * Python 3.10 (specifically)
  * Node.js 18.0.0+
  * Docker Desktop for macOS
* **API Keys**:
  * OpenAI API key for LLM access
  * Optional: HuggingFace token for open-source models

## Quick Start Guide

### 1. Setup Environment

```bash
# Clone this repository
git clone https://github.com/yourusername/mega-service-agentQnA.git
cd mega-service-agentQnA

# Run the setup script
chmod +x setup.sh
./setup.sh
```

### 2. Configure API Keys

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Ingest Documents

```bash
# Place PDF documents in the data directory
mkdir -p data
cp your-documents/*.pdf data/

# Run the ingestion script
./run_ingest_data.sh
```

### 4. Launch Services

```bash
# Launch services with OpenAI models
./launch_openai_agents.sh
```

### 5. Access the Application

Open your browser and navigate to http://localhost:8000

## Detailed Documentation

### Directory Structure

```
mega-service-agentQnA/
├── backend/              # FastAPI backend services
├── data/                 # Document storage
├── db/                   # Vector database storage
├── frontend/             # React-based UI
├── logs/                 # Application logs
├── scripts/              # Utility scripts
├── tests/                # Test cases
├── tools/                # Agent tools and connectors
├── Dockerfile            # Container definition
├── docker-compose.yml    # Container orchestration
├── setup.sh              # Setup script
├── launch_openai_agents.sh   # Script to launch with OpenAI
└── requirements.txt      # Python dependencies
```

### Available Scripts

* **setup.sh**: Sets up the environment, dependencies, and databases
* **run_ingest_data.sh**: Processes documents into the vector database
* **launch_openai_agents.sh**: Launches all services with OpenAI models
* **launch_agents.sh**: Alternative script for multi-agent setup
* **launch_minimal_agent.sh**: Runs a lightweight version with minimal resources

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/query | POST | Ask a single question |
| /api/chat | POST | Have a conversation with context |
| /api/upload | POST | Upload documents to knowledge base |
| /health | GET | Service health check |
| /metrics | GET | Monitoring metrics |

### Environment Variables

* `OPENAI_API_KEY`: Your OpenAI API key
* `HOST_IP`: Host machine IP address (auto-detected)
* `TOOLSET_PATH`: Path to agent tools directory
* `HUGGINGFACEHUB_API_TOKEN`: Optional token for HuggingFace models
* `HF_CACHE_DIR`: Cache location for downloaded models
* `SQLITE_DB_PATH`: Path to SQL database
* `CRAG_MOCK_API_URL`: URL for the Knowledge Graph API

## Architecture Overview

```
┌───────────────┐        ┌───────────────┐       ┌───────────────┐
│  Web Browser  │◄──────►│  AgentQnA UI  │◄─────►│  FastAPI      │
└───────────────┘        │  (Local)      │       │  Backend      │
                         └───────────────┘       └───────┬───────┘
                                                         │
                    ┌────────────────────────────────────┼────────────────────────┐
                    │                                    │                        │
          ┌─────────▼─────────┐             ┌───────────▼───────────┐   ┌────────▼───────┐
          │  OpenAI API       │             │  Supervisor Agent     │   │  Vector DB     │
          │  (Remote Service) │             │  (Docker Container)   │   │  (ChromaDB)    │
          └───────────────────┘             └───────────┬───────────┘   └────────────────┘
                                                        │
                            ┌─────────────────┬─────────┼─────────┬─────────────────┐
                            │                 │                   │                 │
                    ┌───────▼────────┐ ┌──────▼───────┐  ┌───────▼────────┐ ┌──────▼──────┐
                    │  Worker Agent  │ │ Worker Agent │  │ Worker Agent   │ │ Retrieval   │
                    │  (Docker)      │ │ (Docker)     │  │ (Docker)       │ │ Tool (Docker)│
                    └────────┬───────┘ └──────────────┘  └────────────────┘ └─────────────┘
                             │
                     ┌──────▼──────┐
                     │ Knowledge    │
                     │ Graph API    │
                     │ (Docker)     │
                     └──────────────┘
```

## Logging Configuration

AgentQnA includes a comprehensive logging system that captures application activities, errors, API interactions, and performance metrics. The logging system is configured as follows:

### Logging Setup

1. Enable logging in your `.env` file:
   ```
   ENABLE_LOGGING=true
   LOG_LEVEL=INFO  # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
   ```

2. Log files are automatically created in the `logs/` directory:
   * `agent_activity.log`: Records agent operations and decisions
   * `agent_errors.log`: Captures error messages and exceptions
   * `api_requests.log`: Documents API requests and responses
   * `performance.log`: Tracks performance metrics and response times

3. Log rotation is configured automatically:
   * Maximum log file size: 10MB
   * Backup count: 5 (maintains last 5 archived log files)

### Using the Logging System

You can access the logging functionality in your code by importing the appropriate logger:

```python
from backend.utils import get_agent_logger, get_error_logger, get_api_logger, get_performance_logger

# Get a logger
logger = get_agent_logger()

# Log messages
logger.info("Agent started processing query")
logger.error("Error occurred during document retrieval")
```

### Testing Logging Functionality

To verify that the logging system is working correctly:

```bash
# Run the logging test script
chmod +x scripts/test_logging.sh
./scripts/test_logging.sh
```

This script will create test log entries in all log files and display their contents.

### Viewing Logs

You can view logs using standard command-line tools:

```bash
# View the full agent activity log
cat logs/agent_activity.log

# View the last 50 lines of the error log
tail -n 50 logs/agent_errors.log

# Follow new entries to the API log in real time
tail -f logs/api_requests.log

# Search for specific events in the performance log
grep "processing time" logs/performance.log
```

For containerized components, access logs using Docker:
```bash
# View logs from all services
docker-compose logs

# View logs from a specific service
docker-compose logs agent-supervisor

# Follow container logs in real time
docker-compose logs --follow
```

### Troubleshooting Logging Issues

* **Empty logs folder**: 
  * Check if `ENABLE_LOGGING=true` is set in your `.env` file
  * Verify that your user has write permissions to the logs directory
  * Run `./scripts/test_logging.sh` to test logging functionality
  * For containerized services, logs may be stored in Docker volumes

* **Missing log entries**: 
  * Ensure the log level is appropriate (e.g., DEBUG for detailed information)
  * Check if the specific component is configured to use the logging system
  * Verify that the application has write access to log files

* **Log file access errors**:
  * Check file permissions on the logs directory
  * Ensure adequate disk space is available
  * Verify that log rotation is working correctly

## Troubleshooting

* **Connection errors**: Ensure Docker is running and ports are available
* **Authentication errors**: Verify your API keys in the `.env` file
* **Performance issues**: Check system resources and Docker resource allocation
* **Document ingestion fails**: Verify PDF file formats and size limits
* **Query errors**: If you receive "Sorry, there was an error processing your request" responses:
  * Verify the question relates to your ingested document domains
  * Check Docker container logs: `docker-compose logs`
  * Ensure all agent services are running with `docker ps`
  * Try restarting the service with `./launch_openai_agents.sh --restart`
* **Empty logs folder**: 
  * Check Docker container logs as services may log there instead of to the local filesystem
  * Verify your logging configuration in the application settings
  * Ensure your user has write permissions to the logs directory

## Query Limitations and Expected Use

AgentQnA is designed to answer questions about documents you've uploaded to the system and connected knowledge sources. The system is not:

* A general knowledge QA system for topics outside your document base
1. Upload domain-specific documents related to your areas of interest
2. Ask questions specifically about information contained in those documents
3. Use clear, specific questions that reference concepts from your knowledge base
4. Check the system logs if you receive error messages to identify specific issues

Example of appropriate queries:
* "Summarize the key points from the Q3 financial report I uploaded"
* "What security protocols are mentioned in the network documentation?"
* "Compare the performance metrics between Project A and Project B"

## Minimal Agent Setup

The `launch_minimal_agent.sh` script provides a lightweight deployment option when full system resources aren't needed or available. This is useful for:

* Development and testing on resource-constrained machines
* Quick demos without full infrastructure setup
* CI/CD pipeline testing
* Focusing on specific agent functionality

### Minimal Agent Setup Steps

1. Ensure your environment is configured with the basic requirements
   ```bash
   ./setup.sh --minimal
   ```

2. Prepare a smaller test dataset (optional)
   ```bash
   cp test-documents/*.pdf data/minimal/
   ./run_ingest_data.sh --subset minimal
   ```

3. Launch the minimal agent configuration
   ```bash
   ./launch_minimal_agent.sh
   ```

4. Access the minimal interface at http://localhost:8001

The minimal setup uses:
* Single combined agent instead of supervisor/worker architecture
* In-memory vector storage rather than persistent ChromaDB
* Limited toolset with core functionality only
* Reduced token usage for OpenAI API calls

## Advanced Configuration

For advanced configuration options, refer to the detailed [Tech-Specs.md](./Tech-Specs.md) document.

## Version Control Guidelines

When contributing to this repository, please note:

* The `.gitignore` file specifies which files and directories are excluded from version control
* Do not commit the `GenAIComps/` directory, as it contains large development components not needed for deployment
* Never commit API keys, credentials, or `.env` files
* Keep data files out of version control unless they are small example files
* Commit documentation updates along with code changes

# CRAG Minimal Agent

This project provides a minimal agent that connects to the CRAG Mock API, with domain-specific routing capabilities.

## Overview

The minimal agent is a FastAPI application that serves as an intermediary between users and the CRAG Mock API. It provides:

- A simple web interface for interactions
- Domain-specific query routing
- Automatic API endpoint discovery
- Graceful handling of API initialization period

## Quick Start

The easiest way to get started is to use the all-in-one setup script:

```bash
./start_and_configure.sh
```

This script will:
1. Create a dedicated Docker network
2. Start the CRAG Mock API container
3. Build and start the minimal agent container
4. Install the domain adapter for intelligent query routing
5. Configure the system for optimal functionality

Once complete, access the web interface at: http://localhost:8000

## Components

### Minimal Agent

A lightweight FastAPI application that provides:
- Web interface for user interactions
- REST API endpoint for chat functionality
- Integration with the CRAG domain adapter

### CRAG Mock API

A containerized version of the CRAG API that provides:
- Domain-specific endpoints for querying information
- Multiple domains: movie, finance, music, sports, and general knowledge
- OpenAPI documentation for endpoint discovery

### Domain Adapter

An intelligent middleware that:
- Routes queries to the appropriate domain-specific endpoints
- Determines the domain of each query using keyword analysis
- Formats structured responses into readable text
- Handles API initialization and connection issues

## Available Scripts

Several utility scripts are available to help manage the system:

- `start_and_configure.sh`: Complete setup and configuration
- `fix_domain_adapter.sh`: Fix issues with domain adapter installation
- `fix_indentation.sh`: Fix indentation issues in code files
- `show_mock_api_status.sh`: Check status of the Mock API
- `container_dashboard.sh`: View status of all containers
- `discover_correct_api_endpoints.sh`: Find working API endpoints
- `test_valid_endpoints.sh`: Test API endpoints for validity
- `fix_mock_api_crashes.sh`: Recover from Mock API container crashes

## Common Issues and Solutions

### Mock API Initialization

The CRAG Mock API takes several minutes to fully initialize. During this period, you may see error messages about the API not being available. Please be patient.

**Solution**: Wait for 5-10 minutes and try again. You can monitor initialization with:
```bash
docker logs -f crag-mock-api
```

### Indentation Errors

If you encounter indentation errors when updating code:

**Solution**: Run the indentation fixer:
```bash
./fix_indentation.sh
```

### API Connection Issues

If the minimal agent cannot connect to the Mock API:

**Solution**: Check network connectivity and run:
```bash
./fix_docker_networking.sh
```

### Domain Adapter Not Working

If the domain adapter isn't routing queries correctly:

**Solution**: Reinstall the domain adapter:
```bash
./fix_domain_adapter.sh
```

## Testing the System

You can test the system using curl:

```bash
curl -s -X POST \
     -H "Content-Type: application/json" \
     -d '{"message":"Who directed the movie Inception?"}' \
     http://localhost:8000/api/chat | jq
```

Or use the web interface at: http://localhost:8000

## Monitoring

To monitor the system:
- Check minimal agent logs: `docker logs minimal-agent`
- Check Mock API logs: `docker logs crag-mock-api`
- View container status: `./container_dashboard.sh`
