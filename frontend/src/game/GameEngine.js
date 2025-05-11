import Phaser from 'phaser';

// Import game configuration
import { enemyConfig, playerConfig, gameProgressionConfig } from '../config/gameConfig';

// Import hero character spritesheet
import heroSpritesheet from '../assets/platformer/herochar sprites(new)/herochar_idle_anim_strip_4.png';
import heroAttackSpritesheet from '../assets/platformer/herochar sprites(new)/herochar_attack_anim_strip_4(new).png';
import heroHitSpritesheet from '../assets/platformer/herochar sprites(new)/herochar_hit_anim_strip_3.png';
import background from '../assets/platformer/tiles and background_foreground (new)/background.png';
import attackEffect from '../assets/platformer/herochar sprites(new)/sword_effect_strip_4(new).png';
import hitEffect from '../assets/platformer/herochar sprites(new)/hit_sparkle_anim_strip_4.png';
// Points effect sprite
import grassProps from '../assets/platformer/miscellaneous sprites/grass_props.png';
import flowersProps from '../assets/platformer/miscellaneous sprites/flowers_props.png';
import bigFlowersProps from '../assets/platformer/miscellaneous sprites/bigflowers_props.png';
import rootProps from '../assets/platformer/miscellaneous sprites/root_props.png';
import dryGrassProps from '../assets/platformer/miscellaneous sprites/drygrass_props.png';

// Import audio files
import backgroundMusic from '../assets/audio/background.mp3';
import hitSound from '../assets/audio/hit.mp3';
import victorySound from '../assets/audio/victory.mp3';
import defeatSound from '../assets/audio/defeat.mp3';

export default class GameEngine {
  constructor(containerId, onGameReady) {
    this.containerId = containerId;
    this.onGameReady = onGameReady;
    this.game = null;
    this.player = null;
    this.enemy = null;
    this.playerHealth = playerConfig.baseHealth;
    this.enemyHealth = 100;
    this.playerMaxHealth = playerConfig.baseHealth;
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
    this.points = playerConfig.basePoints; // Points counter
    this.pointsText = null;
    this.gameScene = null;
    this.attackAnimationPlaying = false;
    this.enemiesDefeated = 0;
    this.currentEnemyConfig = null;
    
    // Audio properties
    this.backgroundMusic = null;
    this.hitSound = null;
    this.victorySound = null;
    this.defeatSound = null;
  }

  init() {
    // Clean up any existing game instance
    if (this.game) {
      // Stop any playing audio
      if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
        this.backgroundMusic.stop();
      }
      
      this.game.destroy(true);
      this.destroyHealthBars();
    }
    
