/**
 * Clicker / Idle Game Mechanics Generator
 * Features click detection, currency, passive CPS, upgrades, multipliers, and win condition
 */
import { Blocks } from '../blocks';
import { GameProject } from '../project';
import {
  generateCoinSvg,
  generateBackdropSvg,
  generateBannerSvg,
} from '../assets/procedural';
import { synthesizeSoundEffect } from '../assets/sound-synth';

export interface ClickerConfig {
  title?: string;
  winThreshold?: number;
}

export function buildClickerProject(config: ClickerConfig = {}): GameProject {
  const title = config.title || 'Super Coin Tycoon';
  const project = new GameProject(title);

  const winGoal = config.winThreshold ?? 500;

  // 1. Global Variables
  const coinsVarId = project.ensureGlobalVariable('Coins', 0);
  const clickPowerVarId = project.ensureGlobalVariable('Click Power', 1);
  const cpsVarId = project.ensureGlobalVariable('Coins Per Sec', 0);
  const autoCostVarId = project.ensureGlobalVariable('Auto Miner Cost', 15);
  const powerCostVarId = project.ensureGlobalVariable('Power Upgrade Cost', 50);
  const stateVarId = project.ensureGlobalVariable('Game State', 'PLAYING');

  // 2. Broadcasts
  const bcStart = project.ensureBroadcast('START_GAME');
  const bcVictory = project.ensureBroadcast('VICTORY');

  // 3. Audio
  const sCoin = synthesizeSoundEffect('coin');
  const sWin = synthesizeSoundEffect('win');
  project.registerAsset(sCoin.asset);
  project.registerAsset(sWin.asset);

  // 4. Backdrop
  const bg = generateBackdropSvg('sky', '#0284C7');
  const cBg = project.stage.addCostume('Sky_Backdrop', bg.svg, bg.centerX, bg.centerY);
  project.registerAsset(cBg.asset);

  // Stage init script & Passive Income loop (CPS)
  const stageFlag = Blocks.whenFlagClicked(50, 50);
  stageFlag
    .chain(Blocks.setVariable('Coins', coinsVarId, 0))
    .chain(Blocks.setVariable('Click Power', clickPowerVarId, 1))
    .chain(Blocks.setVariable('Coins Per Sec', cpsVarId, 0))
    .chain(Blocks.setVariable('Auto Miner Cost', autoCostVarId, 15))
    .chain(Blocks.setVariable('Power Upgrade Cost', powerCostVarId, 50))
    .chain(Blocks.setVariable('Game State', stateVarId, 'PLAYING'))
    .chain(Blocks.broadcast('START_GAME', bcStart));
  project.stage.addScript(stageFlag);

  // Passive CPS loop
  const cpsLoop = Blocks.whenBroadcastReceived('START_GAME', bcStart, 50, 260);
  cpsLoop.chain(
    Blocks.repeatUntil(
      Blocks.equals(Blocks.getVariable('Game State', stateVarId), 'VICTORY'),
      Blocks.chainBlocks([
        Blocks.wait(1),
        Blocks.ifThen(
          Blocks.gt(Blocks.getVariable('Coins Per Sec', cpsVarId), 0),
          Blocks.chainBlocks([
            Blocks.changeVariableBy('Coins', coinsVarId, Blocks.getVariable('Coins Per Sec', cpsVarId)),
            // Check victory condition
            Blocks.ifThen(
              Blocks.gt(Blocks.getVariable('Coins', coinsVarId), winGoal - 1),
              Blocks.chainBlocks([
                Blocks.setVariable('Game State', stateVarId, 'VICTORY'),
                Blocks.broadcast('VICTORY', bcVictory),
              ])
            ),
          ])
        ),
      ])
    )
  );
  project.stage.addScript(cpsLoop);

  // 5. Clickable Coin Sprite
  const coinSprite = project.addSprite('Big_Coin');
  const coinSvg = generateCoinSvg('#F59E0B');
  const cCoin = coinSprite.addCostume('BigCoin', coinSvg.svg, coinSvg.centerX, coinSvg.centerY);
  project.registerAsset(cCoin.asset);
  coinSprite.addSound('coin', sCoin.asset.content as Uint8Array);

  const cFlag = Blocks.whenFlagClicked(50, 50);
  cFlag
    .chain(Blocks.goToXY(-70, 0))
    .chain(Blocks.setSizeTo(180))
    .chain(Blocks.show());
  coinSprite.addScript(cFlag);

  // When Big Coin Clicked
  const cClick = Blocks.whenThisSpriteClicked(50, 200);
  cClick
    .chain(Blocks.startSound('coin'))
    .chain(Blocks.changeVariableBy('Coins', coinsVarId, Blocks.getVariable('Click Power', clickPowerVarId)))
    // Squish & bounce animation
    .chain(Blocks.setSizeTo(200))
    .chain(Blocks.wait(0.06))
    .chain(Blocks.setSizeTo(180))
    // Victory check
    .chain(
      Blocks.ifThen(
        Blocks.gt(Blocks.getVariable('Coins', coinsVarId), winGoal - 1),
        Blocks.chainBlocks([
          Blocks.setVariable('Game State', stateVarId, 'VICTORY'),
          Blocks.broadcast('VICTORY', bcVictory),
        ])
      )
    );
  coinSprite.addScript(cClick);

  // 6. Upgrade 1 Sprite: Auto Miner
  const autoSprite = project.addSprite('Upgrade_AutoMiner');
  const autoSvg = generateBannerSvg('+1 CPS', 'Cost: 15 Coins', true);
  const cAuto = autoSprite.addCostume('AutoMiner_Btn', autoSvg.svg, autoSvg.centerX, autoSvg.centerY);
  project.registerAsset(cAuto.asset);

  const autoFlag = Blocks.whenFlagClicked(50, 50);
  autoFlag
    .chain(Blocks.goToXY(120, 50))
    .chain(Blocks.setSizeTo(55))
    .chain(Blocks.show());
  autoSprite.addScript(autoFlag);

  const autoClick = Blocks.whenThisSpriteClicked(50, 200);
  autoClick.chain(
    Blocks.ifThen(
      Blocks.gt(Blocks.getVariable('Coins', coinsVarId), Blocks.subtract(Blocks.getVariable('Auto Miner Cost', autoCostVarId), 1)),
      Blocks.chainBlocks([
        Blocks.changeVariableBy('Coins', coinsVarId, Blocks.multiply(-1, Blocks.getVariable('Auto Miner Cost', autoCostVarId))),
        Blocks.changeVariableBy('Coins Per Sec', cpsVarId, 1),
        Blocks.setVariable(
          'Auto Miner Cost',
          autoCostVarId,
          Blocks.round(Blocks.multiply(Blocks.getVariable('Auto Miner Cost', autoCostVarId), 1.5))
        ),
        Blocks.say('Purchased +1 CPS!', 1),
      ])
    )
  );
  autoSprite.addScript(autoClick);

  // 7. Upgrade 2 Sprite: Power Click
  const powerSprite = project.addSprite('Upgrade_Power');
  const powerSvg = generateBannerSvg('2x Click', 'Cost: 50 Coins', true);
  const cPower = powerSprite.addCostume('Power_Btn', powerSvg.svg, powerSvg.centerX, powerSvg.centerY);
  project.registerAsset(cPower.asset);

  const powerFlag = Blocks.whenFlagClicked(50, 50);
  powerFlag
    .chain(Blocks.goToXY(120, -50))
    .chain(Blocks.setSizeTo(55))
    .chain(Blocks.show());
  powerSprite.addScript(powerFlag);

  const powerClick = Blocks.whenThisSpriteClicked(50, 200);
  powerClick.chain(
    Blocks.ifThen(
      Blocks.gt(Blocks.getVariable('Coins', coinsVarId), Blocks.subtract(Blocks.getVariable('Power Upgrade Cost', powerCostVarId), 1)),
      Blocks.chainBlocks([
        Blocks.changeVariableBy('Coins', coinsVarId, Blocks.multiply(-1, Blocks.getVariable('Power Upgrade Cost', powerCostVarId))),
        Blocks.changeVariableBy('Click Power', clickPowerVarId, 2),
        Blocks.setVariable(
          'Power Upgrade Cost',
          powerCostVarId,
          Blocks.multiply(Blocks.getVariable('Power Upgrade Cost', powerCostVarId), 2)
        ),
        Blocks.say('Purchased +2 Click Power!', 1),
      ])
    )
  );
  powerSprite.addScript(powerClick);

  // 8. Victory Banner
  const uiSprite = project.addSprite('UI_Banner');
  const bannerWin = generateBannerSvg('TYCOON MASTER!', `Goal of ${winGoal} Coins Reached!`, true);
  const cBWin = uiSprite.addCostume('Victory_Banner', bannerWin.svg, bannerWin.centerX, bannerWin.centerY);
  project.registerAsset(cBWin.asset);
  uiSprite.addSound('win', sWin.asset.content as Uint8Array);

  const uiFlag = Blocks.whenFlagClicked(50, 50);
  uiFlag.chain(Blocks.hide()).chain(Blocks.goToXY(0, 0));
  uiSprite.addScript(uiFlag);

  const uiWin = Blocks.whenBroadcastReceived('VICTORY', bcVictory, 50, 200);
  uiWin
    .chain(Blocks.goToFront())
    .chain(Blocks.show())
    .chain(Blocks.startSound('win'));
  uiSprite.addScript(uiWin);

  return project;
}
