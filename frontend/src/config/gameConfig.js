/**
 * Game Configuration File
 * Contains settings for enemies, player stats, and level progression
 */

// Import enemy sprite paths
import goblinIdleSprite from '../assets/platformer/enemies sprites/goblin/goblin_idle_anim_strip_4.png';
import goblinAttackSprite from '../assets/platformer/enemies sprites/goblin/goblin_attack_anim_strip_4.png';
import goblinHitSprite from '../assets/platformer/enemies sprites/goblin/goblin_hit_anim_strip_3.png';
import blueFlyIdleSprite from '../assets/platformer/enemies sprites/fly/blue_fly_idle_or_flying_anim_strip_3.png';
import blueFlyAttackSprite from '../assets/platformer/enemies sprites/fly/blue_fly_attack_anim_srip_3.png';
import blueFlyHitSprite from '../assets/platformer/enemies sprites/fly/blue_fly_hit_anim_strip_3.png';
import orangeFlyIdleSprite from '../assets/platformer/enemies sprites/fly/orange_fly_idle_or_flying_anim_strip_3.png';
import orangeFlyAttackSprite from '../assets/platformer/enemies sprites/fly/orange_fly_atack_anim_srip_3.png';
import orangeFlyHitSprite from '../assets/platformer/enemies sprites/fly/orange_fly_hit_anim_strip_3.png';
import bomberGoblinIdleSprite from '../assets/platformer/enemies sprites/bomber goblin/bomber_goblin_idle_anim_strip_4.png';
import bomberGoblinAttackSprite from '../assets/platformer/enemies sprites/bomber goblin/bomber_goblin_attack_anim_strip_6.png';
import bomberGoblinHitSprite from '../assets/platformer/enemies sprites/bomber goblin/bomber_goblin_hit_anim_strip_3.png';

/**
 * Enemy configuration for each level
 */
export const enemyConfig = {
  // Level 1: Goblin
  1: {
    name: 'Goblin',
    health: 100,
    damage: 20,
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
    scale: 4.0,
    tint: 0xFFFFFF // No tint for level 1
  },
  
  // Level 2: Blue Fly
  2: {
    name: 'Blue Fly',
    health: 100,
    damage: 25,
    hitsToDefeat: 2, // Player needs 2 correct answers to defeat
    playerDamage: 50, // Player deals 50 damage per correct answer
    sprites: {
      idle: blueFlyIdleSprite,
      attack: blueFlyAttackSprite,
      hit: blueFlyHitSprite
    },
    animation: {
      idle: { frameStart: 0, frameEnd: 2, frameRate: 8 },
      attack: { frameStart: 0, frameEnd: 2, frameRate: 10 },
      hit: { frameStart: 0, frameEnd: 2, frameRate: 8 }
    },
    scale: 4.0,
    tint: 0x99CCFF // Blue tint
  },
  
  // Level 3: Orange Fly
  3: {
    name: 'Orange Fly',
    health: 100,
    damage: 35,
    hitsToDefeat: 2, // Player needs 2 correct answers to defeat
    playerDamage: 50, // Player deals 50 damage per correct answer
    sprites: {
      idle: orangeFlyIdleSprite,
      attack: orangeFlyAttackSprite,
      hit: orangeFlyHitSprite
    },
    animation: {
      idle: { frameStart: 0, frameEnd: 2, frameRate: 8 },
      attack: { frameStart: 0, frameEnd: 2, frameRate: 10 },
      hit: { frameStart: 0, frameEnd: 2, frameRate: 8 }
    },
    scale: 4.0,
    tint: 0xFF9933 // Orange tint
  },
  
  // Level 4: Boss - Bomber Goblin
  4: {
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
    scale: 4.5, // Slightly larger for boss
    tint: 0xFF6666 // Red tint for boss
  }
};

/**
 * Player configuration
 */
export const playerConfig = {
  // Initial player stats
  baseHealth: 100,
  baseXP: 0,
  
  // Health per level
  healthByLevel: {
    1: 100, // 5 hits from level 1 enemy (damage 20)
    2: 100, // 4 hits from level 2 enemy (damage 25)
    3: 105, // 3 hits from level 3 enemy (damage 35)
    4: 100  // 2 hits from boss enemy (damage 50)
  },
  
  // XP required to level up
  xpToLevelUp: 100,
  
  // XP gained per correct answer
  xpPerCorrectAnswer: 25,
  
  // XP gained for defeating an enemy
  xpPerEnemyDefeated: {
    1: 50,
    2: 75,
    3: 100,
    4: 150 // Boss gives more XP
  }
};

/**
 * Game progression configuration
 */
export const gameProgressionConfig = {
  // Number of enemies to defeat per level before progressing
  enemiesToDefeat: {
    1: 3, // Defeat 3 goblins to reach level 2
    2: 3, // Defeat 3 blue flies to reach level 3
    3: 3, // Defeat 3 orange flies to reach boss level
    4: 1  // Defeat the boss to win the game
  },
  
  // Delay after answering before showing next question (ms)
  answerFeedbackDelay: 4000,
  
  // Delay after defeating an enemy before showing next enemy (ms)
  enemyDefeatDelay: 2000,
  
  // Delay after leveling up before showing next enemy (ms)
  levelUpDelay: 3000
};
