#!/usr/bin/env node

/**
 * This script compiles and runs the asset generation tool
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Compile first
console.log('Compiling TypeScript files...');
try {
  execSync('npx tsc -p tsconfig.json', { stdio: 'inherit', cwd: projectRoot });
} catch (e) {
  console.error('TypeScript compilation failed');
  process.exit(1);
}

// Now run the compiled JavaScript file
console.log('Running asset generator...');
try {
  // The path to the compiled JS file (change if your output directory is different)
  const generatorScript = path.join(projectRoot, 'scripts', 'generate-assets.js');
  // You can pass arguments to the script
  const args = process.argv.slice(2).join(' ');
  
  execSync(`node ${generatorScript} ${args}`, { stdio: 'inherit', cwd: projectRoot });
} catch (e) {
  console.error('Asset generation failed');
  process.exit(1);
}
