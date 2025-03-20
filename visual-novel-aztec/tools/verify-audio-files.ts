import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyAudioFiles() {
  console.log('Verifying dialogue audio files...');
  
  // Get audio directory
  const audioDir = path.resolve(__dirname, '../public/assets/audio/optimized/dialogue');
  
  // Check if directory exists
  if (!fs.existsSync(audioDir)) {
    console.error(`❌ Audio directory not found: ${audioDir}`);
    console.log('Creating the directory structure...');
    fs.mkdirSync(audioDir, { recursive: true });
    console.log(`✅ Created directory: ${audioDir}`);
    return;
  }
  
  // List all files in the directory
  const audioFiles = fs.readdirSync(audioDir)
    .filter(file => file.endsWith('.mp3'));
  
  console.log(`Found ${audioFiles.length} audio files in ${audioDir}`);
  
  // Get story directory
  const storyDir = path.resolve(__dirname, '../public/story');
  if (!fs.existsSync(storyDir)) {
    console.error(`❌ Story directory not found: ${storyDir}`);
    return;
  }
  
  // List all story files
  const storyFiles = fs.readdirSync(storyDir)
    .filter(file => file.match(/^scene\d+\.json$/));
  
  console.log(`Found ${storyFiles.length} story files`);
  
  // Load each story file and check if corresponding audio files exist
  let totalDialogues = 0;
  let missingAudio = 0;
  
  for (const storyFile of storyFiles) {
    // Load story data
    const storyPath = path.join(storyDir, storyFile);
    let storyData;
    
    try {
      const storyContent = fs.readFileSync(storyPath, 'utf8');
      storyData = JSON.parse(storyContent);
    } catch (error) {
      console.error(`❌ Failed to parse ${storyFile}:`, error);
      continue;
    }
    
    const sceneId = storyData.id;
    const dialogues = Object.keys(storyData.dialog);
    totalDialogues += dialogues.length;
    
    console.log(`Checking ${dialogues.length} dialogues in ${sceneId}...`);
    
    for (const dialogId of dialogues) {
      const audioKey = `${sceneId}_${dialogId}_ja.mp3`;
      const audioPath = path.join(audioDir, audioKey);
      
      if (!fs.existsSync(audioPath)) {
        console.warn(`⚠️ Missing audio file: ${audioKey}`);
        missingAudio++;
      }
    }
  }
  
  console.log(`\nAudio file verification complete:`);
  console.log(`- Total dialogues: ${totalDialogues}`);
  console.log(`- Available audio files: ${audioFiles.length}`);
  console.log(`- Missing audio files: ${missingAudio}`);
  
  if (missingAudio > 0) {
    console.log(`\nTo generate missing audio files, run:`);
    console.log(`npm run generate:audio`);
  } else if (audioFiles.length > 0) {
    console.log(`\n✅ All dialogue audio files are available`);
  } else {
    console.log(`\n⚠️ No audio files found. Run:`);
    console.log(`npm run generate:audio`);
  }
}

// Run the verification
verifyAudioFiles().catch(error => {
  console.error('Verification failed:', error);
});
