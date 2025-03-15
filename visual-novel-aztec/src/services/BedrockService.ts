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
  private isMockMode: boolean = false;

  private constructor(region?: string) {
    // Get AWS region from process.env or provided region or default
    this.region = region || (typeof process !== 'undefined' ? process.env.AWS_REGION : undefined) || "us-east-1";
    
    // Check for credentials and set mock mode if missing
    const credentials = this.getCredentials();
    if (!credentials) {
      console.warn("⚠️ AWS credentials not found. Running in mock mode.");
      this.isMockMode = true;
    }
    
    // Create client with credentials if available
    this.client = new BedrockRuntimeClient({
      region: this.region,
      credentials: credentials || undefined
    });
    
    this.preferredModel = (typeof process !== 'undefined' ? process.env.BEDROCK_PREFERRED_MODEL : undefined) || "stability.stable-diffusion-xl-v1";
    
    // Simple log to confirm service initialization
    console.log(`BedrockService initialized with region: ${this.region}, Mock mode: ${this.isMockMode}`);
  }
  
  /**
   * Get credentials from various sources
   */
  private getCredentials(): any {
    // For browser environments, try to get from localStorage or window.AWS_CONFIG
    if (typeof window !== 'undefined') {
      try {
        // Try window.AWS_CONFIG global var (could be set from backend)
        if ((window as any).AWS_CONFIG?.accessKeyId && (window as any).AWS_CONFIG?.secretAccessKey) {
          return {
            accessKeyId: (window as any).AWS_CONFIG.accessKeyId,
            secretAccessKey: (window as any).AWS_CONFIG.secretAccessKey
          };
        }
        
        // Check localStorage (for development purposes - not secure for production)
        const accessKeyId = localStorage.getItem('AWS_ACCESS_KEY_ID');
        const secretAccessKey = localStorage.getItem('AWS_SECRET_ACCESS_KEY');
        
        if (accessKeyId && secretAccessKey) {
          return {
            accessKeyId,
            secretAccessKey
          };
        }
      } catch (e) {
        console.warn('Error accessing AWS credentials:', e);
      }
    }
    
    // For Node.js, credentials will be automatically loaded from env vars
    return null;
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
      // In mock mode, return placeholder images
      if (this.isMockMode) {
        console.log(`🔹 Using mock image for prompt: "${prompt.substring(0, 30)}..."`);
        return this.getMockImage(prompt);
      }
      
      console.log(`🔸 Generating image with AWS Bedrock: "${prompt.substring(0, 30)}..."`);
      
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
      
      console.log("✅ Image generated successfully with Bedrock API");
      return responseBody.artifacts[0].base64;
    } catch (error: unknown) {
      console.error(`❌ Error details for Bedrock image generation:`, error);
      
      if (typeof error === 'object' && error !== null) {
        if ('name' in error && error.name === "ExpiredTokenException") {
          console.error("⚠️ AWS token expired. Please update your credentials.");
        } else if ('message' in error && typeof error.message === 'string' && error.message.includes("credentials")) {
          console.error("⚠️ AWS credentials issue. Make sure credentials are properly configured.");
        }
      }
      
      console.warn(`⚠️ Falling back to mock image for: "${prompt.substring(0, 30)}..."`);
      return this.getMockImage(prompt);
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error("Error generating text with Bedrock:", error);
      throw error;
    }
  }

  /**
   * Get a mock image based on the prompt type
   */
  private getMockImage(prompt: string): string {
    const placeholderPath = this.getPlaceholderPath(prompt);
    console.log(`Using placeholder image: ${placeholderPath}`);
    return placeholderPath;
  }
  
  /**
   * Get appropriate placeholder image path based on prompt content
   */
  private getPlaceholderPath(prompt: string): string {
    // Return different placeholder paths based on prompt contents
    if (prompt.includes("dialog box") || prompt.includes("dialogue box")) {
      return "assets/ui/default_dialog.png";
    } else if (prompt.includes("button")) {
      return "assets/ui/default_button.png";
    } else if (prompt.includes("village") || prompt.includes("aztec village")) {
      return "assets/backgrounds/village.png";
    } else if (prompt.includes("prison") || prompt.includes("cell")) {
      return "assets/backgrounds/prison.png";
    } else if (prompt.includes("temple")) {
      return "assets/backgrounds/temple.png";
    } else {
      return "assets/backgrounds/default.png";
    }
  }
}
