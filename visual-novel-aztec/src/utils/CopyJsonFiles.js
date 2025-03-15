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
  fs.mkdirSync(path.resolve(assetsDir, 'audio'), { recursive: true });
}

// Copy mappings.json
try {
  const mappingsSource = path.resolve(__dirname, '../../mappings.json');
  const mappingsTarget = path.resolve(storyDir, 'mappings.json');
  if (fs.existsSync(mappingsSource)) {
    fs.copyFileSync(mappingsSource, mappingsTarget);
    console.log('Copied mappings.json to public/story');
  } else {
    // Create a minimal mappings.json if the original doesn't exist
    const defaultMappings = {
      "characterNames": {
        "tlaloc": "Tlaloc",
        "citlali": "Citlali",
        "diego": "Guard Diego",
        "narrator": "Narrator"
      },
      "locations": {
        "prison-cell": "Spanish Prison Cell",
        "aztec-village": "Aztec Village (Flashback)",
        "spanish-invasion": "Spanish Invasion (Flashback)",
        "hidden-tunnel": "Escape Tunnel"
      }
    };
    fs.writeFileSync(mappingsTarget, JSON.stringify(defaultMappings, null, 2));
    console.log('Created default mappings.json in public/story');
  }

  // Copy or create scene001.json
  const sceneSource = path.resolve(__dirname, '../../story/scene001.json');
  const sceneTarget = path.resolve(storyDir, 'scene001.json');
  if (fs.existsSync(sceneSource)) {
    fs.copyFileSync(sceneSource, sceneTarget);
    console.log('Copied scene001.json to public/story');
  } else {
    // Create a minimal scene001.json if the original doesn't exist
    const defaultScene = {
      "id": "scene001",
      "title": "Prison Escape",
      "location_id": "prison-cell",
      "character_id": "tlaloc",
      "startsAt": "x00",
      "timer": {
        "initial": 3600,
        "penalty": 300
      },
      "dialog": {
        "x00": {
          "speakerId": "narrator",
          "japanese": "テスト",
          "english": "Test",
          "default_next_id": "001"
        },
        "001": {
          "speakerId": "tlaloc",
          "japanese": "こんにちは",
          "english": "Hello",
          "default_next_id": "002"
        },
        "002": {
          "speakerId": "citlali",
          "japanese": "脱出しましょう",
          "english": "Let's escape",
          "default_next_id": "001"
        }
      },
      "vocabulary": []
    };
    fs.writeFileSync(sceneTarget, JSON.stringify(defaultScene, null, 2));
    console.log('Created default scene001.json in public/story');
  }

  console.log('JSON files copied successfully');
} catch (error) {
  console.error('Error copying JSON files:', error);
}
