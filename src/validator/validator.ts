/**
 * 3-Tier Scratch Project Validation Engine
 * Enforces Structural, Semantic, and Gameplay integrity rules
 */
import { GameProject } from '../engine/project';
import {
  ValidationIssue,
  ValidationResult,
  ValidationSeverity,
  Sb3Target,
  Sb3Block,
} from '../engine/types';

export class ProjectValidator {
  /**
   * Run full validation suite on a GameProject
   */
  public static validate(project: GameProject): ValidationResult {
    const issues: ValidationIssue[] = [];
    const rawSb3 = project.toSb3Json();

    // 1. Structural Checks
    this.checkStructural(project, rawSb3, issues);

    // 2. Semantic Checks
    this.checkSemantic(project, rawSb3, issues);

    // 3. Gameplay Checks
    this.checkGameplay(project, rawSb3, issues);

    const hasErrors = issues.some((i) => i.severity === 'error');

    // Compute metrics
    let totalBlocks = 0;
    let totalScripts = 0;
    let totalCostumes = project.stage.costumes.length;
    let totalSounds = project.stage.sounds.length;
    let totalVars = Object.keys(project.stage.variables).length;
    let totalLists = Object.keys(project.stage.lists).length;

    for (const sprite of project.sprites) {
      totalCostumes += sprite.costumes.length;
      totalSounds += sprite.sounds.length;
      totalVars += Object.keys(sprite.variables).length;
      totalLists += Object.keys(sprite.lists).length;
      totalScripts += Object.keys(sprite.blocks).length;
      const rawTarget = rawSb3.targets.find((t) => t.name === sprite.name);
      if (rawTarget) {
        totalBlocks += Object.keys(rawTarget.blocks).filter((k) => !Array.isArray(rawTarget.blocks[k])).length;
      }
    }

    return {
      valid: !hasErrors,
      issues,
      metrics: {
        targetCount: rawSb3.targets.length,
        spriteCount: project.sprites.length,
        blockCount: totalBlocks,
        scriptCount: totalScripts,
        variableCount: totalVars,
        listCount: totalLists,
        broadcastCount: Object.keys(project.globalBroadcasts).length,
        costumeCount: totalCostumes,
        soundCount: totalSounds,
      },
    };
  }

  // ==========================================
  // Tier 1: Structural Checks
  // ==========================================
  private static checkStructural(project: GameProject, rawSb3: ReturnType<GameProject['toSb3Json']>, issues: ValidationIssue[]): void {
    if (!rawSb3.targets || rawSb3.targets.length === 0) {
      issues.push({
        id: 'STRUCT_NO_TARGETS',
        severity: 'error',
        category: 'structural',
        message: 'Project has no targets.',
        explanation: 'Every Scratch project must have at least a Stage target.',
        fixableAutomatically: true,
      });
      return;
    }

    const stage = rawSb3.targets[0];
    if (!stage.isStage) {
      issues.push({
        id: 'STRUCT_FIRST_NOT_STAGE',
        severity: 'error',
        category: 'structural',
        message: 'First target is not the Stage.',
        explanation: 'Scratch 3.0 requires target 0 to have isStage: true.',
        fixableAutomatically: true,
      });
    }

    // Check assets match in project
    for (const target of rawSb3.targets) {
      for (const costume of target.costumes) {
        if (!costume.assetId || !costume.md5ext) {
          issues.push({
            id: 'STRUCT_INVALID_COSTUME_ID',
            severity: 'error',
            category: 'structural',
            target: target.name,
            message: `Costume "${costume.name}" in "${target.name}" is missing assetId or md5ext.`,
            explanation: 'Every costume must have a valid 32-hex MD5 asset ID.',
            fixableAutomatically: true,
            context: { costumeName: costume.name },
          });
        } else if (!project.assets.has(costume.md5ext)) {
          issues.push({
            id: 'STRUCT_MISSING_COSTUME_ASSET',
            severity: 'warning',
            category: 'structural',
            target: target.name,
            message: `Asset file "${costume.md5ext}" for costume "${costume.name}" was not registered.`,
            explanation: 'Scratch will display an empty costume if the asset file is missing.',
            fixableAutomatically: true,
            context: { md5ext: costume.md5ext, costumeName: costume.name },
          });
        }
      }

      // Check block integrity
      for (const [blockId, blockData] of Object.entries(target.blocks)) {
        if (Array.isArray(blockData)) continue; // Primitive array

        if (!blockData.opcode) {
          issues.push({
            id: 'STRUCT_BLOCK_NO_OPCODE',
            severity: 'error',
            category: 'structural',
            target: target.name,
            message: `Block "${blockId}" in "${target.name}" is missing an opcode.`,
            explanation: 'All blocks in Scratch 3.0 must specify an opcode.',
            fixableAutomatically: true,
            context: { blockId },
          });
        }

        // Parent / Next linkage check
        if (blockData.next) {
          const nextBlock = target.blocks[blockData.next];
          if (!nextBlock) {
            issues.push({
              id: 'STRUCT_BROKEN_NEXT_PTR',
              severity: 'error',
              category: 'structural',
              target: target.name,
              message: `Block "${blockId}" references non-existent next block "${blockData.next}".`,
              explanation: 'Block sequence is broken due to a dangling pointer.',
              fixableAutomatically: true,
              context: { blockId, next: blockData.next },
            });
          }
        }
      }
    }
  }

