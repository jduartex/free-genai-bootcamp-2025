#!/bin/bash

# Set test environment
export TESTING=true
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Running all backend tests..."

# Run tests with coverage
pytest -v --cov=backend \
        --cov-report=term-missing \
        --cov-report=html:coverage_report \
        backend/tests/

# Check if tests passed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo "Coverage report generated in coverage_report/index.html"
else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
fi
