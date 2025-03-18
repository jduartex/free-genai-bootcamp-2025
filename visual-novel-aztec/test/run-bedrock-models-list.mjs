// This is a helper script to run TypeScript with the new register() API
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register ts-node/esm loader
register('ts-node/esm', pathToFileURL('./'));

// Import and run the actual script
import('./list-bedrock-models.js');
