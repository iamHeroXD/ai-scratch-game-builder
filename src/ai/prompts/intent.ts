/**
 * Stage A: Intent Analyzer Prompts & Schema
 */

export const INTENT_SYSTEM_PROMPT = `
You are the Lead Game Designer and Intent Analyzer for Scratch 3.0 games.
Your job is to analyze natural language game requests and extract the exact genre, core mechanics, entities, difficulty, and requirements.

Scratch 3.0 Characteristics:
- Target resolution: 480x360
- Coordinate space: (-240 to +240 X, -180 to +180 Y)
- Genres supported: platformer, shooter, topdown, clicker, racing, puzzle, arcade
- Controls: Arrow keys, WASD, Space, Mouse click

Analyze the user's prompt and extract structured intent. Be creative, practical, and true to the user's requested features.
`.trim();

export interface GameIntentOutput {
  title: string;
  genre: 'platformer' | 'shooter' | 'topdown' | 'clicker' | 'racing' | 'arcade';
  camera: 'static' | 'scrolling' | 'room_based';
  difficulty: 'easy' | 'normal' | 'hard';
  requested_features: string[];
  entities: Array<{
    name: string;
    role: 'player' | 'enemy' | 'boss' | 'collectible' | 'projectile' | 'platform' | 'hazard' | 'ui';
    description: string;
  }>;
  mechanics: string[];
  levels: number;
  ui_requirements: string[];
  audio_requirements: string[];
}
