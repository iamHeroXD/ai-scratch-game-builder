/**
 * Top-Down Space Shooter Mechanics Generator
 * Features player controls, projectile clone spawning, enemy waves, health, score, and a final boss
 */
import { Blocks } from '../blocks';
import { GameProject } from '../project';
import {
  generatePlayerSvg,
  generateEnemySvg,
  generateBossSvg,
  generateProjectileSvg,
  generateBackdropSvg,
  generateBannerSvg,
} from '../assets/procedural';
import { synthesizeSoundEffect } from '../assets/sound-synth';

export interface ShooterConfig {
  title?: string;
  lives?: number;
  bossScoreThreshold?: number;
}

export function buildShooterProject(config: ShooterConfig = {}): GameProject {
  const title = config.title || 'Galactic Defender';
  const project = new GameProject(title);

  const initialLives = config.lives ?? 3;
  const bossThreshold = config.bossScoreThreshold ?? 100;

  // 1. Global Variables
  const healthVarId = project.ensureGlobalVariable('Health', initialLives);
  const scoreVarId = project.ensureGlobalVariable('Score', 0);
  const stateVarId = project.ensureGlobalVariable('Game State', 'PLAYING');
  const bossHealthVarId = project.ensureGlobalVariable('Boss Health', 10);

  // 2. Broadcasts
  const bcStart = project.ensureBroadcast('START_GAME');
  const bcGameOver = project.ensureBroadcast('GAME_OVER');
  const bcVictory = project.ensureBroadcast('VICTORY');
  const bcSpawnBoss = project.ensureBroadcast('SPAWN_BOSS');

  // 3. Audio Assets
  const sShoot = synthesizeSoundEffect('shoot');
  const sHit = synthesizeSoundEffect('hit');
  const sExplode = synthesizeSoundEffect('explosion');
  const sWin = synthesizeSoundEffect('win');
  const sGameOver = synthesizeSoundEffect('game_over');

  project.registerAsset(sShoot.asset);
  project.registerAsset(sHit.asset);
  project.registerAsset(sExplode.asset);
  project.registerAsset(sWin.asset);
  project.registerAsset(sGameOver.asset);

  // 4. Stage & Backdrop
  const bgSpace = generateBackdropSvg('space', '#090D16');
  const cBg = project.stage.addCostume('Space_Backdrop', bgSpace.svg, bgSpace.centerX, bgSpace.centerY);
  project.registerAsset(cBg.asset);

  const stageFlag = Blocks.whenFlagClicked(50, 50);
  stageFlag
    .chain(Blocks.setVariable('Game State', stateVarId, 'PLAYING'))
    .chain(Blocks.setVariable('Health', healthVarId, initialLives))
    .chain(Blocks.setVariable('Score', scoreVarId, 0))
    .chain(Blocks.setVariable('Boss Health', bossHealthVarId, 10))
    .chain(Blocks.broadcast('START_GAME', bcStart));
  project.stage.addScript(stageFlag);

  // 5. Player Ship Sprite
  const player = project.addSprite('Player');
  const pSvg = generatePlayerSvg('space', '#38BDF8');
  const cPlayer = player.addCostume('Ship', pSvg.svg, pSvg.centerX, pSvg.centerY);
  project.registerAsset(cPlayer.asset);

  player.addSound('shoot', sShoot.asset.content as Uint8Array);
  player.addSound('hit', sHit.asset.content as Uint8Array);

  const pFlag = Blocks.whenFlagClicked(50, 50);
  pFlag
    .chain(Blocks.goToXY(0, -130))
    .chain(Blocks.pointInDirection(0))
    .chain(Blocks.show());
  player.addScript(pFlag);

  // Player Control Loop
  const pLoop = Blocks.whenBroadcastReceived('START_GAME', bcStart, 50, 200);
  const moveControls = Blocks.chainBlocks([
    // Up / W
    Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('up arrow'), Blocks.keyPressed('w')),
      Blocks.ifThen(Blocks.lt(Blocks.yPosition(), 140), Blocks.changeYBy(5))
    ),
    // Down / S
    Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('down arrow'), Blocks.keyPressed('s')),
      Blocks.ifThen(Blocks.gt(Blocks.yPosition(), -150), Blocks.changeYBy(-5))
    ),
    // Left / A
    Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('left arrow'), Blocks.keyPressed('a')),
      Blocks.ifThen(Blocks.gt(Blocks.xPosition(), -220), Blocks.changeXBy(-5))
    ),
    // Right / D
    Blocks.ifThen(
      Blocks.or(Blocks.keyPressed('right arrow'), Blocks.keyPressed('d')),
      Blocks.ifThen(Blocks.lt(Blocks.xPosition(), 220), Blocks.changeXBy(5))
    ),
    // Shoot key (Space)
    Blocks.ifThen(
      Blocks.keyPressed('space'),
      Blocks.chainBlocks([
        Blocks.startSound('shoot'),
        Blocks.createCloneOf('Projectile'),
        Blocks.wait(0.2),
      ])
    ),
    // Collision with Enemy
    Blocks.ifThen(
      Blocks.or(Blocks.touchingObject('Enemy'), Blocks.touchingObject('Boss')),
      Blocks.chainBlocks([
        Blocks.startSound('hit'),
        Blocks.changeVariableBy('Health', healthVarId, -1),
        Blocks.wait(0.5),
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

  pLoop.chain(Blocks.forever(moveControls));
  player.addScript(pLoop);

  // 6. Projectile Sprite
  const projectile = project.addSprite('Projectile');
  const projSvg = generateProjectileSvg('#FBBF24');
  const cProj = projectile.addCostume('Laser', projSvg.svg, projSvg.centerX, projSvg.centerY);
  project.registerAsset(cProj.asset);

  const projFlag = Blocks.whenFlagClicked(50, 50);
  projFlag.chain(Blocks.hide());
  projectile.addScript(projFlag);

  // Projectile clone behavior
  const projClone = Blocks.startAsClone(50, 200);
  projClone
    .chain(Blocks.goToXY(Blocks.xPosition(), Blocks.yPosition())) // position is set from player at clone time
    .chain(Blocks.show())
    .chain(
      Blocks.repeatUntil(
        Blocks.or(
          Blocks.gt(Blocks.yPosition(), 170),
          Blocks.or(Blocks.touchingObject('Enemy'), Blocks.touchingObject('Boss'))
        ),
        Blocks.changeYBy(10)
      )
    )
    .chain(Blocks.deleteThisClone());
  projectile.addScript(projClone);

  // 7. Enemy Sprite (Spawns Clones)
  const enemy = project.addSprite('Enemy');
  const enemySvg = generateEnemySvg('drone', '#EF4444');
  const cEnemy = enemy.addCostume('AlienDrone', enemySvg.svg, enemySvg.centerX, enemySvg.centerY);
  project.registerAsset(cEnemy.asset);

  enemy.addSound('explosion', sExplode.asset.content as Uint8Array);

  const enemyFlag = Blocks.whenFlagClicked(50, 50);
  enemyFlag.chain(Blocks.hide());
  enemy.addScript(enemyFlag);

  // Enemy Spawner Script
  const enemySpawner = Blocks.whenBroadcastReceived('START_GAME', bcStart, 50, 200);
  enemySpawner.chain(
    Blocks.repeatUntil(
      Blocks.equals(Blocks.getVariable('Game State', stateVarId), 'VICTORY'),
      Blocks.chainBlocks([
        Blocks.wait(Blocks.random(1, 2)),
        // Only spawn regular enemies if Boss is not yet defeated
        Blocks.ifThen(
          Blocks.lt(Blocks.getVariable('Score', scoreVarId), bossThreshold),
          Blocks.createCloneOf('Enemy')
        ),
        // Check if boss should be spawned
        Blocks.ifThen(
          Blocks.and(
            Blocks.gt(Blocks.getVariable('Score', scoreVarId), bossThreshold - 1),
            Blocks.gt(Blocks.getVariable('Boss Health', bossHealthVarId), 0)
          ),
          Blocks.broadcast('SPAWN_BOSS', bcSpawnBoss)
        ),
      ])
    )
  );
  enemy.addScript(enemySpawner);

  // Enemy Clone Behavior
  const enemyClone = Blocks.startAsClone(350, 50);
  enemyClone
    .chain(Blocks.goToXY(Blocks.random(-200, 200), 160))
    .chain(Blocks.show())
    .chain(
      Blocks.repeatUntil(
        Blocks.or(
          Blocks.lt(Blocks.yPosition(), -160),
          Blocks.touchingObject('Projectile')
        ),
        Blocks.changeYBy(-3)
      )
    )
    .chain(
      Blocks.ifThen(
        Blocks.touchingObject('Projectile'),
        Blocks.chainBlocks([
          Blocks.startSound('explosion'),
          Blocks.changeVariableBy('Score', scoreVarId, 10),
        ])
      )
    )
    .chain(Blocks.deleteThisClone());
  enemy.addScript(enemyClone);

  // 8. Boss Sprite
  const boss = project.addSprite('Boss');
  const bossSvg = generateBossSvg('dragon', '#8B5CF6');
  const cBoss = boss.addCostume('Boss_Mech', bossSvg.svg, bossSvg.centerX, bossSvg.centerY);
  project.registerAsset(cBoss.asset);
  boss.addSound('hit', sHit.asset.content as Uint8Array);
  boss.addSound('win', sWin.asset.content as Uint8Array);

  const bossFlag = Blocks.whenFlagClicked(50, 50);
  bossFlag.chain(Blocks.hide()).chain(Blocks.goToXY(0, 100));
  boss.addScript(bossFlag);

  // Boss Spawn & Fight Script
  const bossFight = Blocks.whenBroadcastReceived('SPAWN_BOSS', bcSpawnBoss, 50, 200);
  bossFight
    .chain(Blocks.goToXY(0, 90))
    .chain(Blocks.show())
    .chain(
      Blocks.repeatUntil(
        Blocks.lt(Blocks.getVariable('Boss Health', bossHealthVarId), 1),
        Blocks.chainBlocks([
          // Patrol side-to-side
          Blocks.repeat(25, Blocks.chainBlocks([
            Blocks.changeXBy(4),
            Blocks.wait(0.05),
            Blocks.ifThen(
              Blocks.touchingObject('Projectile'),
              Blocks.chainBlocks([
                Blocks.startSound('hit'),
                Blocks.changeVariableBy('Boss Health', bossHealthVarId, -1),
              ])
            ),
          ])),
          Blocks.repeat(25, Blocks.chainBlocks([
            Blocks.changeXBy(-4),
            Blocks.wait(0.05),
            Blocks.ifThen(
              Blocks.touchingObject('Projectile'),
              Blocks.chainBlocks([
                Blocks.startSound('hit'),
                Blocks.changeVariableBy('Boss Health', bossHealthVarId, -1),
              ])
            ),
          ])),
        ])
      )
    )
    // Defeated!
    .chain(Blocks.startSound('win'))
    .chain(Blocks.changeVariableBy('Score', scoreVarId, 100))
    .chain(Blocks.setVariable('Game State', stateVarId, 'VICTORY'))
    .chain(Blocks.broadcast('VICTORY', bcVictory))
    .chain(Blocks.hide());
  boss.addScript(bossFight);

  // 9. UI Banners (Game Over & Victory)
  const uiSprite = project.addSprite('UI_Banner');
  const bannerOver = generateBannerSvg('MISSION FAILED', 'Press Green Flag to Restart', false);
  const bannerWin = generateBannerSvg('VICTORY!', 'Galaxy Saved! Final Boss Defeated!', true);
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
