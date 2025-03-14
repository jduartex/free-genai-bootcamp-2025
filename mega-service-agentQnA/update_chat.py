import json
import requests

def update_chat_endpoint():
    url = "http://localhost:8080/api/chat"
    payload = {
        "messages": [
            {"role": "user", "content": "Tell me about document ingestion"}
        ]
    }
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    update_chat_endpoint()
