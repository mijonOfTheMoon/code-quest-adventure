/**
 * Game Configuration File
 * Contains settings for enemies, player stats, and level progression
 */

// Import enemy sprite paths
import goblinIdleSprite from '../assets/platformer/enemies sprites/goblin/goblin_idle_anim_strip_4.png';
import goblinAttackSprite from '../assets/platformer/enemies sprites/goblin/goblin_attack_anim_strip_4.png';
import goblinHitSprite from '../assets/platformer/enemies sprites/goblin/goblin_hit_anim_strip_3.png';
import bomberGoblinIdleSprite from '../assets/platformer/enemies sprites/bomber goblin/bomber_goblin_idle_anim_strip_4.png';
import bomberGoblinAttackSprite from '../assets/platformer/enemies sprites/bomber goblin/bomber_goblin_attack_anim_strip_6.png';
import bomberGoblinHitSprite from '../assets/platformer/enemies sprites/bomber goblin/bomber_goblin_hit_anim_strip_3.png';

/**
 * Enemy configuration for each level
 */
export const enemyConfig = {
  // Level 1: Small Goblin
  1: {
    name: 'Small Goblin',
    health: 100,
    damage: 25,
    hitsToDefeat: 2, // Player needs 2 correct answers to defeat
    playerDamage: 50, // Player deals 50 damage per correct answer
    sprites: {
      idle: goblinIdleSprite,
      attack: goblinAttackSprite,
      hit: goblinHitSprite
    },
    animation: {
      idle: { frameStart: 0, frameEnd: 3, frameRate: 5 },
      attack: { frameStart: 0, frameEnd: 3, frameRate: 8 },
      hit: { frameStart: 0, frameEnd: 2, frameRate: 8 }
    },
    scale: 3.5,
  },
  
  // Level 2: Large Goblin
  2: {
    name: 'Large Goblin',
    health: 100,
    damage: 35,
    hitsToDefeat: 2, // Player needs 2 correct answers to defeat
    playerDamage: 50, // Player deals 50 damage per correct answer
    sprites: {
      idle: goblinIdleSprite,
      attack: goblinAttackSprite,
      hit: goblinHitSprite
    },
    animation: {
      idle: { frameStart: 0, frameEnd: 3, frameRate: 5 },
      attack: { frameStart: 0, frameEnd: 3, frameRate: 8 },
      hit: { frameStart: 0, frameEnd: 2, frameRate: 8 }
    },
    scale: 8.0,
  },
  
  // Level 3: Boss - Bomber Goblin
  3: {
    name: 'Bomber Goblin',
    health: 105, // 35 damage × 3 hits = 105 health
    damage: 50,
    hitsToDefeat: 3, // Player needs 3 correct answers to defeat
    playerDamage: 35, // Player deals 35 damage per correct answer
    sprites: {
      idle: bomberGoblinIdleSprite,
      attack: bomberGoblinAttackSprite,
      hit: bomberGoblinHitSprite
    },
    animation: {
      idle: { frameStart: 0, frameEnd: 3, frameRate: 5 },
      attack: { frameStart: 0, frameEnd: 5, frameRate: 8 },
      hit: { frameStart: 0, frameEnd: 2, frameRate: 8 }
    },
    scale: 12.0, // Larger for boss
  }
};

/**
 * Player configuration
 */
export const playerConfig = {
  // Initial player stats
  baseHealth: 100,
  basePoints: 0, // Starting points
  
  // Health per level
  healthByLevel: {
    1: 100, // 4 hits from level 1 enemy (damage 25)
    2: 100, // 3 hits from level 2 enemy (damage 35)
    3: 100  // 2 hits from boss enemy (damage 50)
  },
  
  // Points gained per correct answer
  pointsPerCorrectAnswer: 25,
  
  // Points gained for defeating an enemy
  pointsPerEnemyDefeated: {
    1: 50,
    2: 75,
    3: 150 // Boss gives more points
  }
};

/**
 * Game progression configuration
 */
export const gameProgressionConfig = {
  // Number of enemies to defeat per level
  enemiesToDefeat: {
    1: 1, // Defeat 1 small goblin in level 1
    2: 1, // Defeat 1 large goblin in level 2
    3: 1  // Defeat the boss in level 3
  },
  
  // Delay after answering before showing next question (ms)
  answerFeedbackDelay: 4000,
  
  // Delay after defeating an enemy before showing next enemy (ms)
  enemyDefeatDelay: 2000,
  
  // Delay after changing stage level before showing next enemy (ms)
  stageLevelChangeDelay: 1500
};
