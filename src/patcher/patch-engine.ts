/**
 * Project-Aware AST Patch Engine
 * Applies incremental surgical modifications without regenerating the entire project
 */
import { GameProject, Sprite } from '../engine/project';
import { ProjectPatch, PatchOperation } from '../engine/types';
import { Blocks } from '../engine/blocks';
import { generateEnemySvg, generateCoinSvg } from '../engine/assets/procedural';

export class PatchEngine {
  /**
   * Applies a patch containing multiple atomic operations to a GameProject
   */
  public static applyPatch(project: GameProject, patch: ProjectPatch): { success: boolean; applied: string[]; errors: string[] } {
    const applied: string[] = [];
    const errors: string[] = [];

    for (const op of patch.operations) {
      try {
        const desc = this.applyOperation(project, op);
        applied.push(desc);
      } catch (err: any) {
        errors.push(`Failed op "${op.op}": ${err.message || String(err)}`);
      }
    }

    return {
      success: errors.length === 0,
      applied,
      errors,
    };
  }

  private static applyOperation(project: GameProject, op: PatchOperation): string {
    switch (op.op) {
      case 'add_variable': {
        const name = (op.payload.name as string) || 'NewVar';
        const value = op.payload.value ?? 0;
        const id = project.ensureGlobalVariable(name, value as any);
        return `Added global variable "${name}" (ID: ${id}) with initial value ${value}`;
      }

      case 'modify_variable': {
        const name = (op.payload.name as string) || (op.target as string);
        const value = op.payload.value;
        const varId = project.getGlobalVariableId(name);
        if (!varId) {
          throw new Error(`Variable "${name}" does not exist`);
        }
        project.stage.variables[varId][1] = value as any;
        return `Updated initial value of variable "${name}" to ${value}`;
      }

      case 'add_sprite': {
        const name = (op.payload.name as string) || 'Extra_Entity';
        const type = (op.payload.type as string) || 'enemy';
        const sprite = project.addSprite(name);

        if (type === 'coin') {
          const coinSvg = generateCoinSvg();
          const { asset } = sprite.addCostume('Coin', coinSvg.svg, coinSvg.centerX, coinSvg.centerY);
          project.registerAsset(asset);
          const flag = Blocks.whenFlagClicked(50, 50);
          flag.chain(Blocks.goToXY(Number(op.payload.x || 0), Number(op.payload.y || 0))).chain(Blocks.show());
          sprite.addScript(flag);
        } else {
          const enemySvg = generateEnemySvg('slime', '#EF4444');
          const { asset } = sprite.addCostume('Enemy', enemySvg.svg, enemySvg.centerX, enemySvg.centerY);
          project.registerAsset(asset);
          const flag = Blocks.whenFlagClicked(50, 50);
          flag
            .chain(Blocks.goToXY(Number(op.payload.x || 60), Number(op.payload.y || -90)))
            .chain(Blocks.show())
            .chain(
              Blocks.forever(
                Blocks.chainBlocks([
                  Blocks.repeat(20, Blocks.changeXBy(2)),
                  Blocks.repeat(20, Blocks.changeXBy(-2)),
                ])
              )
            );
          sprite.addScript(flag);
        }

        return `Added new sprite "${name}" of type "${type}"`;
      }

      case 'remove_sprite': {
        const name = (op.target as string) || (op.payload.name as string);
        const removed = project.removeSprite(name);
        if (!removed) throw new Error(`Sprite "${name}" not found`);
        return `Removed sprite "${name}"`;
      }

      case 'modify_mechanic': {
        const target = op.target || 'Player';
        const sprite = project.getSprite(target);
        if (!sprite) throw new Error(`Target sprite "${target}" not found`);

        const change = op.payload.change as string;
        // e.g. "jump_higher", "faster", "more_health"
        if (change === 'jump_higher') {
          const yVelId = sprite.getVariableId('y_vel') || project.getGlobalVariableId('y_vel');
          if (yVelId) {
            // Find and increase jump value in blocks
            this.adjustNumberInputs(sprite, 'data_setvariableto', 14, 18);
          }
          return `Increased jump force for "${target}"`;
        }

        if (change === 'faster') {
          this.adjustNumberInputs(sprite, 'data_changevariableby', 2, 3.5);
          this.adjustNumberInputs(sprite, 'motion_changexby', 4, 7);
          return `Increased movement speed for "${target}"`;
        }

        return `Applied mechanic modification "${change}" to "${target}"`;
      }

      case 'rename_identifier': {
        const oldName = op.payload.oldName as string;
        const newName = op.payload.newName as string;
        const kind = (op.payload.kind as string) || 'variable';

        if (kind === 'variable') {
          const varId = project.getGlobalVariableId(oldName);
          if (varId) {
            project.stage.variables[varId][0] = newName;
            // Update all blocks referencing this variable name
            this.refactorVariableName(project, varId, newName);
            return `Renamed variable "${oldName}" to "${newName}" across all blocks`;
          }
        } else if (kind === 'broadcast') {
          const bcId = project.getBroadcastId(oldName);
          if (bcId) {
            project.globalBroadcasts[bcId] = newName;
            project.stage.broadcasts[bcId] = newName;
            return `Renamed broadcast "${oldName}" to "${newName}"`;
          }
        }
        return `Renamed identifier "${oldName}" to "${newName}"`;
      }

      default:
        return `Executed custom patch: ${op.description || op.op}`;
    }
  }

  private static adjustNumberInputs(sprite: Sprite, opcode: string, matchVal: number, newVal: number): void {
    for (const hat of Object.values(sprite.blocks)) {
      let current: any = hat;
      while (current) {
        if (current.opcode === opcode) {
          const valInput = current.inputs['VALUE'] || current.inputs['DX'] || current.inputs['DY'];
          if (Array.isArray(valInput) && Array.isArray(valInput[1])) {
            const raw = Number(valInput[1][1]);
            if (Math.abs(raw - matchVal) < 1) {
              valInput[1][1] = String(newVal);
            }
          }
        }
        current = current.next;
      }
    }
  }

  private static refactorVariableName(project: GameProject, varId: string, newName: string): void {
    const targets = [project.stage, ...project.sprites];
    for (const target of targets) {
      for (const hat of Object.values(target.blocks)) {
        let current: any = hat;
        while (current) {
          if (current.fields['VARIABLE'] && current.fields['VARIABLE'][1] === varId) {
            current.fields['VARIABLE'][0] = newName;
          }
          current = current.next;
        }
      }
    }
  }
}
