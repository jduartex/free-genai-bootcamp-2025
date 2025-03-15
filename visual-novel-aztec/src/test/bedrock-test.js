// Simple JS version that can run directly without TypeScript issues

const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const fs = require('fs');
const path = require('path');

// Simplified test script for AWS Bedrock functionality
class BedrockTester {
  constructor(region = "us-east-1") {
    this.client = new BedrockRuntimeClient({ region });
    this.outputDir = path.join(__dirname, '../../test-output');
  }

  async run() {
    console.log('🧪 STARTING BEDROCK INTEGRATION TESTS');
    console.log('==================================');

    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Test 1: Generate an image directly
      await this.testImageGeneration();
      
      console.log('\n🎉 All tests completed!');
    } catch (error) {
      console.error('❌ Test failed with error:', error);
      process.exit(1);
    }
  }

  async testImageGeneration() {
    console.log('\n📊 Testing direct image generation...');
    
    try {
      const modelId = "stability.stable-diffusion-xl-v1";
      
      const request = {
        prompt: [
          {
            text: "An Aztec temple with detailed stone carvings in a jungle setting",
            weight: 1.0
          }
        ],
        negative_prompt: [{ text: "blurry, modern, low quality" }],
        cfg_scale: 7,
        steps: 30,
        seed: Math.floor(Math.random() * 1000000),
        width: 512,
        height: 512
      };

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(request),
        contentType: "application/json",
        accept: "application/json"
      });

      console.log('- Sending request to Bedrock API...');
      const response = await this.client.send(command);
      
      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const imageBase64 = responseBody.artifacts[0].base64;
      
      console.log('✅ Image generated successfully!');
      
      // Save the generated image
      const outputPath = path.join(this.outputDir, 'test-aztec-temple.png');
      fs.writeFileSync(outputPath, Buffer.from(imageBase64, 'base64'));
      console.log(`📁 Image saved to: ${outputPath}`);
      
      return imageBase64;
    } catch (error) {
      console.error("❌ Image generation test failed:", error);
      throw error;
    }
  }
}

// Check for AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️ AWS credentials not found in environment variables!');
  console.log('ℹ️ Make sure AWS credentials are configured before running the tests.');
}

// Run the tests
const tester = new BedrockTester();
tester.run()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
