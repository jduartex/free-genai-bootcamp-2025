#!/usr/bin/env node --loader ts-node/esm

import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listAvailableModels(): Promise<void> {
  const region = process.env.AWS_REGION || 'us-east-1';
  
  console.log(`Connecting to AWS Bedrock in region: ${region}`);
  console.log('Retrieving available models...');
  
  const client = new BedrockClient({ region });
  
  try {
    // Get all available models
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);
    
    if (response.modelSummaries && response.modelSummaries.length > 0) {
      // Find all image generation models
      const imageModels = response.modelSummaries.filter(model => 
        model.outputModalities?.includes('IMAGE')
      );
      
      // Find all text generation models
      const textModels = response.modelSummaries.filter(model => 
        model.outputModalities?.includes('TEXT') && !model.outputModalities?.includes('IMAGE')
      );
      
      console.log('\n🖼️ IMAGE GENERATION MODELS:');
      if (imageModels.length > 0) {
        imageModels.forEach(model => {
          console.log(`- ${model.modelId} (${model.providerName})`);
        });
        
        console.log('\nTo use one of these models in your test scripts:');
        console.log('BEDROCK_PREFERRED_MODEL=model.id.here node test/bedrock-node-test.js');
      } else {
        console.log('No image generation models found. You need to enable model access in AWS Bedrock console.');
      }
      
      console.log('\n📝 TEXT GENERATION MODELS:');
      if (textModels.length > 0) {
        textModels.forEach(model => {
          console.log(`- ${model.modelId} (${model.providerName})`);
        });
        
        console.log('\nTo use one of these models in your test scripts:');
        console.log('BEDROCK_PREFERRED_TEXT_MODEL=model.id.here node test/bedrock-node-test.js');
      } else {
        console.log('No text generation models found. You need to enable model access in AWS Bedrock console.');
      }
    } else {
      console.log('No models available. You need to enable model access in AWS Bedrock console.');
      console.log('Visit the AWS Bedrock console and request access to models.');
    }
  } catch (error) {
    console.error('Error listing models:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure you have AWS credentials configured');
    console.log('2. Verify your AWS account has access to AWS Bedrock service');
    console.log('3. Check that you have enabled at least one model in the AWS Bedrock console');
    console.log('\n📦 DEPENDENCIES:');
    console.log('   npm install @aws-sdk/client-bedrock @aws-sdk/client-bedrock-runtime dotenv');
  }
}

// Run the function if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  listAvailableModels();
}

export { listAvailableModels };
