import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ImageRequest {
  text_prompts?: { text: string; weight: number }[];
  textPrompt?: string;
  negativePrompt?: string;
  width: number;
  height: number;
  cfg_scale?: number;
  steps?: number;
  seed?: number;
  quality?: string;
  cfgScale?: number;
}

/**
 * Test script for AWS Bedrock in Node.js environment
 * - Simplified version without model availability checking
 */
class BedrockNodeTester {
  private region: string;
  private client: BedrockRuntimeClient;
  private outputDir: string;
  private activeImageModelId: string;

  constructor(region = "us-east-1") {
    // Allow region override via environment variable
    this.region = process.env.AWS_REGION || region;
    this.client = new BedrockRuntimeClient({ region: this.region });
    this.outputDir = '/Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/visual-novel-aztec/test-output';
    
    // Try Amazon's Titan model which is often enabled by default
    this.activeImageModelId = process.env.BEDROCK_PREFERRED_MODEL || "amazon.titan.1";
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async runTests(): Promise<boolean> {
    console.log('🔍 STARTING AWS BEDROCK TESTS');
    console.log('============================\n');
    console.log(`Using AWS region: ${this.region}`);
    console.log(`Using model: ${this.activeImageModelId}\n`);

    try {
      // 1. Test Direct Image Generation
      await this.testImageGeneration();
      
      // 2. Test Dialog Box Generation
      await this.testDialogBoxGeneration();
      
      // 3. Test Button Generation
      await this.testButtonGeneration();
      
      console.log('\n============================');
      console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY');
      console.log(`📁 Results saved in: ${this.outputDir}`);
      
      return true;
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.printTroubleshootingGuide();
      return false;
    }
  }

  async testImageGeneration(): Promise<string> {
    console.log('TEST 1: Direct Image Generation');
    
    try {
      const request = this.buildImageRequest("An Aztec temple in the jungle with detailed stone carvings", 
                                            "blurry, low quality");
      
      console.log('- Generating test image...');
      const imageBase64 = await this.invokeModel(this.activeImageModelId, request);
      
      await this.saveBase64Image(
        imageBase64, 
        path.join(this.outputDir, 'bedrock-direct-generation.png')
      );
      
      console.log('✅ Direct image generation test completed\n');
      return imageBase64;
    } catch (error) {
      console.error("❌ Image generation test failed:", error);
      throw error;
    }
  }

  async testDialogBoxGeneration(): Promise<string> {
    console.log('TEST 2: Dialog Box Generation');
    
    try {
      const prompt = "A beautiful dialog box for a visual novel game with an Aztec stone with gold inlays aesthetic. " +
                    "The design should have empty space in the middle for text. Semi-transparent, elegant design with " +
                    "Aztec ornaments and decorations around the border.";
                    
      const negativePrompt = "text, words, intrusive elements in the center, blur, low quality";
      
      // Fix dimensions to be multiples of 64 as required by the model
      const width = 768; // Changed from 800 to 768 (multiple of 64)
      const height = 256; // Changed from 250 to 256 (multiple of 64)
      
      const request = this.buildImageRequest(prompt, negativePrompt, width, height);
      
      console.log('- Generating dialog box...');
      const imageBase64 = await this.invokeModel(this.activeImageModelId, request);
      
      await this.saveBase64Image(
        imageBase64, 
        path.join(this.outputDir, 'ui-dialog-box.png')
      );
      
      console.log('✅ Dialog box generation test completed\n');
      return imageBase64;
    } catch (error) {
      console.error("❌ Dialog box generation test failed:", error);
      throw error;
    }
  }

  async testButtonGeneration(): Promise<string> {
    console.log('TEST 3: Button Generation');
    
    try {
      const prompt = "A high-quality UI button with an ancient stone carving style. Clean, isometric view, suitable " +
                    "for a visual novel game. The button should complement an Aztec theme. No text on the button.";
                    
      const negativePrompt = "text, words, labels, blur, distortion, low quality, flat design";
      
      // Fix dimensions to meet 256x256 minimum size requirement
      const width = 320; // Already a multiple of 64 and > 256
      const height = 256; // Changed from 128 to 256 (minimum required by the model)
      
      const request = this.buildImageRequest(prompt, negativePrompt, width, height);

      console.log('- Generating button...');
      const imageBase64 = await this.invokeModel(this.activeImageModelId, request);
      
      await this.saveBase64Image(
        imageBase64, 
        path.join(this.outputDir, 'ui-button.png')
      );
      
      console.log('✅ Button generation test completed\n');
      return imageBase64;
    } catch (error) {
      console.error("❌ Button generation test failed:", error);
      throw error;
    }
  }

  // Build appropriate request format based on the model
  buildImageRequest(prompt: string, negativePrompt: string, width = 512, height = 512): ImageRequest {
    const model = this.activeImageModelId || "";
    
    // For Stability AI models
    if (model.startsWith("stability.")) {
      return {
        text_prompts: [
          { text: prompt, weight: 1.0 },
          { text: negativePrompt, weight: -1.0 }
        ],
        cfg_scale: 7,
        steps: 30,
        seed: Math.floor(Math.random() * 1000000),
        width,
        height
      };
    } 
    // For Amazon Titan models
    else if (model.startsWith("amazon.titan")) {
      return {
        textPrompt: prompt,
        negativePrompt: negativePrompt,
        width,
        height,
        quality: "standard",
        cfgScale: 7,
        seed: Math.floor(Math.random() * 1000000)
      };
    }
    // Default format (stability)
    else {
      return {
        text_prompts: [
          { text: prompt, weight: 1.0 },
          { text: negativePrompt, weight: -1.0 }
        ],
        cfg_scale: 7,
        steps: 30,
        seed: Math.floor(Math.random() * 1000000),
        width,
        height
      };
    }
  }

  async invokeModel(modelId: string, requestData: ImageRequest): Promise<string> {
    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify(requestData),
      contentType: "application/json",
      accept: "application/json"
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Handle different response formats from different models
    if (responseBody.artifacts && responseBody.artifacts.length > 0) {
      return responseBody.artifacts[0].base64;
    } else if (responseBody.images && responseBody.images.length > 0) {
      return responseBody.images[0].base64; 
    } else if (responseBody.image) {
      return responseBody.image;
    } else {
      throw new Error("Unexpected response format: " + JSON.stringify(responseBody));
    }
  }

  async saveBase64Image(base64: string, outputPath: string): Promise<void> {
    try {
      const imageBuffer = Buffer.from(base64, 'base64');
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`✅ Image saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Error saving image:', error);
      throw error;
    }
  }
  
  printTroubleshootingGuide(): void {
    console.log('\n🔧 TROUBLESHOOTING GUIDE:');
    console.log('1. Check your AWS credentials are properly set up');
    console.log('2. Verify you have access to AWS Bedrock in your AWS account');
    console.log('3. Make sure you have enabled the model you are trying to use');
    console.log('4. If you get dimension errors, try using multiples of 64 for width/height');
    console.log('5. Some models require minimum dimensions of 256x256');
    console.log('\nYou can list available models with:');
    console.log('npm run list:models');
  }
}

// Run the tests if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new BedrockNodeTester();
  tester.runTests().catch(console.error);
}

export { BedrockNodeTester };
