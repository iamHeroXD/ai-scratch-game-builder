/**
 * Master GameSpec Compiler
 * Compiles a structured GameSpec into a complete, playable GameProject AST
 */
import { GameSpec } from '../engine/types';
import { GameProject } from '../engine/project';
import { buildPlatformerProject } from '../engine/mechanics/platformer';
import { buildShooterProject } from '../engine/mechanics/shooter';
import { buildClickerProject } from '../engine/mechanics/clicker';
import { buildTopdownProject } from '../engine/mechanics/topdown';
import { generateEnemySvg, generateCoinSvg } from '../engine/assets/procedural';
import { Blocks } from '../engine/blocks';

export class GameCompiler {
  /**
   * Compiles high-level GameSpec into GameProject AST
   */
  public static compile(spec: GameSpec): GameProject {
    let project: GameProject;

    // 1. Select and build core mechanics template based on genre
    switch (spec.genre) {
      case 'shooter':
        project = buildShooterProject({
          title: spec.title,
          lives: 3,
          bossScoreThreshold: 100,
        });
        break;

      case 'clicker':
        project = buildClickerProject({
          title: spec.title,
          winThreshold: 500,
        });
        break;

      case 'topdown':
        project = buildTopdownProject({
          title: spec.title,
          speed: 4,
        });
        break;

      case 'platformer':
      default:
        project = buildPlatformerProject({
          title: spec.title,
          doubleJump: true,
          lives: 3,
          levelCount: Math.max(1, Math.min(3, spec.levels.length || 3)),
        });
        break;
    }

    // 2. Ensure all custom variables specified in GameSpec exist (defensive normalization)
    const rawVars = spec.variables || [];
    const varList: Array<{ name: string; initialValue: any }> = [];
    if (Array.isArray(rawVars)) {
      for (const v of rawVars) {
        if (typeof v === 'string') varList.push({ name: v, initialValue: 0 });
        else if (v && typeof v === 'object') varList.push({ name: v.name || 'Var', initialValue: v.initialValue ?? 0 });
      }
    } else if (typeof rawVars === 'object') {
      for (const [k, val] of Object.entries(rawVars)) {
        varList.push({ name: k, initialValue: val });
      }
    }
    for (const v of varList) {
      project.ensureGlobalVariable(v.name, v.initialValue);
    }

    // 3. Ensure all custom broadcasts exist (defensive normalization)
    const rawBc = spec.broadcasts || [];
    const bcList: string[] = [];
    if (Array.isArray(rawBc)) {
      for (const b of rawBc) {
        if (typeof b === 'string') bcList.push(b);
        else if (b && (b as any).name) bcList.push((b as any).name);
      }
    } else if (typeof rawBc === 'object') {
      bcList.push(...Object.values(rawBc as Record<string, string>));
    }
    for (const b of bcList) {
      project.ensureBroadcast(b);
    }

    // 4. Inject any custom entities not already present in the base template
    const rawEntities = Array.isArray(spec.entities) ? spec.entities : [];
    for (const entity of rawEntities) {
      const existingSprite = project.getSprite(entity.name);
      if (!existingSprite && entity.role !== 'player' && entity.role !== 'ui') {
        const customSprite = project.addSprite(entity.name);
        customSprite.x = entity.initialX ?? 60;
        customSprite.y = entity.initialY ?? -60;

        if (entity.role === 'collectible') {
          const coinSvg = generateCoinSvg(entity.primaryColor || '#FBBF24');
          const { asset } = customSprite.addCostume(entity.costumeType || 'Coin', coinSvg.svg, coinSvg.centerX, coinSvg.centerY);
          project.registerAsset(asset);
          const flag = Blocks.whenFlagClicked(50, 50);
          flag.chain(Blocks.goToXY(customSprite.x, customSprite.y)).chain(Blocks.show());
          customSprite.addScript(flag);
        } else {
          const enemySvg = generateEnemySvg(entity.costumeType || 'slime', entity.primaryColor || '#EF4444');
          const { asset } = customSprite.addCostume(entity.costumeType || 'Enemy', enemySvg.svg, enemySvg.centerX, enemySvg.centerY);
          project.registerAsset(asset);
          const flag = Blocks.whenFlagClicked(50, 50);
          flag
            .chain(Blocks.goToXY(customSprite.x, customSprite.y))
            .chain(Blocks.show())
            .chain(
              Blocks.forever(
                Blocks.chainBlocks([
                  Blocks.repeat(25, Blocks.changeXBy(2)),
                  Blocks.repeat(25, Blocks.changeXBy(-2)),
                ])
              )
            );
          customSprite.addScript(flag);
        }
      }
    }

    return project;
  }
}
