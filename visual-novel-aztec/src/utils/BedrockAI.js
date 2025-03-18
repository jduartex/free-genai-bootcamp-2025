import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
export class BedrockAI {
    static initialize() {
        // Configure AWS SDK
        AWS.config.update({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        this.bedrock = new AWS.BedrockRuntime();
    }
    /**
     * Generate cultural facts about Aztecs that can be included in the game
     */
    static async generateCulturalFacts(topic, count = 3) {
        try {
            const model = 'anthropic.claude-v2';
            const prompt = `
        Generate ${count} historically accurate facts about Aztec culture related to ${topic}.
        Keep each fact brief (1-2 sentences) and focus on interesting details that would be
        educational in a Japanese language learning game set during the Spanish invasion.
      `;
            const params = {
                modelId: model,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    prompt: `Human: ${prompt}\n\nAssistant:`,
                    max_tokens_to_sample: 2000,
                    temperature: 0.7,
                    top_p: 0.9
                })
            };
            const response = await this.bedrock.invokeModel(params).promise();
            const responseBody = JSON.parse(response.body.toString());
            const facts = responseBody.completion.trim().split('\n\n');
            return facts.map((fact) => fact.replace(/^\d+\.\s*/, '').trim());
        }
        catch (error) {
            console.error('Error generating cultural facts:', error);
            return [`Aztecs had a complex society with advanced agriculture.`];
        }
    }
    /**
     * Generate image variations for game assets using Stable Diffusion
     */
    static async generateImageVariation(prompt, seed = Math.floor(Math.random() * 1000000)) {
        try {
            const model = 'stability.stable-diffusion-xl-v1';
            const params = {
                modelId: model,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    text_prompts: [{ text: prompt }],
                    seed: seed,
                    cfg_scale: 7,
                    steps: 30
                })
            };
            const response = await this.bedrock.invokeModel(params).promise();
            const responseBody = JSON.parse(response.body.toString());
            // Extract image data
            const base64Image = responseBody.artifacts[0].base64;
            const imageId = uuidv4();
            // Here you would save the image to your assets folder
            return `generated_image_${imageId}.png`;
        }
        catch (error) {
            console.error('Error generating image variation:', error);
            return '';
        }
    }
}
