#!/bin/bash

echo "=========================================================="
echo "FORCE MOCK API CONNECTION SETUP"
echo "=========================================================="
echo "This script will bypass initialization checks and force the connection setup"

# Check if containers are running
echo "Checking container status..."
if ! docker ps | grep -q "crag-mock-api"; then
    echo "❌ Mock API container is not running"
    echo "Starting it now..."
    docker start crag-mock-api 2>/dev/null || \
    docker run -d -p 8080:8000 --name crag-mock-api docker.io/aicrowd/kdd-cup-24-crag-mock-api:v0
    
    echo "Waiting for container to start..."
    sleep 5
    
    if ! docker ps | grep -q "crag-mock-api"; then
        echo "❌ Failed to start Mock API container"
        exit 1
    fi
else
    echo "✅ Mock API container is running"
fi

if ! docker ps | grep -q "minimal-agent"; then
    echo "❌ Minimal agent container is not running"
    echo "Please run the fix_docker_networking.sh or fix_minimal_agent.sh script first"
    exit 1
else
    echo "✅ Minimal agent container is running"
fi

echo "Getting network information..."

# Create a network if it doesn't exist
NETWORK_NAME="agentqna-network"
docker network create $NETWORK_NAME 2>/dev/null || true

# Connect containers to the same network if not already connected
if ! docker network inspect $NETWORK_NAME | grep -q "crag-mock-api"; then
    echo "Connecting crag-mock-api to the network..."
    docker network connect $NETWORK_NAME crag-mock-api
fi

if ! docker network inspect $NETWORK_NAME | grep -q "minimal-agent"; then
    echo "Connecting minimal-agent to the network..."
    docker network connect $NETWORK_NAME minimal-agent
fi

# Get IP addresses
MOCK_API_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' crag-mock-api)
echo "Mock API IP address: $MOCK_API_IP"

# Try all possible connection methods
echo "Setting up connection configuration..."
CONFIG_SCRIPT=$(mktemp)
cat > $CONFIG_SCRIPT << 'EOL'
import os
import json

# Create a configuration file that will be read by the agent
config = {
    "mock_api_urls": [
        "http://crag-mock-api:8000/generate",  # Container name
        "http://MOCK_API_IP/generate",         # Direct IP address - will be replaced
        "http://host.docker.internal:8080/generate",  # Host mapping
        "http://localhost:8080/generate"       # Local fallback
    ],
    "timeout": 30,
    "retry_attempts": 3
}

# Save to a file
with open('/app/mock_api_config.json', 'w') as f:
    json.dump(config, f, indent=2)

print("Created connection configuration file")

# Modify main.py to use this configuration
filename = '/app/main.py'
with open(filename, 'r') as file:
    content = file.read()

# Check if we need to add the config code
if "mock_api_config.json" not in content:
    # Find a suitable location for the code
    if "MOCK_API_URLS = [" in content:
        # Replace the hard-coded URLs with the config-based approach
        import re
        content = re.sub(
            r'MOCK_API_URLS = \[.*?\]',
            'MOCK_API_URLS = json.load(open("/app/mock_api_config.json"))["mock_api_urls"]',
            content,
            flags=re.DOTALL
        )
    else:
        # Add import and config loading code after the existing imports
        if "import json" not in content:
            content = content.replace("import logging", "import logging\nimport json")
        
        # Add config loading after the logger initialization
        config_code = """
# Load Mock API configuration
try:
    with open('/app/mock_api_config.json', 'r') as f:
        mock_api_config = json.load(f)
        MOCK_API_URLS = mock_api_config.get('mock_api_urls', [
            "http://crag-mock-api:8000/generate",
            "http://host.docker.internal:8080/generate",
            "http://localhost:8080/generate"
        ])
        API_TIMEOUT = mock_api_config.get('timeout', 10)
        RETRY_ATTEMPTS = mock_api_config.get('retry_attempts', 3)
except Exception as e:
    logger.warning(f"Failed to load Mock API config: {e}")
    MOCK_API_URLS = [
        "http://crag-mock-api:8000/generate",
        "http://host.docker.internal:8080/generate",
        "http://localhost:8080/generate"
    ]
    API_TIMEOUT = 10
    RETRY_ATTEMPTS = 3
"""
        # Find a good place to insert it
        if "logger = logging.getLogger" in content:
            content = content.replace("logger = logging.getLogger", config_code + "\nlogger = logging.getLogger")
        else:
            # Just add it after imports
            import_end = content.find("import") + 100
            import_section_end = content.find("\n\n", import_end)
            if import_section_end > 0:
                content = content[:import_section_end] + config_code + content[import_section_end:]
            else:
                content = content.replace("import", "import" + config_code)

    # Write the modified content back to the file
    with open(filename, 'w') as file:
        file.write(content)
    print("Updated main.py to use the configuration")
