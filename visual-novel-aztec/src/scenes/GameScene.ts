import Phaser from 'phaser';
import { getScene, saveGameProgress } from '../utils/StoryLoader';
import { InteractiveObject } from '../components/InteractiveObject';
import { StoryData, GameState } from '../types/StoryTypes';
import { AssetLoader } from '../utils/AssetLoader';
import { AudioManager } from '../utils/AudioManager';
import { DialogueAudioManager } from '../core/DialogueAudioManager';

export class GameScene extends Phaser.Scene {
  // Declare properties with proper types
  private background!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | null;
  private interactiveObjects: InteractiveObject[] = [];
  private currentStoryData!: StoryData;
  private gameState!: GameState;
  private ambientSound!: Phaser.Sound.BaseSound;
  private assetLoader!: AssetLoader;
  private dialogueAudioManager!: DialogueAudioManager;

  constructor() {
    super({ key: 'GameScene' });
  }

  // Helper method declarations - updated to avoid accessing non-existent properties
  private isEndingDialog(dialogId: string): boolean {
    const dialog = this.currentStoryData?.dialog?.[dialogId];
    // Use safer property checks
    if (!dialog) return false;
    
    // Use type assertion to check for potential ending flags
    const anyDialog = dialog as any;
    return anyDialog.is_ending === true || 
           anyDialog.ends === true ||
           anyDialog.final === true || 
           anyDialog.ending === true || 
           !dialog.default_next_id;
  }

  private getTimerPenalty(): number {
    // Access timer data safely using type assertion
    try {
      const timer = this.currentStoryData.timer as any;
      if (timer && typeof timer === 'object' && timer.penalty !== undefined) {
        return Number(timer.penalty) || 0;
      }
    } catch (error) {
      console.warn('Failed to get timer penalty:', error);
    }
    return 0; // Default no penalty
  }

  init(data: { sceneId: string; dialogId: string; remainingTime?: number }): void {
    // Initialize AssetLoader
    this.assetLoader = new AssetLoader(this);
    
    // Get story data
    const storyData = getScene(data.sceneId);
    if (!storyData) {
      console.error(`Failed to load scene data for ${data.sceneId}`);
      this.scene.start('MenuScene');
      return;
    }
    
    this.currentStoryData = storyData;
    
    // First create object with all required GameState properties
    const gameStateInit: GameState = {
      currentSceneId: data.sceneId,
      currentDialogId: data.dialogId,
      timeRemaining: data.remainingTime ?? this.getInitialTime(storyData),
      inventory: [],
      flags: {},               // Add missing required properties
      visitedLocations: [],
      score: 0,
      hintsUsed: 0,
      vocabularySeen: []
    };
    
    // Initialize with the proper type
    this.gameState = gameStateInit;
    
    // Add any additional properties we need for backwards compatibility
    (this.gameState as any).solvedPuzzles = [];
    (this.gameState as any).unlockedHints = [];
  }

  // Helper method to safely get initial time - updated to handle type issues
  private getInitialTime(storyData: StoryData): number {
    try {
      const timer = storyData.timer as any;
      if (!timer) return 3600;
      
      if (typeof timer === 'object' && timer.initial !== undefined) {
        return Number(timer.initial) || 3600;
      } else if (typeof timer === 'number') {
        return timer;
      }
    } catch (error) {
      console.warn('Failed to get initial time:', error);
    }
    return 3600; // Default value
  }

  create(): void {
    // Setup background based on location - making sure location_id is a string
    const locationId = this.currentStoryData.location_id || 'default-location';
    this.setupBackground(locationId);
    
    // Start dialogue scene
    this.scene.launch('DialogueScene', {
      dialogId: this.gameState.currentDialogId,
      storyData: this.currentStoryData
    });

    // Start UI scene with timer
    this.scene.launch('UIScene', {
      remainingTime: this.gameState.timeRemaining,  // Changed from remainingTime to timeRemaining
      timerConfig: this.currentStoryData.timer
    });

    // Set up communication between scenes
    this.setupEventListeners();

    // Create interactive objects based on the current scene
    this.createInteractiveObjects();
    
    // Start ambient audio
    this.setupAudio();

    // Update visited locations
    if (!this.gameState.visitedLocations.includes(locationId)) {
      this.gameState.visitedLocations.push(locationId);
    }

    // Save initial game state with non-null parameters
    saveGameProgress(
      this.gameState.currentSceneId,
      this.gameState.currentDialogId,
      this.gameState.timeRemaining
    );

    // Initialize dialogue audio manager
    this.dialogueAudioManager = new DialogueAudioManager(this);
  }

