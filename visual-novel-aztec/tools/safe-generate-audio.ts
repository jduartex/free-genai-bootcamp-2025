import * as child_process from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioGeneratorPath = path.resolve(__dirname, 'pre-generate-audio.ts');

console.log('Attempting to generate audio...');
try {
  // Try to run the audio generator script
  const result = child_process.spawnSync('node', ['--loader', 'ts-node/esm', audioGeneratorPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  if (result.status !== 0) {
    console.warn('Audio generation failed or skipped, but continuing with build...');
    process.exit(0); // Exit with success to continue the build process
  }
  
  console.log('Audio generation completed successfully');
  process.exit(0);
} catch (error) {
  console.warn('Error running audio generator:', error);
  console.warn('Skipping audio generation and continuing with build...');
  process.exit(0); // Exit with success to continue the build process
}
