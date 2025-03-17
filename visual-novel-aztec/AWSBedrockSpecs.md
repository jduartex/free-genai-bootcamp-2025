# AWS Bedrock Integration for Visual Novel Game

## Overview

This document describes the implementation of AWS Bedrock services to enhance the visual novel game with AI-generated content, specifically for UI elements and character image variations.

## Architecture

We've created a modular architecture with the following components:

1. **BedrockService** - Core service that handles AWS API calls
2. **AssetCache** - Caching system for generated assets to reduce API calls
3. **UIGenerator** - Utility to generate themed UI elements
4. **ImageVariationGenerator** - Utility to create character expression variations

![Architecture Diagram](https://mermaid.ink/img/pako:eNp9UsFOAyEU_JXN2YTW9dBjk8bGXtpDb_DAAlvaLgvAaE38dwGp1t02JLww7wwz8JhCYw1BDp3cKHoCa6WB5wjOD4Ypl_0xsLMeaN05e6RFNWsSG0FjZvbbNnVBVKeNhLUTMZCIPqygCy9BPBlPJl_3CMfPdNfStXnJrAJ-kOySyTXIzCc0Ob0p62ohqqFxVLxobrOJ5SIWoFL_KtSgmfG1uhQU1bpQsZsGCsadaekmJScUgQIn-wiX4FDi5f-FJgp8nWF4H0PG5o2Ny9tNaapqbtyvxdvkIdlVZbWjSo3SmQwyE3OZ2tt4sMN4pHLrwA2BI7jJJ3pTo8wMQzWY_gPJJ45v)

## Features Implemented

### 1. Dynamic UI Generation

The system can generate custom UI elements based on thematic descriptions, including:

- **Dialog boxes** - Themed backgrounds for conversation dialogs
- **Buttons** - Custom styled buttons matching the game's aesthetic

### 2. Character Expression Variations

- Generate different facial expressions for characters
- Maintain consistent art style and character identity
- Apply expressions in real-time during gameplay

### 3. Asset Caching System

- In-memory cache to avoid redundant API calls
- LocalStorage persistence between sessions
- Automatic pruning of older assets when storage limits are reached

## Implementation Details

### 1. BedrockService

The core service that handles communication with AWS Bedrock APIs:

- Image generation using Stable Diffusion XL
- Image variations based on existing character images
- Text generation using Claude model

```typescript
// Example usage
const bedrock = BedrockService.getInstance();
const imageBase64 = await bedrock.generateImage(
  "A beautiful Aztec temple with sunlight streaming through vines",
  "blurry, dark, modern elements",
  1024, 
  768
);
```

### 2. UIGenerator

Handles creation of themed UI elements:

- Dialog boxes with cultural themes
- Buttons and other interactive elements
- Applies generated elements to game objects

```typescript
// Example usage
const uiGenerator = UIGenerator.getInstance();
const dialogBoxBase64 = await uiGenerator.generateDialogBox("Aztec stone with hieroglyphics");
await uiGenerator.applyImageToGameObject(scene, dialogBox, dialogBoxBase64, "themed_dialog");
```

### 3. ImageVariationGenerator

Creates variations of character images for different expressions:

- Extracts base character image
- Generates variations with specific expressions
- Applies new expressions to character sprites

```typescript
// Example usage
const generator = ImageVariationGenerator.getInstance();
await generator.generateCharacterExpression(
  scene,
  "tlaloc",
  "happy",
  "tlaloc"
);
```

### 4. AssetCache

Provides efficient caching of generated assets:

- In-memory cache for quick access
- LocalStorage persistence
- Automatic pruning when storage limits are reached

## Setup Instructions

1. **Install AWS SDK Dependencies:**

```bash
npm install @aws-sdk/client-bedrock-runtime
```

2. **Configure AWS Credentials:**

You can configure credentials using one of the following approaches:

- **Environment variables:**
  ```bash
  export AWS_ACCESS_KEY_ID=your-access-key
  export AWS_SECRET_ACCESS_KEY=your-secret-key
  export AWS_REGION=us-east-1
  ```

- **AWS credentials file (~/.aws/credentials):**
  
  ## Testing AWS Bedrock Integration

To verify your AWS Bedrock credentials and test the integration:

### Prerequisites

1. Ensure you have Node.js installed (version 14+)
2. Install dependencies with `npm install @aws-sdk/client-bedrock-runtime dotenv`
3. Configure your AWS credentials using one of these methods:
   - Create an `.env` file with AWS credentials:
     ```
     AWS_ACCESS_KEY_ID=your_access_key
     AWS_SECRET_ACCESS_KEY=your_secret_key
     AWS_REGION=us-east-1
     ```
   - Configure AWS CLI with `aws configure`
   - Set environment variables directly:
     ```bash
     export AWS_ACCESS_KEY_ID=your_access_key
     export AWS_SECRET_ACCESS_KEY=your_secret_key
     export AWS_REGION=us-east-1
     ```

### Running the Test Script

```bash
# First, ensure you're in the project root directory
cd /Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/visual-novel-aztec

# Create a directory for the script (if it doesn't exist)
mkdir -p test

# Create a directory for test output
mkdir -p test-output

# Navigate to the scripts directory
cd test

# Run the test script
node bedrock-node-test.js
```

### Script Options

You can customize the script execution with environment variables:

```bash
# Run with a specific AWS region
AWS_REGION=us-west-2 node bedrock-node-test.js

# Use a different AI model
BEDROCK_PREFERRED_MODEL=amazon.titan-image-generator-v1 node bedrock-node-test.js

# Enable debug output
DEBUG=true node bedrock-node-test.js
```

### Expected Output

If successful, you should see:
- Test messages showing progress for each test (Direct Image, Dialog Box, Button)
- Generated images saved in the `../../test-output` directory:
  - `bedrock-direct-generation.png` - Basic image test
  - `ui-dialog-box.png` - Dialog box UI element
  - `ui-button.png` - Button UI element
- A final "ALL TESTS COMPLETED SUCCESSFULLY" message

### Troubleshooting

If you encounter errors:

1. **AWS Credentials Issues**:
   - Verify your AWS access key and secret key are correct
   - Check that your IAM user/role has the `bedrock:InvokeModel` permission

2. **Model Access Issues**:
   - You must explicitly enable models in the AWS Bedrock console:
     - Visit https://console.aws.amazon.com/bedrock
     - Go to "Model access" in the left navigation
     - Request access to "Stable Diffusion XL" by Stability AI
     - Wait for access approval (usually immediate)

3. **Region Issues**:
   - Ensure AWS Bedrock is available in your selected region
   - Try `us-east-1` or `us-west-2` if experiencing issues

4. **API Rate Limits**:
   - AWS Bedrock has rate limits that may cause throttling errors
   - If you see "ThrottlingException", wait a few minutes and try again

### Inspecting Test Results

After successful execution:

1. Check the `test-output` directory for generated images
2. Verify the quality and correctness of the generated assets
3. If images show any issues:
   - Try adjusting prompts in the script
   - Ensure stable internet connection
   - Check if the model has any specific requirements or limitations