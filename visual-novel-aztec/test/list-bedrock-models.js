import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function listAvailableModels() {
  console.log('🔍 Fetching available AWS Bedrock models...');
  console.log('This will show which models you have access to use.\n');
  
  try {
    // Check for credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('⚠️ AWS credentials not found in environment variables!');
      console.log('Make sure AWS credentials are configured before running this script.');
      console.log('Create a .env file in the project root with your credentials.\n');
    }
    
    // Create a client with better error handling
    const region = process.env.AWS_REGION || 'us-east-1';
    console.log(`Using AWS region: ${region}`);
    
    const client = new BedrockClient({ region });
    
    // List all foundation models
    console.log('Querying available models...');
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);
    
    console.log('\n=== AVAILABLE BEDROCK MODELS ===');
    
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
      } else {
        console.log('No text generation models found.');
      }
      
      console.log('\n💡 TIP: If no models appear above, you need to request model access:');
      console.log('1. Visit: https://console.aws.amazon.com/bedrock');
      console.log('2. Go to "Model access" in the left navigation');
      console.log('3. Request access to the models you need');
      console.log('4. For image generation, start with "Stability.stable-diffusion-xl" or "Amazon.titan-image"');
    } else {
      console.log('❌ No models available. Make sure to request model access in the AWS Bedrock console.');
    }
  } catch (error) {
    console.error('❌ Error fetching models:', error);
    
    if (error.Code === 'UnrecognizedClientException' || error.name === 'CredentialsProviderError') {
      console.log('\n💡 This looks like a credentials error. Check that:');
      console.log('1. You have AWS credentials set up properly');
      console.log('2. Your AWS credentials have permission to access Bedrock');
    } else if (error.Code === 'AccessDeniedException') {
      console.log('\n💡 Access denied. Make sure your IAM user/role has:');
      console.log('- bedrock:ListFoundationModels permission');
    }
    
    console.log('\n📋 SETUP GUIDE:');
    console.log('1. Create a .env file with:');
    console.log('   AWS_ACCESS_KEY_ID=your_access_key');
    console.log('   AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('   AWS_REGION=us-east-1');
    console.log('2. Install required dependencies:');
    console.log('   npm install @aws-sdk/client-bedrock @aws-sdk/client-bedrock-runtime dotenv');
  }
}

// Run the function
listAvailableModels().catch(console.error);
