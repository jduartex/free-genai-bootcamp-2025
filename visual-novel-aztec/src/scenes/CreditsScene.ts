import Phaser from 'phaser';

export class CreditsScene extends Phaser.Scene {
  private _returnScene: string = 'MenuScene';
  private _creditTexts: Phaser.GameObjects.Text[] = [];
  private _creditImages: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: 'CreditsScene' });
  }

  init(data: { returnScene?: string } = {}): void {
    this._returnScene = data.returnScene || 'MenuScene';
  }

  create(): void {
    // Add background
    const bg = this.add.rectangle(
      this.cameras.main.width / 2, 
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.9
    );
    
    // Add title text
    const title = this.add.text(
      this.cameras.main.width / 2,
      50,
      'Credits',
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    
    // Create credits content
    this.createCredits();
    
    // Add back button
    const backButton = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height - 50,
      'button-default'
    )
    .setDisplaySize(200, 60)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.sound.play('click', { volume: 0.5 });
      this.scene.start(this._returnScene);
    });
    
    // Add text to the button
    const backText = this.add.text(
      backButton.x,
      backButton.y,
      'Back',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
  
  private createCredits(): void {
    const centerX = this.cameras.main.width / 2;
    let currentY = 120;
    const lineHeight = 40;
    
    const credits = [
      { title: 'Game Design', name: 'Your Team' },
      { title: 'Programming', name: 'Your Team' },
      { title: 'Art Assets', name: 'Generated with AWS Bedrock' },
      { title: 'Sound Effects', name: 'Various Sources' },
      { title: 'Music', name: 'Various Artists' },
      { title: 'Special Thanks', name: 'AWS Generative AI Team' }
    ];
    
    // Add each credit line
    credits.forEach(credit => {
      this._creditTexts.push(this.add.text(
        centerX - 150,
        currentY,
        credit.title + ':',
        {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ffcc00',
          fontStyle: 'bold'
        }
      ).setOrigin(0, 0.5));
      
      this._creditTexts.push(this.add.text(
        centerX + 20,
        currentY,
        credit.name,
        {
          fontFamily: 'Arial',
          fontSize: '22px',
          color: '#ffffff'
        }
      ).setOrigin(0, 0.5));
      
      currentY += lineHeight;
    });
    
    // Add AI credit notice
    currentY += 40;
    
    const aiNotice = this.add.text(
      centerX,
      currentY,
      'Assets in this game were created with the help of generative AI.',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#999999',
        align: 'center',
        wordWrap: { width: 600 }
      }
    ).setOrigin(0.5);
    
    this._creditTexts.push(aiNotice);
  }
  
  update(): void {
    // Add animation or interactivity if needed
  }
}
