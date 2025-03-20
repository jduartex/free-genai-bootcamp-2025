import path from 'path';
import fs from 'fs';
import { PlaceholderGenerator } from '../src/utils/PlaceholderGenerator';

// Define public directory path
const publicDir = path.resolve(__dirname, '../public');
console.log('Generating placeholders in:', publicDir);

// Check if directory exists
if (!fs.existsSync(publicDir)) {
  console.error('Public directory does not exist:', publicDir);
  process.exit(1);
}

// Generate placeholders
PlaceholderGenerator.generatePlaceholders(publicDir);
