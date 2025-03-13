#!/usr/bin/env python
import json
import requests
import sys

def update_chat_endpoint():
    """Test the chat endpoint with a query about document ingestion."""
    url = "http://localhost:8080/api/chat"
    
    # Default message asking about document ingestion
    payload = {
        "messages": [
            {"role": "user", "content": "Tell me about document ingestion"}
        ]
    }
    
    # If a command line argument is provided, use it as the message content
    if len(sys.argv) > 1:
        payload["messages"][0]["content"] = " ".join(sys.argv[1:])
    
    headers = {"Content-Type": "application/json"}
    
    try:
        print(f"Sending request to {url}...")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the service is running.")
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    update_chat_endpoint()