  update(time: number, delta: number): void {
    // Update any animations or game logic that needs to run every frame
    
    // Update timer (handled by UIScene)
    
    // Update interactive objects
    for (const obj of this.interactiveObjects) {
      obj.update(time, delta);
    }
  }

  private setupBackground(locationId: string): void {
    // First, remove any existing background
    if (this.background) {
      this.background.destroy();
      this.background = null;
    }
    
    // Get the correct background texture based on location
    const bgTextureKey = locationId || 'prison-cell';
    
    try {
      // Check if texture exists
      if (!this.textures.exists(bgTextureKey)) {
        console.log(`Background texture ${bgTextureKey} not found, attempting to load directly`);
        
        // Try to load the texture directly first before creating a placeholder
        this.load.image(bgTextureKey, `/assets/scenes/${bgTextureKey}.png`);
        this.load.once('filecomplete-image-' + bgTextureKey, () => {
          console.log(`Successfully loaded background: ${bgTextureKey}`);
          if (!this.background) {
            // Create the background now that the texture is loaded
            this.background = this.add.image(
              this.cameras.main.width / 2,
              this.cameras.main.height / 2,
              bgTextureKey
            ).setDisplaySize(this.cameras.main.width, this.cameras.main.height);
          }
        });
        this.load.once('loaderror', () => {
          console.error(`Failed to load background: ${bgTextureKey}`);
          // Now create a placeholder if loading failed
          if (!this.background) {
            this.background = this.createPlaceholderBackground(bgTextureKey);
          }
        });
        this.load.start();
        
        // Create a temporary placeholder while loading
        this.background = this.createPlaceholderBackground(bgTextureKey);
        return;
      }
      
      // Create the background since the texture exists
      this.background = this.add.image(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        bgTextureKey
      ).setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    } catch (error) {
      console.error(`Error setting up background for ${locationId}:`, error);
      // Fallback to a simple colored rectangle
      this.background = this.createPlaceholderBackground(bgTextureKey);
    }

    // Mark this location as visited
    if (!this.gameState.visitedLocations.includes(locationId)) {
      this.gameState.visitedLocations.push(locationId);
    }
  }

