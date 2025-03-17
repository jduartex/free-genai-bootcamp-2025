# AWS Bedrock Asset Generation for Visual Novel

This document explains how to generate assets for the Aztec Visual Novel using AWS Bedrock.

## Prerequisites

Before you can use AWS Bedrock to generate assets, you need:

1. An AWS account with access to AWS Bedrock service
2. AWS credentials with appropriate permissions
3. Access to at least one image generation model (e.g., Stable Diffusion XL or Amazon Titan)

## Setup

1. Create a `.env` file in the project root with your AWS credentials:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
BEDROCK_PREFERRED_MODEL=stability.stable-diffusion-xl-v1
```

2. Install required dependencies:

```bash
npm install @aws-sdk/client-bedrock-runtime dotenv
```

## Generating Assets

The project includes a script to generate all necessary assets using AWS Bedrock:

```bash
# Install ts-node if you don't have it
npm install -g ts-node

# Generate all assets
node scripts/generate-assets.js --all

# Or generate specific asset types
node scripts/generate-assets.js --backgrounds
node scripts/generate-assets.js --ui
node scripts/generate-assets.js --characters
```

The generated assets will be saved in the following directories:

- Scene backgrounds: `public/assets/scenes/`
- UI elements: `public/assets/ui/`
- Character portraits: `public/assets/characters/`

## Adding New Assets

To add new asset generation:

1. Update the respective arrays in `scripts/generate-assets.ts`
2. Add new scenes, UI elements, or characters with appropriate prompts
3. Run the script with the corresponding flag

## Troubleshooting

If you encounter issues:

1. Check that your AWS credentials have permission to use Bedrock services
2. Verify that you have enabled the specific models you're trying to use in the AWS Bedrock console
3. Look for errors in the console output that might indicate specific issues
4. Try a different model if one isn't producing good results

## Model Selection

You can specify which model to use by setting the `BEDROCK_PREFERRED_MODEL` environment variable:

- For Stable Diffusion: `stability.stable-diffusion-xl-v1`
- For Amazon Titan: `amazon.titan-image-generator-v1`

Different models may produce different styles of images, so experiment to find the best fit for your game's aesthetic.
