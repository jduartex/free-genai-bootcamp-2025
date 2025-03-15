import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Import dotenv normally, but only use it in Node.js environment
import dotenv from 'dotenv';

// Only configure dotenv in Node.js environment
if (typeof process !== 'undefined' && process.env && !process.env.BROWSER) {
  try {
    dotenv.config();
  } catch (e) {
    console.warn('Could not configure dotenv:', e);
  }
}

/**
 * BedrockService - Handles AWS Bedrock API interactions for AI-generated content
 */
export class BedrockService {
  private static instance: BedrockService;
  private client: BedrockRuntimeClient;
  private region: string;
  private preferredModel: string;

  private constructor(region?: string) {
    // Get AWS region from process.env or provided region or default
    this.region = region || (typeof process !== 'undefined' ? process.env.AWS_REGION : undefined) || "us-east-1";
    this.client = new BedrockRuntimeClient({ region: this.region });
    this.preferredModel = (typeof process !== 'undefined' ? process.env.BEDROCK_PREFERRED_MODEL : undefined) || "stability.stable-diffusion-xl-v1";
    
    // Simple log to confirm service initialization
    console.log(`BedrockService initialized with region: ${this.region}`);
  }

  /**
   * Get the singleton instance of BedrockService
   */
  public static getInstance(region?: string): BedrockService {
    if (!BedrockService.instance) {
      BedrockService.instance = new BedrockService(region);
    }
    return BedrockService.instance;
  }

  /**
   * Generate an image using Stable Diffusion
   * @param prompt The text prompt to generate the image
   * @param negativePrompt Optional negative prompt to guide what not to include
   * @param width Image width (default 512)
   * @param height Image height (default 512)
   * @returns Base64 encoded image data
   */
  public async generateImage(
    prompt: string,
    negativePrompt: string = "",
    width: number = 512,
    height: number = 512
  ): Promise<string> {
    try {
      // Use preferred model from env or default
      const modelId = this.preferredModel;
      
      const request = {
        prompt: [
          {
            text: prompt,
            weight: 1.0
          }
        ],
        negative_prompt: negativePrompt ? [{ text: negativePrompt }] : [],
        cfg_scale: 7,
        steps: 30,
        seed: Math.floor(Math.random() * 1000000),
        width,
        height
      };

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(request),
        contentType: "application/json",
        accept: "application/json"
      });

      const response = await this.client.send(command);
      
      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.artifacts[0].base64;
    } catch (error) {
      console.error("Error generating image with Bedrock:", error);
      throw error;
    }
  }

  /**
   * Generate variations of an existing image
   * @param imageBase64 Base64 encoded image to create variations of
   * @param prompt Additional guidance prompt
   * @param count Number of variations to generate
   * @returns Array of Base64 encoded images
   */
  public async generateImageVariations(
    imageBase64: string,
    prompt: string = "",
    count: number = 1
  ): Promise<string[]> {
    try {
      // Use the appropriate model for image variations
      const modelId = "stability.stable-diffusion-xl-v1";
      
      const request = {
        init_image: imageBase64,
        prompt: [{ text: prompt, weight: 1.0 }],
        image_strength: 0.35, // Control how much the original image influences the result
        samples: count,
        steps: 40
      };

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(request),
        contentType: "application/json",
        accept: "application/json"
      });

      const response = await this.client.send(command);
      
      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Return all generated variations
      return responseBody.artifacts.map((artifact: any) => artifact.base64);
    } catch (error) {
      console.error("Error generating image variations with Bedrock:", error);
      throw error;
    }
  }

  /**
   * Generate text using Claude model
   * @param prompt The prompt to generate text from
   * @returns Generated text
   */
  public async generateText(prompt: string): Promise<string> {
    try {
      const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
      
      const request = {
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
      };

      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(request),
        contentType: "application/json",
        accept: "application/json"
      });

      const response = await this.client.send(command);
      
      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.completion;
    } catch (error) {
      console.error("Error generating text with Bedrock:", error);
      throw error;
    }
  }
}
