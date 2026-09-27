/**
 * Scratch 3.0 & AI Scratch Game Builder Type Definitions
 */

// ==========================================
// 1. Scratch 3.0 Low-Level Format (project.json)
// ==========================================

export type ScratchPrimitiveType =
  | 4  // number
  | 5  // positive number
  | 6  // positive integer
  | 7  // integer
  | 8  // angle
  | 9  // color
  | 10 // string
  | 11 // broadcast
  | 12 // variable
  | 13; // list

export type ScratchShadowType =
  | 1 // unshadowed (direct primitive or shadow value)
  | 2 // block input (reporter or sub-block)
  | 3; // shadowed block input (sub-block with fallback default)

export type ScratchInput =
  | [ScratchShadowType, [ScratchPrimitiveType, string | number]]
  | [ScratchShadowType, [11, string, string]] // broadcast: [11, name, id]
  | [ScratchShadowType, [12, string, string]] // variable: [12, name, id]
  | [ScratchShadowType, [13, string, string]] // list: [13, name, id]
  | [ScratchShadowType, string] // block id reference (reporter/condition/substack)
  | [ScratchShadowType, string, [ScratchPrimitiveType, string | number]];

export type ScratchField = [string, string?] | string;

export interface Sb3BlockMutation {
  tagName: 'mutation';
  children: unknown[];
  proccode?: string;
  argumentids?: string;
  argumentnames?: string;
  argumentdefaults?: string;
  warp?: string | boolean;
  hasnext?: string | boolean;
}

export interface Sb3Block {
  opcode: string;
  next: string | null;
  parent: string | null;
  inputs: Record<string, ScratchInput>;
  fields: Record<string, ScratchField>;
  shadow: boolean;
  topLevel: boolean;
  x?: number;
  y?: number;
  mutation?: Sb3BlockMutation;
}

export interface Sb3Costume {
  assetId: string;       // 32-hex MD5 hash
  name: string;
  md5ext: string;        // <assetId>.<dataFormat>
  dataFormat: 'svg' | 'png' | 'jpg';
  rotationCenterX: number;
  rotationCenterY: number;
  bitmapResolution?: number;
}

export interface Sb3Sound {
  assetId: string;
  name: string;
  md5ext: string;
  dataFormat: 'wav' | 'mp3';
  format?: string;
  rate?: number;
  sampleCount?: number;
}

export type Sb3Variable = [string, string | number | boolean, boolean?]; // [name, value, isCloud?]
export type Sb3List = [string, (string | number)[]]; // [name, values]

export interface Sb3Target {
  isStage: boolean;
  name: string;
  variables: Record<string, Sb3Variable>;
  lists: Record<string, Sb3List>;
  broadcasts: Record<string, string>;
  blocks: Record<string, Sb3Block | [number, string | number]>;
  comments: Record<string, unknown>;
  currentCostume: number;
  costumes: Sb3Costume[];
  sounds: Sb3Sound[];
  volume: number;
  layerOrder: number;
  // Sprite-only properties:
  visible?: boolean;
  x?: number;
  y?: number;
  size?: number;
  direction?: number;
  draggable?: boolean;
  rotationStyle?: 'all around' | 'left-right' | "don't rotate";
  // Stage-only properties:
  tempo?: number;
  videoTransparency?: number;
  videoState?: string;
  textToSpeechLanguage?: string | null;
}

export interface Sb3Monitor {
  id: string;
  mode: 'default' | 'large' | 'slider' | 'list';
  opcode: string;
  params: Record<string, string>;
  spriteName: string | null;
  value: string | number | boolean | (string | number)[];
  width: number;
  height: number;
  x: number;
  y: number;
  visible: boolean;
  sliderMin?: number;
  sliderMax?: number;
  isDiscrete?: boolean;
}

export interface Sb3Meta {
  semver: string;
  vm: string;
  agent: string;
}

export interface Sb3Project {
  targets: Sb3Target[];
  monitors: Sb3Monitor[];
  extensions: string[];
  meta: Sb3Meta;
}

