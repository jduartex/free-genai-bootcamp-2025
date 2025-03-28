# Game Design Doc and Tech Specifications: Aztec Escape

## Overview

### Game Concept

An educational Japanese language learning visual novel with escape room mechanics. Players must solve puzzles in Japanese to help two Aztec characters escape from Spanish imprisonment. The game combines language learning with time pressure and puzzle-solving to create an engaging, immersive experience.

### Target Audience

- Japanese language learners (Beginners, JLPT5)
- Fans of escape room games
- People interested in Aztec/historical settings

### Platform

Web-application

## Story and Setting

### Synopsis

Two Aztec nobles have been captured during the Spanish invasion of the Aztec Empire. Using your knowledge of Japanese, you must help them solve puzzles to escape their prison before time runs out. All interactions and puzzles are in Japanese, forcing players to apply their language skills under pressure.

## Core Game Framework
- Prison cell environment with interactive objects
- Timer counting down from 60 minutes
- 4 Japanese language puzzles that reveal numerical codes
- Wrong answers reduce remaining time by 5 minutes
- All dialogues in Japanese with optional English captions
- Final escape requires the correct 4-digit code

### Settings

16th century Spanish prison cell in Mesoamerica

#### Locations / Scenes

**Prison Cell (Interior)**  
A dark, stone-walled prison cell with minimal furniture. A small barred window lets in streams of light. The cell contains a wooden bed, a small table with some items, and various objects that can be inspected for clues. Scratches and markings on the walls hint at previous prisoners' attempts to track time or leave messages. A heavy wooden door with iron reinforcements blocks the exit, featuring a complex lock mechanism that requires a 4-digit code.

**Flashback: Aztec Village (Exterior)**  
A vibrant Aztec village with traditional structures, decorative art, and bustling activity. This scene appears in flashbacks as characters remember their life before imprisonment. Bright colors contrast sharply with the prison environment, showing ceremonial spaces, residential areas, and agricultural zones typical of Aztec civilization.

**Flashback: Spanish Invasion (Exterior)**  
A chaotic scene depicting the Spanish invasion of the Aztec territory. Spanish conquistadors with advanced weapons face off against Aztec warriors. This scene is shown through memory fragments as characters recall how they were captured. The imagery is intense and dramatic, showing the clash of civilizations and the moment of the characters' capture.

**Hidden Tunnel (Interior)**  
A narrow, earthen escape tunnel that becomes accessible only after solving all puzzles. Dim lighting reveals a rough-hewn passage leading away from the prison, with supports made from scavenged wood and signs of previous escape attempts. This represents the final escape route and victory condition for players who successfully solve all puzzles.

### Characters

#### Aztec Warrior
- **Name**: Tlaloc
- **Gender**: Male
- **Age**: 35
- **Height**: 165 cm
- **Appearance**: Strong muscular build, traditional Aztec warrior attire (though somewhat tattered from imprisonment), distinctive face paint patterns faded but still visible, short black hair, determined expression
- **Personality**: Brave, protective, tactical thinker, occasionally hot-headed
- **Role**: The main problem-solver for physical puzzles
- **Background**: Former eagle warrior and father of two, separated from his family during the Spanish attack
- **Key Interactions**: Provides historical context about Aztec culture, examines physical objects in the cell

#### Aztec Healer/Scholar
- **Name**: Citlali
- **Gender**: Female
- **Age**: 30
- **Appearance**: Average height, slender but strong, long black hair tied back, simple clothing with elements indicating her status as a healer, distinctive necklace with obsidian pendant
- **Personality**: Intelligent, observant, calm under pressure, strategic
- **Role**: The main problem-solver for logical puzzles and codes
- **Background**: Skilled in traditional medicine and astronomy, wife of Tlaloc
- **Key Interactions**: Deciphers symbols, remembers cultural knowledge needed for puzzles

#### Spanish Guard (Unseen but heard)
- **Name**: Diego
- **Gender**: Male
- **Age**: 40
- **Role**: Occasional antagonist who checks on prisoners
- **Key Interactions**: Creates time pressure by announcing remaining time before execution

## Game Mechanics

### Escape Room Mechanics
- **Time Limit**: 60-minute countdown timer
- **Time Penalties**: -5 minutes for each incorrect answer
- **Puzzle Types**: Symbol matching, pattern recognition, vocabulary challenges, cultural knowledge tests
- **Hint System**: Progressive hints available at the cost of time reduction
  - Three-tiered hint system: vocabulary assistance first, grammar explanations second, and contextual clues third
  - Each hint level costs additional time (1, 3, and 5 minutes respectively)
  - Players can request specific help with vocabulary or grammar structures
  - Visual highlighting of key elements after hint activation

