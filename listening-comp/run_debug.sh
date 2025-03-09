#!/bin/bash
# Debug script for Streamlit

# Set environment variables for debugging
export STREAMLIT_LOGGER_LEVEL=debug
export PYTHONVERBOSE=1
export PYTHONTRACEMALLOC=1

# Run Streamlit with debug options
streamlit run app.py \
  --logger.level=debug \
  --client.showErrorDetails=true \
  --browser.gatherUsageStats=false \
  --server.enableCORS=false \
  --server.enableXsrfProtection=false \
  --server.runOnSave=true \
  --server.headless=false \
  --theme.base=light
