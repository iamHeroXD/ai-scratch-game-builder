/**
 * GameProject Engine Abstraction Layer
 */
import {
  Sb3Costume,
  Sb3Project,
  Sb3Sound,
  Sb3Target,
  Sb3Variable,
  Sb3List,
  ProjectAsset,
} from './types';
import { BlockNode } from './blocks';
import { computeMd5 } from './assets/md5';

export class GameTarget {
  public isStage: boolean;
  public name: string;
  public variables: Record<string, Sb3Variable> = {};
  public lists: Record<string, Sb3List> = {};
  public broadcasts: Record<string, string> = {};
  public blocks: Record<string, BlockNode> = {};
  public costumes: Sb3Costume[] = [];
  public sounds: Sb3Sound[] = [];
  public currentCostume: number = 0;
  public volume: number = 100;
  public layerOrder: number = 1;

  constructor(name: string, isStage = false) {
    this.name = name;
    this.isStage = isStage;
  }

  public addCostume(
    name: string,
    svgOrPngContent: string | Uint8Array,
    centerX: number,
    centerY: number,
    dataFormat: 'svg' | 'png' = 'svg'
  ): { costume: Sb3Costume; asset: ProjectAsset } {
    const assetId = computeMd5(svgOrPngContent);
    const md5ext = `${assetId}.${dataFormat}`;

    const costume: Sb3Costume = {
      assetId,
      name,
      md5ext,
      dataFormat,
      rotationCenterX: centerX,
      rotationCenterY: centerY,
    };

    const asset: ProjectAsset = {
      assetId,
      name,
      fileName: md5ext,
      extension: dataFormat,
      content: svgOrPngContent,
    };

    this.costumes.push(costume);
    return { costume, asset };
  }

  public addSound(
    name: string,
    wavOrMp3Data: Uint8Array,
    rate = 22050,
    dataFormat: 'wav' | 'mp3' = 'wav'
  ): { sound: Sb3Sound; asset: ProjectAsset } {
    const assetId = computeMd5(wavOrMp3Data);
    const md5ext = `${assetId}.${dataFormat}`;

    const sound: Sb3Sound = {
      assetId,
      name,
      md5ext,
      dataFormat,
      rate,
      sampleCount: wavOrMp3Data.length,
    };

    const asset: ProjectAsset = {
      assetId,
      name,
      fileName: md5ext,
      extension: dataFormat,
      content: wavOrMp3Data,
    };

    this.sounds.push(sound);
    return { sound, asset };
  }

  public addScript(hatBlock: BlockNode): this {
    this.blocks[hatBlock.id] = hatBlock;
    return this;
  }

  public addVariable(name: string, initialValue: string | number | boolean = 0, isCloud = false): string {
    // Search if already exists
    for (const [id, [varName]] of Object.entries(this.variables)) {
      if (varName === name) return id;
    }
    const id = 'v_' + Math.random().toString(36).substring(2, 9);
    this.variables[id] = [name, initialValue, isCloud];
    return id;
  }

  public getVariableId(name: string): string | null {
    for (const [id, [varName]] of Object.entries(this.variables)) {
      if (varName === name) return id;
    }
    return null;
  }
}

export class Stage extends GameTarget {
  public tempo: number = 60;
  public videoTransparency: number = 50;
  public videoState: string = 'on';
  public textToSpeechLanguage: string | null = null;

  constructor() {
    super('Stage', true);
  }
}

export class Sprite extends GameTarget {
  public visible: boolean = true;
  public x: number = 0;
  public y: number = 0;
  public size: number = 100;
  public direction: number = 90;
  public draggable: boolean = false;
  public rotationStyle: 'all around' | 'left-right' | "don't rotate" = 'all around';

  constructor(name: string) {
    super(name, false);
  }
}

export class GameProject {
  public name: string;
  public stage: Stage;
  public sprites: Sprite[] = [];
  public assets: Map<string, ProjectAsset> = new Map();
  public globalBroadcasts: Record<string, string> = {}; // { id: name }

  constructor(name = 'Untitled Game') {
    this.name = name;
    this.stage = new Stage();
  }

  public addSprite(name: string): Sprite {
    const existing = this.sprites.find((s) => s.name === name);
    if (existing) return existing;

    const sprite = new Sprite(name);
    sprite.layerOrder = this.sprites.length + 1;
    this.sprites.push(sprite);
    return sprite;
  }

  public getSprite(name: string): Sprite | undefined {
    return this.sprites.find((s) => s.name === name);
  }

