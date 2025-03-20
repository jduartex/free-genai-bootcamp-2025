import { Scene } from 'phaser';

// Define interfaces for the dialogue manifest structure
interface DialogueFile {
  dialogueName: string;
  dialoguePath: string;
}

interface CharacterDialogue {
  characterName: string;
  dialogueFiles: DialogueFile[];
}

export interface DialogueAudio {
  characterName: string;
  dialogueName: string;
  audio: Phaser.Sound.BaseSound;
}

export class DialogueAudioManager {
  private scene: Scene;
  private dialogueAudio: Map<string, DialogueAudio> = new Map();
  private currentDialogue: Phaser.Sound.BaseSound | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.initializeFromManifest();
  }

  private initializeFromManifest(): void {
    const assetManifest = this.scene.cache.json.get('assetManifest');
    if (!assetManifest || !assetManifest.dialogue) {
      console.warn('No dialogue defined in asset manifest');
      return;
    }

    assetManifest.dialogue.forEach((character: CharacterDialogue) => {
      character.dialogueFiles.forEach((dialogueFile: DialogueFile) => {
        if (this.scene.sound.get(dialogueFile.dialogueName)) {
          const audio = this.scene.sound.get(dialogueFile.dialogueName);
          this.dialogueAudio.set(dialogueFile.dialogueName, {
            characterName: character.characterName,
            dialogueName: dialogueFile.dialogueName,
            audio
          });
          console.log(`Registered dialogue audio: ${dialogueFile.dialogueName}`);
        }
      });
    });
  }

  playDialogue(dialogueName: string): void {
    if (this.currentDialogue && this.currentDialogue.isPlaying) {
      this.currentDialogue.stop();
    }
    
    const dialogue = this.dialogueAudio.get(dialogueName);
    if (dialogue) {
      console.log(`Playing dialogue: ${dialogueName}`);
      this.currentDialogue = dialogue.audio;
      this.currentDialogue.play();
    } else {
      console.warn(`Dialogue not found: ${dialogueName}`);
    }
  }

  playCharacterDialogue(characterName: string, dialogueType: string): void {
    const fullName = `${characterName}-${dialogueType}`;
    this.playDialogue(fullName);
  }

  stopAllDialogue(): void {
    if (this.currentDialogue && this.currentDialogue.isPlaying) {
      this.currentDialogue.stop();
      this.currentDialogue = null;
    }
  }
}
