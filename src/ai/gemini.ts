/**
 * Google Gemini AI Integration Layer
 * Uses official @google/genai SDK with structured JSON outputs and fallback resilience
 */
import { INTENT_SYSTEM_PROMPT, GameIntentOutput } from './prompts/intent';
import { DESIGNER_SYSTEM_PROMPT } from './prompts/designer';
import { PATCHER_SYSTEM_PROMPT } from './prompts/patcher';
import { GameSpec, ProjectPatch } from '../engine/types';

export class GeminiService {
  private static defaultModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  private static getApiKey(overrideKey?: string): string | undefined {
    return overrideKey || process.env.GEMINI_API_KEY;
  }

  /**
   * Stage A: Intent Analyzer
   */
  public static async analyzeIntent(
    userPrompt: string,
    apiKeyOverride?: string,
    modelOverride?: string
  ): Promise<GameIntentOutput> {
    const apiKey = this.getApiKey(apiKeyOverride);
    const model = modelOverride || this.defaultModel;

    if (!apiKey) {
      return this.heuristicIntentAnalysis(userPrompt);
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `${INTENT_SYSTEM_PROMPT}\n\nUSER REQUEST:\n${userPrompt}\n\nReturn strict JSON matching the schema.`;
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      return JSON.parse(text) as GameIntentOutput;
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to heuristic analysis:', err.message);
      return this.heuristicIntentAnalysis(userPrompt);
    }
  }

  /**
   * Stage B: Game Designer
   */
  public static async designGame(
    intent: GameIntentOutput,
    apiKeyOverride?: string,
    modelOverride?: string
  ): Promise<GameSpec> {
    const apiKey = this.getApiKey(apiKeyOverride);
    const model = modelOverride || this.defaultModel;

    if (!apiKey) {
      return this.heuristicGameDesign(intent);
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `${DESIGNER_SYSTEM_PROMPT}\n\nANALYZED INTENT:\n${JSON.stringify(intent, null, 2)}\n\nReturn strict GameSpec JSON.`;
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      return JSON.parse(text) as GameSpec;
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to heuristic game design:', err.message);
      return this.heuristicGameDesign(intent);
    }
  }

  /**
   * Stage C: Project Patcher / Modifier
   */
  public static async generatePatch(
    projectSummary: string,
    userInstruction: string,
    apiKeyOverride?: string,
    modelOverride?: string
  ): Promise<ProjectPatch> {
    const apiKey = this.getApiKey(apiKeyOverride);
    const model = modelOverride || this.defaultModel;

    if (!apiKey) {
      return this.heuristicPatch(userInstruction);
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `${PATCHER_SYSTEM_PROMPT}\n\nPROJECT SUMMARY:\n${projectSummary}\n\nUSER INSTRUCTION:\n${userInstruction}\n\nReturn strict ProjectPatch JSON.`;
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      return JSON.parse(text) as ProjectPatch;
    } catch (err: any) {
      console.warn('Gemini patch generation failed, using heuristic patch:', err.message);
      return this.heuristicPatch(userInstruction);
    }
  }

