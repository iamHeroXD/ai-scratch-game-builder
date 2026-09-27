/**
 * Automated Self-Healing Repair Engine
 * Diagnoses and automatically fixes structural and semantic errors in GameProject ASTs
 */
import { GameProject } from '../engine/project';
import { ProjectValidator } from './validator';
import { Blocks } from '../engine/blocks';
import { generatePlayerSvg } from '../engine/assets/procedural';

export interface RepairResult {
  success: boolean;
  attempts: number;
  repairsApplied: string[];
  finalValid: boolean;
  project: GameProject;
}

export class ProjectRepairer {
  public static readonly MAX_REPAIR_ATTEMPTS = 3;

  /**
   * Run automated repair passes until valid or max attempts reached
   */
  public static autoRepair(project: GameProject): RepairResult {
    let attempts = 0;
    const repairsApplied: string[] = [];

    while (attempts < this.MAX_REPAIR_ATTEMPTS) {
      attempts++;
      const valResult = ProjectValidator.validate(project);

      if (valResult.valid) {
        return {
          success: true,
          attempts,
          repairsApplied,
          finalValid: true,
          project,
        };
      }

      let repairedSomething = false;

      for (const issue of valResult.issues) {
        if (!issue.fixableAutomatically) continue;

        // Fix 1: Missing Variable
        if (issue.id === 'SEMANTIC_UNKNOWN_VARIABLE' && issue.context?.varName) {
          const varName = issue.context.varName as string;
          const varId = (issue.context.varId as string) || project.ensureGlobalVariable(varName, 0);
          project.stage.variables[varId] = [varName, 0, false];
          repairsApplied.push(`Created missing global variable "${varName}" on Stage (ID: ${varId})`);
          repairedSomething = true;
        }

        // Fix 2: Missing Green Flag Starter
        if (issue.id === 'GAMEPLAY_NO_START_SCRIPT') {
          const starter = Blocks.whenFlagClicked(50, 50);
          starter.chain(Blocks.broadcast('START_GAME', project.ensureBroadcast('START_GAME')));
          project.stage.addScript(starter);
          repairsApplied.push('Generated initial "When Green Flag Clicked" script on Stage');
          repairedSomething = true;
        }

        // Fix 3: Missing Costume Asset File
        if (issue.id === 'STRUCT_MISSING_COSTUME_ASSET' && issue.target && issue.context?.costumeName) {
          const target = issue.target === 'Stage' ? project.stage : project.getSprite(issue.target);
          if (target) {
            const fallback = generatePlayerSvg('hero', '#38BDF8');
            const { asset } = target.addCostume(
              issue.context.costumeName as string,
              fallback.svg,
              fallback.centerX,
              fallback.centerY
            );
            project.registerAsset(asset);
            repairsApplied.push(`Synthesized fallback vector asset for missing costume "${issue.context.costumeName}" on "${issue.target}"`);
            repairedSomething = true;
          }
        }

        // Fix 4: Orphan Broadcast without receiver
        if (issue.id === 'SEMANTIC_ORPHAN_BROADCAST' && issue.context?.broadcastName) {
          const bcName = issue.context.broadcastName as string;
          const bcId = project.ensureBroadcast(bcName);
          const listener = Blocks.whenBroadcastReceived(bcName, bcId, 50, 200 + repairsApplied.length * 50);
          project.stage.addScript(listener);
          repairsApplied.push(`Added receiver handler for broadcast "${bcName}" on Stage`);
          repairedSomething = true;
        }
      }

      if (!repairedSomething) {
        // No automatic fixes could be applied
        break;
      }
    }

    const finalVal = ProjectValidator.validate(project);
    return {
      success: finalVal.valid,
      attempts,
      repairsApplied,
      finalValid: finalVal.valid,
      project,
    };
  }
}
