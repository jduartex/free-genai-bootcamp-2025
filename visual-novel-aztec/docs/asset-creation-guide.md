# Asset Creation Guide for Aztec Escape

This guide provides detailed instructions for creating assets for your Aztec Escape visual novel game.

## Tools Recommended

1. For Graphics:
   - Adobe Photoshop or GIMP for editing and creating images
   - Aseprite for pixel art if you want that style
   - Inkscape for vector graphics (UI elements)

2. For Audio:
   - Audacity for recording and editing sounds
   - LMMS or GarageBand for music creation
   - Freesound.org for free sound effects

3. AI-Assisted Tools:
   - Midjourney or DALL-E for image generation
   - ElevenLabs for voice generation
   - Suno.ai for music generation

## Graphics Specifications

### Scene Backgrounds
- **Format**: JPG
- **Dimensions**: 1280x720 pixels
- **Color Profile**: sRGB
- **Theme**: Aztec architecture, Spanish colonial prison, ancient tunnels
- **Location**: Save in `public/assets/scenes/`

### Character Portraits
- **Format**: PNG with transparency
- **Dimensions**: 600x800 pixels 
- **Style**: Consistent anime-inspired style for all characters
- **Poses**: At minimum, create a neutral pose for each character
- **Location**: Save in `public/assets/characters/`

### UI Elements
- **Format**: PNG with transparency
- **Style**: Aztec-inspired patterns and decoration
- **Theme**: Stone textures, gold accents, Aztec symbols
- **Location**: Save in `public/assets/ui/`

### Interactive Objects
- **Format**: PNG with transparency
- **Dimensions**: Various sizes depending on object
- **Style**: Consistent with the background scenes
- **Location**: Save in `public/assets/objects/`

## Audio Specifications

### Sound Effects
- **Format**: MP3
- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit
- **Duration**: Short, typically <2 seconds for UI sounds
- **Location**: Save in `public/assets/audio/optimized/`

### Background Music
- **Format**: MP3
- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit
- **Duration**: 2-3 minutes, with loop points
- **Theme**: Aztec-inspired, mysterious, adventurous
- **Location**: Save in `public/assets/audio/optimized/`

### Voice Acting
- **Format**: MP3
- **Sample Rate**: 44.1 kHz
- **Naming Convention**: `[sceneId]_[dialogId]_[language].mp3`
- **Example**: `scene001_x001_ja.mp3` for Japanese voice of dialog x001 in scene001
- **Location**: Save in `public/assets/audio/optimized/dialogue/`

## Resources

1. **Free Aztec-themed graphics**: 
   - OpenGameArt.org
   - Itch.io (search for "Aztec" or "Maya" asset packs)

2. **Cultural References**:
   - Aztec patterns and symbols: research authentic patterns
   - Color schemes: earth tones, jade green, terracotta red

3. **Audio Resources**:
   - Freesound.org
   - OpenGameArt.org (bgm section)
   - incompetech.com for royalty-free music

## Integration Checklist

✅ Asset matches required dimensions  
✅ File is in correct format (PNG/JPG/MP3)  
✅ Asset is saved in the correct folder  
✅ Filename matches exactly what's expected in the code  
✅ For transparent PNGs, transparency works correctly  
✅ For audio, volume levels are consistent
