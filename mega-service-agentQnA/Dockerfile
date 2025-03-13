FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for frontend
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ backend/
COPY scripts/ scripts/

# Create necessary directories
RUN mkdir -p data db logs

# Set up frontend
COPY frontend/ frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Back to the app directory
WORKDIR /app

# Copy environment variables example file
COPY .env.example .

# Expose ports
EXPOSE 8000 3000

# Create entrypoint script
RUN echo '#!/bin/bash\n\
cd /app/backend\n\
uvicorn main:app --host 0.0.0.0 --port 8000 &\n\
cd /app/frontend\n\
npm start' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Command to run when the container starts
CMD ["/app/entrypoint.sh"]
