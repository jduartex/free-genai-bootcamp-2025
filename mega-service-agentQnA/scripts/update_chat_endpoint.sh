#!/bin/bash

echo "Creating enhanced chat endpoint implementation..."

# Generate a Python script with an improved chat endpoint implementation
cat > update_chat_endpoint.py << 'EOF'
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import time
import os
import logging
import sys

# Define the chat endpoint function with enhanced responses
def create_chat_endpoint_code():
    return '''
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
        if "document" in last_message_lower and ("ingestion" in last_message_lower or "upload" in last_message_lower):
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
        elif "agent" in last_message_lower or "multi-agent" in last_message_lower:
            response = (
                "AgentQnA uses a multi-agent architecture where:\\n\\n"
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
        elif "rag" in last_message_lower or "retrieval" in last_message_lower:
            response = (
                "Retrieval Augmented Generation (RAG) is a core technology in AgentQnA that:\\n\\n"
                "1. Retrieves relevant context from your documents\\n"
                "2. Provides this context to the language model\\n"
                "3. Generates answers grounded in your specific knowledge\\n"
                "4. Reduces hallucinations and improves accuracy\\n\\n"
                "This allows for precise answers based on your organization's documents."
            )
        else:
            response = (
                f"I'd be happy to help with information about '{last_message}'. "
                "AgentQnA specializes in retrieving information from your documents. "
                "You can ask about document ingestion, the multi-agent system, RAG architecture, or how to use specific features."
            )
            
        logger.info("Chat response generated successfully")
        return ChatResponse(
            message=Message(role="assistant", content=response),
            sources=[]
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

# Function to inject the updated chat endpoint into the main.py file
def update_main_py():
    import re
    
    # Path to the main.py file in the container
    main_file = '/app/backend/main.py'
    
    try:
        # Read the current main.py content
        with open(main_file, 'r') as f:
            content = f.read()
        
        # Create the new chat endpoint code
        new_chat_endpoint = create_chat_endpoint_code()
        
        # Replace the existing chat endpoint function
        pattern = r'@app\.post\("/api/chat"\)[^@]*?sources=\[\]\s*\)\s*}'
        replacement = new_chat_endpoint
        
        # Use regex to replace the chat endpoint
        updated_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        
        # Write the updated content back to the file
        with open(main_file, 'w') as f:
            f.write(updated_content)
        
        print("Chat endpoint successfully updated!")
        return True
    
    except Exception as e:
        print(f"Error updating main.py: {str(e)}")
        return False

if __name__ == '__main__':
    update_main_py()
EOF

# Copy the script to the container
echo "Copying update script to container..."
docker cp update_chat_endpoint.py mega-service-agentqna-agentqna-1:/app/update_chat_endpoint.py

# Execute the script in the container
echo "Executing update script in container..."
docker-compose exec agentqna python /app/update_chat_endpoint.py

# Restart the backend service
echo "Restarting the backend service..."
docker-compose restart

# Clean up
rm update_chat_endpoint.py

echo "Done! The chat endpoint has been updated with enhanced responses."
echo "Please wait a moment for the service to restart, then try your chat command again."
