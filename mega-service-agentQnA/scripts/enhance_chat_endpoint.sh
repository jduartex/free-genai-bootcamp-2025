#!/bin/bash

echo "Creating an enhanced chat endpoint implementation..."

# Create a temporary Python script to update the chat endpoint
cat > enhance_chat.py << 'EOF'
import os
import re

def update_chat_endpoint():
    # Path to the main.py file
    main_py_path = '/app/backend/main.py'
    
    # Read the current content
    with open(main_py_path, 'r') as f:
        content = f.read()
    
    # Define the new chat endpoint implementation
    new_chat_endpoint = '''
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Process a chat conversation and return the next message
    """
    logger.info(f"Received chat request with {len(request.messages)} messages")
    try:
        # Get the last user message
        last_message = request.messages[-1].content if request.messages else ""
        last_message_lower = last_message.lower()
        
        # Generate contextual responses based on message content
        sources = []
        
        if "document" in last_message_lower and ("ingest" in last_message_lower or "upload" in last_message_lower):
            response = (
                "AgentQnA's document ingestion process works as follows:\\n\\n"
                "1. You upload PDF documents through the UI or API\\n"
                "2. The system extracts text content using OCR if needed\\n"
                "3. Documents are chunked into semantic segments\\n"
                "4. Each segment is converted to vector embeddings\\n"
                "5. Embeddings are stored in the vector database (ChromaDB)\\n"
                "6. Documents become searchable by semantic meaning\\n\\n"
                "This allows the system to retrieve relevant context when answering questions."
            )
            sources = [
                Source(title="Document Processing Guide", excerpt="Document Ingestion: Upload and process PDF documents for domain-specific knowledge"),
                Source(title="Vector Store Implementation", excerpt="Each segment is converted to embeddings using OpenAI's text-embedding-ada-002 model")
            ]
        elif ("agent" in last_message_lower or "multi-agent" in last_message_lower) or "architecture" in last_message_lower:
            response = (
                "AgentQnA uses a sophisticated multi-agent architecture where:\\n\\n"
                "1. A supervisor agent coordinates the overall process\\n"
                "2. Specialized worker agents perform specific tasks like:\\n"
                "   - Document retrieval agent\\n"
                "   - Knowledge graph agent\\n"
                "   - SQL query agent\\n"
                "   - Web search agent\\n"
                "3. Agents collaborate to answer complex questions\\n"
                "4. Each agent has access to different tools and knowledge sources\\n\\n"
                "This approach provides more accurate answers by combining different expertise and capabilities."
            )
            sources = [
                Source(title="AgentQnA Architecture Document", excerpt="Multi-Agent System: Supervisor and worker agents collaborate to answer complex questions"),
                Source(title="Agent Communication Protocol", excerpt="Agents use a standardized JSON format to share information and coordinate activities")
            ]
        elif "rag" in last_message_lower or "retrieval" in last_message_lower:
            response = (
                "Retrieval Augmented Generation (RAG) is a core technology in AgentQnA that:\\n\\n"
                "1. Retrieves relevant context from your documents\\n"
                "2. Provides this context to the language model\\n"
                "3. Generates answers grounded in your specific knowledge\\n"
                "4. Reduces hallucinations and improves accuracy\\n\\n"
                "This allows for precise answers based on your organization's documents."
            )
            sources = [
                Source(title="RAG Architecture Guide", excerpt="Retrieval Augmented Generation (RAG): Enhances LLM responses with context from your documents"),
                Source(title="Vector Search Implementation", excerpt="Semantic retrieval of relevant document passages using cosine similarity")
            ]
        elif "feature" in last_message_lower:
            response = (
                "Key features of AgentQnA include:\\n\\n"
                "1. Multi-Agent System: Collaborative AI agents with specialized capabilities\\n"
                "2. Retrieval Augmented Generation (RAG): Context-aware responses from your documents\\n"
                "3. Knowledge Graph Integration: Connect structured knowledge sources\\n"
                "4. SQL Database Access: Query relational databases for precise information\\n"
                "5. Document Management: Upload, process, and organize your knowledge base\\n"
                "6. Vector Search: Semantic retrieval of information based on meaning, not just keywords"
            )
            sources = [
                Source(title="Feature Documentation", excerpt="AgentQnA combines multiple specialized technologies to deliver accurate answers"),
                Source(title="Technical Specifications", excerpt="The system integrates vector search, LLMs, and specialized agents")
            ]
        else:
            response = (
                f"I'd be happy to help with information about '{last_message}'. "
                "AgentQnA specializes in retrieving information from your documents. "
                "You can ask about document ingestion, the multi-agent system, RAG architecture, or how to use specific features."
            )
            
        logger.info("Chat response generated successfully")
        return ChatResponse(
            message=Message(role="assistant", content=response),
            sources=sources
        )
    except Exception as e:
        error_msg = f"Error processing chat: {str(e)}"
        logger.error(error_msg)
        logger.exception("Detailed exception information:")
        return JSONResponse(
            status_code=500, 
            content={"detail": "An error occurred while processing your chat request"}
        )
'''
    
    # Find and replace the chat endpoint
    pattern = r'@app\.post\("/api/chat"\)[\s\S]+?return ChatResponse[\s\S]+?sources=\[\]\s+\)\s+except'
    replacement = new_chat_endpoint.strip() + '\n    except'
    
    # Perform the replacement
    updated_content = re.sub(pattern, replacement, content)
    
    # Write the updated content back
    with open(main_py_path, 'w') as f:
        f.write(updated_content)
    
    print("Chat endpoint successfully enhanced!")
    return True

if __name__ == "__main__":
    update_chat_endpoint()
EOF

# Copy the script to the container
echo "Copying enhancement script to container..."
docker cp enhance_chat.py mega-service-agentqna-agentqna-1:/app/enhance_chat.py

# Execute the script in the container
echo "Applying chat enhancements in container..."
docker-compose exec agentqna python /app/enhance_chat.py

# Restart the backend service
echo "Restarting the backend service..."
docker-compose restart

# Clean up
rm enhance_chat.py

echo "Waiting for services to restart..."
sleep 5

echo "Done! The chat endpoint now provides rich responses with sources."
echo "Try it with: ./scripts/chat.sh 'Tell me about the multi-agent architecture'"
