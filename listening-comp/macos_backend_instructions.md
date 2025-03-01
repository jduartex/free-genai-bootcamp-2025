# Running the Backend on macOS with zsh

This guide provides specific instructions for running the Japanese Listening Comprehension App backend on macOS using zsh shell.

## Prerequisites

1. macOS with zsh shell (default shell on macOS Catalina and later)
2. Python 3.10 or higher
3. Required API keys in your `.env` file

## Setup Instructions

1. Open Terminal (Applications → Utilities → Terminal)

2. Navigate to the project directory:
```zsh
cd /Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/listening-comp
```

3. Create a Python virtual environment (recommended):
```zsh
python3 -m venv venv
source venv/bin/activate
```

4. Install required packages:
```zsh
pip install -r requirements.txt
```

5. Make the backend script executable:
```zsh
chmod +x run_backend.sh
```

## Running the Backend

Once the setup is complete, you can run the backend in one of two ways:

### Option 1: Using the provided shell script

```zsh
./run_backend.sh
```

### Option 2: Running components manually

If you prefer to run each component separately:

1. Initialize the database:
```zsh
python backend/init_db.py
```

2. Start the API server:
```zsh
python backend/api.py
```

## Environment Variables

The `run_backend.sh` script will automatically load environment variables from the `.env` file. If you're running the components manually and your `.env` file isn't being loaded automatically, you can do:

```zsh
source .env
```

Or for a specific component:

```zsh
export $(cat .env | grep -v '#' | xargs) && python backend/api.py
```

## Verifying It's Working

Once the backend is running, you should see output indicating the server is running, typically:

```
* Serving Flask app 'api'
* Running on http://127.0.0.1:5000
```

You can verify it's working by opening a new terminal window and testing an endpoint:

```zsh
curl -X GET http://localhost:5000/health
```

The response should be something like:
```json
{"status":"ok","message":"Backend API is running"}
```

## Stopping the Backend

To stop the backend:

1. Press `Ctrl+C` in the terminal where the backend is running
2. Deactivate the virtual environment when done:
```zsh
deactivate
```

## Troubleshooting

- **Permission Denied**: If you get "Permission denied" when running `./run_backend.sh`, ensure you've made it executable with `chmod +x run_backend.sh`
- **Python Version**: If you have multiple Python versions, you might need to use `python3` explicitly
- **Environment Variables**: If your API isn't working, check that environment variables are loaded correctly with `env | grep OPENAI`
- **Port Already in Use**: If port 5000 is already in use (common with AirPlay on newer macOS versions), modify the API server port in `backend/api.py`
