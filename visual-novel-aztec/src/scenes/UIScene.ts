import Phaser from 'phaser';
import { TimerConfig } from '../types/StoryTypes';

export class UIScene extends Phaser.Scene {
  private timerText!: Phaser.GameObjects.Text;
  private timerImage!: Phaser.GameObjects.Image;
  private timerConfig!: TimerConfig;
  private remainingTime: number = 0;
  private timerInterval!: Phaser.Time.TimerEvent;
  private helpButton!: Phaser.GameObjects.Image;
  private inventoryButton!: Phaser.GameObjects.Image;
  private inventoryItems: string[] = [];
  private isTimerPaused: boolean = false;
  
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { remainingTime: number; timerConfig: TimerConfig }): void {
    this.remainingTime = data.remainingTime;
    this.timerConfig = data.timerConfig;
  }

  create(): void {
    // Create timer background
    this.timerImage = this.add.image(
      100, 
      50, 
      'timer'
    ).setOrigin(0.5, 0.5)
    .setDisplaySize(160, 60);
    
    // Create timer text
    this.timerText = this.add.text(
      100, 
      50, 
      this.formatTime(this.remainingTime), 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: this.remainingTime > 300 ? '#ffffff' : '#ff0000',
        align: 'center'
      }
    ).setOrigin(0.5, 0.5);
    
    // Start the timer
    this.startTimer();
    
    // Create help button
    this.helpButton = this.add.image(
      this.cameras.main.width - 50, 
      50, 
      'button'
    ).setDisplaySize(80, 80)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', this.showHelpMenu, this);
    
    // Add help icon/text
    this.add.text(
      this.cameras.main.width - 50, 
      50, 
      '?', 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '40px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5, 0.5);
    
    // Create inventory button
    this.inventoryButton = this.add.image(
      this.cameras.main.width - 150, 
      50, 
      'button'
    ).setDisplaySize(80, 80)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', this.toggleInventory, this);
    
    // Add inventory icon/text
    this.add.text(
      this.cameras.main.width - 150, 
      50, 
      '🎒', 
      { 
        fontFamily: 'Crimson Text',
        fontSize: '30px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5, 0.5);
    
    // Setup event listeners
    this.events.on('shutdown', this.stopTimer, this);
    this.events.on('destroy', this.stopTimer, this);
    
    // Listen for timer update events from GameScene
    this.scene.get('GameScene').events.on('updateTimer', (time: number) => {
      this.remainingTime = time;
      this.updateTimerDisplay();
    });
    
    // Listen for pause/resume
    this.scene.get('GameScene').events.on('pauseTimer', () => {
      this.pauseTimer();
    });
    
    this.scene.get('GameScene').events.on('resumeTimer', () => {
      this.resumeTimer();
    });
    
    // Listen for inventory updates
    this.scene.get('GameScene').events.on('addInventoryItem', (itemId: string) => {
      this.addInventoryItem(itemId);
    });
  }

  private startTimer(): void {
    this.timerInterval = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      this.timerInterval.destroy();
    }
  }

  private pauseTimer(): void {
    this.isTimerPaused = true;
    if (this.timerInterval) {
      this.timerInterval.paused = true;
    }
  }

  private resumeTimer(): void {
    this.isTimerPaused = false;
    if (this.timerInterval) {
      this.timerInterval.paused = false;
    }
  }

  private updateTimer(): void {
    if (this.isTimerPaused) return;
    
    this.remainingTime--;
    this.updateTimerDisplay();
    
    // Emit event to inform GameScene of the new time
    this.scene.get('GameScene').events.emit('timerTick', this.remainingTime);
    
    // Check for time warning conditions
    if (this.remainingTime === 300) { // 5 minutes left
      this.showTimeWarning(5);
    } else if (this.remainingTime === 60) { // 1 minute left
      this.showTimeWarning(1);
    } else if (this.remainingTime === 0) {
      // Time's up!
      this.scene.get('GameScene').events.emit('timeUp');
      
      // Timer continues into negative to show how over time they are
      this.timerText.setColor('#ff0000');
    }
  }

  private updateTimerDisplay(): void {
    this.timerText.setText(this.formatTime(this.remainingTime));
    
    // Change color if time is low
    if (this.remainingTime <= 300 && this.remainingTime > 0) { // 5 minutes or less
      this.timerText.setColor('#ff9900');
      
      // Add pulsing effect for low time
      if (!this.tweens.isTweening(this.timerText)) {
        this.tweens.add({
          targets: this.timerText,
          scale: { from: 1, to: 1.2 },
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }
    } else if (this.remainingTime <= 0) {
      this.timerText.setColor('#ff0000');
    }
  }

  private formatTime(seconds: number): string {
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const remainingSeconds = absSeconds % 60;
    
    // Add negative sign if time is below zero
    const sign = seconds < 0 ? '-' : '';
    
    return `${sign}${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private showTimeWarning(minutes: number): void {
    // Show a warning that time is running low
    this.scene.get('GameScene').events.emit('timeWarning', minutes);
    
    // Flash the timer
    this.tweens.add({
      targets: [this.timerImage, this.timerText],
      alpha: { from: 1, to: 0.2 },
      duration: 300,
      yoyo: true,
      repeat: 5
    });
    
    // Play warning sound
    this.sound.play('warning', { volume: 0.7 });
  }

  private showHelpMenu(): void {
    // Pause the timer while help menu is open
    this.pauseTimer();
    
    // Create a semi-transparent overlay
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    ).setInteractive();
    
    // Create help panel
    const panelWidth = this.cameras.main.width - 200;
    const panelHeight = this.cameras.main.height - 200;
    const panel = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      panelWidth,
      panelHeight,
      0x333333,
      0.9
    ).setStrokeStyle(2, 0xffffff);
    
    // Create title text
    const title = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - panelHeight / 2 + 40,
      'Help Menu',
      {
        fontFamily: 'Crimson Text',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Create help text sections
    const helpText = this.add.text(
      this.cameras.main.width / 2 - panelWidth / 2 + 40,
      this.cameras.main.height / 2 - panelHeight / 2 + 100,
      [
        'Game Controls:',
        '- Click on objects to interact with them',
        '- Click on dialogue to advance or skip',
        '- Click on choices to make a selection',
        '- Click the inventory button to view collected items',
        '',
        'Language Help:',
        '- Toggle English subtitles in the bottom right of dialogue',
        '- Request hints by clicking below (costs time)',
        '',
        'Current Puzzle:',
        '- Solve puzzles by selecting the correct Japanese answer',
        '- Wrong answers will cost 5 minutes of time',
        '- The timer continues even if it goes negative'
      ].join('\n'),
      {
        fontFamily: 'Noto Sans JP',
        fontSize: '20px',
        color: '#ffffff',
        lineSpacing: 10
      }
    );
    
    // Create hint buttons
    const hintButtonY = this.cameras.main.height / 2 + 80;
    const buttonSpacing = 60;
    
    const createHintButton = (
      x: number, 
      y: number, 
      label: string, 
      cost: number, 
      hintLevel: number
    ): void => {
      const hintButton = this.add.rectangle(
        x, y, 200, 50, 0x555555
      ).setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        hintButton.fillColor = 0x777777;
      })
      .on('pointerout', () => {
        hintButton.fillColor = 0x555555;
      })
      .on('pointerdown', () => {
        // Close help menu
        closeHelpMenu();
        
        // Request hint from GameScene
        this.scene.get('GameScene').events.emit('requestHint', hintLevel);
      });
      
      this.add.text(
        x, y, `${label}\n(Cost: ${cost} min)`,
        {
          fontFamily: 'Noto Sans JP',
          fontSize: '16px',
          color: '#ffffff',
          align: 'center'
        }
      ).setOrigin(0.5);
    };
    
    // Create the three levels of hints
    createHintButton(
      this.cameras.main.width / 2 - 220,
      hintButtonY,
      'Vocabulary Hint',
      1,
      1
    );
    
    createHintButton(
      this.cameras.main.width / 2,
      hintButtonY,
      'Grammar Hint',
      3,
      2
    );
    
    createHintButton(
      this.cameras.main.width / 2 + 220,
      hintButtonY,
      'Solution Hint',
      5,
      3
    );
    
    // Create close button
    const closeButton = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + panelHeight / 2 - 40,
      200,
      50,
      0x770000
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      closeButton.fillColor = 0x990000;
    })
    .on('pointerout', () => {
      closeButton.fillColor = 0x770000;
    })
    .on('pointerdown', () => {
      closeHelpMenu();
    });
    
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + panelHeight / 2 - 40,
      'Close',
      {
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Group all elements
    const helpElements = [overlay, panel, title, helpText, closeButton];
    
    // Function to close help menu
    const closeHelpMenu = (): void => {
      // Destroy all elements
      helpElements.forEach(element => element.destroy());
      
      // Resume timer
      this.resumeTimer();
    };
  }

  private toggleInventory(): void {
    // Pause the timer while inventory is open
    this.pauseTimer();
    
    // Create a semi-transparent overlay
    const overlay = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    ).setInteractive();
    
    // Create inventory panel
    const panelWidth = this.cameras.main.width - 200;
    const panelHeight = this.cameras.main.height - 200;
    const panel = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      panelWidth,
      panelHeight,
      0x333333,
      0.9
    ).setStrokeStyle(2, 0xffffff);
    
    // Create title text
    const title = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - panelHeight / 2 + 40,
      'Inventory',
      {
        fontFamily: 'Crimson Text',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Display inventory items or empty message
    let inventoryContent;
    
    if (this.inventoryItems.length === 0) {
      inventoryContent = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'No items collected yet.',
        {
          fontFamily: 'Noto Sans JP',
          fontSize: '20px',
          color: '#cccccc',
          align: 'center'
        }
      ).setOrigin(0.5);
    } else {
      // Create grid of inventory items
      const itemsPerRow = 4;
      const itemSize = 100;
      const itemSpacing = 20;
      const startX = this.cameras.main.width / 2 - ((itemSize + itemSpacing) * Math.min(itemsPerRow, this.inventoryItems.length) / 2) + (itemSize / 2);
      const startY = this.cameras.main.height / 2 - 50;
      
      inventoryContent = this.add.group();
      
      this.inventoryItems.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = startX + col * (itemSize + itemSpacing);
        const y = startY + row * (itemSize + itemSpacing);
        
        // Item background
        const itemBg = this.add.rectangle(
          x, y, itemSize, itemSize, 0x555555
        ).setStrokeStyle(2, 0xffffff)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.showItemDetails(item);
        });
        
        // Item image or placeholder
        const itemImage = this.add.sprite(x, y - 15, item)
          .setDisplaySize(itemSize - 20, itemSize - 40);
        
        // Item name
        const itemName = this.add.text(
          x, y + 30, item,
          {
            fontFamily: 'Noto Sans JP',
            fontSize: '14px',
            color: '#ffffff',
            align: 'center'
          }
        ).setOrigin(0.5);
        
        inventoryContent.add(itemBg);
        inventoryContent.add(itemImage);
        inventoryContent.add(itemName);
      });
    }
    
    // Create close button
    const closeButton = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + panelHeight / 2 - 40,
      200,
      50,
      0x770000
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      closeButton.fillColor = 0x990000;
    })
    .on('pointerout', () => {
      closeButton.fillColor = 0x770000;
    })
    .on('pointerdown', () => {
      closeInventory();
    });
    
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + panelHeight / 2 - 40,
      'Close',
      {
        fontFamily: 'Crimson Text',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Group all elements
    const inventoryElements = [overlay, panel, title, closeButton];
    
    // Function to close inventory
    const closeInventory = (): void => {
      // Destroy all elements
      inventoryElements.forEach(element => element.destroy());
      if (inventoryContent instanceof Phaser.GameObjects.Group) {
        inventoryContent.clear(true, true);
      } else if (inventoryContent) {
        inventoryContent.destroy();
      }
      
      // Resume timer
      this.resumeTimer();
    };
  }

  private showItemDetails(itemId: string): void {
    // This would show a detailed view of the selected inventory item
    // For now, we'll just log to console
    console.log(`Showing details for item: ${itemId}`);
  }

  private addInventoryItem(itemId: string): void {
    // Check if item already exists in inventory
    if (!this.inventoryItems.includes(itemId)) {
      this.inventoryItems.push(itemId);
      
      // Play item pickup sound
      this.sound.play('pickup', { volume: 0.5 });
      
      // Show notification
      this.showNotification(`Added to inventory: ${itemId}`);
    }
  }

  private showNotification(message: string): void {
    // Create notification text
    const notification = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      message,
      {
        fontFamily: 'Noto Sans JP',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 15, y: 10 }
      }
    ).setOrigin(0.5)
    .setAlpha(0);
    
    // Animation sequence
    this.tweens.add({
      targets: notification,
      alpha: 1,
      y: this.cameras.main.height - 120,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: notification,
            alpha: 0,
            y: this.cameras.main.height - 100,
            duration: 500,
            ease: 'Sine.easeIn',
            onComplete: () => {
              notification.destroy();
            }
          });
        });
      }
    });
  }
}
