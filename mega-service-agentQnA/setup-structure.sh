#!/bin/bash
# Script to create the initial project structure

# Create main directories
mkdir -p backend/routes backend/services backend/utils backend/models
mkdir -p frontend/src/components frontend/src/services frontend/public
mkdir -p data db logs scripts tests/data

# Create placeholder files to preserve directory structure
touch data/.gitkeep db/.gitkeep logs/.gitkeep
