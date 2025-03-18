import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create necessary directories
const publicDir = path.resolve(__dirname, '../../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const storyDir = path.resolve(__dirname, '../../public/story');
if (!fs.existsSync(storyDir)) {
  fs.mkdirSync(storyDir, { recursive: true });
}

// Create assets directories
const assetsDir = path.resolve(__dirname, '../../public/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.mkdirSync(path.resolve(assetsDir, 'scenes'), { recursive: true });
  fs.mkdirSync(path.resolve(assetsDir, 'characters'), { recursive: true });
  fs.mkdirSync(path.resolve(assetsDir, 'ui'), { recursive: true });
}