  // Helper method to create a placeholder background
  private createPlaceholderBackground(key: string): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x333344
    );
  }

  private setupEventListeners(): void {
    // Listen for dialogue events
    this.events.on('dialogueComplete', (nextDialogId: string) => {
      try {
        if (!nextDialogId || typeof nextDialogId !== 'string') {
          console.error('Invalid dialogId received:', nextDialogId);
          return;
        }
        
        this.gameState.currentDialogId = nextDialogId;
        
        // Save progress
        saveGameProgress(
          this.gameState.currentSceneId,
          this.gameState.currentDialogId,
          this.gameState.timeRemaining
        );
        
        // Check if we need to update the scene
        if (this.isEndingDialog(nextDialogId)) {
          this.handleEndOfScene();
          return;
        }
        
        // Otherwise, continue with the next dialogue
        this.scene.launch('DialogueScene', {
          dialogId: nextDialogId,
          storyData: this.currentStoryData
        });
      } catch (error) {
        console.error('Error in dialogueComplete handler:', error);
        // Try to recover by going to a safe dialogue
        this.scene.launch('DialogueScene', {
          dialogId: 'error-recovery',
          storyData: {
            ...this.currentStoryData,
            dialog: {
              'error-recovery': {
                speakerId: 'system',
                japanese: 'エラーが発生しました。',
                english: 'An error occurred.',
                default_next_id: this.gameState.currentDialogId
              }
            }
          }
        });
      }
    });
    
    // Listen for puzzle solving events with error handling
    this.events.on('puzzleSolved', (puzzleId: string, answer: number) => {
      try {
        if (!puzzleId || typeof puzzleId !== 'string') {
          console.error('Invalid puzzleId received:', puzzleId);
          return;
        }
        
        // Access solvedPuzzles property with type assertion
        (this.gameState as any).solvedPuzzles.push(puzzleId);
        
        // Play success sound safely
        this.playSoundSafe('success', 0.7);
        
        // Save progress
        saveGameProgress(
          this.gameState.currentSceneId,
          this.gameState.currentDialogId,
          this.gameState.timeRemaining
        );
      } catch (error) {
        console.error('Error in puzzleSolved handler:', error);
      }
    });

    // Listen for wrong answers
    this.events.on('puzzleWrong', () => {
      // Apply time penalty
      const penalty = this.getTimerPenalty();
      if (penalty > 0) {
        this.gameState.timeRemaining -= penalty;
        this.events.emit('updateTimer', this.gameState.timeRemaining);
        
        // Play fail sound safely
        this.playSoundSafe('fail', 0.5);
      }
    });
    
    // Listen for timer updates
    this.events.on('timerTick', (remainingTime: number) => {
      this.gameState.timeRemaining = remainingTime;  // Changed from remainingTime to timeRemaining
      
      // Check for game over condition
      if (remainingTime <= 0) {
        this.events.emit('timeUp');
      }
    });
    
    // Listen for time up event
    this.events.on('timeUp', () => {
      // Player still can continue but with negative time
      // This is handled in UIScene by showing negative time
      
      // Add an urgent prompt from the guard
      this.scene.launch('DialogueScene', {
        dialogId: 'timeWarning',
        storyData: {
          ...this.currentStoryData,
          dialog: {
            timeWarning: {
              speakerId: 'diego',
              japanese: "時間切れだ！急げ！",
              english: "Time's up! Hurry!",
              default_next_id: this.gameState.currentDialogId
            }
          }
        }
      });
    });
    
    // Listen for location change events
    this.events.on('changeLocation', (locationId: string) => {
      this.setupBackground(locationId);
      this.createInteractiveObjects();
    });
    
    // Listen for hint request
    this.events.on('requestHint', (hintLevel: number) => {
      // Apply time cost for hint
      const hintCost = hintLevel * 60; // 1, 2, or 3 minutes
      this.gameState.timeRemaining -= hintCost;
      this.events.emit('updateTimer', this.gameState.timeRemaining);
      
      // Increment hints used counter
      this.gameState.hintsUsed++;
      
      // Record that hint was used - using type assertion for unlockedHints
      const currentDialogId = this.gameState.currentDialogId;
      (this.gameState as any).unlockedHints.push(`${currentDialogId}_hint${hintLevel}`);
      
      // Display hint (this would be implemented in DialogueScene)
      this.events.emit('showHint', currentDialogId, hintLevel);
    });

    // Add event listener for vocabulary words
    this.events.on('vocabularyDiscovered', (word: string) => {
      if (!this.gameState.vocabularySeen.includes(word)) {
        this.gameState.vocabularySeen.push(word);
        // Maybe give some points for discovering new words
        this.gameState.score += 5;
      }
    });
  }

  // Helper method to safely play sounds
  private playSoundSafe(key: string, volume: number = 0.5): void {
    try {
      if (this.sound && !this.sound.locked && this.cache.audio.exists(key)) {
        this.sound.play(key, { volume });
      }
    } catch (error) {
      // Just log the error but don't crash the game
      console.warn(`Sound play error (${key}):`, error);
    }
  }

  private createInteractiveObjects(): void {
    // Clear existing objects
    for (const obj of this.interactiveObjects) {
      obj.destroy();
    }
    this.interactiveObjects = [];
    
    // Create new objects based on current scene
    switch (this.currentStoryData.location_id) {
      case 'prison-cell':
        this.createPrisonCellObjects();
        break;
      case 'aztec-village':
        this.createAztecVillageObjects();
        break;
      case 'spanish-invasion':
        this.createSpanishInvasionObjects();
        break;
      case 'hidden-tunnel':
        this.createHiddenTunnelObjects();
        break;
    }
  }
  
  private createPrisonCellObjects(): void {
    // Create window (for puzzle 1)
    const window = new InteractiveObject(
      this,
      this.cameras.main.width * 0.8,
      this.cameras.main.height * 0.3,
      'window',
      'まど (Window)',
      () => {
        // Use type assertion to access solvedPuzzles
        if (!(this.gameState as any).solvedPuzzles.includes('puzzle1')) {
          this.events.emit('dialogueComplete', 'puzzle1-intro');
        } else {
          this.showExaminedMessage('window', 'たいよう');
        }
      }
    );
    this.interactiveObjects.push(window);
    
    // Create floor pattern (for puzzle 2)
    const floorPattern = new InteractiveObject(
      this,
      this.cameras.main.width * 0.5,
      this.cameras.main.height * 0.8,
      'floor-pattern',
      'ゆかのもよう (Floor Pattern)',
      () => {
        // Use type assertion to access solvedPuzzles
        if ((this.gameState as any).solvedPuzzles.includes('puzzle1') && 
            !(this.gameState as any).solvedPuzzles.includes('puzzle2')) {
          this.events.emit('dialogueComplete', 'puzzle2-intro');
        } else if ((this.gameState as any).solvedPuzzles.includes('puzzle2')) {
          this.showExaminedMessage('floor', 'わし');
        } else {
          this.showTooEarlyMessage();
        }
      }
    );
    this.interactiveObjects.push(floorPattern);
    
    // Add bed and door as well
    // Create bed (for character interaction)
    const bed = new InteractiveObject(
      this,
      this.cameras.main.width * 0.2,
      this.cameras.main.height * 0.7,
      'bed',
      'ベッド (Bed)',
      () => {
        this.showExaminedMessage('bed');
      }
    );
    this.interactiveObjects.push(bed);
    
    // Create door (for puzzle 4 and final escape)
    const door = new InteractiveObject(
      this,
      this.cameras.main.width * 0.1,
      this.cameras.main.height * 0.5,
      'door',
      'ドア (Door)',
      () => {
        // Use type assertion to access solvedPuzzles
        if ((this.gameState as any).solvedPuzzles.includes('puzzle1') && 
            (this.gameState as any).solvedPuzzles.includes('puzzle2') && 
            (this.gameState as any).solvedPuzzles.includes('puzzle3') &&
            !(this.gameState as any).solvedPuzzles.includes('puzzle4')) {
          this.events.emit('dialogueComplete', 'puzzle4-intro');
        } else if ((this.gameState as any).solvedPuzzles.includes('puzzle4')) {
          this.events.emit('dialogueComplete', 'final-scene');
        } else {
          this.showExaminedMessage('door');
        }
      }
    );
    this.interactiveObjects.push(door);
  }
  
  private createAztecVillageObjects(): void {
    // Create temple (for puzzle 3)
    const temple = new InteractiveObject(
      this,
      this.cameras.main.width * 0.5,
      this.cameras.main.height * 0.4,
      'temple',
      'てら (Temple)',
      () => {
        // Use type assertion to access solvedPuzzles
        if ((this.gameState as any).solvedPuzzles.includes('puzzle2') && 
            !(this.gameState as any).solvedPuzzles.includes('puzzle3')) {
          this.events.emit('dialogueComplete', 'puzzle3-question');
        } else if ((this.gameState as any).solvedPuzzles.includes('puzzle3')) {
          this.scene.launch('DialogueScene', {
            dialogId: 'temple-examined',
            storyData: {
              ...this.currentStoryData,
              dialog: {
                'temple-examined': {
                  speakerId: 'citlali',
                  japanese: "神殿には7本の柱がある。「なな」という数字を表しています。",
                  english: "The temple has 7 pillars. It represents the number 'nana'.",
                  default_next_id: this.gameState.currentDialogId
                }
              }
            }
          });
        }
      }
    );
    this.interactiveObjects.push(temple);
    
    // Create a way to return to the prison cell
    const returnToCell = new InteractiveObject(
      this,
      this.cameras.main.width * 0.1,
      this.cameras.main.height * 0.9,
      'return-arrow',
      'セルに戻る (Return to cell)',
      () => {
        // Return to prison cell
        this.events.emit('changeLocation', 'prison-cell');
      }
    );
    this.interactiveObjects.push(returnToCell);
  }
  
  private createSpanishInvasionObjects(): void {
    // This is a flashback scene, so minimal interaction
    
    // Create a way to return to the prison cell
    const returnToCell = new InteractiveObject(
      this,
      this.cameras.main.width * 0.1,
      this.cameras.main.height * 0.9,
      'return-arrow',
      'セルに戻る (Return to cell)',
      () => {
        // Return to prison cell
        this.events.emit('changeLocation', 'prison-cell');
      }
    );
    this.interactiveObjects.push(returnToCell);
  }
  
  private createHiddenTunnelObjects(): void {
    // End of game scene, minimal interaction
    
    // Create ending trigger
    const exitTunnel = new InteractiveObject(
      this,
      this.cameras.main.width * 0.9,
      this.cameras.main.height * 0.5,
      'exit',
      'でぐち (Exit)',
      () => {
        // Transition to end credits or next scene
        this.scene.start('CreditsScene');
      }
    );
    this.interactiveObjects.push(exitTunnel);
  }
  
  private setupAudio(): void {
    try {
      // Map location to ambient sound
      const ambientMap: Record<string, string> = {
        'prison-cell': 'prison_ambience',
        'aztec-village': 'village_ambience',
        'spanish-invasion': 'battle_ambience',
        'hidden-tunnel': 'tunnel_ambience'
      };
      
      const locationId = this.currentStoryData.location_id || 'prison-cell';
      const ambientKey = ambientMap[locationId] || 'prison_ambience';
      
      // Set up background music with error handling
      if (!this.sound.get(ambientKey)) {
        // Check if the sound exists in cache
        if (this.cache.audio.exists(ambientKey)) {
          const music = this.sound.add(ambientKey, {
            volume: 0.3,
            loop: true
          });
          
          music.once('error', (err: Error) => {
            console.error(`Error playing ambient sound: ${ambientKey}`, err);
          });
          
          if (!this.sound.locked) {
            music.play();
            this.ambientSound = music;
          } else {
            // Wait for sound to be unlocked
            this.sound.once('unlocked', () => {
              music.play();
              this.ambientSound = music;
            });
          }
        } else {
          // Try loading the sound with full path
          const ambientPath = '/assets/' + AudioManager.getAudioPath('', `${ambientKey}.mp3`);
          console.log(`Loading ambient sound: ${ambientKey} from ${ambientPath}`);
          
          this.load.audio(ambientKey, ambientPath);
          this.load.once('complete', () => {
            const music = this.sound.add(ambientKey, {
              volume: 0.3,
              loop: true
            });
            music.play();
            this.ambientSound = music;
          });
          this.load.start();
        }
      }
    } catch (error) {
      console.error('Failed to setup audio:', error);
      // Game can continue without ambient sound
    }
  }
  
  private handleEndOfScene(): void {
    // This is called when a dialogue entry with ends=true is reached
    
    // Stop ambient sound
    if (this.ambientSound && this.ambientSound.isPlaying) {
      this.ambientSound.stop();
    }
    
    // Transition to ending sequence
    this.cameras.main.fade(1000, 0, 0, 0, false, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        // When fade is complete, change to ending/credits scene
        this.scene.start('CreditsScene');
      }
    });
  }

  // Helper methods to show messages
  private showExaminedMessage(objectType: string, relatedWord?: string): void {
    const word = relatedWord || '';
    
    const messages: Record<string, {
      speakerId: string;
      japanese: string;
      english: string;
      default_next_id: string;
    }> = {
      'window': {
        speakerId: "narrator",
        japanese: `窓にある文字は「${word || 'たいよう'}」と読めます。`,
        english: `The symbols on the window spell '${word || 'taiyō'}' (sun).`,
        default_next_id: this.gameState.currentDialogId
      },
      'floor': {
        speakerId: "narrator",
        japanese: `床には鷲の絵が描かれています。「${relatedWord || 'わし'}」という言葉を表しています。`,
        english: `An eagle is drawn on the floor. It represents the word '${relatedWord || 'washi'}'.`,
        default_next_id: this.gameState.currentDialogId  // Changed from currentDialog to currentDialogId
      },
      'bed': {
        speakerId: "tlaloc",
        japanese: "この硬いベッドでは眠れない。でも今は休んでいる場合ではない。",
        english: "I can't sleep on this hard bed. But now is not the time to rest.",
        default_next_id: this.gameState.currentDialogId  // Changed from currentDialog to currentDialogId
      },
      'door': {
        speakerId: "tlaloc",
        japanese: "ドアには4つの数字を入力する鍵がかかっている。すべての謎を解かなければならない。",
        english: "The door has a lock that requires 4 numbers. We must solve all the puzzles.",
        default_next_id: this.gameState.currentDialogId  // Changed from currentDialog to currentDialogId
      }
    };
    
    // Ensure the objectType is valid
    if (!messages[objectType]) {
      console.error(`Unknown object type: ${objectType}`);
      return;
    }
    
    // Launch dialog with appropriate message
    this.scene.launch('DialogueScene', {
      dialogId: `${objectType}-examined`,
      storyData: {
        ...this.currentStoryData,
        dialog: {
          [`${objectType}-examined`]: messages[objectType]
        }
      }
    });

    // If there's a related word, add it to vocabulary
    if (relatedWord) {
      if (!this.gameState.vocabularySeen.includes(relatedWord)) {
        this.gameState.vocabularySeen.push(relatedWord);
        this.gameState.score += 10; // Reward for learning vocabulary
      }
      this.events.emit('vocabularyDiscovered', relatedWord);
    }
  }

  private showTooEarlyMessage(): void {
    this.scene.launch('DialogueScene', {
      dialogId: 'too-early',
      storyData: {
        ...this.currentStoryData,
        dialog: {
          'too-early': {
            speakerId: "citlali",
            japanese: "まずは窓の近くを調べましょう。",
            english: "Let's first examine near the window.",
            default_next_id: this.gameState.currentDialogId  // Changed from currentDialog to currentDialogId
          }
        }
      }
    });
  }

  // Add a method for dynamic dialogue generation
  private async generateNPCDialogue(characterId: string, situation: string): Promise<void> {
    try {
      // This would be implemented to call the API in a production setting
      // For now, we'll use placeholder dialogue
      const dialogueOptions = [
        {
          speakerId: characterId,
          japanese: "助けが必要ですか？",
          english: "Do you need help?",
          default_next_id: this.gameState.currentDialogId  // Changed from currentDialog to currentDialogId
        },
        {
          speakerId: characterId,
          japanese: "この先には危険がありますよ。",
          english: "There is danger ahead.",
          default_next_id: this.gameState.currentDialogId  // Changed from currentDialog to currentDialogId
        },
        {
          speakerId: characterId,
          japanese: "早く行きましょう、時間がありません。",
          english: "Let's go quickly, we don't have much time.",
          default_next_id: this.gameState.currentDialogId  // Changed from currentDialog to currentDialogId
        }
      ];
      
      // Randomly select one dialogue option
      const randomIndex = Math.floor(Math.random() * dialogueOptions.length);
      const selectedDialogue = dialogueOptions[randomIndex];
      
      // Launch dialogue scene with the generated content
      this.scene.launch('DialogueScene', {
        dialogId: 'generated-dialogue',
        storyData: {
          ...this.currentStoryData,
          dialog: {
            'generated-dialogue': selectedDialogue
          }
        }
      });
    } catch (error) {
      console.error('Failed to generate dialogue:', error);
    }
  }

  // Example method to handle character dialogue
  showDialogue(character: string, text: string, dialogueType?: string) {
    // ...existing code for displaying text...
    
    // Play associated audio if dialogueType is provided
    if (dialogueType) {
      this.dialogueAudioManager.playCharacterDialogue(character, dialogueType);
    }
    
    // ...existing code...
  }
}
