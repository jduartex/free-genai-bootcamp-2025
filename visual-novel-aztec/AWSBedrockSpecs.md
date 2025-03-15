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
  