  // ==========================================
  // Deterministic Heuristic Fallbacks (Offline & Resilient)
  // ==========================================
  private static heuristicIntentAnalysis(prompt: string): GameIntentOutput {
    const lower = prompt.toLowerCase();
    let genre: GameIntentOutput['genre'] = 'platformer';

    if (lower.includes('shoot') || lower.includes('space') || lower.includes('bullet') || lower.includes('galaxy')) {
      genre = 'shooter';
    } else if (lower.includes('click') || lower.includes('tycoon') || lower.includes('idle')) {
      genre = 'clicker';
    } else if (lower.includes('top down') || lower.includes('top-down') || lower.includes('rpg') || lower.includes('dungeon')) {
      genre = 'topdown';
    }

    const titleMatch = prompt.match(/(?:called|named|title[:\s]+)(["']?[a-zA-Z0-9\s]+["']?)/i);
    const title = titleMatch ? titleMatch[1].replace(/["']/g, '').trim() : `${genre.charAt(0).toUpperCase() + genre.slice(1)} Adventure`;

    return {
      title,
      genre,
      camera: 'static',
      difficulty: 'normal',
      requested_features: ['player movement', 'scoring', 'sound effects', 'game over screen', 'win condition'],
      entities: [
        { name: 'Player', role: 'player', description: 'Main controllable protagonist' },
        { name: 'Enemy', role: 'enemy', description: 'Adversary entity' },
        { name: 'Coin', role: 'collectible', description: 'Collectible bonus item' },
      ],
      mechanics: ['controls', 'collision', 'scoring', 'state_machine'],
      levels: 3,
      ui_requirements: ['Score', 'Health', 'Victory Banner', 'Game Over Banner'],
      audio_requirements: ['jump', 'coin', 'hit', 'win', 'game_over'],
    };
  }

  private static heuristicGameDesign(intent: GameIntentOutput): GameSpec {
    return {
      title: intent.title,
      description: `A fast-paced ${intent.genre} game featuring responsive controls, scoring, and multiple levels.`,
      genre: intent.genre,
      difficulty: intent.difficulty,
      instructions: 'Use Arrow keys or WASD to move. Avoid hazards and reach the goal!',
      variables: [
        { name: 'Health', initialValue: 3, showMonitor: true },
        { name: 'Score', initialValue: 0, showMonitor: true },
        { name: 'Level', initialValue: 1, showMonitor: true },
        { name: 'Game State', initialValue: 'PLAYING', showMonitor: false },
      ],
      broadcasts: ['START_GAME', 'GAME_OVER', 'VICTORY', 'NEXT_LEVEL'],
      states: ['MENU', 'PLAYING', 'GAME_OVER', 'VICTORY'],
      entities: intent.entities.map((e) => ({
        name: e.name,
        role: e.role,
        costumeType: e.name.toLowerCase(),
        initialX: e.role === 'player' ? -180 : 60,
        initialY: e.role === 'player' ? -60 : -90,
      })),
      mechanics: [
        { type: 'player_controller', config: {} },
        { type: 'score_system', config: {} },
        { type: 'health_system', config: {} },
      ],
      levels: [
        { levelNumber: 1, name: 'Level 1: Genesis', backdropName: 'Sky', backgroundColor: '#38BDF8' },
        { levelNumber: 2, name: 'Level 2: The Depths', backdropName: 'Dungeon', backgroundColor: '#F97316' },
        { levelNumber: 3, name: 'Level 3: The Cosmos', backdropName: 'Space', backgroundColor: '#8B5CF6' },
      ],
    };
  }

  private static heuristicPatch(instruction: string): ProjectPatch {
    const lower = instruction.toLowerCase();
    const ops: ProjectPatch['operations'] = [];

    if (lower.includes('jump') && (lower.includes('higher') || lower.includes('boost'))) {
      ops.push({
        op: 'modify_mechanic',
        target: 'Player',
        payload: { change: 'jump_higher' },
        description: 'Increased player jump force',
      });
    }

    if (lower.includes('faster') || lower.includes('speed')) {
      ops.push({
        op: 'modify_mechanic',
        target: 'Player',
        payload: { change: 'faster' },
        description: 'Increased player speed',
      });
    }

    if (lower.includes('enemy') || lower.includes('enemies')) {
      ops.push({
        op: 'add_sprite',
        payload: { name: 'Extra_Enemy', type: 'enemy', x: 100, y: -90 },
        description: 'Added an extra enemy entity',
      });
    }

    if (lower.includes('coin')) {
      ops.push({
        op: 'add_sprite',
        payload: { name: 'Bonus_Coin', type: 'coin', x: 0, y: -20 },
        description: 'Added a bonus collectible coin',
      });
    }

    if (lower.includes('score') || lower.includes('multiplier')) {
      ops.push({
        op: 'add_variable',
        payload: { name: 'Multiplier', value: 2 },
        description: 'Added Multiplier variable',
      });
    }

    if (ops.length === 0) {
      ops.push({
        op: 'add_variable',
        payload: { name: 'Bonus', value: 100 },
        description: `Applied modification: ${instruction}`,
      });
    }

    return {
      id: 'patch_' + Math.random().toString(36).substring(2, 9),
      version: 2,
      timestamp: new Date().toISOString(),
      instruction,
      operations: ops,
    };
  }
}
