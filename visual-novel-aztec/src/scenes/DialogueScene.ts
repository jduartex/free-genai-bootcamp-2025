import Phaser from 'phaser';
import { DialogEntry, DialogChoice, StoryData } from '../types/StoryTypes';
import { getCharacterName } from '../utils/StoryLoader';
import { VoiceGenerator } from '../utils/VoiceGenerator'; // Import VoiceGenerator

interface DialogSceneData {
  dialogId: string;
  storyData: StoryData;
}

interface Character {
  sprite?: Phaser.GameObjects.Sprite;
  // Add any other character properties you need
}

export class DialogueScene extends Phaser.Scene {
  private dialogBox!: Phaser.GameObjects.Image;
  private characterNameText!: Phaser.GameObjects.Text;
  private dialogText!: Phaser.GameObjects.Text;
  private englishText!: Phaser.GameObjects.Text;
  private characterPortrait!: Phaser.GameObjects.Sprite; // Fixed: Removed Spine type
  private continueIndicator!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.Container[] = [];
  private currentEntry!: DialogEntry;
  private currentStoryData!: StoryData;
  private typingSpeed: number = 30; // ms per character
  private isTyping: boolean = false;
  private showEnglish: boolean = true;
  private dialogSound!: Phaser.Sound.BaseSound;
  private useSpineAnimations: boolean = false;
  private speakingTween: Phaser.Tweens.Tween | undefined;
  private speakingIndicator: Phaser.GameObjects.Arc | undefined;
  private audioWaveform: Phaser.GameObjects.Rectangle[] | undefined;
  private characters: Map<string, Character> = new Map(); // Add characters Map
  
  constructor() {
    super({ key: 'DialogueScene' });
  }

  init(data: DialogSceneData): void {
    this.currentStoryData = data.storyData;
    this.currentEntry = this.currentStoryData.dialog[data.dialogId];
    
    // Check if we have spine animations
    this.useSpineAnimations = this.textures.exists('tlaloc-spine') && 
                             this.textures.exists('citlali-spine');
                             
    // Check if English subtitles should be shown (could be stored in localStorage)
    this.showEnglish = localStorage.getItem('aztecEscape_showEnglish') !== 'false';
  }

  create(): void {
    // Create dialog box background
    this.dialogBox = this.add.image(
      this.cameras.main.width / 2, 
      this.cameras.main.height - 150,
      'dialog-box'
    ).setOrigin(0.5, 0.5)
    .setDisplaySize(this.cameras.main.width - 40, 200);
    
    // Create character name
    const speakerName = getCharacterName(this.currentEntry.speakerId);
    this.characterNameText = this.add.text(
      30, 
      this.cameras.main.height - 240,
      speakerName, 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        backgroundColor: '#422'
      }
    ).setPadding(10, 5, 10, 5);
    
    // Create Japanese text
    this.dialogText = this.add.text(
      30, 
      this.cameras.main.height - 190, 
      '', 
      { 
        fontFamily: 'Noto Sans JP',
        fontSize: '22px',
        color: '#ffffff',
        wordWrap: { width: this.cameras.main.width - 80 }
      }
    );
    
