# Setting up the Backend API Endpoints

The frontend expects the following API endpoints to be available:

1. POST `/api/chat` - Endpoint for chat requests
   - Request format: `{ "message": "user message" }`
   - Expected response: `{ "response": "agent response" }`

2. GET `/health` - Health check endpoint
   - Expected response: `{ "status": "ok" }`

3. GET `/api/query` - Endpoint for direct queries
   - Optional, used for specific document queries

If your backend is using a different structure, you will need to either:
1. Configure your backend to handle these endpoints, or
2. Update the frontend code to match your backend's API structure

## Quick Backend Configuration with Flask

If your backend is using Flask, you can add these routes:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    # Process the message using your backend logic
    response = "This is a sample response. Replace with your actual chat logic."
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
```
