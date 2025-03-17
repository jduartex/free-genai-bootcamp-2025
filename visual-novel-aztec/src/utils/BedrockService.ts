import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

/**
 * Service for interacting with AWS Bedrock AI services
 * Handles image generation and text operations
 */
export class BedrockService {
  private static instance: BedrockService;
  private client: BedrockRuntimeClient;
  private preferredModel: string;
  
  private constructor() {
    this.client = new BedrockRuntimeClient({ 
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.preferredModel = process.env.BEDROCK_PREFERRED_MODEL || 'stability.stable-diffusion-xl-v1';
  }
  
  /**
   * Get the singleton instance of BedrockService
   */
  public static getInstance(): BedrockService {
    if (!BedrockService.instance) {
      BedrockService.instance = new BedrockService();
    }
    return BedrockService.instance;
  }
  
  /**
   * Generate an image based on text prompt
   */
  public async generateImage(
    prompt: string, 
    negativePrompt: string = '', 
    width: number = 512, 
    height: number = 512
  ): Promise<string> {
    const requestData = this.buildImageRequest(prompt, negativePrompt, width, height);
    
    try {
      return await this.invokeModel(this.preferredModel, requestData);
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }
  
  /**
   * Build the appropriate request format based on the model
   */
  private buildImageRequest(prompt: string, negativePrompt: string, width: number, height: number) {
    const model = this.preferredModel;
    
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
    } else if (model.startsWith("amazon.titan")) {
      return {
        textPrompt: prompt,
        negativePrompt: negativePrompt,
        width,
        height,
        quality: "standard",
        cfgScale: 7,
        seed: Math.floor(Math.random() * 1000000)
      };
    } else {
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
  
  /**
   * Invoke the Bedrock model with the given data
   */
  private async invokeModel(modelId: string, requestData: any): Promise<string> {
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
}
