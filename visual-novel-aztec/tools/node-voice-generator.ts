/**
 * Node.js specific implementation of voice generation
 * This file is only used in the build process, not in the browser
 */
import { PollyClient, SynthesizeSpeechCommand, Engine, TextType, OutputFormat, VoiceId } from '@aws-sdk/client-polly';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

// Use process.cwd() instead of trying to use __dirname and __filename
const projectRoot = process.cwd();

export class NodeVoiceGenerator {
  private static polly: PollyClient;
  private static initialized = false;
  private static outputDir = path.resolve(projectRoot, 'public/assets/audio/optimized/voices');

  /**
   * Initialize the AWS SDK with credentials
   */
  static initialize(): void {
    if (!this.initialized) {
      // Check for AWS credentials
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.warn('⚠️ AWS credentials not found in environment variables!');
        console.warn('Voice generation will not work without valid AWS credentials.');
        console.warn('Make sure you have created a .env file with:');
        console.warn('AWS_ACCESS_KEY_ID=your_access_key');
        console.warn('AWS_SECRET_ACCESS_KEY=your_secret_key');
        console.warn('AWS_REGION=us-east-1');
      }
      
      // Create the Polly service client
      this.polly = new PollyClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }
      });

      // Create output directory if it doesn't exist
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
        console.log(`Created output directory: ${this.outputDir}`);
      }

      this.initialized = true;
      console.log('AWS Polly client initialized');
    }
  }

  /**
   * Get the appropriate voice for a character
   */
  static getVoiceForCharacter(character: string): VoiceId {
    // Map characters to voice IDs using the VoiceId enum
    const voiceMap: Record<string, VoiceId> = {
      'tlaloc': VoiceId.Takumi, // Japanese male
      'citlali': VoiceId.Kazuha, // Japanese female
      'diego': VoiceId.Miguel,   // Spanish male
      'default': VoiceId.Joanna // Default English voice
    };

    return voiceMap[character.toLowerCase()] || voiceMap.default;
  }

  /**
   * Generate voice audio for a dialogue entry
   */
  static async generateVoiceForDialogue(
    id: string,
    text: string,
    language: 'ja-JP' | 'en-US' | 'es-ES',
    voice: VoiceId
  ): Promise<string> {
    if (!this.initialized) {
      this.initialize();
    }

    // Ensure valid filename
    const safeId = id.replace(/[^a-z0-9_-]/gi, '_');
    const outputPath = path.join(this.outputDir, `${safeId}.mp3`);

    // Skip if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Audio file already exists for ${id}, skipping generation.`); // Fixed: syntax error with parentheses
      return outputPath;
    }

    // Configure the voice synthesis request
    const params = {
      Engine: Engine.NEURAL,
      OutputFormat: OutputFormat.MP3,
      Text: text,
      TextType: TextType.TEXT,
      VoiceId: voice,
      LanguageCode: language
    };

    try {
      // Call AWS Polly to synthesize speech
      const command = new SynthesizeSpeechCommand(params);
      const response = await this.polly.send(command);

      if (!response.AudioStream) {
        throw new Error('No audio data received from AWS Polly');
      }

      // Convert AudioStream to buffer and save to file
      const audioBuffer = await this.streamToBuffer(response.AudioStream ?? []);
      fs.writeFileSync(outputPath, audioBuffer);

      console.log(`Voice audio generated successfully: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Error generating voice audio:', error);
      throw error;
    }
  }

  /**
   * Helper method to convert AWS stream to buffer
   */
  private static async streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      // Handle AWS SDK stream which is typically a Readable stream
      if (stream instanceof Readable) {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        return;
      }
      
      // Handle web ReadableStream
      if (stream && typeof stream.getReader === 'function') {
        const reader = stream.getReader();
        
        const processRead = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(Buffer.from(value));
            }
            resolve(Buffer.concat(chunks));
          } catch (error) {
            reject(error);
          }
        };
        
        processRead();
        return;
      }
      
      // Fallback for any other stream type
      reject(new Error('Unsupported stream type'));
    });
  }
}

// Add this line to ensure the export is properly recognized
export default NodeVoiceGenerator;