// ==========================================
// 2. High-Level Game Specification (GameSpec)
// ==========================================

export type GameGenre =
  | 'platformer'
  | 'shooter'
  | 'topdown'
  | 'clicker'
  | 'racing'
  | 'puzzle'
  | 'arcade';

export type GameDifficulty = 'easy' | 'normal' | 'hard';

export type GameState =
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'VICTORY'
  | 'LEVEL_COMPLETE';

export interface EntitySpec {
  name: string;
  role: 'player' | 'enemy' | 'boss' | 'collectible' | 'projectile' | 'platform' | 'hazard' | 'ui' | 'npc';
  costumeType: string; // e.g. "hero", "slime", "coin", "spike", "bullet", "boss"
  primaryColor?: string;
  secondaryColor?: string;
  initialX?: number;
  initialY?: number;
  size?: number;
  physics?: {
    gravity?: number;
    jumpForce?: number;
    speed?: number;
    canDoubleJump?: boolean;
    hasFriction?: boolean;
  };
  combat?: {
    maxHealth?: number;
    damage?: number;
    attackSpeed?: number;
    shootCooldown?: number;
  };
  behavior?: string; // e.g. "patrol", "chase_player", "scroll_down", "idle_bounce"
}

export interface MechanicSpec {
  type:
    | 'player_controller'
    | 'gravity_jump'
    | 'double_jump'
    | 'projectile_shooting'
    | 'enemy_spawning'
    | 'coin_collection'
    | 'hazard_collision'
    | 'health_system'
    | 'score_system'
    | 'level_transition'
    | 'boss_phases'
    | 'game_loop'
    | 'clicker_currency';
  config: Record<string, unknown>;
}

export interface LevelSpec {
  levelNumber: number;
  name: string;
  backdropName: string;
  backgroundColor: string;
  goalX?: number;
  goalY?: number;
  enemyCount?: number;
  coinCount?: number;
  hazards?: Array<{ x: number; y: number; width?: number }>;
}

export interface GameSpec {
  title: string;
  description: string;
  genre: GameGenre;
  difficulty: GameDifficulty;
  instructions: string;
  variables: Array<{
    name: string;
    initialValue: number | string;
    isCloud?: boolean;
    showMonitor?: boolean;
  }>;
  broadcasts: string[];
  states: GameState[];
  entities: EntitySpec[];
  mechanics: MechanicSpec[];
  levels: LevelSpec[];
}

// ==========================================
// 3. Asset Package
// ==========================================

export interface ProjectAsset {
  assetId: string;       // 32-character hex MD5
  name: string;
  fileName: string;      // <assetId>.<extension>
  extension: 'svg' | 'png' | 'wav' | 'mp3';
  content: string | Uint8Array; // string for SVG, Uint8Array for binary
}

// ==========================================
// 4. Validation & Diagnostics
// ==========================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: 'structural' | 'semantic' | 'gameplay';
  target?: string; // Sprite name or 'Stage'
  message: string;
  explanation: string;
  fixableAutomatically: boolean;
  suggestedFix?: string;
  context?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  metrics: {
    targetCount: number;
    spriteCount: number;
    blockCount: number;
    scriptCount: number;
    variableCount: number;
    listCount: number;
    broadcastCount: number;
    costumeCount: number;
    soundCount: number;
  };
}

// ==========================================
// 5. Patch System
// ==========================================

export type PatchOperationType =
  | 'add_sprite'
  | 'remove_sprite'
  | 'modify_variable'
  | 'add_variable'
  | 'modify_mechanic'
  | 'add_mechanic'
  | 'modify_costume'
  | 'rename_identifier';

export interface PatchOperation {
  op: PatchOperationType;
  target?: string; // Target sprite or property
  payload: Record<string, unknown>;
  description: string;
}

export interface ProjectPatch {
  id: string;
  version: number;
  timestamp: string;
  instruction: string;
  operations: PatchOperation[];
}
