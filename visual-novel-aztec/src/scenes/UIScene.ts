import Phaser from 'phaser';

interface TimerConfig {
  initial: number;
  warning: number;
  penalty: number;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  image: Phaser.GameObjects.Image | null;
  icon: Phaser.GameObjects.Image | null;
}

export class UIScene extends Phaser.Scene {
  // Make sure timerInterval is correctly declared with a type that matches how it's used
  public inventoryItems: InventoryItem[] = [];
  public remainingTime: number = 3600;
  public isTimerPaused: boolean = false;
  public timerImage!: Phaser.GameObjects.Image;
  public timerText!: Phaser.GameObjects.Text;
  public timerConfig!: TimerConfig;
  // Fix the type declaration for timerInterval to ensure compatibility with setInterval
  public timerInterval: NodeJS.Timeout | null = null;
  public helpButton!: Phaser.GameObjects.Image;
  public inventoryButton!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'UIScene' });
  }

  // Add proper return type to methods
  init(data: { remainingTime?: number; timerConfig?: TimerConfig } = {}): void {
    this.remainingTime = data.remainingTime || 3600;
    this.timerConfig = data.timerConfig || {
      initial: 3600,
      warning: 300,
      penalty: 60
    };
  }

  create(): void {
    // Create timer display
    this.timerImage = this.add.image(
      this.cameras.main.width - 100,
      60,
      'timer'
    ).setDisplaySize(180, 80);

    this.timerText = this.add.text(
      this.cameras.main.width - 100,
      60,
      this.formatTime(this.remainingTime),
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);

    // Create help button
    this.helpButton = this.add.image(
      this.cameras.main.width - 50,
      this.cameras.main.height - 50,
      'help-icon'
    ).setDisplaySize(60, 60)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.showHelpMenu();
    });

    // Create inventory button
    this.inventoryButton = this.add.image(
      50,
      this.cameras.main.height - 50,
      'inventory-icon'
    ).setDisplaySize(60, 60)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.showInventory();
    });

    // Start timer
    this.startTimer();
    
    // Set up event listeners
    this.setupEvents();
    
    // Setup timer with proper typing
    this.setupTimerInterval();
  }

  update(time: number, delta: number): void {
    // In case we need any dynamic updates beyond the timer
  }

  // Fix event handler type in setupEvents
  private setupEvents(): void {
    // Use proper event parameter types
    this.scene.get('GameScene').events.on('updateTimer', (remainingTime: number) => {
      this.remainingTime = remainingTime;
      this.updateTimerDisplay();
    });
    
    this.scene.get('GameScene').events.on('addInventoryItem', (itemId: string) => {
      this.addInventoryItem(itemId);
    });
  }

  private startTimer(): void {
    // Clear any existing timer to prevent duplicates
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
    }
    
    // Store result of setInterval with the correct type
    this.timerInterval = setInterval(() => {
      if (!this.isTimerPaused) {
        this.remainingTime -= 1;
        this.updateTimerDisplay();
        this.events.emit('timerTick', this.remainingTime);
        
        // Check for warning threshold
        if (this.timerConfig && 
            this.remainingTime === this.timerConfig.warning) {
          this.displayTimeWarning();
        }
      }
    }, 1000);
  }

  private pauseTimer(): void {
    this.isTimerPaused = true;
    
    // Clear the interval to prevent memory leak
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private resumeTimer(): void {
    // Only resume if it was previously paused
    if (!this.isTimerPaused) return;
    
    this.isTimerPaused = false;
    this.startTimer();
  }

  private toggleTimer(): void {
    if (this.isTimerPaused) {
      this.resumeTimer();
    } else {
      this.pauseTimer();
    }
  }

  private updateTimerDisplay(): void {
    if (!this.timerText) return;
    
    // Update timer text
    this.timerText.setText(this.formatTime(this.remainingTime));
    
    // Change color based on remaining time
    if (this.timerConfig && this.remainingTime <= this.timerConfig.warning) {
      this.timerText.setColor('#ff0000'); // Red for warning
    } else if (this.remainingTime < 0) {
      this.timerText.setColor('#ff00ff'); // Purple for overtime
    } else {
      this.timerText.setColor('#ffffff'); // White for normal
    }
    
    // Add visual feedback when time is getting low
    if (this.timerConfig && this.remainingTime <= this.timerConfig.warning) {
      if (!this.timerText.getData('warning-pulse')) {
        this.timerText.setData('warning-pulse', true);
        
        this.tweens.add({
          targets: this.timerText,
          scale: { from: 1.0, to: 1.2 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else if (this.timerText.getData('warning-pulse')) {
      this.timerText.setData('warning-pulse', false);
      this.tweens.killTweensOf(this.timerText);
      this.timerText.setScale(1.0);
    }
  }

  private formatTime(seconds: number): string {
    // Convert remaining seconds to mm:ss format
    const absSeconds = Math.abs(seconds);
    const minutes = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    
    // Add negative sign if time is negative
    const sign = seconds < 0 ? '-' : '';
    
    return `${sign}${this.padNumber(minutes)}:${this.padNumber(secs)}`;
  }

  private padNumber(minutes: number): string {
    return minutes < 10 ? '0' + minutes : minutes.toString();
  }

  private hideUIElements(): void {
    if (this.timerImage) this.timerImage.setVisible(false);
    if (this.timerText) this.timerText.setVisible(false);
  }

  private showUIElements(): void {
    if (this.timerImage) this.timerImage.setVisible(true);
    if (this.timerText) this.timerText.setVisible(true);
  }

  private displayTimeWarning(): void {
    // Flash the timer to indicate warning
    if (!this.timerText) return;
    
    this.tweens.add({
      targets: this.timerText,
      alpha: { from: 1, to: 0.3 },
      duration: 300,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut'
    });
    
    // Also show a warning message
    const warningText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3,
      'Warning: Time is running out!',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    // Fade out the warning
    this.tweens.add({
      targets: warningText,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      delay: 2000,
      onComplete: () => {
        warningText.destroy();
      }
    });
  }

  private showHelpMenu(): void {
    // Pause timer while help is shown
    this.pauseTimer();
    
    // Create semi-transparent background
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    ).setInteractive();
    
    // Create help window
    const helpWindow = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width - 200,
      this.cameras.main.height - 200,
      0x333333,
      1
    ).setStrokeStyle(2, 0xffffff);
    
    // Create title
    const title = this.add.text(
      this.cameras.main.width / 2,
      100,
      'Help',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Create hint options
    this.createHintButton(
      this.cameras.main.width / 2,
      200,
      'Small Hint (-1 min)',
      60,
      1
    );
    
    this.createHintButton(
      this.cameras.main.width / 2,
      280,
      'Medium Hint (-2 min)',
      120,
      2
    );
    
    this.createHintButton(
      this.cameras.main.width / 2,
      360,
      'Big Hint (-3 min)',
      180,
      3
    );
    
    // Create close button
    const closeButton = this.add.rectangle(
      this.cameras.main.width / 2,
      500,
      200,
      60,
      0x555555,
      1
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      // Clean up help menu
      bg.destroy();
      helpWindow.destroy();
      title.destroy();
      closeButton.destroy();
      closeText.destroy();
      
      // Resume timer
      this.resumeTimer();
    });
    
    const closeText = this.add.text(
      this.cameras.main.width / 2,
      500,
      'Close',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
  
  private createHintButton(x: number, y: number, label: string, cost: number, hintLevel: number): void {
    const button = this.add.rectangle(
      x,
      y,
      400,
      60,
      0x555555,
      1
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      button.setFillStyle(0x777777);
    })
    .on('pointerout', () => {
      button.setFillStyle(0x555555);
    })
    .on('pointerdown', () => {
      // Request hint from GameScene
      this.scene.get('GameScene').events.emit('requestHint', hintLevel);
      
      // Play feedback sound
      this.sound.play('click', { volume: 0.5 });
      
      // Close the help menu after selecting a hint
      const helpElements = this.children.getAll().filter(obj => 
        obj !== this.timerImage && 
        obj !== this.timerText && 
        obj !== this.helpButton && 
        obj !== this.inventoryButton
      );
      
      helpElements.forEach(element => element.destroy());
      
      // Resume timer
      this.resumeTimer();
    });
    
    const text = this.add.text(
      x,
      y,
      label,
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  private showInventory(): void {
    // Pause timer while inventory is shown
    this.pauseTimer();
    
    // Create semi-transparent background
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.8
    ).setInteractive();
    
    // Create inventory window
    const inventoryWindow = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width - 200,
      this.cameras.main.height - 200,
      0x333333,
      1
    ).setStrokeStyle(2, 0xffffff);
    
    // Create title
    const title = this.add.text(
      this.cameras.main.width / 2,
      100,
      'Inventory',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Display inventory items
    if (this.inventoryItems.length === 0) {
      this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        'No items yet',
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#aaaaaa',
          fontStyle: 'italic'
        }
      ).setOrigin(0.5);
    } else {
      this.inventoryItems.forEach((item: InventoryItem, index: number) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        
        const x = (this.cameras.main.width / 4) + col * (this.cameras.main.width / 4);
        const y = 200 + row * 150;
        
        // Create item slot
        const slot = this.add.rectangle(
          x,
          y,
          100,
          100,
          0x555555,
          1
        ).setStrokeStyle(1, 0xffffff)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          slot.setStrokeStyle(2, 0xffff00);
        })
        .on('pointerout', () => {
          slot.setStrokeStyle(1, 0xffffff);
        })
        .on('pointerdown', () => {
          this.sound.play('click', { volume: 0.5 });
          this.showItemDetail(item.id);
        });
        
        // Add item image
        const itemImg = this.add.sprite(
          x,
          y,
          item.id
        ).setDisplaySize(90, 90);
        
        // Add item name below
        this.add.text(
          x,
          y + 70,
          item.name,
          {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
          }
        ).setOrigin(0.5);
      });
    }
    
    // Create close button
    const closeButton = this.add.rectangle(
      this.cameras.main.width / 2,
      500,
      200,
      60,
      0x555555,
      1
    ).setStrokeStyle(2, 0xffffff)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      // Clean up inventory menu
      bg.destroy();
      inventoryWindow.destroy();
      title.destroy();
      closeButton.destroy();
      closeText.destroy();
      
      // Destroy all other inventory-related elements
      const inventoryElements = this.children.getAll().filter(obj => 
        obj !== this.timerImage && 
        obj !== this.timerText && 
        obj !== this.helpButton && 
        obj !== this.inventoryButton
      );
      
      inventoryElements.forEach(element => element.destroy());
      
      // Resume timer
      this.resumeTimer();
    });
    
    const closeText = this.add.text(
      this.cameras.main.width / 2,
      500,
      'Close',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }

  private showItemDetail(itemId: string): void {
    // Find the item
    const item = this.inventoryItems.find((i: InventoryItem) => i.id === itemId);
    if (!item) return;
    
    // Show item detail popup
    const detailBg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      300,
      0x222222,
      0.9
    ).setStrokeStyle(2, 0xffffff);
    
    // Item name
    const nameText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 100,
      item.name,
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Item image
    const itemImg = this.add.sprite(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      item.id
    ).setDisplaySize(150, 150);
    
    // Item description
    const descText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 100,
      item.description,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: 350 }
      }
    ).setOrigin(0.5);
    
    // Close button for detail view
    const closeDetailButton = this.add.text(
      this.cameras.main.width / 2 + 170,
      this.cameras.main.height / 2 - 130,
      'X',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#444444',
      }
    ).setPadding(10, 5, 10, 5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      // Clean up detail view elements
      detailBg.destroy();
      nameText.destroy();
      itemImg.destroy();
      descText.destroy();
      closeDetailButton.destroy();
    });
  }

  // Fix return type for public methods
  public addInventoryItem(itemId: string): void {
    // Check if item already exists in inventory
    const existingItem = this.inventoryItems.find((item: InventoryItem) => item.id === itemId);
    if (existingItem) {
      console.log(`Item ${itemId} already in inventory`);
      return;
    }
    
    // Create a new inventory item
    const newItem: InventoryItem = {
      id: itemId,
      name: this.getItemName(itemId),
      description: this.getItemDescription(itemId),
      image: null,
      icon: null
    };
    
    // Add to inventory
    this.inventoryItems.push(newItem);
    
    // Play pickup sound
    this.sound.play('pickup', { volume: 0.5 });
    
    // Show notification
    this.showNotification(`Added ${newItem.name} to inventory!`);
  }

  /**
   * Remove an item from the inventory
   * @param itemId - The ID of the item to remove
   */
  public removeItem(itemId: string): void {
    const index = this.inventoryItems.findIndex((item: InventoryItem) => item.id === itemId);
    if (index >= 0) {
      this.inventoryItems.splice(index, 1);
    }
  }
  
  /**
   * Check if an item is in the inventory
   * @param itemId - The ID of the item to check
   * @returns True if the item is in the inventory
   */
  public hasItem(itemId: string): boolean {
    return this.inventoryItems.some((item: InventoryItem) => item.id === itemId);
  }

  /**
   * Display a notification message temporarily
   * @param message - The message to display
   */
  private showNotification(message: string): void {
    // Create notification background
    const notificationBg = this.add.rectangle(
      this.cameras.main.width / 2,
      100,
      400,
      60,
      0x333333,
      0.8
    ).setStrokeStyle(1, 0xffffff);
    
    // Create notification text
    const notificationText = this.add.text(
      this.cameras.main.width / 2,
      100,
      message,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5);
    
    // Fade out and destroy after delay
    this.tweens.add({
      targets: [notificationBg, notificationText],
      alpha: { from: 1, to: 0 },
      duration: 2000,
      delay: 1500,
      onComplete: () => {
        notificationBg.destroy();
        notificationText.destroy();
      }
    });
  }
  
  /**
   * Get display name for an item
   * @param itemId - The item ID
   * @returns The display name for the item
   */
  private getItemName(itemId: string): string {
    // In a production game, this would come from a data source
    const itemNames: Record<string, string> = {
      'key': 'Prison Key',
      'map': 'Treasure Map',
      'codex': 'Aztec Codex',
      'pendant': 'Jade Pendant',
      'tool': 'Stone Tool'
    };
    
    return itemNames[itemId as keyof typeof itemNames] || `Item ${itemId}`;
  }
  
  /**
   * Get description for an item
   * @param itemId - The item ID
   * @returns The description for the item
   */
  private getItemDescription(itemId: string): string {
    // In a production game, this would come from a data source
    const itemDescriptions: Record<string, string> = {
      'key': 'A rusty key that might open a prison cell.',
      'map': 'A map showing what appears to be hidden tunnels.',
      'codex': 'An ancient Aztec manuscript with important symbols.',
      'pendant': 'A beautiful jade pendant with mystical properties.',
      'tool': 'A stone tool that can help remove obstacles.'
    };
    
    return itemDescriptions[itemId as keyof typeof itemDescriptions] || `No description available for ${itemId}.`;
  }

  /**
   * Clean up resources before scene is removed
   * This is the correct Phaser lifecycle hook
   */
  public destroy(): void {
    this.cleanupResources();
  }
  
  /**
   * Clean up resources when scene sleeps or is stopped
   * This is the correct Phaser lifecycle hook
   */
  public sleep(): void {
    this.cleanupResources();
  }
  
  /**
   * Clean up resources shared between lifecycle methods
   */
  private cleanupResources(): void {
    // Clear timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Kill all tweens
    this.tweens.killAll();
    
    // Remove all listeners
    this.events.removeAllListeners();
  }
  
  private setupTimerInterval(): void {
    // Clear any existing timer first
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Set up a new timer
    this.timerInterval = setInterval(() => {
      if (!this.isTimerPaused) {
        this.remainingTime--;
        this.updateTimerDisplay();
        
        // Check for warning threshold
        if (this.timerConfig?.warning && 
            this.remainingTime <= this.timerConfig.warning &&
            this.remainingTime % 60 === 0) {
          this.displayTimeWarning();
        }
        
        // Emit timer tick event
        this.scene.get('GameScene').events.emit('timerTick', this.remainingTime);
      }
    }, 1000) as unknown as NodeJS.Timeout;
  }
}