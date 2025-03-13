FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including git for package building
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    cmake \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create directory for requirements
RUN mkdir -p /home/user/comps/agent/src/

# Copy requirements and install Python dependencies
COPY requirements.txt /home/user/comps/agent/src/requirements.txt

# Skip problematic dependencies for manifold3d by setting an environment variable
ENV SKIP_TRIMESH_MANIFOLD=1
ARG ARCH=cpu

# Create filtered requirements file - explicitly exclude problematic packages
RUN cat /home/user/comps/agent/src/requirements.txt | \
    grep -v "manifold3d" | \
    grep -v "trimesh" > /home/user/comps/agent/src/filtered_requirements.txt

# Install Python dependencies with increased verbosity
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    echo "Installing filtered Python requirements..." && \
    if [ "${ARCH}" = "cpu" ]; then \
        pip install --verbose --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r /home/user/comps/agent/src/filtered_requirements.txt || \
        echo "Some packages failed to install, continuing build"; \
    else \
        pip install --verbose --no-cache-dir -r /home/user/comps/agent/src/filtered_requirements.txt || \
        echo "Some packages failed to install, continuing build"; \
    fi

# Copy backend code
COPY backend/ backend/
COPY scripts/ scripts/

# Create necessary directories
RUN mkdir -p data db logs

# Create necessary directories for logging
RUN mkdir -p /app/logs
RUN mkdir -p /app/backend/logs

# Make sure the directories are writable
RUN chmod -R 777 /app/logs
RUN chmod -R 777 /app/backend/logs

# Set up frontend if it exists
COPY frontend/ frontend/
WORKDIR /app/frontend

# Check if package.json exists before running npm commands
RUN if [ -f "package.json" ]; then \
    npm install && \
    npm run build || echo "Frontend build failed, continuing anyway"; \
    else \
    echo "No package.json found, skipping frontend build"; \
    fi

# Back to the app directory
WORKDIR /app

# Copy environment variables example file
COPY .env.example .

# Expose ports
EXPOSE 8000 3000

# Create entrypoint script with conditional frontend startup and log directory creation
RUN echo '#!/bin/bash\n\
# Create log directories\n\
mkdir -p /app/logs\n\
mkdir -p /app/backend/logs\n\
chmod -R 777 /app/logs\n\
chmod -R 777 /app/backend/logs\n\
ln -sf /app/logs /app/backend/logs\n\
\n\
cd /app/backend\n\
uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
if [ -f "/app/frontend/package.json" ]; then\n\
  cd /app/frontend\n\
  npm start &\n\
fi\n\
wait' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Command to run when the container starts
CMD ["/app/entrypoint.sh"]
