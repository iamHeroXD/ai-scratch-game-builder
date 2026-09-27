/**
 * Scratch 3.0 .sb3 Project Importer & Analyzer
 * Unpacks .sb3 archives, parses project.json, restores assets, and extracts metrics
 */
import JSZip from 'jszip';
import { GameProject, Sprite } from './project';
import { ProjectAsset, Sb3Project, Sb3Target } from './types';
import { BlockNode } from './blocks';

export interface ProjectAnalysis {
  title: string;
  spriteCount: number;
  costumeCount: number;
  soundCount: number;
  variableCount: number;
  listCount: number;
  scriptCount: number;
  blockCount: number;
  broadcastCount: number;
  sprites: Array<{
    name: string;
    costumeCount: number;
    scriptCount: number;
    blockCount: number;
    variables: string[];
  }>;
  globalVariables: string[];
  broadcasts: string[];
}

export class Sb3Importer {
  /**
   * Import from an ArrayBuffer, Uint8Array, or Blob
   */
  public static async importProject(data: ArrayBuffer | Uint8Array): Promise<{
    project: GameProject;
    rawSb3: Sb3Project;
    analysis: ProjectAnalysis;
  }> {
    const zip = await JSZip.loadAsync(data);
    const projectJsonFile = zip.file('project.json');

    if (!projectJsonFile) {
      throw new Error('Invalid .sb3 archive: missing project.json');
    }

    const projectJsonText = await projectJsonFile.async('text');
    const rawSb3: Sb3Project = JSON.parse(projectJsonText);

    // Identify stage and sprites
    const stageTarget = rawSb3.targets.find((t) => t.isStage);
    if (!stageTarget) {
      throw new Error('Invalid .sb3 archive: missing Stage target');
    }

    const spriteTargets = rawSb3.targets.filter((t) => !t.isStage);
    const projectName = 'Imported Project';
    const project = new GameProject(projectName);

    // Load Stage properties
    project.stage.variables = { ...stageTarget.variables };
    project.stage.lists = { ...stageTarget.lists };
    project.stage.currentCostume = stageTarget.currentCostume || 0;
    project.stage.costumes = [...stageTarget.costumes];
    project.stage.sounds = [...stageTarget.sounds];
    project.globalBroadcasts = { ...stageTarget.broadcasts };

    // Extract all assets from the ZIP
    const assetFiles = Object.keys(zip.files).filter((name) => name !== 'project.json');
    for (const fileName of assetFiles) {
      const file = zip.files[fileName];
      if (file && !file.dir) {
        const ext = (fileName.split('.').pop() || 'svg') as 'svg' | 'png' | 'wav';
        const isSvg = ext === 'svg';
        const content = isSvg ? await file.async('text') : await file.async('uint8array');
        const assetId = fileName.replace(/\.[^/.]+$/, '');

        const asset: ProjectAsset = {
          assetId,
          name: fileName,
          fileName,
          extension: ext,
          content,
        };
        project.registerAsset(asset);
      }
    }

    // Restore Sprites
    for (const sTarget of spriteTargets) {
      const sprite = new Sprite(sTarget.name);
      sprite.x = sTarget.x ?? 0;
      sprite.y = sTarget.y ?? 0;
      sprite.size = sTarget.size ?? 100;
      sprite.direction = sTarget.direction ?? 90;
      sprite.visible = sTarget.visible ?? true;
      sprite.draggable = sTarget.draggable ?? false;
      sprite.rotationStyle = sTarget.rotationStyle ?? 'all around';
      sprite.layerOrder = sTarget.layerOrder ?? project.sprites.length + 1;
      sprite.variables = { ...sTarget.variables };
      sprite.lists = { ...sTarget.lists };
      sprite.costumes = [...sTarget.costumes];
      sprite.sounds = [...sTarget.sounds];
      sprite.currentCostume = sTarget.currentCostume ?? 0;

      // Reconstruct top-level block trees
      this.reconstructBlocks(sTarget, sprite);
      project.sprites.push(sprite);
    }

    // Compute analysis
    const analysis = this.analyze(project, rawSb3);
    return { project, rawSb3, analysis };
  }

  private static reconstructBlocks(target: Sb3Target, sprite: Sprite): void {
    const rawBlocks = target.blocks;
    for (const [id, blockData] of Object.entries(rawBlocks)) {
      if (Array.isArray(blockData)) continue; // Primitive array
      if (blockData.topLevel) {
        const hatNode = new BlockNode(blockData.opcode, {
          id,
          topLevel: true,
          shadow: blockData.shadow,
          x: blockData.x,
          y: blockData.y,
          fields: blockData.fields,
          inputs: blockData.inputs,
          mutation: blockData.mutation,
        });
        sprite.addScript(hatNode);
      }
    }
  }

  /**
   * Generates a detailed breakdown of project statistics
   */
  public static analyze(project: GameProject, rawSb3?: Sb3Project): ProjectAnalysis {
    let totalBlockCount = 0;
    let totalScriptCount = 0;
    let totalCostumes = project.stage.costumes.length;
    let totalSounds = project.stage.sounds.length;
    let totalVars = Object.keys(project.stage.variables).length;
    let totalLists = Object.keys(project.stage.lists).length;

    const spritesInfo = project.sprites.map((s) => {
      totalCostumes += s.costumes.length;
      totalSounds += s.sounds.length;
      totalVars += Object.keys(s.variables).length;
      totalLists += Object.keys(s.lists).length;

      const scriptCount = Object.keys(s.blocks).length;
      totalScriptCount += scriptCount;

      let blockCount = 0;
      if (rawSb3) {
        const rawTarget = rawSb3.targets.find((t) => t.name === s.name);
        if (rawTarget) {
          blockCount = Object.keys(rawTarget.blocks).filter((k) => !Array.isArray(rawTarget.blocks[k])).length;
        }
      } else {
        blockCount = scriptCount * 3; // approximation
      }
      totalBlockCount += blockCount;

      return {
        name: s.name,
        costumeCount: s.costumes.length,
        scriptCount,
        blockCount,
        variables: Object.values(s.variables).map(([name]) => name),
      };
    });

    const globalVariables = Object.values(project.stage.variables).map(([name]) => name);
    const broadcasts = Object.values(project.globalBroadcasts);

    return {
      title: project.name,
      spriteCount: project.sprites.length,
      costumeCount: totalCostumes,
      soundCount: totalSounds,
      variableCount: totalVars,
      listCount: totalLists,
      scriptCount: totalScriptCount,
      blockCount: Math.max(totalBlockCount, totalScriptCount),
      broadcastCount: broadcasts.length,
      sprites: spritesInfo,
      globalVariables,
      broadcasts,
    };
  }
}
