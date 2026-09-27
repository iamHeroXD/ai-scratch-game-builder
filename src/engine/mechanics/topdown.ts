/**
 * Top-Down Adventure / RPG Mechanics Generator
 * Features 4-way movement, door keys, enemy patrol, obstacle collision, and exit goals
 */
import { Blocks } from '../blocks';
import { GameProject } from '../project';
import {
  generatePlayerSvg,
  generateEnemySvg,
  generateCoinSvg,
  generateGoalSvg,
  generateBackdropSvg,
  generateBannerSvg,
  generatePlatformSvg,
} from '../assets/procedural';
import { synthesizeSoundEffect } from '../assets/sound-synth';

export interface TopdownConfig {
  title?: string;
  speed?: number;
}

export function buildTopdownProject(config: TopdownConfig = {}): GameProject {
  const title = config.title || 'Dungeon Escape';
  const project = new GameProject(title);

  // 1. Global Variables
  const healthVarId = project.ensureGlobalVariable('Health', 3);
  const keysVarId = project.ensureGlobalVariable('Keys', 0);
  const scoreVarId = project.ensureGlobalVariable('Score', 0);
  const stateVarId = project.ensureGlobalVariable('Game State', 'PLAYING');

  // 2. Broadcasts
  const bcStart = project.ensureBroadcast('START_GAME');
  const bcGameOver = project.ensureBroadcast('GAME_OVER');
  const bcVictory = project.ensureBroadcast('VICTORY');

  // 3. Audio
  const sCoin = synthesizeSoundEffect('coin');
  const sHit = synthesizeSoundEffect('hit');
  const sWin = synthesizeSoundEffect('win');
  const sGameOver = synthesizeSoundEffect('game_over');

  project.registerAsset(sCoin.asset);
  project.registerAsset(sHit.asset);
  project.registerAsset(sWin.asset);
  project.registerAsset(sGameOver.asset);

  // 4. Backdrop
  const bg = generateBackdropSvg('dungeon', '#18181B');
  const cBg = project.stage.addCostume('Dungeon_Backdrop', bg.svg, bg.centerX, bg.centerY);
  project.registerAsset(cBg.asset);

  const stageFlag = Blocks.whenFlagClicked(50, 50);
  stageFlag
    .chain(Blocks.setVariable('Health', healthVarId, 3))
    .chain(Blocks.setVariable('Keys', keysVarId, 0))
    .chain(Blocks.setVariable('Score', scoreVarId, 0))
    .chain(Blocks.setVariable('Game State', stateVarId, 'PLAYING'))
    .chain(Blocks.broadcast('START_GAME', bcStart));
  project.stage.addScript(stageFlag);

  // 5. Obstacle Wall Sprite
  const wall = project.addSprite('Wall');
  const wallSvg = generatePlatformSvg('metal', 180, 24);
  const cWall = wall.addCostume('StoneWall', wallSvg.svg, wallSvg.centerX, wallSvg.centerY);
  project.registerAsset(cWall.asset);

  const wallFlag = Blocks.whenFlagClicked(50, 50);
  wallFlag.chain(Blocks.goToXY(0, 30)).chain(Blocks.show());
  wall.addScript(wallFlag);

  // 6. Key Collectible Sprite
  const keySprite = project.addSprite('Key');
  const keySvg = generateCoinSvg('#FBBF24');
  const cKey = keySprite.addCostume('GoldenKey', keySvg.svg, keySvg.centerX, keySvg.centerY);
  project.registerAsset(cKey.asset);
  keySprite.addSound('coin', sCoin.asset.content as Uint8Array);

  const keyFlag = Blocks.whenFlagClicked(50, 50);
  keyFlag
    .chain(Blocks.goToXY(-120, 100))
    .chain(Blocks.show())
    .chain(
      Blocks.forever(
        Blocks.ifThen(
          Blocks.touchingObject('Player'),
          Blocks.chainBlocks([
            Blocks.startSound('coin'),
            Blocks.changeVariableBy('Keys', keysVarId, 1),
            Blocks.changeVariableBy('Score', scoreVarId, 50),
            Blocks.hide(),
            Blocks.stopThisScript(),
          ])
        )
      )
    );
  keySprite.addScript(keyFlag);

  // 7. Exit Door / Goal Sprite
  const doorSprite = project.addSprite('Exit_Door');
  const doorSvg = generateGoalSvg();
  const cDoor = doorSprite.addCostume('Exit', doorSvg.svg, doorSvg.centerX, doorSvg.centerY);
  project.registerAsset(cDoor.asset);
  doorSprite.addSound('win', sWin.asset.content as Uint8Array);

  const doorFlag = Blocks.whenFlagClicked(50, 50);
  doorFlag
    .chain(Blocks.goToXY(180, 100))
    .chain(Blocks.show())
    .chain(
      Blocks.forever(
        Blocks.ifThen(
          Blocks.touchingObject('Player'),
          Blocks.ifElse(
            Blocks.gt(Blocks.getVariable('Keys', keysVarId), 0),
            Blocks.chainBlocks([
              Blocks.startSound('win'),
              Blocks.setVariable('Game State', stateVarId, 'VICTORY'),
              Blocks.broadcast('VICTORY', bcVictory),
              Blocks.stopThisScript(),
            ]),
            Blocks.say('Door is locked! Find the key first.', 1.5)
          )
        )
      )
    );
  doorSprite.addScript(doorFlag);

  // 8. Enemy Guard Sprite
  const guard = project.addSprite('Guard');
  const guardSvg = generateEnemySvg('bat', '#DC2626');
  const cGuard = guard.addCostume('BatGuard', guardSvg.svg, guardSvg.centerX, guardSvg.centerY);
  project.registerAsset(cGuard.asset);

  const guardFlag = Blocks.whenFlagClicked(50, 50);
  guardFlag
    .chain(Blocks.goToXY(80, -60))
    .chain(Blocks.show())
    .chain(
      Blocks.forever(
        Blocks.chainBlocks([
          Blocks.repeat(25, Blocks.changeXBy(-3)),
          Blocks.wait(0.2),
          Blocks.repeat(25, Blocks.changeXBy(3)),
          Blocks.wait(0.2),
        ])
      )
    );
  guard.addScript(guardFlag);

  // 9. Player Sprite
  const player = project.addSprite('Player');
  const pSvg = generatePlayerSvg('ninja', '#38BDF8');
  const cP = player.addCostume('Ninja', pSvg.svg, pSvg.centerX, pSvg.centerY);
  project.registerAsset(cP.asset);
  player.addSound('hit', sHit.asset.content as Uint8Array);

  const pFlag = Blocks.whenFlagClicked(50, 50);
  pFlag
    .chain(Blocks.goToXY(-160, -100))
    .chain(Blocks.setRotationStyle('left-right'))
    .chain(Blocks.show());
  player.addScript(pFlag);

  // 4-Directional Player Movement
  const pLoop = Blocks.whenBroadcastReceived('START_GAME', bcStart, 50, 200);
  const topdownMoves = Blocks.chainBlocks([
    // Up
    Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('up arrow'), Blocks.keyPressed('w')),
      Blocks.chainBlocks([
        Blocks.changeYBy(4),
        Blocks.ifThen(Blocks.touchingObject('Wall'), Blocks.changeYBy(-4)),
      ])
    ),
    // Down
    Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('down arrow'), Blocks.keyPressed('s')),
      Blocks.chainBlocks([
        Blocks.changeYBy(-4),
        Blocks.ifThen(Blocks.touchingObject('Wall'), Blocks.changeYBy(4)),
      ])
    ),
    // Left
    Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('left arrow'), Blocks.keyPressed('a')),
      Blocks.chainBlocks([
        Blocks.pointInDirection(-90),
        Blocks.changeXBy(-4),
        Blocks.ifThen(Blocks.touchingObject('Wall'), Blocks.changeXBy(4)),
      ])
    ),
    // Right
    Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('right arrow'), Blocks.keyPressed('d')),
      Blocks.chainBlocks([
        Blocks.pointInDirection(90),
        Blocks.changeXBy(4),
        Blocks.ifThen(Blocks.touchingObject('Wall'), Blocks.changeXBy(-4)),
      ])
    ),
    // Enemy collision
    Blocks.ifThen(
      Blocks.touchingObject('Guard'),
      Blocks.chainBlocks([
        Blocks.startSound('hit'),
        Blocks.changeVariableBy('Health', healthVarId, -1),
        Blocks.goToXY(-160, -100),
        Blocks.wait(0.4),
        Blocks.ifThen(
          Blocks.lt(Blocks.getVariable('Health', healthVarId), 1),
          Blocks.chainBlocks([
            Blocks.setVariable('Game State', stateVarId, 'GAME_OVER'),
            Blocks.broadcast('GAME_OVER', bcGameOver),
            Blocks.hide(),
            Blocks.stopThisScript(),
          ])
        ),
      ])
    ),
  ]);

  pLoop.chain(Blocks.forever(topdownMoves));
  player.addScript(pLoop);

  // 10. UI Banner
  const uiSprite = project.addSprite('UI_Banner');
  const bannerOver = generateBannerSvg('DUNGEON FAILED', 'Caught by the guard!', false);
  const bannerWin = generateBannerSvg('ESCAPED!', 'You unlocked the door and escaped!', true);
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
