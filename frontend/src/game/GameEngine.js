import Phaser from 'phaser';

// Import hero character spritesheet
import heroSpritesheet from '../assets/platformer/herochar sprites(new)/herochar_idle_anim_strip_4.png';
import enemySpritesheet from '../assets/platformer/enemies sprites/goblin/goblin_idle_anim_strip_4.png';
import heroAttackSpritesheet from '../assets/platformer/herochar sprites(new)/herochar_attack_anim_strip_4(new).png';
import heroHitSpritesheet from '../assets/platformer/herochar sprites(new)/herochar_hit_anim_strip_3.png';
import goblinAttackSpritesheet from '../assets/platformer/enemies sprites/goblin/goblin_attack_anim_strip_4.png';
import goblinHitSpritesheet from '../assets/platformer/enemies sprites/goblin/goblin_hit_anim_strip_3.png';
import background from '../assets/platformer/tiles and background_foreground (new)/background.png';
import attackEffect from '../assets/platformer/herochar sprites(new)/sword_effect_strip_4(new).png';
import hitEffect from '../assets/platformer/herochar sprites(new)/hit_sparkle_anim_strip_4.png';
import levelUpEffect from '../assets/platformer/miscellaneous sprites/orb_collected_anim_strip_5.png';
import grassProps from '../assets/platformer/miscellaneous sprites/grass_props.png';
import flowersProps from '../assets/platformer/miscellaneous sprites/flowers_props.png';
import bigFlowersProps from '../assets/platformer/miscellaneous sprites/bigflowers_props.png';
import rootProps from '../assets/platformer/miscellaneous sprites/root_props.png';
import dryGrassProps from '../assets/platformer/miscellaneous sprites/drygrass_props.png';
import savePointAnim from '../assets/platformer/miscellaneous sprites/save_point_anim_strip_9.png';

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
    this.playerHealthBarBorder = null;
    this.enemyHealthBar = null;
    this.enemyHealthBarBorder = null;
    this.attackButton = null;
    this.attackEffect = null;
    this.damageText = null;
    this.levelText = null;
    this.currentLevel = 1;
    this.xpPoints = 0;
    this.xpText = null;
    this.levelUpEffect = null;
    this.gameScene = null;
    this.attackAnimationPlaying = false;
    this.enemyTypes = [
      { key: 'goblin', scale: 2.0, offsetY: 0, frameStart: 0, frameEnd: 3 },
      { key: 'slime', scale: 2.0, offsetY: 0, frameStart: 0, frameEnd: 4 },
      { key: 'mushroom', scale: 2.0, offsetY: 0, frameStart: 0, frameEnd: 7 },
      { key: 'fly', scale: 2.0, offsetY: 0, frameStart: 0, frameEnd: 2 },
      { key: 'worm', scale: 2.0, offsetY: 0, frameStart: 0, frameEnd: 5 }
    ];
  }

  init() {
    const config = {
      type: Phaser.AUTO,
      parent: this.containerId,
      width: window.innerWidth,
      height: 500,
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
    
    // Load game assets with spritesheets
    this.gameScene.load.spritesheet('hero_idle', heroSpritesheet, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('hero_attack', heroAttackSpritesheet, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('hero_hit', heroHitSpritesheet, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('goblin_idle', enemySpritesheet, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('goblin_attack', goblinAttackSpritesheet, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('goblin_hit', goblinHitSpritesheet, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('attack_effect', attackEffect, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('hit_effect', hitEffect, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('level_up', levelUpEffect, { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    
    this.gameScene.load.spritesheet('save_point', savePointAnim, {
      frameWidth: 16,
      frameHeight: 16
    });
    
    // Load environment props
    this.gameScene.load.image('grass', grassProps);
    this.gameScene.load.image('flowers', flowersProps);
    this.gameScene.load.image('big_flowers', bigFlowersProps);
    this.gameScene.load.image('roots', rootProps);
    this.gameScene.load.image('dry_grass', dryGrassProps);
    
    this.gameScene.load.image('background', background);
  }

  create() {
    // Get the actual width of the game
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;
    
    // Add background with proper scaling to cover the entire area
    const bg = this.gameScene.add.image(gameWidth/2, gameHeight/2, 'background');
    bg.setDisplaySize(gameWidth, gameHeight); // Force it to cover the entire game area
    
    // Add decorative props
    this.addEnvironmentProps();
    
    // Create player animations
    this.createPlayerAnimations();
    
    // Create enemy animations
    this.createEnemyAnimations();
    
    // Create effect animations
    this.createEffectAnimations();
    
    // Create player (hero)
    this.player = this.gameScene.physics.add.sprite(gameWidth * 0.25, gameHeight * 0.6, 'hero_idle');
    this.player.setScale(5.0); // Make the player bigger
    
    // Create enemy based on current level
    this.createEnemy();
    
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
    
    // Play idle animations
    this.player.anims.play('hero_idle', true);
    this.enemy.anims.play('goblin_idle', true);
    
    // Notify that game is ready
    if (this.onGameReady) {
      this.onGameReady();
    }
  }
  
  addEnvironmentProps() {
    // Get the actual width of the game
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;
    
    // Add save point animation
    const savePoint = this.gameScene.physics.add.sprite(100, gameHeight - 100, 'save_point');
    savePoint.setScale(3);
    
    // Create save point animation
    this.gameScene.anims.create({
      key: 'save_point_anim',
      frames: this.gameScene.anims.generateFrameNumbers('save_point', { start: 0, end: 8 }),
      frameRate: 8,
      repeat: -1
    });
    
    // Play save point animation
    savePoint.anims.play('save_point_anim', true);
    
    // Add grass props at the bottom
    const grassCount = Math.ceil(gameWidth / 80); // Calculate how many grass sprites we need
    for (let i = 0; i < grassCount; i++) {
      const x = 40 + i * 80;
      const grassSprite = this.gameScene.add.image(x, gameHeight - 50, 'grass');
      grassSprite.setScale(3);
    }
    
    // Add dry grass props
    const dryGrassPositions = [
      { x: gameWidth * 0.15, y: gameHeight - 60 },
      { x: gameWidth * 0.35, y: gameHeight - 55 },
      { x: gameWidth * 0.65, y: gameHeight - 60 },
      { x: gameWidth * 0.85, y: gameHeight - 55 }
    ];
    
    dryGrassPositions.forEach(pos => {
      const dryGrassSprite = this.gameScene.add.image(pos.x, pos.y, 'dry_grass');
      dryGrassSprite.setScale(3);
    });
    
    // Add flower props scattered around
    const flowerPositions = [
      { x: gameWidth * 0.1, y: gameHeight - 70 },
      { x: gameWidth * 0.3, y: gameHeight - 60 },
      { x: gameWidth * 0.5, y: gameHeight - 65 },
      { x: gameWidth * 0.7, y: gameHeight - 55 },
      { x: gameWidth * 0.9, y: gameHeight - 70 }
    ];
    
    flowerPositions.forEach(pos => {
      const flowerSprite = this.gameScene.add.image(pos.x, pos.y, 'flowers');
      flowerSprite.setScale(2.5);
    });
    
    // Add big flowers as focal points
    const bigFlowerPositions = [
      { x: gameWidth * 0.25, y: gameHeight - 80 },
      { x: gameWidth * 0.75, y: gameHeight - 75 }
    ];
    
    bigFlowerPositions.forEach(pos => {
      const bigFlowerSprite = this.gameScene.add.image(pos.x, pos.y, 'big_flowers');
      bigFlowerSprite.setScale(3);
    });
    
    // Add roots
    const rootPositions = [
      { x: gameWidth * 0.2, y: gameHeight - 60 },
      { x: gameWidth * 0.6, y: gameHeight - 55 },
      { x: gameWidth * 0.95, y: gameHeight - 60 }
    ];
    
    rootPositions.forEach(pos => {
      const rootSprite = this.gameScene.add.image(pos.x, pos.y, 'roots');
      rootSprite.setScale(3);
    });
  }
  
  createPlayerAnimations() {
    // Idle animation
    this.gameScene.anims.create({
      key: 'hero_idle',
      frames: this.gameScene.anims.generateFrameNumbers('hero_idle', { start: 0, end: 3 }),
      frameRate: 5, // Slower animation
      repeat: -1
    });
    
    // Attack animation
    this.gameScene.anims.create({
      key: 'hero_attack',
      frames: this.gameScene.anims.generateFrameNumbers('hero_attack', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0
    });
    
    // Hit animation
    this.gameScene.anims.create({
      key: 'hero_hit',
      frames: this.gameScene.anims.generateFrameNumbers('hero_hit', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: 0
    });
  }
  
  createEnemyAnimations() {
    // Goblin idle animation
    this.gameScene.anims.create({
      key: 'goblin_idle',
      frames: this.gameScene.anims.generateFrameNumbers('goblin_idle', { start: 0, end: 3 }),
      frameRate: 5, // Slower animation
      repeat: -1
    });
    
    // Goblin attack animation
    this.gameScene.anims.create({
      key: 'goblin_attack',
      frames: this.gameScene.anims.generateFrameNumbers('goblin_attack', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0
    });
    
    // Goblin hit animation
    this.gameScene.anims.create({
      key: 'goblin_hit',
      frames: this.gameScene.anims.generateFrameNumbers('goblin_hit', { start: 0, end: 2 }),
      frameRate: 8,
      repeat: 0
    });
  }
  
  createEffectAnimations() {
    // Attack effect animation
    this.gameScene.anims.create({
      key: 'attack_effect',
      frames: this.gameScene.anims.generateFrameNumbers('attack_effect', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0
    });
    
    // Hit effect animation
    this.gameScene.anims.create({
      key: 'hit_effect',
      frames: this.gameScene.anims.generateFrameNumbers('hit_effect', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0
    });
    
    // Level up effect animation
    this.gameScene.anims.create({
      key: 'level_up_effect',
      frames: this.gameScene.anims.generateFrameNumbers('level_up', { start: 0, end: 4 }),
      frameRate: 10,
      repeat: 0
    });
  }
  
  createEnemy() {
    // Get the actual width of the game
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;
    
    // Determine enemy type based on level
    const enemyIndex = Math.min(this.currentLevel - 1, this.enemyTypes.length - 1);
    const enemyType = this.enemyTypes[enemyIndex];
    
    // Remove previous enemy if it exists
    if (this.enemy) {
      this.enemy.destroy();
    }
    
    // Create new enemy
    this.enemy = this.gameScene.physics.add.sprite(gameWidth * 0.75, gameHeight * 0.6, 'goblin_idle');
    this.enemy.setScale(4.0); // Make the enemy bigger
    this.enemy.flipX = true; // Make sure enemy is facing left
    
    // Apply tint based on level (gets redder/darker with higher levels)
    const baseTint = 0xffaaaa;
    const darkenFactor = Math.max(0, Math.min(0.4, (this.currentLevel - 1) * 0.1));
    const r = Math.floor(0xff * (1 - darkenFactor));
    const g = Math.floor(0xaa * (1 - darkenFactor));
    const b = Math.floor(0xaa * (1 - darkenFactor));
    const tint = (r << 16) | (g << 8) | b;
    this.enemy.setTint(tint);
    
    // Play idle animation
    this.enemy.anims.play('goblin_idle', true);
  }
  
  update() {
    // Get the actual height of the game
    const gameHeight = this.game.config.height;
    
    // Gentle floating animation for idle state with slower motion
    if (!this.attackAnimationPlaying) {
      const baseY = gameHeight * 0.6;
      this.player.y = baseY + Math.sin(this.gameScene.time.now / 2000) * 5; // Slower motion
      this.enemy.y = baseY + Math.cos(this.gameScene.time.now / 1600) * 5; // Slower motion
      
      // Update health bar positions to follow characters
      if (this.playerHealthBarBorder) {
        this.playerHealthBarBorder.y = this.player.y - 70;
        this.playerHealthBar.y = this.player.y - 70;
      }
      
      if (this.enemyHealthBarBorder) {
        this.enemyHealthBarBorder.y = this.enemy.y - 70;
        this.enemyHealthBar.y = this.enemy.y - 70;
      }
    }
  }
  
  createHealthBars() {
    // Get current positions
    const playerY = this.player.y - 70;
    const enemyY = this.enemy.y - 70;
    
    // Update player health bar border position
    this.playerHealthBarBorder = this.gameScene.add.graphics();
    this.playerHealthBarBorder.fillStyle(0x000000, 0.8);
    this.playerHealthBarBorder.fillRoundedRect(
      this.player.x - 62, 
      playerY - 9.5, 
      124, 
      19, 
      8
    );
    
    // Update player health bar
    this.playerHealthBar = this.gameScene.add.graphics();
    this.playerHealthBar.fillStyle(0x66ccff, 1);
    const playerBarWidth = 120 * (this.playerHealth / this.playerMaxHealth);
    this.playerHealthBar.fillRoundedRect(
      this.player.x - 60, 
      playerY - 7.5, 
      playerBarWidth, 
      15, 
      7
    );
    
    // Update enemy health bar border position
    this.enemyHealthBarBorder = this.gameScene.add.graphics();
    this.enemyHealthBarBorder.fillStyle(0x000000, 0.8);
    this.enemyHealthBarBorder.fillRoundedRect(
      this.enemy.x - 62, 
      enemyY - 9.5, 
      124, 
      19, 
      8
    );
    
    // Update enemy health bar
    this.enemyHealthBar = this.gameScene.add.graphics();
    this.enemyHealthBar.fillStyle(0xff9999, 1);
    const enemyBarWidth = 120 * (this.enemyHealth / this.enemyMaxHealth);
    this.enemyHealthBar.fillRoundedRect(
      this.enemy.x - 60, 
      enemyY - 7.5, 
      enemyBarWidth, 
      15, 
      7
    );
  }
  
  updateHealthBars() {
    // Get current positions
    const playerY = this.player.y - 70;
    const enemyY = this.enemy.y - 70;
    
    // Update player health bar border position
    this.playerHealthBarBorder.clear();
    this.playerHealthBarBorder.fillStyle(0x000000, 0.8);
    this.playerHealthBarBorder.fillRoundedRect(
      this.player.x - 62, 
      playerY - 9.5, 
      124, 
      19, 
      8
    );
    
    // Update player health bar
    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0x66ccff, 1);
    const playerBarWidth = 120 * (this.playerHealth / this.playerMaxHealth);
    this.playerHealthBar.fillRoundedRect(
      this.player.x - 60, 
      playerY - 7.5, 
      playerBarWidth, 
      15, 
      7
    );
    
    // Update enemy health bar border position
    this.enemyHealthBarBorder.clear();
    this.enemyHealthBarBorder.fillStyle(0x000000, 0.8);
    this.enemyHealthBarBorder.fillRoundedRect(
      this.enemy.x - 62, 
      enemyY - 9.5, 
      124, 
      19, 
      8
    );
    
    // Update enemy health bar
    this.enemyHealthBar.clear();
    this.enemyHealthBar.fillStyle(0xff9999, 1);
    const enemyBarWidth = 120 * (this.enemyHealth / this.enemyMaxHealth);
    this.enemyHealthBar.fillRoundedRect(
      this.enemy.x - 60, 
      enemyY - 7.5, 
      enemyBarWidth, 
      15, 
      7
    );
  }
  
  playerAttack(damage = 20) {
    if (this.attackAnimationPlaying) return false;
    this.attackAnimationPlaying = true;
    
    // Play attack animation
    this.player.anims.play('hero_attack', true);
    
    // Create attack effect sprite
    const attackEffect = this.gameScene.physics.add.sprite(
      this.enemy.x - 20, 
      this.enemy.y, 
      'attack_effect'
    );
    attackEffect.setScale(5.0); // Make effect bigger
    
    // Delay the effect to match the animation
    setTimeout(() => {
      // Play attack effect animation
      attackEffect.anims.play('attack_effect', true);
      
      // Reduce enemy health
      this.enemyHealth = Math.max(0, this.enemyHealth - damage);
      
      // Update enemy health bar
      this.updateHealthBars();
      
      // Show damage text
      if (this.damageText) this.damageText.destroy();
      this.damageText = this.gameScene.add.text(this.enemy.x, this.enemy.y - 50, `-${damage}`, { 
        fontSize: '24px', 
        fill: '#ff6666',
        fontFamily: '"Press Start 2P", cursive',
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      // Fade out damage text
      this.gameScene.tweens.add({
        targets: this.damageText,
        y: this.enemy.y - 100,
        alpha: 0,
        duration: 1500, // Slower fade
        onComplete: () => {
          if (this.damageText) this.damageText.destroy();
        }
      });
      
      // Enemy hit animation
      this.enemy.anims.play('goblin_hit', true);
      
      // Enemy hit effect
      const hitEffect = this.gameScene.physics.add.sprite(
        this.enemy.x, 
        this.enemy.y, 
        'hit_effect'
      );
      hitEffect.setScale(5.0); // Make effect bigger
      hitEffect.anims.play('hit_effect', true);
      
      // Clean up effects after animation completes
      attackEffect.on('animationcomplete', () => {
        attackEffect.destroy();
      });
      
      hitEffect.on('animationcomplete', () => {
        hitEffect.destroy();
      });
      
      // Return to idle state after delay
      setTimeout(() => {
        this.player.anims.play('hero_idle', true);
        this.enemy.anims.play('goblin_idle', true);
        this.attackAnimationPlaying = false;
      }, 1200); // Longer delay
    }, 300); // Delay before effect appears
    
    return this.enemyHealth <= 0;
  }
  
  enemyAttack(damage = 10) {
    if (this.attackAnimationPlaying) return false;
    this.attackAnimationPlaying = true;
    
    // Play enemy attack animation
    this.enemy.anims.play('goblin_attack', true);
    
    // Delay the effect to match the animation
    setTimeout(() => {
      // Create attack effect sprite
      const attackEffect = this.gameScene.physics.add.sprite(
        this.player.x + 20, 
        this.player.y, 
        'attack_effect'
      );
      attackEffect.setScale(5.0); // Make effect bigger
      attackEffect.flipX = true; // Flip for enemy attack direction
      
      // Play attack effect animation
      attackEffect.anims.play('attack_effect', true);
      
      // Reduce player health
      this.playerHealth = Math.max(0, this.playerHealth - damage);
      
      // Update player health bar
      this.updateHealthBars();
      
      // Show damage text
      const damageText = this.gameScene.add.text(this.player.x, this.player.y - 50, `-${damage}`, { 
        fontSize: '24px', 
        fill: '#ff6666',
        fontFamily: '"Press Start 2P", cursive',
        stroke: '#000',
        strokeThickness: 4
      }).setOrigin(0.5);
      
      // Fade out damage text
      this.gameScene.tweens.add({
        targets: damageText,
        y: this.player.y - 100,
        alpha: 0,
        duration: 1500, // Slower fade
        onComplete: () => {
          damageText.destroy();
        }
      });
      
      // Player hit animation
      this.player.anims.play('hero_hit', true);
      
      // Player hit effect
      const hitEffect = this.gameScene.physics.add.sprite(
        this.player.x, 
        this.player.y, 
        'hit_effect'
      );
      hitEffect.setScale(5.0); // Make effect bigger
      hitEffect.anims.play('hit_effect', true);
      
      // Clean up effects after animation completes
      attackEffect.on('animationcomplete', () => {
        attackEffect.destroy();
      });
      
      hitEffect.on('animationcomplete', () => {
        hitEffect.destroy();
      });
      
      // Return to idle state after delay
      setTimeout(() => {
        this.player.anims.play('hero_idle', true);
        this.enemy.anims.play('goblin_idle', true);
        this.attackAnimationPlaying = false;
      }, 1200); // Longer delay
    }, 300); // Delay before effect appears
    
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
    
    // Create level up effect sprite
    const levelUpEffect = this.gameScene.physics.add.sprite(
      this.player.x, 
      this.player.y, 
      'level_up'
    );
    levelUpEffect.setScale(6.0); // Make effect bigger
    levelUpEffect.anims.play('level_up_effect', true);
    
    // Increase player max health
    this.playerMaxHealth += 20;
    this.playerHealth = this.playerMaxHealth;
    
    // Update health bar
    this.updateHealthBars();
    
    // Show level up text
    const levelUpText = this.gameScene.add.text(this.player.x, this.player.y - 70, 'LEVEL UP!', { 
      fontSize: '28px', 
      fill: '#ffff00',
      fontFamily: '"Press Start 2P", cursive',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Animate level up text
    this.gameScene.tweens.add({
      targets: levelUpText,
      y: this.player.y - 120,
      alpha: 0,
      scale: 1.5,
      duration: 2500, // Slower animation
      onComplete: () => {
        levelUpText.destroy();
      }
    });
    
    // Clean up level up effect after animation completes
    levelUpEffect.on('animationcomplete', () => {
      levelUpEffect.destroy();
      
      // Change enemy to a scarier one
      this.createEnemy();
      this.enemyHealth = this.enemyMaxHealth;
      
      // Recreate health bars for the new enemy position
      this.createHealthBars();
    });
  }
  
  resetEnemy() {
    this.enemyHealth = this.enemyMaxHealth;
    this.updateHealthBars();
  }
  
  gameOver() {
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;
    
    const gameOverText = this.gameScene.add.text(gameWidth/2, gameHeight/2, 'GAME OVER', { 
      fontSize: '48px', 
      fill: '#ff6666',
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
      duration: 1500 // Slower animation
    });
  }
}
