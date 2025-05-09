import Phaser from 'phaser';

export default class GameEngine {
  constructor(containerId, onGameReady) {
    this.containerId = containerId;
    this.onGameReady = onGameReady;
    this.game = null;
    this.player = null;
    this.enemy = null;
    this.playerHealth = 100;
    this.enemyHealth = 100;
    this.playerMaxHealth = 100;
    this.enemyMaxHealth = 100;
    this.playerHealthBar = null;
    this.enemyHealthBar = null;
    this.attackButton = null;
    this.attackEffect = null;
    this.damageText = null;
    this.levelText = null;
    this.currentLevel = 1;
    this.xpPoints = 0;
    this.xpText = null;
    this.levelUpEffect = null;
    this.gameScene = null;
  }

  init() {
    const config = {
      type: Phaser.AUTO,
      parent: this.containerId,
      width: 800,
      height: 400,
      transparent: true,
      scene: {
        preload: this.preload.bind(this),
        create: this.create.bind(this),
        update: this.update.bind(this)
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      }
    };

    this.game = new Phaser.Game(config);
  }

  preload() {
    this.gameScene = this.game.scene.scenes[0];
    
    // Load game assets
    this.gameScene.load.spritesheet('player', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.gameScene.load.spritesheet('enemy', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.gameScene.load.image('background', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/skies/space3.png');
    this.gameScene.load.image('attack', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/particles/blue.png');
    this.gameScene.load.image('levelup', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/particles/yellow.png');
  }

  create() {
    // Add background
    this.gameScene.add.image(400, 200, 'background');
    
    // Create player
    this.player = this.gameScene.physics.add.sprite(200, 200, 'player');
    this.player.setScale(2);
    this.player.setTint(0x00ff00);
    
    // Create enemy
    this.enemy = this.gameScene.physics.add.sprite(600, 200, 'enemy');
    this.enemy.setScale(2);
    this.enemy.setTint(0xff0000);
    this.enemy.flipX = true;
    
    // Create animations
    this.gameScene.anims.create({
      key: 'idle',
      frames: this.gameScene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.gameScene.anims.create({
      key: 'attack',
      frames: this.gameScene.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: 0
    });
    
    // Play idle animation
    this.player.anims.play('idle', true);
    this.enemy.anims.play('idle', true);
    
    // Create health bars
    this.createHealthBars();
    
    // Create level and XP text
    this.levelText = this.gameScene.add.text(20, 20, `Level: ${this.currentLevel}`, { 
      fontSize: '24px', 
      fill: '#fff',
      fontFamily: '"Press Start 2P", cursive',
      stroke: '#000',
      strokeThickness: 4
    });
    
    this.xpText = this.gameScene.add.text(20, 50, `XP: ${this.xpPoints}`, { 
      fontSize: '18px', 
      fill: '#fff',
      fontFamily: '"Press Start 2P", cursive',
      stroke: '#000',
      strokeThickness: 3
    });
    
    // Create particle effects
    this.createParticleEffects();
    
    // Notify that game is ready
    if (this.onGameReady) {
      this.onGameReady();
    }
  }
  
  update() {
    // Update game state
  }
  
  createHealthBars() {
    // Player health bar background
    this.gameScene.add.rectangle(200, 150, 120, 15, 0x000000).setOrigin(0.5);
    this.playerHealthBar = this.gameScene.add.rectangle(200, 150, 120, 15, 0x00ff00).setOrigin(0.5);
    
    // Enemy health bar background
    this.gameScene.add.rectangle(600, 150, 120, 15, 0x000000).setOrigin(0.5);
    this.enemyHealthBar = this.gameScene.add.rectangle(600, 150, 120, 15, 0xff0000).setOrigin(0.5);
  }
  
  createParticleEffects() {
    // Attack effect
    this.attackEffect = this.gameScene.add.particles(0, 0, 'attack', {
      speed: 100,
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 500
    });
    this.attackEffect.stop();
    
    // Level up effect
    this.levelUpEffect = this.gameScene.add.particles(0, 0, 'levelup', {
      speed: 100,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      quantity: 50
    });
    this.levelUpEffect.stop();
  }
  
  playerAttack(damage = 20) {
    // Play attack animation
    this.player.anims.play('attack');
    
    // Show attack effect
    this.attackEffect.setPosition(this.enemy.x, this.enemy.y);
    this.attackEffect.explode(20);
    
    // Reduce enemy health
    this.enemyHealth = Math.max(0, this.enemyHealth - damage);
    
    // Update enemy health bar
    this.enemyHealthBar.width = (this.enemyHealth / this.enemyMaxHealth) * 120;
    
    // Show damage text
    if (this.damageText) this.damageText.destroy();
    this.damageText = this.gameScene.add.text(this.enemy.x, this.enemy.y - 50, `-${damage}`, { 
      fontSize: '24px', 
      fill: '#ff0000',
      fontFamily: '"Press Start 2P", cursive'
    });
    
    // Fade out damage text
    this.gameScene.tweens.add({
      targets: this.damageText,
      y: this.enemy.y - 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        if (this.damageText) this.damageText.destroy();
      }
    });
    
    // Enemy shake effect
    this.gameScene.tweens.add({
      targets: this.enemy,
      x: this.enemy.x + 10,
      yoyo: true,
      repeat: 5,
      duration: 50
    });
    
    // Return to idle animation
    setTimeout(() => {
      this.player.anims.play('idle', true);
    }, 500);
    
    return this.enemyHealth <= 0;
  }
  
  enemyAttack(damage = 10) {
    // Reduce player health
    this.playerHealth = Math.max(0, this.playerHealth - damage);
    
    // Update player health bar
    this.playerHealthBar.width = (this.playerHealth / this.playerMaxHealth) * 120;
    
    // Show damage text
    const damageText = this.gameScene.add.text(this.player.x, this.player.y - 50, `-${damage}`, { 
      fontSize: '24px', 
      fill: '#ff0000',
      fontFamily: '"Press Start 2P", cursive'
    });
    
    // Fade out damage text
    this.gameScene.tweens.add({
      targets: damageText,
      y: this.player.y - 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        damageText.destroy();
      }
    });
    
    // Player shake effect
    this.gameScene.tweens.add({
      targets: this.player,
      x: this.player.x - 10,
      yoyo: true,
      repeat: 5,
      duration: 50
    });
    
    return this.playerHealth <= 0;
  }
  
  addXP(points) {
    this.xpPoints += points;
    this.xpText.setText(`XP: ${this.xpPoints}`);
    
    // Check for level up (simple formula: 100 XP per level)
    const newLevel = Math.floor(this.xpPoints / 100) + 1;
    if (newLevel > this.currentLevel) {
      this.levelUp(newLevel);
    }
  }
  
  levelUp(newLevel) {
    this.currentLevel = newLevel;
    this.levelText.setText(`Level: ${this.currentLevel}`);
    
    // Show level up effect
    this.levelUpEffect.setPosition(this.player.x, this.player.y);
    this.levelUpEffect.explode(50);
    
    // Increase player max health
    this.playerMaxHealth += 20;
    this.playerHealth = this.playerMaxHealth;
    this.playerHealthBar.width = 120; // Full health
    
    // Show level up text
    const levelUpText = this.gameScene.add.text(this.player.x - 50, this.player.y - 70, 'LEVEL UP!', { 
      fontSize: '28px', 
      fill: '#ffff00',
      fontFamily: '"Press Start 2P", cursive',
      stroke: '#000',
      strokeThickness: 4
    });
    
    // Animate level up text
    this.gameScene.tweens.add({
      targets: levelUpText,
      y: this.player.y - 120,
      alpha: 0,
      scale: 1.5,
      duration: 2000,
      onComplete: () => {
        levelUpText.destroy();
      }
    });
  }
  
  resetEnemy() {
    this.enemyHealth = this.enemyMaxHealth;
    this.enemyHealthBar.width = 120; // Full health
  }
  
  gameOver() {
    const gameOverText = this.gameScene.add.text(400, 200, 'GAME OVER', { 
      fontSize: '48px', 
      fill: '#ff0000',
      fontFamily: '"Press Start 2P", cursive',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    // Animate game over text
    this.gameScene.tweens.add({
      targets: gameOverText,
      scale: 1.2,
      yoyo: true,
      repeat: -1,
      duration: 1000
    });
  }
}