  // ==========================================
  // Tier 2: Semantic Checks
  // ==========================================
  private static checkSemantic(project: GameProject, rawSb3: ReturnType<GameProject['toSb3Json']>, issues: ValidationIssue[]): void {
    const globalVarIds = new Set(Object.keys(rawSb3.targets[0]?.variables || {}));
    const globalBroadcasts = new Set(Object.values(project.globalBroadcasts));

    // Track broadcasts sent and received
    const broadcastsSent = new Set<string>();
    const broadcastsReceived = new Set<string>();

    for (const target of rawSb3.targets) {
      const targetVarIds = new Set([...globalVarIds, ...Object.keys(target.variables || {})]);

      for (const [blockId, blockData] of Object.entries(target.blocks)) {
        if (Array.isArray(blockData)) continue;

        // Variable check
        if (blockData.opcode.startsWith('data_setvariable') || blockData.opcode.startsWith('data_changevariable')) {
          const field = blockData.fields['VARIABLE'];
          if (field && Array.isArray(field)) {
            const [varName, varId] = field;
            if (varId && !targetVarIds.has(varId)) {
              issues.push({
                id: 'SEMANTIC_UNKNOWN_VARIABLE',
                severity: 'error',
                category: 'semantic',
                target: target.name,
                message: `Script in "${target.name}" references variable "${varName}" (ID: ${varId}) which does not exist.`,
                explanation: `The variable "${varName}" must be defined either globally on the Stage or locally on "${target.name}".`,
                fixableAutomatically: true,
                suggestedFix: `Create variable "${varName}" on Stage.`,
                context: { varName, varId, target: target.name },
              });
            }
          }
        }

        // Broadcast send check
        if (blockData.opcode === 'event_broadcast' || blockData.opcode === 'event_broadcastandwait') {
          const input = blockData.inputs['BROADCAST_INPUT'];
          if (input && Array.isArray(input)) {
            const broadcastPayload = input[1];
            if (Array.isArray(broadcastPayload) && broadcastPayload[0] === 11) {
              const msgName = String(broadcastPayload[1]);
              broadcastsSent.add(msgName);
            }
          }
        }

        // Broadcast receive check
        if (blockData.opcode === 'event_whenbroadcastreceived') {
          const field = blockData.fields['BROADCAST_OPTION'];
          if (field && Array.isArray(field)) {
            const msgName = field[0];
            broadcastsReceived.add(msgName);
          }
        }

        // Costume check
        if (blockData.opcode === 'looks_switchcostumeto') {
          const costumeInput = blockData.inputs['COSTUME'];
          if (costumeInput && Array.isArray(costumeInput) && costumeInput[1]) {
            const menuBlockId = costumeInput[1];
            const menuBlock = target.blocks[menuBlockId as string];
            if (menuBlock && typeof menuBlock === 'object' && !Array.isArray(menuBlock)) {
              const costumeName = menuBlock.fields['COSTUME']?.[0];
              if (costumeName && !target.costumes.some((c) => c.name === costumeName)) {
                issues.push({
                  id: 'SEMANTIC_UNKNOWN_COSTUME',
                  severity: 'warning',
                  category: 'semantic',
                  target: target.name,
                  message: `Target "${target.name}" switches to costume "${costumeName}" which is not in its costume list.`,
                  explanation: 'Switching to a non-existent costume will default to the current costume or fail silently.',
                  fixableAutomatically: true,
                  context: { costumeName, target: target.name },
                });
              }
            }
          }
        }

        // Clone handler check
        if (blockData.opcode === 'control_create_clone_of') {
          const cloneInput = blockData.inputs['CLONE_OPTION'];
          if (cloneInput && Array.isArray(cloneInput) && cloneInput[1]) {
            const menuBlock = target.blocks[cloneInput[1] as string];
            if (menuBlock && typeof menuBlock === 'object' && !Array.isArray(menuBlock)) {
              const targetSpriteName = menuBlock.fields['CLONE_OPTION']?.[0];
              if (targetSpriteName && targetSpriteName !== '_myself_') {
                const cloneTarget = rawSb3.targets.find((t) => t.name === targetSpriteName);
                if (!cloneTarget) {
                  issues.push({
                    id: 'SEMANTIC_UNKNOWN_CLONE_TARGET',
                    severity: 'error',
                    category: 'semantic',
                    target: target.name,
                    message: `Sprite "${target.name}" attempts to clone non-existent sprite "${targetSpriteName}".`,
                    explanation: 'Scratch cannot clone a sprite that does not exist in the project.',
                    fixableAutomatically: true,
                    context: { targetSpriteName },
                  });
                }
              }
            }
          }
        }
      }
    }

    // Check for broadcasts with sender but zero receivers
    for (const msg of broadcastsSent) {
      if (!broadcastsReceived.has(msg)) {
        issues.push({
          id: 'SEMANTIC_ORPHAN_BROADCAST',
          severity: 'warning',
          category: 'semantic',
          message: `Broadcast "${msg}" is sent, but no sprite or stage listens for it.`,
          explanation: 'Sending an unhandled broadcast has no effect in gameplay.',
          fixableAutomatically: true,
          context: { broadcastName: msg },
        });
      }
    }
  }

