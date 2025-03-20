import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the audio directories
const audioDir = path.resolve(__dirname, '../public/assets/audio');
const dialogueDir = path.resolve(__dirname, '../public/assets/audio/dialogue');
const voicesDir = path.resolve(__dirname, '../public/assets/audio/voices');

// Create a single optimized directory for all audio files
const optimizedDir = path.join(audioDir, 'optimized');
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Create subdirectories in the optimized folder to maintain structure
if (!fs.existsSync(path.join(optimizedDir, 'dialogue'))) {
  fs.mkdirSync(path.join(optimizedDir, 'dialogue'), { recursive: true });
}

if (!fs.existsSync(path.join(optimizedDir, 'voices'))) {
  fs.mkdirSync(path.join(optimizedDir, 'voices'), { recursive: true });
}

// Process a directory of audio files
function processAudioDirectory(directory) {
  // Skip if directory doesn't exist
  if (!fs.existsSync(directory)) {
    console.log(`Directory not found, skipping: ${directory}`);
    return;
  }

  console.log(`\nProcessing directory: ${directory}`);
  
  // Determine the relative path from the audio directory
  const relativePath = path.relative(audioDir, directory);
  
  // For the root audio directory, the output path is just the optimized directory
  // For subdirectories, create the path within the optimized directory
  const outputPath = relativePath 
    ? path.join(optimizedDir, relativePath) 
    : optimizedDir;
  
  // Process MP3 files
  console.log('Optimizing MP3 files...');
  const mp3Files = fs.readdirSync(directory)
    .filter(file => file.endsWith('.mp3'))
    .filter(file => file !== 'optimized'); // Skip the optimized directory itself
  
  if (mp3Files.length === 0) {
    console.log('No MP3 files found in this directory');
  }
  
  mp3Files.forEach(file => {
    const inputPath = path.join(directory, file);
    const outputFilePath = path.join(outputPath, file);
    
    try {
      console.log(`Processing: ${file}`);
      execSync(`ffmpeg -i "${inputPath}" -codec:a libmp3lame -qscale:a 4 "${outputFilePath}"`, { stdio: 'inherit' });
      console.log(`✅ Optimized: ${file} -> ${outputFilePath}`);
    } catch (error) {
      console.error(`❌ Error processing ${file}: ${error.message}`);
    }
  });

  // Process WAV files
  console.log('\nOptimizing WAV files...');
  const wavFiles = fs.readdirSync(directory)
    .filter(file => file.endsWith('.wav'))
    .filter(file => file !== 'optimized'); // Skip the optimized directory itself
  
  if (wavFiles.length === 0) {
    console.log('No WAV files found in this directory');
  }
  
  wavFiles.forEach(file => {
    const inputPath = path.join(directory, file);
    const outputFilePath = path.join(outputPath, file);
    
    try {
      console.log(`Processing: ${file}`);
      execSync(`ffmpeg -i "${inputPath}" -c:a pcm_s16le "${outputFilePath}"`, { stdio: 'inherit' });
      console.log(`✅ Optimized: ${file} -> ${outputFilePath}`);
    } catch (error) {
      console.error(`❌ Error processing ${file}: ${error.message}`);
    }
  });
}

// Main function
function optimizeAllAudio() {
  console.log('Starting audio optimization process');
  console.log(`All optimized files will be stored in: ${optimizedDir}`);
  
  // Process main audio directory
  processAudioDirectory(audioDir);
  
  // Process dialogue directory
  processAudioDirectory(dialogueDir);
  
  // Process voices directory
  processAudioDirectory(voicesDir);
  
  console.log('\n=== Optimization Summary ===');
  console.log(`Audio files have been optimized and placed in: ${optimizedDir}`);
  console.log('The directory structure has been preserved within the optimized folder.');
  console.log('Update your game code to load audio files from the optimized directory.');
}

// Run the optimization
optimizeAllAudio();
