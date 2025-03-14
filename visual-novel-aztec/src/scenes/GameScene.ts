import Phaser from 'phaser';
import { getScene, saveGameProgress } from '../utils/StoryLoader';
import { InteractiveObject } from '../components/InteractiveObject';
import { StoryData, GameState } from '../types/StoryTypes';

export class GameScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Image;
  private interactiveObjects: InteractiveObject[] = [];
  private currentStoryData!: StoryData;
  private gameState!: GameState;
  private ambientSound!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { sceneId: string; dialogId: string; remainingTime?: number }): void {
    // Get story data
    const storyData = getScene(data.sceneId);
    if (!storyData) {
      console.error(`Failed to load scene data for ${data.sceneId}`);
      this.scene.start('MenuScene');
      return;
    }
    
    this.currentStoryData = storyData;
    
    // Initialize game state
    this.gameState = {
      currentScene: data.sceneId,
      currentDialog: data.dialogId,
      remainingTime: data.remainingTime ?? storyData.timer?.initial ?? 3600,
      collectedItems: [],
      solvedPuzzles: [],
      unlockedHints: []
    };
  }

  create(): void {
    // Setup background based on location
    this.setupBackground(this.currentStoryData.location_id);
    
    // Start dialogue scene
    this.scene.launch('DialogueScene', {
      dialogId: this.gameState.currentDialog,
      storyData: this.currentStoryData
    });

    // Start UI scene with timer
    this.scene.launch('UIScene', {
      remainingTime: this.gameState.remainingTime,
      timerConfig: this.currentStoryData.timer
    });

    // Set up communication between scenes
    this.setupEventListeners();

    // Create interactive objects based on the current scene
    this.createInteractiveObjects();
    
    // Start ambient audio
    this.setupAudio();

    // Save initial game state
    saveGameProgress(
      this.gameState.currentScene,
      this.gameState.currentDialog,
      this.gameState.remainingTime
    );
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
    // Clear any existing background
    if (this.background) {
      this.background.destroy();
    }

    // Set the new background
    this.background = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      locationId
    )
    .setOrigin(0.5)
    .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    
    // Add a subtle animation to make the scene feel alive
    this.tweens.add({
      targets: this.background,
      scale: { from: 1.0, to: 1.05 },
      duration: 20000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private setupEventListeners(): void {
    // Listen for dialogue events
    this.events.on('dialogueComplete', (nextDialogId: string) => {
      this.gameState.currentDialog = nextDialogId;
      
      // Save progress
      saveGameProgress(
        this.gameState.currentScene,
        this.gameState.currentDialog,
        this.gameState.remainingTime
      );
      
      // Check if we need to update the scene
      if (this.currentStoryData.dialog[nextDialogId]?.ends) {
        this.handleEndOfScene();
        return;
      }
      
      // Otherwise, continue with the next dialogue
      this.scene.launch('DialogueScene', {
        dialogId: nextDialogId,
        storyData: this.currentStoryData
      });
    });
    
    // Listen for puzzle solving events
    this.events.on('puzzleSolved', (puzzleId: string, answer: number) => {
      this.gameState.solvedPuzzles.push(puzzleId);
      
      // Play success sound
      this.sound.play('success', { volume: 0.7 });
      
      // Save progress
      saveGameProgress(
        this.gameState.currentScene,
        this.gameState.currentDialog,
        this.gameState.remainingTime
      );
    });
    
    // Listen for wrong answers
    this.events.on('puzzleWrong', () => {
      // Apply time penalty
      if (this.currentStoryData.timer?.penalty) {
        this.gameState.remainingTime -= this.currentStoryData.timer.penalty;
        this.events.emit('updateTimer', this.gameState.remainingTime);
        
        // Play fail sound
        this.sound.play('fail', { volume: 0.5 });
      }
    });
    
    // Listen for timer updates
    this.events.on('timerTick', (remainingTime: number) => {
      this.gameState.remainingTime = remainingTime;
      
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
              default_next_id: this.gameState.currentDialog
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
      this.gameState.remainingTime -= hintCost;
      this.events.emit('updateTimer', this.gameState.remainingTime);
      
      // Record that hint was used
      const currentDialogId = this.gameState.currentDialog;
      this.gameState.unlockedHints.push(`${currentDialogId}_hint${hintLevel}`);
      
      // Display hint (this would be implemented in DialogueScene)
      this.events.emit('showHint', currentDialogId, hintLevel);
    });
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
        if (!this.gameState.solvedPuzzles.includes('puzzle1')) {
          this.events.emit('dialogueComplete', 'puzzle1-intro');
        } else {
          this.scene.launch('DialogueScene', {
            dialogId: 'window-examined',
            storyData: {
              ...this.currentStoryData,
              dialog: {
                'window-examined': {
                  speakerId: 'narrator',
                  japanese: "窓にある文字は「たいよう」と読めます。",
                  english: "The symbols on the window spell 'taiyō' (sun).",
                  default_next_id: this.gameState.currentDialog
                }
              }
            }
          });
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
        if (this.gameState.solvedPuzzles.includes('puzzle1') && 
            !this.gameState.solvedPuzzles.includes('puzzle2')) {
          this.events.emit('dialogueComplete', 'puzzle2-intro');
        } else if (this.gameState.solvedPuzzles.includes('puzzle2')) {
          this.scene.launch('DialogueScene', {
            dialogId: 'floor-examined',
            storyData: {
              ...this.currentStoryData,
              dialog: {
                'floor-examined': {
                  speakerId: 'narrator',
                  japanese: "床には鷲の絵が描かれています。「わし」という言葉を表しています。",
                  english: "An eagle is drawn on the floor. It represents the word 'washi'.",
                  default_next_id: this.gameState.currentDialog
                }
              }
            }
          });
        } else {
          this.scene.launch('DialogueScene', {
            dialogId: 'floor-too-early',
            storyData: {
              ...this.currentStoryData,
              dialog: {
                'floor-too-early': {
                  speakerId: 'citlali',
                  japanese: "まずは窓の近くを調べましょう。",
                  english: "Let's first examine near the window.",
                  default_next_id: this.gameState.currentDialog
                }
              }
            }
          });
        }
      }
    );
    this.interactiveObjects.push(floorPattern);
    
    // Create bed (for character interaction)
    const bed = new InteractiveObject(
      this,
      this.cameras.main.width * 0.2,
      this.cameras.main.height * 0.7,
      'bed',
      'ベッド (Bed)',
      () => {
        this.scene.launch('DialogueScene', {
          dialogId: 'bed-examined',
          storyData: {
            ...this.currentStoryData,
            dialog: {
              'bed-examined': {
                speakerId: 'tlaloc',
                japanese: "この硬いベッドでは眠れない。でも今は休んでいる場合ではない。",
                english: "I can't sleep on this hard bed. But now is not the time to rest.",
                default_next_id: this.gameState.currentDialog
              }
            }
          }
        });
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
        if (this.gameState.solvedPuzzles.includes('puzzle1') && 
            this.gameState.solvedPuzzles.includes('puzzle2') && 
            this.gameState.solvedPuzzles.includes('puzzle3') &&
            !this.gameState.solvedPuzzles.includes('puzzle4')) {
          this.events.emit('dialogueComplete', 'puzzle4-intro');
        } else if (this.gameState.solvedPuzzles.includes('puzzle4')) {
          this.events.emit('dialogueComplete', 'final-scene');
        } else {
          this.scene.launch('DialogueScene', {
            dialogId: 'door-locked',
            storyData: {
              ...this.currentStoryData,
              dialog: {
                'door-locked': {
                  speakerId: 'tlaloc',
                  japanese: "ドアには4つの数字を入力する鍵がかかっている。すべての謎を解かなければならない。",
                  english: "The door has a lock that requires 4 numbers. We must solve all the puzzles.",
                  default_next_id: this.gameState.currentDialog
                }
              }
            }
          });
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
        if (this.gameState.solvedPuzzles.includes('puzzle2') && 
            !this.gameState.solvedPuzzles.includes('puzzle3')) {
          this.events.emit('dialogueComplete', 'puzzle3-question');
        } else if (this.gameState.solvedPuzzles.includes('puzzle3')) {
          this.scene.launch('DialogueScene', {
            dialogId: 'temple-examined',
            storyData: {
              ...this.currentStoryData,
              dialog: {
                'temple-examined': {
                  speakerId: 'citlali',
                  japanese: "神殿には7本の柱がある。「なな」という数字を表しています。",
                  english: "The temple has 7 pillars. It represents the number 'nana'.",
                  default_next_id: this.gameState.currentDialog
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
    // Stop any currently playing ambient audio
    if (this.ambientSound && this.ambientSound.isPlaying) {
      this.ambientSound.stop();
    }
    
    // Play appropriate ambient audio for the location
    switch (this.currentStoryData.location_id) {
      case 'prison-cell':
        this.ambientSound = this.sound.add('prison-ambience', { 
          loop: true, 
          volume: 0.4 
        });
        break;
      case 'aztec-village':
        this.ambientSound = this.sound.add('village-ambience', { 
          loop: true, 
          volume: 0.4 
        });
        break;
      case 'spanish-invasion':
        this.ambientSound = this.sound.add('battle-ambience', { 
          loop: true, 
          volume: 0.4 
        });
        break;
      case 'hidden-tunnel':
        this.ambientSound = this.sound.add('tunnel-ambience', { 
          loop: true, 
          volume: 0.4 
        });
        break;
    }
    
    this.ambientSound.play();
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
}
