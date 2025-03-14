#!/bin/bash

echo "Creating log directories inside container..."

# Create the logs directory in the container
docker-compose exec agentqna mkdir -p /app/logs
docker-compose exec agentqna mkdir -p /app/backend/logs

# Set proper permissions
docker-compose exec agentqna chmod -R 777 /app/logs
docker-compose exec agentqna chmod -R 777 /app/backend/logs

echo "Creating symbolic link for logs..."
docker-compose exec agentqna ln -sf /app/logs /app/backend/logs

echo "Restarting services..."
docker-compose restart

echo "Log directories fixed! Check if the application starts correctly now."