    // Create English translation (only visible if showEnglish is true)
    this.englishText = this.add.text(
      30, 
      this.cameras.main.height - 120, 
      '', 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '18px',
        color: '#cccccc',
        wordWrap: { width: this.cameras.main.width - 80 },
        fontStyle: 'italic'
      }
    ).setVisible(this.showEnglish);
    
    // Create toggle for English text
    const toggleText = this.add.text(
      this.cameras.main.width - 140, 
      this.cameras.main.height - 240, 
      `English: ${this.showEnglish ? 'ON' : 'OFF'}`, 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '18px',
        color: '#cccccc',
        backgroundColor: '#422'
      }
    ).setPadding(10, 5, 10, 5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.showEnglish = !this.showEnglish;
      this.englishText.setVisible(this.showEnglish);
      toggleText.setText(`English: ${this.showEnglish ? 'ON' : 'OFF'}`);
      localStorage.setItem('aztecEscape_showEnglish', this.showEnglish.toString());
    });
    
    // Create continue indicator
    this.continueIndicator = this.add.text(
      this.cameras.main.width - 50, 
      this.cameras.main.height - 60, 
      '▼', 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setVisible(false)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.advanceDialog());
    
    // Add click event on dialog box for advancing dialog
    this.dialogBox.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.isTyping) {
          // If still typing, show all text immediately
          this.completeTyping();
        } else {
          // If typing is done, advance dialog
          this.advanceDialog();
        }
      });
    
    // Create character portrait based on speaker
    this.createCharacterPortrait();
    
    // Start dialog typing effect
    this.typeWriterEffect(this.currentEntry.japanese);
    
    // Add vocabulary display if applicable
    if (this.currentEntry.words && this.currentEntry.words.length > 0) {
      this.setupVocabularyHighlighting();
    }
    
    // If entry has choices, create choice buttons when typing finishes
    if (this.currentEntry.choices && this.currentEntry.choices.length > 0) {
      this.events.once('typingComplete', this.createChoiceButtons, this);
    } else {
      this.events.once('typingComplete', () => {
        this.continueIndicator.setVisible(true);
        this.continueIndicator.setAlpha(0);
        this.tweens.add({
          targets: this.continueIndicator,
          alpha: 1,
          duration: 500,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      });
    }
    
    // Setup vocabulary tooltip system
    this.setupVocabularyTooltips();
    
    // Create audio waveform visualization
    this.createAudioWaveform();
    
    // Load and play audio if available
    this.loadAndPlayAudio();
  }

  private createCharacterPortrait(): void {
    // Remove existing portrait if any
    if (this.characterPortrait) {
      this.characterPortrait.destroy();
    }

    // Don't show portrait for narrator
    if (this.currentEntry.speakerId === 'narrator') {
      return;
    }
    
    // Create character portrait
    const x = this.cameras.main.width * 0.15;
    const y = this.cameras.main.height * 0.4;
    
    // Note: We're disabling spine animations for now until we add the plugin properly
    // Always use static image
    this.characterPortrait = this.add.sprite(
      x, y, this.currentEntry.speakerId
    ).setOrigin(0.5, 0.5)
    .setDisplaySize(300, 400);
    
    // Add a simple animation to make the static image less static
    this.tweens.add({
      targets: this.characterPortrait,
      y: y - 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private typeWriterEffect(text: string): void {
    this.isTyping = true;
    let i = 0;
    const speed = this.typingSpeed;
    const timer = this.time.addEvent({
      delay: speed,
      callback: () => {
        this.dialogText.setText(this.dialogText.text + text[i]);
        i++;
        
        // Play typing sound occasionally (not for every character)
        if (i % 3 === 0) {
          this.playSoundSafe('click', 0.1);
        }
        
        if (i === text.length) {
          timer.destroy();
          this.isTyping = false;
          
          // Show English translation after Japanese text is complete
          if (this.showEnglish) {
            this.englishText.setText(this.currentEntry.english);
          }
          
          this.events.emit('typingComplete');
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  private completeTyping(): void {
    // Stop all typing timers
    this.time.removeAllEvents();
    
    // Show full text
    this.dialogText.setText(this.currentEntry.japanese);
    
    // Show English translation
    if (this.showEnglish) {
      this.englishText.setText(this.currentEntry.english);
    }
    
    this.isTyping = false;
    this.events.emit('typingComplete');
  }

  private advanceDialog(): void {
    // Don't advance if still typing
    if (this.isTyping) return;
    
    // Don't advance if choices are showing
    if (this.choiceButtons.length > 0) return;
    
    // Get the next dialog ID
    const nextDialogId = this.currentEntry.default_next_id;
    if (!nextDialogId) {
      console.error('No next dialog ID specified');
      return;
    }

    // Clean up this scene
    this.scene.stop();
    
    // Emit event to tell GameScene to move to next dialog
    this.scene.get('GameScene').events.emit('dialogueComplete', nextDialogId);
  }

  private createChoiceButtons(): void {
    if (!this.currentEntry.choices) return;
    
    const choices = this.currentEntry.choices;
    const buttonHeight = 60;
    const buttonSpacing = 20;
    const totalHeight = choices.length * buttonHeight + (choices.length - 1) * buttonSpacing;
    let startY = (this.cameras.main.height - totalHeight) / 2;
    
    choices.forEach((choice: DialogChoice, index: number) => {
      const y = startY + index * (buttonHeight + buttonSpacing);
      
      const choiceContainer = this.add.container(this.cameras.main.width / 2, y);
      
      // Create button background
      const buttonBg = this.add.rectangle(
        0, 0, this.cameras.main.width - 200, buttonHeight, 0x333333, 0.8
      ).setStrokeStyle(2, 0xffffff, 1);
      
      // Create Japanese text
      const japaneseText = this.add.text(
        0, -10, choice.japanese, 
        { 
          fontFamily: 'Noto Sans JP',
          fontSize: '20px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5, 0.5);
      
      // Create English text if needed
      let englishText;
      if (this.showEnglish) {
        englishText = this.add.text(
          0, 15, choice.english, 
          { 
            fontFamily: 'Crimson Text',
            fontSize: '16px',
            color: '#cccccc',
            fontStyle: 'italic',
            align: 'center'
          }
        ).setOrigin(0.5, 0.5);
      }
      
      // Add all elements to container
      if (englishText) {
        choiceContainer.add([buttonBg, japaneseText, englishText]);
      } else {
        choiceContainer.add([buttonBg, japaneseText]);
      }
      
      // Make container interactive
      buttonBg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBg.fillColor = 0x666666;
          // Safely play hover sound
          this.playSoundSafe('hover', 0.3);
        })
        .on('pointerout', () => {
          buttonBg.fillColor = 0x333333;
        })
        .on('pointerdown', () => this.handleChoice(choice));
      
      this.choiceButtons.push(choiceContainer);
    });
    
    // Hide continue indicator when choices are shown
    if (this.continueIndicator) {
      this.continueIndicator.setVisible(false);
    }
  }

  // Add a helper method to safely play sounds
  private playSoundSafe(key: string, volume: number = 0.5): void {
    try {
      if (this.cache.audio.exists(key) && this.sound.get(key)) {
        this.sound.play(key, { volume });
      } else {
        console.warn(`Sound "${key}" not available`);
      }
    } catch (e) {
      console.warn(`Error playing sound "${key}":`, e);
    }
  }

  private handleChoice(choice: DialogChoice): void {
    // Play selection sound
    this.playSoundSafe('click', 0.5);
    
    // Clean up choices
    this.choiceButtons.forEach(button => button.destroy());
    this.choiceButtons = [];
    
    // Check if this is a puzzle answer
    if (choice.puzzle_answer !== undefined) {
      const currentDialogId = this.currentEntry.default_next_id?.split('-')[0] || '';
      const puzzleId = currentDialogId.includes('puzzle') ? currentDialogId : 'unknown';
      
      // Emit event with answer for GameScene to process
      this.scene.get('GameScene').events.emit(
        'puzzleSolved', 
        puzzleId, 
        choice.puzzle_answer
      );
    }
    
    // Clean up this scene
    this.scene.stop();
    
    // Emit event to tell GameScene to move to next dialog
    this.scene.get('GameScene').events.emit('dialogueComplete', choice.next_id);
  }

  private setupVocabularyHighlighting(): void {
    // Implement word highlighting based on timing data
    // This would highlight words in the Japanese text as they are spoken
    // For now, this is a placeholder for future implementation
  }

  private setupVocabularyTooltips(): void {
    // Get vocabulary words for this scene
    const vocabulary = this.currentStoryData.vocabulary;
    if (!vocabulary || vocabulary.length === 0) return;
    
    // Create interactive areas for each word in the dialog
    // This would allow clicking on words to see translations
    // For now, this is a placeholder for future implementation
  }
  
  private loadAndPlayAudio(): void {
    // Fix the type error by casting the settings.data to our interface
    const sceneData = this.scene.settings.data as DialogSceneData;
    const { dialogId } = sceneData;
    const { id: sceneId } = this.currentStoryData;
    const audioKey = `${sceneId}_${dialogId}_ja`;
    
    console.log(`🔊 Attempting to load dialogue audio: ${audioKey}`);
    
    // Check if audio exists in cache or attempt to load it
    if (!this.cache.audio.exists(audioKey)) {
      const audioPath = `assets/audio/dialogue/${audioKey}.mp3`;
      
      console.log(`🔊 File not in cache, loading from: ${audioPath}`);
      
      // Try to load the audio file
      this.load.audio(audioKey, audioPath);
      
      // Debug to verify the file is being loaded
      this.load.on('filecomplete', (key: string, type: string, data: any) => {
        if (key === audioKey) {
          console.log(`🔊 Successfully loaded audio: ${key}`);
          this.playDialogueAudio(key);
        }
      });
      
      this.load.on('loaderror', (file: Phaser.Loader.File) => {
        console.error(`❌ Error loading audio file: ${file.key}`, file.src);
        
        if (file.key === audioKey) {
          this.tryAlternativeAudioPaths(audioKey, file.src);
        }
      });
      
      this.load.start();
    } else {
      console.log(`🔊 Audio already in cache, playing: ${audioKey}`);
      this.playDialogueAudio(audioKey);
    }
  }

  // Add method to try different audio paths
  private tryAlternativeAudioPaths(audioKey: string, originalPath: string): void {
    const alternatives = [
      `/assets/audio/dialogue/${audioKey}.mp3`,
      `./assets/audio/dialogue/${audioKey}.mp3`,
      `../assets/audio/dialogue/${audioKey}.mp3`,
      `/public/assets/audio/dialogue/${audioKey}.mp3`,
      `./public/assets/audio/dialogue/${audioKey}.mp3`
    ];
    
    console.log(`🔍 Trying alternative audio paths for: ${audioKey}`);
    let loadedAny = false;
    
    // First, create a silent audio placeholder to ensure something will work
    this.createSilentAudioPlaceholder(audioKey);
    
    alternatives.forEach((path, index) => {
      // Create a unique key for each attempt
      const altKey = `${audioKey}_alt${index}`;
      
      this.load.audio(altKey, path);
      
      this.load.once('filecomplete-audio-' + altKey, () => {
        console.log(`✅ Alternative path loaded successfully: ${path}`);
        this.playDialogueAudio(altKey);
        loadedAny = true;
      });
    });
    
    this.load.start();
    
    // If all alternatives fail, try using SoundManager
    this.time.delayedCall(1000, () => {
      if (!loadedAny) {
        console.log(`🔊 Trying to load with SoundManager fallback`);
        this.loadWithSoundManager(audioKey);
      }
    });
  }
  
  // Create a silent audio placeholder that will decode successfully
  private createSilentAudioPlaceholder(audioKey: string): void {
    try {
      // This is a valid base64-encoded silent MP3 file (0.5 seconds)
      const silentAudioBase64 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADQgD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAQAAAAAAAAAAABSAJAJAQgAAgAAAA0L2YLwxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
      
      // Create a temporary Audio element from the base64 string
      const tempAudio = new Audio(silentAudioBase64);
      
      // Force a decode of the audio to create a valid blob
      tempAudio.load();
      
      // Add directly to the cache
      const cachedAudio = this.cache.audio.get(audioKey);
      if (!cachedAudio) {
        // If we could add to the cache directly, we would
        // For now, load the base64 data
        this.load.audio(audioKey, silentAudioBase64);
        this.load.start();
        console.log(`📝 Created silent placeholder for ${audioKey}`);
      }
    } catch (error) {
      console.error(`❌ Could not create silent audio:`, error);
    }
  }

  private playDialogueAudio(key: string): void {
    try {
      // Stop any currently playing dialogue audio
      if (this.dialogSound && this.dialogSound.isPlaying) {
        this.dialogSound.stop();
      }
      
      // Check if audio actually exists before attempting to play
      if (!this.cache.audio.exists(key)) {
        console.warn(`⚠️ Cannot play audio that doesn't exist in cache: ${key}`);
        // Create a silent placeholder before giving up
        this.createSilentAudioPlaceholder(key);
        this.time.delayedCall(100, () => {
          if (this.cache.audio.exists(key)) {
            this.continuePlayingDialogueAudio(key);
          } else {
            console.error(`❌ Still can't play audio: ${key}`);
          }
        });
        return;
      }
      
      this.continuePlayingDialogueAudio(key);
    } catch (error) {
      console.error(`❌ Error in playDialogueAudio:`, error);
      // Still display text even if audio fails
      if (this.characterPortrait && this.currentEntry.speakerId !== 'narrator') {
        // Fix: Pass the character ID instead of the sprite object
        this.addSpeakingAnimation(this.currentEntry.speakerId);
      }
      this.time.delayedCall(5000, () => {
        if (this.characterPortrait) {
          this.stopSpeakingAnimation();
        }
      });
    }
  }

  private continuePlayingDialogueAudio(key: string): void {
    try {
      // Play the new dialogue audio with additional error handling
      console.log(`🔊 Attempting to play audio: ${key}`);
      
      try {
        this.dialogSound = this.sound.add(key, { volume: 1.0 });
      } catch (addError) {
        console.error(`❌ Failed to add sound: ${key}`, addError);
        return;
      }
      
      // Add visual feedback when audio is playing
      if (this.characterPortrait && this.currentEntry.speakerId !== 'narrator') {
        this.addSpeakingAnimation(this.currentEntry.speakerId);
      }
      
      this.dialogSound.once('play', () => {
        console.log(`✅ Audio playing: ${key}`);
        // Start audio visualization
        this.showAudioWaveform(true);
      });
      
      this.dialogSound.once('complete', () => {
        console.log(`✅ Audio completed: ${key}`);
        // Stop speaking animation
        if (this.characterPortrait) {
          this.stopSpeakingAnimation();
        }
        // Hide audio visualization
        this.showAudioWaveform(false);
      });
      
      this.dialogSound.once('loaderror', (error: any) => {
        console.error(`❌ Failed to play audio: ${key}`, error);
        // Stop speaking animation on error
        if (this.characterPortrait) {
          this.stopSpeakingAnimation();
        }
      });
      
      // Verify sound was added successfully
      if (!this.dialogSound) {
        console.error(`❌ Failed to add sound: ${key}`);
        return;
      }
      
      // Force a user interaction for mobile browsers
      let success = false;
      try {
        success = this.dialogSound.play();
      } catch (playError) {
        console.error(`❌ Exception during play: ${key}`, playError);
      }
      
      console.log(`🎵 Audio play result: ${success}`);
      
      // Still continue even if audio failed
      this.events.emit('typingComplete');
      
      // Sync text typing with audio if timing data available
      if (this.currentEntry.words && this.currentEntry.words.length > 0) {
        this.syncTextWithAudio(this.dialogSound);
      }
    } catch (error) {
      console.error(`❌ Error playing dialogue audio:`, error);
      // Stop speaking animation on error
      if (this.characterPortrait) {
        this.stopSpeakingAnimation();
      }
      // Still emit the typing complete event so the game continues
      this.events.emit('typingComplete');
    }
  }

  private loadWithSoundManager(audioKey: string): void {
    try {
      // Get SoundManager instance if available - fixing the incorrect access
      const SoundManager = (window as any).SoundManager; // Use only the global reference
      
      if (SoundManager && SoundManager.getInstance) {
        const soundManager = SoundManager.getInstance();
        const audioPath = `assets/audio/dialogue/${audioKey}.mp3`;
        
        soundManager.loadAudio(audioKey, audioPath)
          .then(() => {
            console.log(`🎧 SoundManager loaded: ${audioKey}`);
            this.playDialogueAudio(audioKey);
          })
          .catch((error: any) => {
            console.error(`❌ SoundManager failed to load: ${audioKey}`, error);
            this.generateAndLoadAudio(audioKey, this.currentEntry.japanese);
          });
      } else {
        this.generateAndLoadAudio(audioKey, this.currentEntry.japanese);
      }
    } catch (error) {
      console.error(`❌ Error using SoundManager:`, error);
      this.generateAndLoadAudio(audioKey, this.currentEntry.japanese);
    }
  }

  private async generateAndLoadAudio(key: string, text: string): Promise<void> {
    try {
      console.log(`Generating audio for: ${key}`);
      const characterVoice = VoiceGenerator.getVoiceForCharacter(this.currentEntry.speakerId);
      
      // Generate the voice (this will return the path where the audio should be)
      const audioPath = await VoiceGenerator.generateVoiceForDialogue(
        key,
        text,
        'ja-JP',
        characterVoice
      );
      
      console.log(`Generated audio path: ${audioPath}`);
      
      // Load the audio (should already be pre-generated, but try anyway)
      this.load.audio(key, audioPath);
      this.load.once('complete', () => {
        this.playDialogueAudio(key);
      });
      this.load.start();
    } catch (error) {
      console.error('Error generating and loading audio:', error);
    }
  }

  private syncTextWithAudio(audio: Phaser.Sound.BaseSound): void {
    // Only if words array with timing data is available
    if (!this.currentEntry.words || this.currentEntry.words.length === 0) return;
    
    // Clear existing text
    this.dialogText.setText('');
    
    // Set up markers for each word
    this.currentEntry.words.forEach((wordData: {word: string, start: number}) => {
      const { word, start } = wordData;
      
      // Create a timeout to show each word at the right time
      this.time.delayedCall(start * 1000, () => {
        this.dialogText.text += word;
      });
    });
  }

  /**
   * Adds a speaking animation to the character with the given ID
   */
  private addSpeakingAnimation(characterId: string): void {
    try {
      // For the simple case, store the character portrait in the characters map if not already done
      if (!this.characters.has(characterId) && this.characterPortrait) {
        this.characters.set(characterId, { sprite: this.characterPortrait });
      }
      
      // Check if we have a valid animation system first
      const character = this.characters.get(characterId);
      
      // First attempt: Try to use the character sprite's animation if it exists
      if (character?.sprite?.anims && typeof character.sprite.anims.play === 'function') {
        // Check if the animation exists before playing it
        if (character.sprite.anims.animationManager.exists(`${characterId}-speaking`)) {
          character.sprite.anims.play(`${characterId}-speaking`, true);
          return;
        }
      }
      
      // Second attempt: Try the characterPortrait directly if it exists
      if (this.characterPortrait?.anims && typeof this.characterPortrait.anims.play === 'function') {
        // Check if the animation exists before playing it
        if (this.characterPortrait.anims.animationManager.exists(`${characterId}-speaking`)) {
          this.characterPortrait.anims.play(`${characterId}-speaking`, true);
          return;
        }
      }
      
      // Fallback: Create a simple speaking effect using tweens if no animation is available
      if (this.characterPortrait && !this.speakingTween) {
        this.speakingTween = this.tweens.add({
          targets: this.characterPortrait,
          scaleX: this.characterPortrait.scaleX * 1.02,
          scaleY: this.characterPortrait.scaleY * 1.02,
          duration: 300,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Also create a simple speaking indicator if it doesn't exist
        if (!this.speakingIndicator) {
          const x = this.characterPortrait.x + 50;
          const y = this.characterPortrait.y - 100;
          this.speakingIndicator = this.add.circle(x, y, 10, 0xffffff, 0.7);
          // Make it pulse
          this.tweens.add({
            targets: this.speakingIndicator,
            alpha: 0.3,
            scale: 1.3,
            duration: 600,
            yoyo: true,
            repeat: -1
          });
        }
      }
    } catch (error) {
      console.error("Error in addSpeakingAnimation:", error);
      // Ensure we don't crash the game for animation issues
    }
  }

  /**
   * Stops the speaking animation for the specified character or all characters
   */
  private stopSpeakingAnimation(characterId?: string): void {
    try {
      // First, stop any tween animation if it exists
      if (this.speakingTween) {
        this.speakingTween.stop();
        this.speakingTween = undefined;
        
        // Reset character portrait scale if needed
        if (this.characterPortrait) {
          this.characterPortrait.setScale(1); // Reset to normal scale
        }
      }
      
      // Hide speaking indicator if it exists
      if (this.speakingIndicator) {
        this.speakingIndicator.setVisible(false);
      }
      
      // Now try to stop sprite animations
      if (characterId) {
        const character = this.characters.get(characterId);
        if (character?.sprite?.anims && typeof character.sprite.anims.stop === 'function') {
          character.sprite.anims.stop();
        }
      } else {
        // Stop animations for all characters
        this.characters.forEach((character: Character) => {
          if (character?.sprite?.anims && typeof character.sprite.anims.stop === 'function') {
            character.sprite.anims.stop();
          }
        });
        
        // Also stop the main character portrait animation if it exists
        if (this.characterPortrait?.anims && typeof this.characterPortrait.anims.stop === 'function') {
          this.characterPortrait.anims.stop();
        }
      }
    } catch (error) {
      console.error("Error in stopSpeakingAnimation:", error);
      // Ensure we don't crash the game for animation issues
    }
  }

  /**
   * Creates the audio waveform visualization elements
   */
  private createAudioWaveform(): void {
    // Clean up existing waveform if any
    if (this.audioWaveform) {
      this.audioWaveform.forEach(rect => rect.destroy());
    }
    
    // Create new waveform visualization
    const numBars = 5;
    const barWidth = 4;
    const barSpacing = 4;
    const barHeight = 20;
    const startX = this.cameras.main.width - 50;
    const startY = this.cameras.main.height - 80;
    
    this.audioWaveform = [];
    
    for (let i = 0; i < numBars; i++) {
      const x = startX + i * (barWidth + barSpacing);
      const rect = this.add.rectangle(x, startY, barWidth, barHeight, 0xffffff, 0.7);
      rect.setVisible(false);
      this.audioWaveform.push(rect);
    }
  }

  /**
   * Shows or hides the audio waveform visualization
   */
  private showAudioWaveform(visible: boolean): void {
    if (this.audioWaveform && this.audioWaveform.length > 0) {
      // Show/hide all bars
      this.audioWaveform.forEach(rect => rect.setVisible(visible));
      
      // If showing, create animation effect
      if (visible) {
        this.audioWaveform.forEach((rect, index) => {
          // Create a unique animation for each bar
          this.tweens.add({
            targets: rect,
            scaleY: Math.random() * 1.5 + 0.5, // Random height between 0.5 and 2.0
            duration: 300 + Math.random() * 200, // Random duration between 300-500ms
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: index * 50 // Stagger the animations
          });
        });
      } else {
        // Stop all animations when hiding
        this.audioWaveform.forEach(rect => {
          this.tweens.killTweensOf(rect);
        });
      }
    }
  }
}