  public removeSprite(name: string): boolean {
    const idx = this.sprites.findIndex((s) => s.name === name);
    if (idx !== -1) {
      this.sprites.splice(idx, 1);
      return true;
    }
    return false;
  }

  public addGlobalVariable(name: string, initialValue: string | number | boolean = 0, isCloud = false): string {
    return this.stage.addVariable(name, initialValue, isCloud);
  }

  public getGlobalVariableId(name: string): string | null {
    return this.stage.getVariableId(name);
  }

  public ensureGlobalVariable(name: string, initialValue: string | number | boolean = 0): string {
    const existingId = this.getGlobalVariableId(name);
    if (existingId) return existingId;
    return this.addGlobalVariable(name, initialValue);
  }

  public addBroadcast(name: string): string {
    for (const [id, broadcastName] of Object.entries(this.globalBroadcasts)) {
      if (broadcastName === name) return id;
    }
    const id = 'bc_' + Math.random().toString(36).substring(2, 9);
    this.globalBroadcasts[id] = name;
    this.stage.broadcasts[id] = name;
    return id;
  }

  public getBroadcastId(name: string): string | null {
    for (const [id, broadcastName] of Object.entries(this.globalBroadcasts)) {
      if (broadcastName === name) return id;
    }
    return null;
  }

  public ensureBroadcast(name: string): string {
    const existing = this.getBroadcastId(name);
    if (existing) return existing;
    return this.addBroadcast(name);
  }

  public registerAsset(asset: ProjectAsset): void {
    this.assets.set(asset.fileName, asset);
  }

  /**
   * Compiles GameProject into official Scratch 3.0 project.json object
   */
  public toSb3Json(): Sb3Project {
    const targets: Sb3Target[] = [];

    // Stage is target 0
    const stageBlocks: Record<string, Sb3Target['blocks'][string]> = {};
    for (const hat of Object.values(this.stage.blocks)) {
      hat.flatten(stageBlocks as Record<string, any>);
    }

    const stageTarget: Sb3Target = {
      isStage: true,
      name: 'Stage',
      variables: { ...this.stage.variables },
      lists: { ...this.stage.lists },
      broadcasts: { ...this.globalBroadcasts },
      blocks: stageBlocks,
      comments: {},
      currentCostume: this.stage.currentCostume,
      costumes: [...this.stage.costumes],
      sounds: [...this.stage.sounds],
      volume: this.stage.volume,
      layerOrder: 0,
      tempo: this.stage.tempo,
      videoTransparency: this.stage.videoTransparency,
      videoState: this.stage.videoState,
      textToSpeechLanguage: this.stage.textToSpeechLanguage,
    };
    targets.push(stageTarget);

    // Sprites
    for (let i = 0; i < this.sprites.length; i++) {
      const sprite = this.sprites[i];
      const spriteBlocks: Record<string, Sb3Target['blocks'][string]> = {};
      for (const hat of Object.values(sprite.blocks)) {
        hat.flatten(spriteBlocks as Record<string, any>);
      }

      const spriteTarget: Sb3Target = {
        isStage: false,
        name: sprite.name,
        variables: { ...sprite.variables },
        lists: { ...sprite.lists },
        broadcasts: {},
        blocks: spriteBlocks,
        comments: {},
        currentCostume: sprite.currentCostume,
        costumes: [...sprite.costumes],
        sounds: [...sprite.sounds],
        volume: sprite.volume,
        layerOrder: i + 1,
        visible: sprite.visible,
        x: sprite.x,
        y: sprite.y,
        size: sprite.size,
        direction: sprite.direction,
        draggable: sprite.draggable,
        rotationStyle: sprite.rotationStyle,
      };
      targets.push(spriteTarget);
    }

    // Monitors for global variables
    const monitors = Object.entries(this.stage.variables).map(([id, [varName, value]], index) => ({
      id,
      mode: 'default' as const,
      opcode: 'data_variable',
      params: { VARIABLE: varName },
      spriteName: null,
      value,
      width: 0,
      height: 0,
      x: 10,
      y: 10 + index * 26,
      visible: true,
      sliderMin: 0,
      sliderMax: 100,
      isDiscrete: true,
    }));

    return {
      targets,
      monitors,
      extensions: [],
      meta: {
        semver: '3.0.0',
        vm: '0.2.0-prerelease',
        agent: 'AI-Scratch-Game-Builder-v1.0',
      },
    };
  }
}
