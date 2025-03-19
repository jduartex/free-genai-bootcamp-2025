# Aztec Escape Scene Structure Explanation

The game uses Phaser's scene system to organize different parts of the gameplay. Here's what each scene does:

### PreloadScene
- First scene that runs when the game starts
- Initializes core systems and fixes asset paths
- Tests loading capabilities of the browser
- Sets up error handlers
- Shows a loading bar to visualize progress
- Sets up fallbacks for missing assets
- Handles audio unlock for mobile browsers
- Loads story data and asset manifests
- Transitions to MenuScene when loading completes

### MenuScene
- Main menu of the game
- Shows the game title "AZTEC ESCAPE" with animation
- Displays background with overlay
- Provides buttons for:
  - Start New Game
  - Continue Game (if save exists)
  - Options
  - Credits
- Plays background music

### LoadScene
- Handles loading saved games and asset loading
- Shows loading indicator when transitioning between major game sections
- Provides fallbacks for missing assets
- Acts as an intermediate scene between menu and gameplay

### GameScene
- Main gameplay scene where most of the visual novel unfolds
- Handles rendering backgrounds and characters
- Manages player interactions with the environment
- Controls game flow and story progression
- Creates and manages interactive objects
- Communicates with DialogueScene and UIScene
- Tracks game state and player progress

### DialogueScene
- Manages character dialogue displays
- Shows text box with character names and portraits
- Controls text animation and typing effects
- Handles dialogue choices/player responses
- Plays voice audio for characters
- Provides Japanese/English language toggle

### UIScene
- Overlays UI elements on top of other scenes
- Manages the game timer
- Provides help button and inventory system
- Shows notifications and warnings
- Stays active across different gameplay scenes
- Ensures UI consistency throughout the game

### SettingsScene
- Allows players to adjust game settings
- Controls audio volume (master, music, effects, voices)
- Provides audio test functionality
- Handles mobile audio unlock
- Saves settings to localStorage

### PracticeScene
- Dedicated to Japanese language practice
- Shows vocabulary words with meanings
- Implements quiz functionality for learning
- Tracks player score and progress
- Helps reinforce vocabulary learned during gameplay

### CreditsScene
- Displays game credits
- Lists developers, artists, contributors
- Acknowledges AI-generated assets
- Includes way to return to the main menu

This structure follows standard visual novel architecture with clear separation of concerns, making the game easier to develop and maintain. The communication between scenes is handled through Phaser's event system, allowing for modular development.