  // ==========================================
  // Tier 3: Gameplay Checks
  // ==========================================
  private static checkGameplay(project: GameProject, rawSb3: ReturnType<GameProject['toSb3Json']>, issues: ValidationIssue[]): void {
    // 1. Must have at least one green flag clicked script
    let hasGreenFlag = false;
    for (const target of rawSb3.targets) {
      for (const [, blockData] of Object.entries(target.blocks)) {
        if (!Array.isArray(blockData) && blockData.opcode === 'event_whenflagclicked') {
          hasGreenFlag = true;
          break;
        }
      }
      if (hasGreenFlag) break;
    }

    if (!hasGreenFlag) {
      issues.push({
        id: 'GAMEPLAY_NO_START_SCRIPT',
        severity: 'error',
        category: 'gameplay',
        message: 'No "When Green Flag Clicked" entry point found in the project.',
        explanation: 'Scratch projects must have at least one Green Flag script to initiate gameplay.',
        fixableAutomatically: true,
      });
    }

    // 2. Player Movement check (for platformers, shooters, topdown)
    const playerTarget = rawSb3.targets.find((t) => !t.isStage && (t.name.toLowerCase() === 'player' || t.name.toLowerCase().includes('hero')));
    if (playerTarget) {
      let hasMovement = false;
      const motionOpcodes = new Set([
        'motion_movesteps',
        'motion_changexby',
        'motion_changeyby',
        'motion_setx',
        'motion_sety',
        'motion_gotoxy',
      ]);

      for (const [, bData] of Object.entries(playerTarget.blocks)) {
        if (!Array.isArray(bData) && motionOpcodes.has(bData.opcode)) {
          hasMovement = true;
          break;
        }
      }

      if (!hasMovement) {
        issues.push({
          id: 'GAMEPLAY_PLAYER_CANNOT_MOVE',
          severity: 'warning',
          category: 'gameplay',
          target: playerTarget.name,
          message: `The Player sprite "${playerTarget.name}" has no motion blocks.`,
          explanation: 'The player entity appears immobile or missing motion controls.',
          fixableAutomatically: false,
        });
      }
    }

    // 3. Win / Victory State check
    let hasVictoryState = false;
    for (const target of rawSb3.targets) {
      for (const [, bData] of Object.entries(target.blocks)) {
        if (Array.isArray(bData)) continue;
        if (bData.opcode === 'event_broadcast' || bData.opcode === 'event_broadcastandwait') {
          const input = bData.inputs['BROADCAST_INPUT'];
          if (input && Array.isArray(input)) {
            const payload = input[1];
            if (Array.isArray(payload) && typeof payload[1] === 'string' && payload[1].toUpperCase().includes('VICTORY')) {
              hasVictoryState = true;
              break;
            }
          }
        }
        if (bData.opcode === 'data_setvariableto') {
          const valInput = bData.inputs['VALUE'];
          if (valInput && Array.isArray(valInput)) {
            const val = String(valInput[1]?.[1] || '');
            if (val.toUpperCase().includes('VICTORY')) {
              hasVictoryState = true;
              break;
            }
          }
        }
      }
      if (hasVictoryState) break;
    }

    if (!hasVictoryState) {
      issues.push({
        id: 'GAMEPLAY_NO_WIN_CONDITION',
        severity: 'info',
        category: 'gameplay',
        message: 'No explicit victory condition or "VICTORY" broadcast detected.',
        explanation: 'Games are more satisfying when they have an achievable goal or win state.',
        fixableAutomatically: false,
      });
    }
  }
}
