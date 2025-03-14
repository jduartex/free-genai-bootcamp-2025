#!/bin/bash

echo "Creating a Python module initializer to help with imports..."

# Run a helper script in the container to add __init__.py files where needed
cat << 'EOF' > fix_imports.py
import os

def create_init_files(root_dir):
    """Create __init__.py files in all directories under root_dir"""
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if '__pycache__' in dirpath:
            continue
        init_file = os.path.join(dirpath, '__init__.py')
        if not os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write('# This file makes the directory a Python package\n')
            print(f"Created {init_file}")

if __name__ == '__main__':
    create_init_files('/app')
EOF

# Copy and run the script in the container
docker cp fix_imports.py mega-service-agentqna-agentqna-1:/app/fix_imports.py
docker-compose exec agentqna python /app/fix_imports.py

echo "Setting up PYTHONPATH in the container..."
docker-compose exec agentqna bash -c 'echo "export PYTHONPATH=/app" >> /root/.bashrc'

# Restart the container
echo "Restarting container to apply changes..."
docker-compose restart

echo "Done! Check logs to see if the application started correctly:"
echo "docker-compose logs -f"

# Clean up
rm fix_imports.py
