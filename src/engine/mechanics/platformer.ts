/**
 * Platformer Mechanics Generator
 * Creates responsive physics (gravity, acceleration, double jump, platform collisions, hazards, scoring)
 */
import { Blocks, BlockNode } from '../blocks';
import { GameProject, Sprite } from '../project';
import {
  generatePlayerSvg,
  generatePlatformSvg,
  generateCoinSvg,
  generateHazardSvg,
  generateGoalSvg,
  generateEnemySvg,
  generateBackdropSvg,
  generateBannerSvg,
} from '../assets/procedural';
import { synthesizeSoundEffect } from '../assets/sound-synth';

export interface PlatformerConfig {
  title?: string;
  doubleJump?: boolean;
  lives?: number;
  levelCount?: number;
  gravity?: number;
  jumpForce?: number;
  speed?: number;
}

export function buildPlatformerProject(config: PlatformerConfig = {}): GameProject {
  const title = config.title || 'Super Platformer Quest';
  const project = new GameProject(title);

  const doubleJumpEnabled = config.doubleJump ?? true;
  const initialLives = config.lives ?? 3;
  const levelCount = config.levelCount ?? 3;

  // 1. Global Variables
  const healthVarId = project.ensureGlobalVariable('Health', initialLives);
  const scoreVarId = project.ensureGlobalVariable('Score', 0);
  const levelVarId = project.ensureGlobalVariable('Level', 1);
  const stateVarId = project.ensureGlobalVariable('Game State', 'PLAYING');

  // Local sprite variables
  const xVelVar = 'x_vel';
  const yVelVar = 'y_vel';
  const canDblJumpVar = 'can_double_jump';

  // 2. Broadcasts
  const bcStart = project.ensureBroadcast('START_GAME');
  const bcGameOver = project.ensureBroadcast('GAME_OVER');
  const bcVictory = project.ensureBroadcast('VICTORY');
  const bcNextLevel = project.ensureBroadcast('NEXT_LEVEL');
  const bcPlayerHit = project.ensureBroadcast('PLAYER_HIT');

  // 3. Audio Assets
  const sJump = synthesizeSoundEffect('jump');
  const sCoin = synthesizeSoundEffect('coin');
  const sHit = synthesizeSoundEffect('hit');
  const sWin = synthesizeSoundEffect('win');
  const sGameOver = synthesizeSoundEffect('game_over');

  project.registerAsset(sJump.asset);
  project.registerAsset(sCoin.asset);
  project.registerAsset(sHit.asset);
  project.registerAsset(sWin.asset);
  project.registerAsset(sGameOver.asset);

  // 4. Stage & Backdrops
  const bg1 = generateBackdropSvg('sky', '#38BDF8');
  const bg2 = generateBackdropSvg('dungeon', '#F97316');
  const bg3 = generateBackdropSvg('space', '#8B5CF6');

  const cBg1 = project.stage.addCostume('Level1_Sky', bg1.svg, bg1.centerX, bg1.centerY);
  const cBg2 = project.stage.addCostume('Level2_Dungeon', bg2.svg, bg2.centerX, bg2.centerY);
  const cBg3 = project.stage.addCostume('Level3_Space', bg3.svg, bg3.centerX, bg3.centerY);
  project.registerAsset(cBg1.asset);
  project.registerAsset(cBg2.asset);
  project.registerAsset(cBg3.asset);

  // Stage Scripts: Handle state & level backdrops
  const stageFlag = Blocks.whenFlagClicked(50, 50);
  stageFlag
    .chain(Blocks.setVariable('Game State', stateVarId, 'PLAYING'))
    .chain(Blocks.setVariable('Health', healthVarId, initialLives))
    .chain(Blocks.setVariable('Score', scoreVarId, 0))
    .chain(Blocks.setVariable('Level', levelVarId, 1))
    .chain(Blocks.switchBackdropTo('Level1_Sky'))
    .chain(Blocks.broadcast('START_GAME', bcStart));
  project.stage.addScript(stageFlag);

  const stageNextLevel = Blocks.whenBroadcastReceived('NEXT_LEVEL', bcNextLevel, 50, 250);
  stageNextLevel
    .chain(Blocks.changeVariableBy('Level', levelVarId, 1))
    .chain(
      Blocks.ifElse(
        Blocks.equals(Blocks.getVariable('Level', levelVarId), 2),
        Blocks.switchBackdropTo('Level2_Dungeon'),
        Blocks.ifThen(
          Blocks.equals(Blocks.getVariable('Level', levelVarId), 3),
          Blocks.switchBackdropTo('Level3_Space')
        )
      )
    );
  project.stage.addScript(stageNextLevel);

  // 5. Platforms Sprite
  const platformSprite = project.addSprite('Platform');
  const plat1 = generatePlatformSvg('grass', 240, 32);
  const plat2 = generatePlatformSvg('metal', 200, 28);
  const cPlat1 = platformSprite.addCostume('Platform_Grass', plat1.svg, plat1.centerX, plat1.centerY);
  const cPlat2 = platformSprite.addCostume('Platform_Metal', plat2.svg, plat2.centerX, plat2.centerY);
  project.registerAsset(cPlat1.asset);
  project.registerAsset(cPlat2.asset);

  platformSprite.x = 0;
  platformSprite.y = -120;
  const platFlag = Blocks.whenFlagClicked(50, 50);
  platFlag
    .chain(Blocks.goToXY(0, -120))
    .chain(Blocks.show());
  platformSprite.addScript(platFlag);

  // 6. Hazard / Spikes Sprite
  const hazardSprite = project.addSprite('Hazard');
  const haz1 = generateHazardSvg('spike');
  const cHaz1 = hazardSprite.addCostume('Spike', haz1.svg, haz1.centerX, haz1.centerY);
  project.registerAsset(cHaz1.asset);
  hazardSprite.x = 80;
  hazardSprite.y = -90;
  const hazFlag = Blocks.whenFlagClicked(50, 50);
  hazFlag
    .chain(Blocks.goToXY(80, -90))
    .chain(Blocks.show());
  hazardSprite.addScript(hazFlag);

  // 7. Coin Sprite (Collectible)
  const coinSprite = project.addSprite('Coin');
  const coinAsset = generateCoinSvg('#FBBF24');
  const cCoin = coinSprite.addCostume('Coin', coinAsset.svg, coinAsset.centerX, coinAsset.centerY);
  coinSprite.addSound('coin', sCoin.asset.content as Uint8Array);
  project.registerAsset(cCoin.asset);
  coinSprite.x = 40;
  coinSprite.y = -40;

  const coinFlag = Blocks.whenFlagClicked(50, 50);
  const coinCollectSubstack = Blocks.startSound('coin')
    .chain(Blocks.changeVariableBy('Score', scoreVarId, 10))
    .chain(Blocks.hide())
    .chain(Blocks.wait(4))
    .chain(Blocks.show());

  coinFlag
    .chain(Blocks.goToXY(40, -40))
    .chain(Blocks.show())
    .chain(
      Blocks.forever(
        Blocks.ifThen(
          Blocks.touchingObject('Player'),
          coinCollectSubstack
        )
      )
    );
  coinSprite.addScript(coinFlag);

  // 8. Goal Flag / Portal Sprite
  const goalSprite = project.addSprite('Goal');
  const goalAsset = generateGoalSvg();
  const cGoal = goalSprite.addCostume('Portal', goalAsset.svg, goalAsset.centerX, goalAsset.centerY);
  goalSprite.addSound('win', sWin.asset.content as Uint8Array);
  project.registerAsset(cGoal.asset);
  goalSprite.x = 180;
  goalSprite.y = -85;

  const goalFlag = Blocks.whenFlagClicked(50, 50);
  const goalTouchSubstack = Blocks.startSound('win')
    .chain(
      Blocks.ifElse(
        Blocks.equals(Blocks.getVariable('Level', levelVarId), levelCount),
        Blocks.chainBlocks([
          Blocks.setVariable('Game State', stateVarId, 'VICTORY'),
          Blocks.broadcast('VICTORY', bcVictory),
        ]),
        Blocks.chainBlocks([
          Blocks.broadcastAndWait('NEXT_LEVEL', bcNextLevel),
          Blocks.wait(0.5),
        ])
      )
    );

  goalFlag
    .chain(Blocks.goToXY(180, -85))
    .chain(Blocks.show())
    .chain(
      Blocks.forever(
        Blocks.ifThen(
          Blocks.touchingObject('Player'),
          goalTouchSubstack
        )
      )
    );
  goalSprite.addScript(goalFlag);

  // 9. Enemy Sprite (Patrolling Slime)
  const enemySprite = project.addSprite('Enemy');
  const enemyAsset = generateEnemySvg('slime', '#EF4444');
  const cEnemy = enemySprite.addCostume('Slime', enemyAsset.svg, enemyAsset.centerX, enemyAsset.centerY);
  project.registerAsset(cEnemy.asset);
  enemySprite.x = -60;
  enemySprite.y = -90;

  const enemyFlag = Blocks.whenFlagClicked(50, 50);
  enemyFlag
    .chain(Blocks.goToXY(-60, -90))
    .chain(Blocks.setRotationStyle('left-right'))
    .chain(Blocks.show())
    .chain(
      Blocks.forever(
        Blocks.chainBlocks([
          Blocks.pointInDirection(90),
          Blocks.repeat(30, Blocks.moveSteps(2)),
          Blocks.pointInDirection(-90),
          Blocks.repeat(30, Blocks.moveSteps(2)),
        ])
      )
    );
  enemySprite.addScript(enemyFlag);

  // 10. Player Sprite & Physics
  const player = project.addSprite('Player');
  const pWalk1 = generatePlayerSvg('hero', '#4C97FF');
  const pWalk2 = generatePlayerSvg('hero', '#3B82F6');
  const cP1 = player.addCostume('Player_Idle', pWalk1.svg, pWalk1.centerX, pWalk1.centerY);
  const cP2 = player.addCostume('Player_Run', pWalk2.svg, pWalk2.centerX, pWalk2.centerY);
  project.registerAsset(cP1.asset);
  project.registerAsset(cP2.asset);

  player.addSound('jump', sJump.asset.content as Uint8Array);
  player.addSound('hit', sHit.asset.content as Uint8Array);

  const xVelId = player.addVariable(xVelVar, 0);
  const yVelId = player.addVariable(yVelVar, 0);
  const canDblJumpId = player.addVariable(canDblJumpVar, 1);

  // Player Init Script
  const playerFlag = Blocks.whenFlagClicked(50, 50);
  playerFlag
    .chain(Blocks.setRotationStyle('left-right'))
    .chain(Blocks.goToXY(-180, -60))
    .chain(Blocks.setVariable(xVelVar, xVelId, 0))
    .chain(Blocks.setVariable(yVelVar, yVelId, 0))
    .chain(Blocks.setVariable(canDblJumpVar, canDblJumpId, 1))
    .chain(Blocks.show());
  player.addScript(playerFlag);

  // Player Physics & Control Loop
  const pLoop = Blocks.whenBroadcastReceived('START_GAME', bcStart, 50, 250);

  // Movement Substack
  const rightKeyCheck = Blocks.ifThen(
    Blocks.or(Blocks.keyPressed('right arrow'), Blocks.keyPressed('d')),
    Blocks.chainBlocks([
      Blocks.pointInDirection(90),
      Blocks.changeVariableBy(xVelVar, xVelId, 2),
      Blocks.nextCostume(),
    ])
  );

  const leftKeyCheck = Blocks.ifThen(
    Blocks.or(Blocks.keyPressed('left arrow'), Blocks.keyPressed('a')),
    Blocks.chainBlocks([
      Blocks.pointInDirection(-90),
      Blocks.changeVariableBy(xVelVar, xVelId, -2),
      Blocks.nextCostume(),
    ])
  );

  // Jump Substack
  let jumpCheck: BlockNode;
  if (doubleJumpEnabled) {
    jumpCheck = Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('up arrow'), Blocks.or(Blocks.keyPressed('w'), Blocks.keyPressed('space'))),
      Blocks.ifElse(
        Blocks.touchingObject('Platform'),
        Blocks.chainBlocks([
          Blocks.setVariable(yVelVar, yVelId, 14),
          Blocks.startSound('jump'),
          Blocks.setVariable(canDblJumpVar, canDblJumpId, 1),
          Blocks.wait(0.2),
        ]),
        Blocks.ifThen(
          Blocks.equals(Blocks.getVariable(canDblJumpVar, canDblJumpId), 1),
          Blocks.chainBlocks([
            Blocks.setVariable(yVelVar, yVelId, 12),
            Blocks.startSound('jump'),
            Blocks.setVariable(canDblJumpVar, canDblJumpId, 0),
            Blocks.wait(0.2),
          ])
        )
      )
    );
  } else {
    jumpCheck = Blocks.ifThen(
      Blocks.and(
        Blocks.or(Blocks.keyPressed('up arrow'), Blocks.or(Blocks.keyPressed('w'), Blocks.keyPressed('space'))),
        Blocks.touchingObject('Platform')
      ),
      Blocks.chainBlocks([
        Blocks.setVariable(yVelVar, yVelId, 14),
        Blocks.startSound('jump'),
        Blocks.wait(0.2),
      ])
    );
  }

  // Physics Step
  const physicsBlock = Blocks.chainBlocks([
    // Apply gravity
    Blocks.changeVariableBy(yVelVar, yVelId, -1.2),
    // Apply friction to X
    Blocks.setVariable(
      xVelVar,
      xVelId,
      Blocks.multiply(Blocks.getVariable(xVelVar, xVelId), 0.78)
    ),
    // Move X
    Blocks.changeXBy(Blocks.getVariable(xVelVar, xVelId)),
    // Horizontal collision
    Blocks.ifThen(
      Blocks.touchingObject('Platform'),
      Blocks.chainBlocks([
        Blocks.changeXBy(Blocks.subtract(0, Blocks.getVariable(xVelVar, xVelId))),
        Blocks.setVariable(xVelVar, xVelId, 0),
      ])
    ),
    // Move Y
    Blocks.changeYBy(Blocks.getVariable(yVelVar, yVelId)),
    // Vertical collision
    Blocks.ifThen(
      Blocks.touchingObject('Platform'),
      Blocks.ifElse(
        Blocks.lt(Blocks.getVariable(yVelVar, yVelId), 0),
        Blocks.chainBlocks([
          Blocks.changeYBy(1.5),
          Blocks.setVariable(yVelVar, yVelId, 0),
          Blocks.setVariable(canDblJumpVar, canDblJumpId, 1),
        ]),
        Blocks.chainBlocks([
          Blocks.changeYBy(-1.5),
          Blocks.setVariable(yVelVar, yVelId, 0),
        ])
      )
    ),
  ]);

  // Damage & Fall Checks
  const damageCheck = Blocks.ifThen(
    Blocks.or(
      Blocks.touchingObject('Hazard'),
      Blocks.or(
        Blocks.touchingObject('Enemy'),
        Blocks.lt(Blocks.yPosition(), -160)
      )
    ),
    Blocks.chainBlocks([
      Blocks.startSound('hit'),
      Blocks.changeVariableBy('Health', healthVarId, -1),
      Blocks.goToXY(-180, -60),
      Blocks.setVariable(xVelVar, xVelId, 0),
      Blocks.setVariable(yVelVar, yVelId, 0),
      Blocks.ifThen(
        Blocks.lt(Blocks.getVariable('Health', healthVarId), 1),
        Blocks.chainBlocks([
          Blocks.setVariable('Game State', stateVarId, 'GAME_OVER'),
          Blocks.broadcast('GAME_OVER', bcGameOver),
          Blocks.hide(),
          Blocks.stopThisScript(),
        ])
      ),
      Blocks.wait(0.3),
    ])
  );

  pLoop.chain(
    Blocks.forever(
      Blocks.chainBlocks([
        rightKeyCheck,
        leftKeyCheck,
        jumpCheck,
        physicsBlock,
        damageCheck,
      ])
    )
  );
  player.addScript(pLoop);

  // Reset on next level
  const pNextLevel = Blocks.whenBroadcastReceived('NEXT_LEVEL', bcNextLevel, 400, 50);
  pNextLevel.chain(Blocks.goToXY(-180, -60)).chain(Blocks.setVariable(xVelVar, xVelId, 0));
  player.addScript(pNextLevel);

  // 11. UI Banners (Game Over & Victory)
  const uiSprite = project.addSprite('UI_Banner');
  const bannerOver = generateBannerSvg('GAME OVER', 'Press Green Flag to Retry', false);
  const bannerWin = generateBannerSvg('VICTORY!', 'Congratulations! You beat all levels!', true);
  const cBOver = uiSprite.addCostume('GameOver_Banner', bannerOver.svg, bannerOver.centerX, bannerOver.centerY);
  const cBWin = uiSprite.addCostume('Victory_Banner', bannerWin.svg, bannerWin.centerX, bannerWin.centerY);
  project.registerAsset(cBOver.asset);
  project.registerAsset(cBWin.asset);
  uiSprite.addSound('game_over', sGameOver.asset.content as Uint8Array);

  const uiFlag = Blocks.whenFlagClicked(50, 50);
  uiFlag.chain(Blocks.hide()).chain(Blocks.goToXY(0, 0));
  uiSprite.addScript(uiFlag);

  const uiOver = Blocks.whenBroadcastReceived('GAME_OVER', bcGameOver, 50, 200);
  uiOver
    .chain(Blocks.switchCostumeTo('GameOver_Banner'))
    .chain(Blocks.goToFront())
    .chain(Blocks.show())
    .chain(Blocks.startSound('game_over'));
  uiSprite.addScript(uiOver);

  const uiWin = Blocks.whenBroadcastReceived('VICTORY', bcVictory, 50, 380);
  uiWin
    .chain(Blocks.switchCostumeTo('Victory_Banner'))
    .chain(Blocks.goToFront())
    .chain(Blocks.show());
  uiSprite.addScript(uiWin);

  return project;
}