### Japanese Language Integration
- All puzzles require understanding of Japanese vocabulary, characters, or grammar
- Interactive objects have Japanese names and descriptions
- All dialogue is in Japanese with optional English subtitles
- Difficulty scales from basic hiragana recognition to simple sentence comprehension
- Contextual help provides translations of key terms when needed

### Puzzle Design Progression
- **Level 1**: Basic hiragana and katakana recognition, simple vocabulary matching
- **Level 2**: Kanji recognition for JLPT N5 level, basic sentence structure puzzles
- **Level 3**: Grammar-based challenges involving particle usage and verb conjugation
- **Level 4**: Complex puzzle combining vocabulary, kanji, and grammar elements
- Each puzzle increases in difficulty, forcing players to apply more advanced language skills
- Answer validation includes partial recognition for "close" answers with feedback on corrections

### Progression System
- 4 main puzzles must be solved in sequence
- Each solved puzzle reveals a single digit (1-9) of the escape code
- All 4 digits must be arranged correctly to unlock the escape route
- Multiple solution paths allow for different approaches to each puzzle

## Technical Requirements

### Core Technologies
- Phaser 3 for game engine
- JavaScript/TypeScript
- WebGL for rendering
- LocalStorage for saving progress
  - Saves current puzzle state and progression
  - Stores remaining time (including negative values if time expires)
  - Records collected inventory items and unlocked hints
  - Enables players to resume their game session at any point
- Web Audio API for sound management

### UI Requirements
- Language toggle for English captions
- Timer display showing remaining time
- Inventory system for collected items/clues
- Interactive dialogue system
- Contextual help system for language assistance

### Educational Features
- Japanese vocabulary tracking
- Grammar point explanations
- Cultural notes about both Aztec civilization and Japanese language
- Practice exercises between puzzle segments
- Feedback system showing correct/incorrect answers
- Flexible answer validation that accepts minor errors with appropriate feedback
- Progress dashboard showing mastered language elements
- Spaced repetition for reinforcing previously learned content

## Art and Audio

### Visual Style
- Historical accuracy in Aztec and Spanish colonial representations
- Detailed backgrounds with interactive elements
- Character portraits with multiple expressions
- Visual cues for important puzzle elements
- Animated character portraits using spine.js or Live2D technology
  - Lip-sync animation for dialogue segments
  - Expression transitions for emotional responses
  - Simple gesture animations for emphasis
  - Breathing animations for idle states

### Audio Requirements
- Period-appropriate background music
- Voice acting for Japanese dialogue
- Sound effects for interactions and puzzle solving
- Ambient prison sounds for immersion

## AI Integration for Game Development

### AI Asset Generation
- **Stable Diffusion** for generating background scenes and character portraits
  - Custom prompts optimized for Aztec and Spanish colonial aesthetics
  - Style consistency maintained through negative prompting
  - Resolution settings for backgrounds (1280x720) and characters (512x768)
  - Multi-step workflow for refinement and variation generation

### Voice Synthesis
- **Amazon Polly** for character dialogue
  - Neural TTS voices mapped to specific characters:
    - Tlaloc: Takumi (Japanese male)
    - Citlali: Kazuha (Japanese female)
    - Diego: Sergio (Spanish male)
    - Narrator: Joanna (English female)
  - Pronunciation refinement for Japanese text
  - Automatic naming and organization of audio files

### Dynamic Content Generation
- **Ollama/Llama 3** for procedural dialogue generation
  - Character-specific dialogue generation based on context
  - Puzzle content generation for varied difficulty levels
  - Multi-language output (Japanese with English translations)

### Cultural Content
- **AWS Bedrock (Claude)** for historical Aztec facts
  - Context-aware cultural information
  - Educational content integration
  - Historical accuracy verification

### Asset Generation Tools
- Command-line tools for batch asset generation
- Integration with CI/CD pipeline for automated updates
- Development helpers for prototyping and placeholder generation

## Development Priorities

1. Core escape room mechanics and puzzle implementation
2. Japanese language integration and educational content
3. Character development and storyline
4. Art and audio assets (with AI generation assistance)
5. Testing and balancing puzzle difficulty
6. UI polish and accessibility features
