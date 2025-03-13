FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including git for package building
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
# Skip problematic dependencies for manifold3d by setting an environment variable
ENV SKIP_TRIMESH_MANIFOLD=1
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ backend/
COPY scripts/ scripts/

# Create necessary directories
RUN mkdir -p data db logs

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

# Create entrypoint script with conditional frontend startup
RUN echo '#!/bin/bash\n\
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
