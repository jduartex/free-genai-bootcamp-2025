# AgentQnA: Question Answering with Multi-Agent AI

AgentQnA is a RAG-based question answering service that leverages multiple AI agents, vector databases, and knowledge graphs to provide accurate and contextual answers to user queries.

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
  * Python 3.9+
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

## Troubleshooting

* **Connection errors**: Ensure Docker is running and ports are available
* **Authentication errors**: Verify your API keys in the `.env` file
* **Performance issues**: Check system resources and Docker resource allocation
* **Document ingestion fails**: Verify PDF file formats and size limits

## Advanced Configuration

For advanced configuration options, refer to the detailed [Tech-Specs.md](./Tech-Specs.md) document.