    const config = {
      type: Phaser.AUTO,
      parent: this.containerId,
      width: window.innerWidth,
      height: 340, // Changed from 500 to 340
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
      },
      audio: {
        disableWebAudio: false
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

    // Load enemy assets for all levels
    for (let level = 1; level <= 3; level++) {
      const enemy = enemyConfig[level];
      
      this.gameScene.load.spritesheet(`enemy_idle_${level}`, enemy.sprites.idle, {
        frameWidth: 16,
        frameHeight: 16
      });

      this.gameScene.load.spritesheet(`enemy_attack_${level}`, enemy.sprites.attack, {
        frameWidth: 16,
        frameHeight: 16
      });

      this.gameScene.load.spritesheet(`enemy_hit_${level}`, enemy.sprites.hit, {
        frameWidth: 16,
        frameHeight: 16
      });
    }

    this.gameScene.load.spritesheet('attack_effect', attackEffect, {
      frameWidth: 16,
      frameHeight: 16
    });

    this.gameScene.load.spritesheet('hit_effect', hitEffect, {
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
    
    // Load audio files
    this.gameScene.load.audio('background_music', backgroundMusic);
    this.gameScene.load.audio('hit_sound', hitSound);
    this.gameScene.load.audio('victory_sound', victorySound);
    this.gameScene.load.audio('defeat_sound', defeatSound);
  }

  create() {
    // Get the actual width of the game
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

    // Add background with proper scaling to cover the entire area
    const bg = this.gameScene.add.image(gameWidth / 2, gameHeight / 2, 'background');
    bg.setDisplaySize(gameWidth, gameHeight); // Force it to cover the entire game area

    // Add decorative props
    this.addEnvironmentProps();

    // Create player animations
    this.createPlayerAnimations();

    // Create enemy animations for all levels
    this.createEnemyAnimations();

    // Create effect animations
    this.createEffectAnimations();

    // Create player (hero)
    this.player = this.gameScene.physics.add.sprite(gameWidth * 0.25, gameHeight * 0.6, 'hero_idle');
    this.player.setScale(5.0); // Make the player bigger

    // Set current enemy config based on level
    this.currentEnemyConfig = enemyConfig[this.currentLevel];

    // Create enemy based on current level
    this.createEnemy();

    // Create health bars
    this.createHealthBars();

    // Create level and points text
    this.levelText = this.gameScene.add.text(20, 20, `Level: ${this.currentLevel}`, {
      fontSize: '24px',
      fill: '#fff',
      fontFamily: '"Press Start 2P", cursive',
      stroke: '#000',
      strokeThickness: 4
    });

    this.pointsText = this.gameScene.add.text(20, 50, `Points: ${this.points}`, {
      fontSize: '18px',
      fill: '#fff',
      fontFamily: '"Press Start 2P", cursive',
      stroke: '#000',
      strokeThickness: 3
    });

    // Play idle animations
    this.player.anims.play('hero_idle', true);
    this.enemy.anims.play(`enemy_idle_${this.currentLevel}`, true);
    
    // Setup audio
    this.setupAudio();

    // Notify that game is ready
    if (this.onGameReady) {
      this.onGameReady();
    }
  }
  
  setupAudio() {
    // Create audio instances
    this.backgroundMusic = this.gameScene.sound.add('background_music', {
      loop: true,
      volume: 0.5
    });
    
    this.hitSound = this.gameScene.sound.add('hit_sound', {
      loop: false,
      volume: 0.7
    });
    
    this.victorySound = this.gameScene.sound.add('victory_sound', {
      loop: false,
      volume: 0.7
    });
    
    this.defeatSound = this.gameScene.sound.add('defeat_sound', {
      loop: false,
      volume: 0.7
    });
    
    // Start playing background music on loop
    this.backgroundMusic.play();
  }

  addEnvironmentProps() {
    // Get the actual width of the game
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

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
      rootSprite.flipY = true; // This flips the root sprite upside down
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
    // Create animations for each enemy type
    for (let level = 1; level <= 3; level++) {
      const enemy = enemyConfig[level];
      
      // Idle animation
      this.gameScene.anims.create({
        key: `enemy_idle_${level}`,
        frames: this.gameScene.anims.generateFrameNumbers(`enemy_idle_${level}`, { 
          start: enemy.animation.idle.frameStart, 
          end: enemy.animation.idle.frameEnd 
        }),
        frameRate: enemy.animation.idle.frameRate,
        repeat: -1
      });

      // Attack animation
      this.gameScene.anims.create({
        key: `enemy_attack_${level}`,
        frames: this.gameScene.anims.generateFrameNumbers(`enemy_attack_${level}`, { 
          start: enemy.animation.attack.frameStart, 
          end: enemy.animation.attack.frameEnd 
        }),
        frameRate: enemy.animation.attack.frameRate,
        repeat: 0
      });

      // Hit animation
      this.gameScene.anims.create({
        key: `enemy_hit_${level}`,
        frames: this.gameScene.anims.generateFrameNumbers(`enemy_hit_${level}`, { 
          start: enemy.animation.hit.frameStart, 
          end: enemy.animation.hit.frameEnd 
        }),
        frameRate: enemy.animation.hit.frameRate,
        repeat: 0
      });
    }
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
  }

  createEnemy() {
    // Get the actual width of the game
    const gameWidth = this.game.config.width;
    const gameHeight = this.game.config.height;

    // Get enemy configuration for current level
    this.currentEnemyConfig = enemyConfig[this.currentLevel];
    
    // Set enemy health based on configuration
    this.enemyMaxHealth = this.currentEnemyConfig.health;
    this.enemyHealth = this.enemyMaxHealth;

    // Remove previous enemy if it exists
    if (this.enemy) {
      this.enemy.destroy();
    }

    // Create new enemy
    this.enemy = this.gameScene.physics.add.sprite(
      gameWidth * 0.75, 
      gameHeight * 0.6, 
      `enemy_idle_${this.currentLevel}`
    );
    
    // Apply scale from config
    this.enemy.setScale(this.currentEnemyConfig.scale);
    
    // Make sure enemy is facing left
    this.enemy.flipX = true;
    
    // Apply tint if specified
    if (this.currentEnemyConfig.tint) {
      this.enemy.setTint(this.currentEnemyConfig.tint);
    }

    // Play idle animation
    this.enemy.anims.play(`enemy_idle_${this.currentLevel}`, true);
    
    console.log(`Created new enemy for level ${this.currentLevel}`);
  }

  update() {
    // Get the actual height of the game
    const gameHeight = this.game.config.height;

    // Make sure player and enemy exist
    if (!this.player || !this.enemy) return;

    // Gentle floating animation for idle state with slower motion
    if (!this.attackAnimationPlaying) {
      const baseY = gameHeight * 0.6;
      this.player.y = baseY + Math.sin(this.gameScene.time.now / 2000) * 5; // Slower motion
      this.enemy.y = baseY + Math.cos(this.gameScene.time.now / 1600) * 5; // Slower motion

      // Update health bar positions to follow characters
      if (this.playerHealthBarBorder && this.playerHealthBar && 
          this.enemyHealthBarBorder && this.enemyHealthBar) {
        this.updateHealthBars();
      }
    }
  }

  createHealthBars() {
    // First destroy any existing health bars
    this.destroyHealthBars();
    
    console.log('Creating new health bars');
    
    // Position health bars above characters
    const playerY = this.player.y - 50; // Moved up closer to character
    const enemyY = this.enemy.y - 50; // Moved up closer to character

    // Create player health bar border position
    this.playerHealthBarBorder = this.gameScene.add.graphics();
    this.playerHealthBarBorder.fillStyle(0x000000, 0.8);
    this.playerHealthBarBorder.fillRoundedRect(
      this.player.x - 40,
      playerY - 9.5,
      80, // Made bar smaller
      12, // Made bar smaller
      6
    );

    // Create player health bar
    this.playerHealthBar = this.gameScene.add.graphics();
    this.playerHealthBar.fillStyle(0x66ccff, 1);
    const playerBarWidth = 76 * (this.playerHealth / this.playerMaxHealth); // Adjusted width
    this.playerHealthBar.fillRoundedRect(
      this.player.x - 38,
      playerY - 7.5,
      playerBarWidth,
      8, // Made bar smaller
      5
    );

    // Create enemy health bar border position
    this.enemyHealthBarBorder = this.gameScene.add.graphics();
    this.enemyHealthBarBorder.fillStyle(0x000000, 0.8);
    this.enemyHealthBarBorder.fillRoundedRect(
      this.enemy.x - 40,
      enemyY - 9.5,
      80, // Made bar smaller
      12, // Made bar smaller
      6
    );

    // Create enemy health bar
    this.enemyHealthBar = this.gameScene.add.graphics();
    this.enemyHealthBar.fillStyle(0xff9999, 1);
    const enemyBarWidth = 76 * (this.enemyHealth / this.enemyMaxHealth); // Adjusted width
    this.enemyHealthBar.fillRoundedRect(
      this.enemy.x - 38,
      enemyY - 7.5,
      enemyBarWidth,
      8, // Made bar smaller
      5
    );
    
    console.log('Health bars created successfully');
  }
  
  // Helper method to destroy health bars
  destroyHealthBars() {
    // Destroy player health bars if they exist
    if (this.playerHealthBar) {
      this.playerHealthBar.clear();
      this.playerHealthBar.destroy();
      this.playerHealthBar = null;
      console.log('Player health bar destroyed');
    }
    
    if (this.playerHealthBarBorder) {
      this.playerHealthBarBorder.clear();
      this.playerHealthBarBorder.destroy();
      this.playerHealthBarBorder = null;
      console.log('Player health bar border destroyed');
    }
    
    // Destroy enemy health bars if they exist
    if (this.enemyHealthBar) {
      this.enemyHealthBar.clear();
      this.enemyHealthBar.destroy();
      this.enemyHealthBar = null;
      console.log('Enemy health bar destroyed');
    }
    
    if (this.enemyHealthBarBorder) {
      this.enemyHealthBarBorder.clear();
      this.enemyHealthBarBorder.destroy();
      this.enemyHealthBarBorder = null;
      console.log('Enemy health bar border destroyed');
    }
  }

  updateHealthBars() {
    // Check if health bars exist, if not create them
    if (!this.playerHealthBar || !this.enemyHealthBar) {
      this.createHealthBars();
      return;
    }
    
    // Position health bars above characters
    const playerY = this.player.y + 70; // Moved up closer to character
    const enemyY = this.enemy.y + 70; // Moved up closer to character

    // Update player health bar border position
    this.playerHealthBarBorder.clear();
    this.playerHealthBarBorder.fillStyle(0x000000, 0.8);
    this.playerHealthBarBorder.fillRoundedRect(
      this.player.x - 40,
      playerY - 9.5,
      80, // Made bar smaller
      12, // Made bar smaller
      6
    );

    // Update player health bar
    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0x66ccff, 1);
    const playerBarWidth = 76 * (this.playerHealth / this.playerMaxHealth); // Adjusted width
    this.playerHealthBar.fillRoundedRect(
      this.player.x - 38,
      playerY - 7.5,
      playerBarWidth,
      8, // Made bar smaller
      5
    );

    // Update enemy health bar border position
    this.enemyHealthBarBorder.clear();
    this.enemyHealthBarBorder.fillStyle(0x000000, 0.8);
    this.enemyHealthBarBorder.fillRoundedRect(
      this.enemy.x - 40,
      enemyY - 9.5,
      80, // Made bar smaller
      12, // Made bar smaller
      6
    );

    // Update enemy health bar
    this.enemyHealthBar.clear();
    this.enemyHealthBar.fillStyle(0xff9999, 1);
    const enemyBarWidth = 76 * (this.enemyHealth / this.enemyMaxHealth); // Adjusted width
    this.enemyHealthBar.fillRoundedRect(
      this.enemy.x - 38,
      enemyY - 7.5,
      enemyBarWidth,
      8, // Made bar smaller
      5
    );
  }

  playerAttack() {
    if (this.attackAnimationPlaying) return false;
    this.attackAnimationPlaying = true;

    // Get damage value from current enemy config
    const damage = this.currentEnemyConfig.playerDamage;

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

      // Play hit sound
      if (this.hitSound) {
        this.hitSound.play();
      }

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
      this.enemy.anims.play(`enemy_hit_${this.currentLevel}`, true);

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

      // Check if enemy is defeated (health <= 1)
      const enemyDefeated = this.enemyHealth <= 1;
      
      if (enemyDefeated) {
        // Keep enemy in hit state animation
        // Don't return to idle state
        this.attackAnimationPlaying = true;
        
        // Play victory sound
        if (this.victorySound) {
          this.victorySound.play();
        }
        
        // Create congratulations popup
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        
        // Create a container for the popup
        const popupContainer = this.gameScene.add.container(gameWidth / 2, gameHeight / 2);
        
        // Add background
        const popupBg = this.gameScene.add.graphics();
        popupBg.fillStyle(0x000000, 0.8);
        popupBg.fillRoundedRect(-275, -125, 550, 250, 20);
        popupContainer.add(popupBg);
        
        // Add congratulations text
        let congratsText;
        if (this.currentLevel === 3) {
          // Final boss defeated
          congratsText = this.gameScene.add.text(0, -80, 'VICTORY!', {
            fontSize: '32px',
            fill: '#f5b70a',
            fontFamily: '"Press Start 2P", cursive',
            stroke: '#000',
            strokeThickness: 6
          }).setOrigin(0.5);
          
          const subText = this.gameScene.add.text(0, -30, 'You defeated the final boss!', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: '"Press Start 2P", cursive',
            stroke: '#000',
            strokeThickness: 3
          }).setOrigin(0.5);
          
          popupContainer.add(subText);
          
          // Add return to main screen button
          const returnButton = this.gameScene.add.text(0, 50, 'RETURN TO MAIN SCREEN', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#4caf50',
            padding: { x: 20, y: 10 },
            fontFamily: '"Press Start 2P", cursive'
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });
          
          returnButton.on('pointerdown', () => {
            // Redirect to main screen
            window.location.reload();
          });
          
          popupContainer.add(returnButton);
        } else {
          // Regular enemy defeated
          congratsText = this.gameScene.add.text(0, -80, 'ENEMY DEFEATED!', {
            fontSize: '24px',
            fill: '#f5b70a',
            fontFamily: '"Press Start 2P", cursive',
            stroke: '#000',
            strokeThickness: 6
          }).setOrigin(0.5);
          
          const subText = this.gameScene.add.text(0, -30, 'Proceed to next level?', {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: '"Press Start 2P", cursive',
            stroke: '#000',
            strokeThickness: 3
          }).setOrigin(0.5);
          
          popupContainer.add(subText);
          
          // Add next level button
          const nextButton = this.gameScene.add.text(0, 50, 'NEXT LEVEL', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#4caf50',
            padding: { x: 20, y: 10 },
            fontFamily: '"Press Start 2P", cursive'
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });
          
          nextButton.on('pointerdown', () => {
            // Hide popup
            popupContainer.setVisible(false);
            
            // Show loading screen
            const loadingContainer = this.gameScene.add.container(gameWidth / 2, gameHeight / 2);
            
            const loadingBg = this.gameScene.add.graphics();
            loadingBg.fillStyle(0x000000, 0.9);
            loadingBg.fillRect(-gameWidth/2, -gameHeight/2, gameWidth, gameHeight);
            loadingContainer.add(loadingBg);
            
            const loadingText = this.gameScene.add.text(0, 0, 'LOADING NEXT LEVEL...', {
              fontSize: '24px',
              fill: '#f5b70a',
              fontFamily: '"Press Start 2P", cursive'
            }).setOrigin(0.5);
            loadingContainer.add(loadingText);
            
            // Increment level
            this.currentLevel = Math.min(3, this.currentLevel + 1);
            
            // Update level text
            if (this.levelText) {
              this.levelText.setText(`Level: ${this.currentLevel}`);
            }
            
            // Update player health for new level
            this.playerMaxHealth = playerConfig.healthByLevel[this.currentLevel];
            this.playerHealth = this.playerMaxHealth;
            
            // Create new enemy for next level after short delay
            setTimeout(() => {
              // Remove loading screen
              loadingContainer.destroy();
              
              // Clean up existing health bars
              if (this.playerHealthBar) {
                this.playerHealthBar.clear();
                this.playerHealthBar.destroy();
                this.playerHealthBar = null;
              }
              
              if (this.playerHealthBarBorder) {
                this.playerHealthBarBorder.clear();
                this.playerHealthBarBorder.destroy();
                this.playerHealthBarBorder = null;
              }
              
              if (this.enemyHealthBar) {
                this.enemyHealthBar.clear();
                this.enemyHealthBar.destroy();
                this.enemyHealthBar = null;
              }
              
              if (this.enemyHealthBarBorder) {
                this.enemyHealthBarBorder.clear();
                this.enemyHealthBarBorder.destroy();
                this.enemyHealthBarBorder = null;
              }
              
              console.log('Health bars destroyed before creating new enemy');
              
              // Create new enemy
              this.createEnemy();
              
              // Create new health bars
              this.createHealthBars();
              
              // Reset animation state
              this.attackAnimationPlaying = false;
              this.player.anims.play('hero_idle', true);
              this.enemy.anims.play(`enemy_idle_${this.currentLevel}`, true);
              
              // Dispatch a custom event to notify the GameScreen component about the level change
              const levelChangeEvent = new CustomEvent('stage-level-changed', { 
                detail: { level: this.currentLevel } 
              });
              document.dispatchEvent(levelChangeEvent);
              console.log(`Stage level changed to: ${this.currentLevel}`);
            }, 1500);
          });
          
          popupContainer.add(nextButton);
        }
        
