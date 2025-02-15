## How to stop the ollama-server container
docker-compose down

## How to start the ollama-server container
docker-compose up -d --build ollama-server

## How to pull a specific model (Pull a model)
curl -X POST http://localhost:8008/api/pull \
-H "Content-Type: application/json" \
-d '{
  "model": "llama3.2:1B"
}'

## How to verify the models installed
curl http://localhost:8008/v1/models


## Generate a Request
curl -X POST http://localhost:8008/api/generate \
-H "Content-Type: application/json" \
-d '{
  "model": "llama3.2:1B",
  "prompt": "Whats the capital of Mexico?"
}'