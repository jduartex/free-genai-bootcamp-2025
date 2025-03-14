#!/bin/bash

echo "=========================================================="
echo "FIXING INDENTATION ERROR"
echo "=========================================================="

# Check if the minimal-agent container is running
if ! docker ps -a | grep -q "minimal-agent"; then
    echo "❌ The minimal-agent container doesn't exist"
    exit 1
fi

# Create a temporary folder
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Copy the main.py file from the container
echo "Retrieving main.py from container..."
docker cp minimal-agent:/app/main.py "$TEMP_DIR/main.py"

if [ ! -f "$TEMP_DIR/main.py"; then
    echo "❌ Failed to copy main.py from container"
    exit 1
fi

# Create a Python script to fix the indentation
cat > "$TEMP_DIR/fix_indent.py" << 'EOL'
import re

# Read the main.py file
with open('main.py', 'r') as f:
    content = f.read()

# Look for indentation errors around line 132
lines = content.split('\n')

# Find the problematic section containing endpoint URLs
problematic_section = False
fixed_lines = []

for i, line in enumerate(lines):
    # Check for the start of URL lists
    if re.search(r'endpoints_to_try = \[$', line) or re.search(r'MOCK_API_ENDPOINTS = \[$', line):
        problematic_section = True
        fixed_lines.append(line)
        continue
        
    if problematic_section:
        # Check for URL strings
        if re.search(r'^\s+"http://', line):
            # Get proper indentation from previous line
            prev_line = fixed_lines[-1]
            proper_indent = ""
            for char in prev_line:
                if char.isspace():
                    proper_indent += char
                else:
                    break
            
            # Add proper indentation plus 4 spaces for list items
            fixed_line = proper_indent + "    " + line.lstrip()
            fixed_lines.append(fixed_line)
        else:
            # If we find a non-URL line, we're done with the problematic section
            if not re.search(r'^\s+\]', line):
                problematic_section = False
            fixed_lines.append(line)
    else:
        fixed_lines.append(line)

# Write the fixed content back
with open('fixed_main.py', 'w') as f:
    f.write('\n'.join(fixed_lines))

print("Indentation fixed successfully!")
EOL

# Run the Python script - try different Python commands
echo "Fixing indentation issues..."
cd "$TEMP_DIR"

# Try python3 first
if command -v python3 &> /dev/null; then
    python3 fix_indent.py
# Fall back to python if python3 isn't available
elif command -v python &> /dev/null; then
    python fix_indent.py
# If neither is available, use Python inside the Docker container
else
    echo "Python not found on host, using Python inside the container..."
    docker cp "$TEMP_DIR/fix_indent.py" minimal-agent:/tmp/fix_indent.py
    docker cp "$TEMP_DIR/main.py" minimal-agent:/tmp/main.py
    docker exec -w /tmp minimal-agent python fix_indent.py
    docker cp minimal-agent:/tmp/fixed_main.py "$TEMP_DIR/fixed_main.py"
fi

if [ ! -f "$TEMP_DIR/fixed_main.py"; then
    echo "❌ Failed to create fixed file"
    exit 1
fi

# Copy the fixed file back to the container
echo "Uploading fixed file to container..."
docker cp "$TEMP_DIR/fixed_main.py" minimal-agent:/app/main.py

# Clean up
rm -rf "$TEMP_DIR"

# Restart the container
echo "Restarting minimal-agent container..."
docker restart minimal-agent

echo "Waiting for container to restart..."
sleep 5

# Check if it's working now
echo "Checking if the server started correctly..."
CONTAINER_LOGS=$(docker logs minimal-agent 2>&1 | grep -c "Application startup complete")

if [ "$CONTAINER_LOGS" -gt 0 ]; then
    echo "✅ The server is now running correctly!"
    echo "You can access the web interface at: http://localhost:8000"
else
    echo "❌ Server still has issues. View logs with: docker logs minimal-agent"
fi

echo ""
echo "If you still encounter issues, try these steps:"
echo "1. Verify the configuration with: docker exec minimal-agent cat /app/main.py"
echo "2. Manually fix indentation issues"
echo "3. Restart the container: docker restart minimal-agent"
echo ""
echo "You can test the API with: curl -s -X POST -H \"Content-Type: application/json\" -d '{\"message\":\"test\"}' http://localhost:8000/api/chat | jq"
