#!/bin/bash

# Get the absolute directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Go to project root directory
cd "$SCRIPT_DIR/.."

# Run the node script with the appropriate loader
NODE_NO_WARNINGS=1 node --loader ts-node/esm test/list-bedrock-models.js

# Exit with the same status code as the Node.js script
exit $?
