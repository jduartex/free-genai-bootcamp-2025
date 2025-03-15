import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NodeVoiceGenerator } from './node-voice-generator.js';
import { StoryData, DialogEntry } from '../src/types/StoryTypes';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the NodeVoiceGenerator
NodeVoiceGenerator.initialize();

async function generateAllDialogueAudio() {
  console.log('Starting dialogue audio generation...');
  
  // Create audio directories if needed
  const audioDir = path.resolve(__dirname, '../public/assets/audio/dialogue');
  fs.mkdirSync(audioDir, { recursive: true });
  
  // Load all story data
  const storyDir = path.resolve(__dirname, '../public/story');
  const storyFiles = fs.readdirSync(storyDir)
    .filter(file => file.match(/^scene\d+\.json$/));
  
  console.log(`Found ${storyFiles.length} story files`);
  
  for (const storyFile of storyFiles) {
    console.log(`Processing ${storyFile}...`);
    
    // Load story data
    const storyPath = path.join(storyDir, storyFile);
    const storyData = JSON.parse(fs.readFileSync(storyPath, 'utf8')) as StoryData;
    const sceneId = storyData.id;
    
    // Process all dialogues
    const dialogues = Object.entries(storyData.dialog);
    console.log(`Found ${dialogues.length} dialogues in scene ${sceneId}`);
    
    for (const [dialogId, dialogEntry] of dialogues) {
      // Construct the audio key and output path
      const audioKey = `${sceneId}_${dialogId}_ja`;
      const outputPath = path.join(audioDir, `${audioKey}.mp3`);
      
      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        console.log(`Audio file already exists: ${audioKey}.mp3`);
        continue;
      }
      
      // Generate the audio
      console.log(`Generating audio for: ${audioKey}`);
      try {
        const characterVoice = NodeVoiceGenerator.getVoiceForCharacter(dialogEntry.speakerId);
        
        await NodeVoiceGenerator.generateVoiceForDialogue(
          audioKey,
          dialogEntry.japanese,
          'ja-JP',
          characterVoice
        );
        
        console.log(`✅ Generated audio for ${audioKey}`);
      } catch (error) {
        console.error(`❌ Failed to generate audio for ${audioKey}:`, error);
      }
    }
  }
  
  console.log('Audio generation completed!');
}

// Run the generator
generateAllDialogueAudio();