        popupContainer.add(congratsText);
        
        // Add Points display
        const pointsText = this.gameScene.add.text(0, 0, `Points: ${this.points}`, {
          fontSize: '18px',
          fill: '#66ccff',
          fontFamily: '"Press Start 2P", cursive'
        }).setOrigin(0.5);
        popupContainer.add(pointsText);
        
        // Scale in animation for popup
        popupContainer.setScale(0.5);
        this.gameScene.tweens.add({
          targets: popupContainer,
          scale: 1,
          duration: 300,
          ease: 'Back.easeOut'
        });
      } else {
        // Return to idle state after delay if enemy not defeated
        setTimeout(() => {
          this.player.anims.play('hero_idle', true);
          this.enemy.anims.play(`enemy_idle_${this.currentLevel}`, true);
          this.attackAnimationPlaying = false;
        }, 1200); // Longer delay
      }
    }, 300); // Delay before effect appears
    
    // Return if enemy is defeated
    return this.enemyHealth <= 1;
  }

  enemyAttack() {
    if (this.attackAnimationPlaying) return false;
    this.attackAnimationPlaying = true;

    // Get damage value from current enemy config
    const damage = this.currentEnemyConfig.damage;

    // Play enemy attack animation
    this.enemy.anims.play(`enemy_attack_${this.currentLevel}`, true);

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
      
      // Play hit sound
      if (this.hitSound) {
        this.hitSound.play();
      }

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

      // Check if player is defeated
      const playerDefeated = this.playerHealth <= 1;
      
      if (playerDefeated) {
        // Keep player in hit state animation
        // Don't return to idle state
        this.attackAnimationPlaying = true;
        
        // Play defeat sound
        if (this.defeatSound) {
          this.defeatSound.play();
        }
        
        // Create game over popup
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        
        // Create a container for the popup
        const popupContainer = this.gameScene.add.container(gameWidth / 2, gameHeight / 2);
        
        // Add background
        const popupBg = this.gameScene.add.graphics();
        popupBg.fillStyle(0x000000, 0.8);
        popupBg.fillRoundedRect(-275, -125, 550, 250, 20);
        popupContainer.add(popupBg);
        
        // Add game over text
        const gameOverText = this.gameScene.add.text(0, -80, 'GAME OVER', {
          fontSize: '32px',
          fill: '#ff6666',
          fontFamily: '"Press Start 2P", cursive',
          stroke: '#000',
          strokeThickness: 6
        }).setOrigin(0.5);
        popupContainer.add(gameOverText);
        
        // Add Points display
        const pointsText = this.gameScene.add.text(0, -20, `Final Points: ${this.points}`, {
          fontSize: '18px',
          fill: '#66ccff',
          fontFamily: '"Press Start 2P", cursive'
        }).setOrigin(0.5);
        popupContainer.add(pointsText);
        
        // Add return to main screen button
        const returnButton = this.gameScene.add.text(0, 50, 'RETURN TO MAIN SCREEN', {
          fontSize: '16px',
          fill: '#ffffff',
          backgroundColor: '#f44336',
          padding: { x: 20, y: 10 },
          fontFamily: '"Press Start 2P", cursive'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        returnButton.on('pointerdown', () => {
          // Redirect to main screen
          window.location.reload();
        });
        
        popupContainer.add(returnButton);
        
        // Scale in animation for popup
        popupContainer.setScale(0.5);
        this.gameScene.tweens.add({
          targets: popupContainer,
          scale: 1,
          duration: 300,
          ease: 'Back.easeOut'
        });
      } else {
        // Return to idle state after delay if player not defeated
        setTimeout(() => {
          this.player.anims.play('hero_idle', true);
          this.enemy.anims.play(`enemy_idle_${this.currentLevel}`, true);
          this.attackAnimationPlaying = false;
        }, 1200); // Longer delay
      }
    }, 300); // Delay before effect appears
    
    // Return if player is defeated
    return this.playerHealth <= 1;
  }

  addPoints(points) {
    // Simply add to the points counter
    this.points += points;
    
    // Update the points text display
    if (this.pointsText) {
      this.pointsText.setText(`Points: ${this.points}`);
    }
    
    // Show a small animation to indicate points gained
    this.showPointsGained(points);
  }
  
  showPointsGained(points) {
    // Show points gained text
    const pointsText = this.gameScene.add.text(this.player.x, this.player.y - 70, `+${points} Points!`, {
      fontSize: '22px',
      fill: '#66ccff',
      fontFamily: '"Press Start 2P", cursive',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Animate points text
    this.gameScene.tweens.add({
      targets: pointsText,
      y: this.player.y - 100,
      alpha: 0,
      scale: 1.2,
      duration: 1500,
      onComplete: () => {
        pointsText.destroy();
      }
    });
  }

  resetEnemy() {
    // Reset enemy health to max
    this.enemyHealth = this.enemyMaxHealth;
    
    // Update health bars
    this.updateHealthBars();
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  getEnemyName() {
    return this.currentEnemyConfig.name;
  }

  getEnemyHealth() {
    return {
      current: this.enemyHealth,
      max: this.enemyMaxHealth
    };
  }

  getPlayerHealth() {
    return {
      current: this.playerHealth,
      max: this.playerMaxHealth
    };
  }

  getEnemiesDefeated() {
    return this.enemiesDefeated;
  }

  getEnemiesNeeded() {
    return gameProgressionConfig.enemiesToDefeat[this.currentLevel];
  }

  gameOver() {
    // This function is no longer needed as we handle game over in enemyAttack
    // Keeping it empty to avoid errors if it's called elsewhere
  }
}