else:
    print("Configuration code already exists in main.py")
EOL

# Replace placeholder with actual IP
sed -i "s/MOCK_API_IP/$MOCK_API_IP/g" $CONFIG_SCRIPT

# Copy and run the script in the container
docker cp $CONFIG_SCRIPT minimal-agent:/app/setup_config.py
docker exec minimal-agent python /app/setup_config.py

rm $CONFIG_SCRIPT

# Add a connectivity test script
TEST_SCRIPT=$(mktemp)
cat > $TEST_SCRIPT << 'EOL'
import requests
import json
import sys
import time
import socket

def test_connection(url, timeout=5):
    try:
        print(f"Testing connection to {url}...")
        base_url = url.replace('/generate', '')
        response = requests.get(base_url, timeout=timeout)
        print(f"Response status: {response.status_code}")
        return True
    except Exception as e:
        print(f"Failed to connect to {url}: {str(e)}")
        return False

# Load config
try:
    with open('/app/mock_api_config.json', 'r') as f:
        config = json.load(f)
        urls = config['mock_api_urls']
except Exception as e:
    print(f"Error loading config: {e}")
    urls = [
        "http://crag-mock-api:8000/generate",
        "http://host.docker.internal:8080/generate",
        "http://localhost:8080/generate"
    ]

# Try DNS resolution
try:
    print("Trying DNS resolution for crag-mock-api...")
    ip = socket.gethostbyname('crag-mock-api')
    print(f"Resolved to {ip}")
    urls.insert(0, f"http://{ip}:8000/generate")
except Exception as e:
    print(f"DNS resolution failed: {e}")

# Test each URL
working_urls = []
for url in urls:
    if test_connection(url):
        working_urls.append(url)

# Report results
print(f"\nFound {len(working_urls)} working connections out of {len(urls)} attempts")
for i, url in enumerate(working_urls):
    print(f"{i+1}. {url}")

if working_urls:
    print("\nSUCCESS: At least one connection method works!")
    # Set the first working URL as default
    config = {}
    try:
        with open('/app/mock_api_config.json', 'r') as f:
            config = json.load(f)
    except:
        pass
    
    config['mock_api_urls'] = working_urls
    with open('/app/mock_api_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("Updated config with working URLs")
    sys.exit(0)
else:
    print("\nFAILURE: No connection methods work")
    sys.exit(1)
EOL

docker cp $TEST_SCRIPT minimal-agent:/app/test_connections.py
echo "Running connection tests from minimal agent container..."
docker exec minimal-agent python /app/test_connections.py
connection_status=$?

rm $TEST_SCRIPT

# Restart the minimal agent
echo "Restarting minimal agent to apply configuration..."
docker restart minimal-agent

echo "Waiting for container to start..."
sleep 5

if [ $connection_status -eq 0 ]; then
    echo "✅ Connection setup successful!"
    echo "Try accessing the web interface at http://localhost:8000"
else
    echo "⚠️ Connection tests failed, but configuration has been updated"
    echo "The API might still be initializing. Try again in a few minutes."
fi

echo ""
echo "If you're still having issues, try these diagnostics:"
echo "1. Run docker logs crag-mock-api | grep -A 5 'Application startup complete'"
echo "   to check if the API has finished initializing"
echo ""
echo "2. Try a direct request from your host machine:"
echo "   curl -X POST -H 'Content-Type: application/json' -d '{\"prompt\":\"hello\"}' http://localhost:8080/generate"
echo ""
echo "3. Try a direct request from the container:"
echo "   docker exec minimal-agent curl -X POST -H 'Content-Type: application/json' -d '{\"prompt\":\"hello\"}' http://crag-mock-api:8000/generate"
