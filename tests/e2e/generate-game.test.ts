import { describe, it, expect } from 'vitest';
import { GeminiService } from '@/ai/gemini';
import { GameCompiler } from '@/ai/compiler';
import { ProjectValidator } from '@/validator/validator';
import { ProjectRepairer } from '@/validator/repair';
import { Sb3Serializer } from '@/engine/serializer';
import JSZip from 'jszip';

describe('End-to-End Game Generation Pipeline', () => {
  it('e2e 1: prompt -> platformer with coins, double jump, levels -> valid .sb3', async () => {
    const prompt = 'Create a polished platformer with a player, double jump, coins, enemies, checkpoints, three levels, health, score, a game-over screen and a final boss.';

    // 1. Stage A: Intent
    const intent = await GeminiService.analyzeIntent(prompt);
    expect(intent.genre).toBe('platformer');
    expect(intent.title).toBeDefined();

    // 2. Stage B: GameSpec
    const spec = await GeminiService.designGame(intent);
    expect(spec.variables.length).toBeGreaterThan(0);
    expect(spec.broadcasts).toContain('START_GAME');

    // 3. Stage C: Compiler
    const project = GameCompiler.compile(spec);
    expect(project.getSprite('Player')).toBeDefined();

    // 4. Stage D: Validator
    let validation = ProjectValidator.validate(project);
    if (!validation.valid) {
      const repair = ProjectRepairer.autoRepair(project);
      expect(repair.success).toBe(true);
      validation = ProjectValidator.validate(project);
    }
    expect(validation.valid).toBe(true);

    // 5. Stage E: Serializer to .sb3
    const sb3Data = await Sb3Serializer.exportToUint8Array(project);
    expect(sb3Data.length).toBeGreaterThan(1000);

    const zip = await JSZip.loadAsync(sb3Data);
    expect(zip.file('project.json')).toBeDefined();
  });

  it('e2e 2: prompt -> space shooter with bullets, waves, boss -> valid .sb3', async () => {
    const prompt = 'Create a top-down space shooter with player movement, enemies, bullets, score, health, waves and a boss.';

    const intent = await GeminiService.analyzeIntent(prompt);
    expect(intent.genre).toBe('shooter');

    const spec = await GeminiService.designGame(intent);
    const project = GameCompiler.compile(spec);

    const validation = ProjectValidator.validate(project);
    expect(validation.valid).toBe(true);

    const sb3Data = await Sb3Serializer.exportToUint8Array(project);
    const zip = await JSZip.loadAsync(sb3Data);
    expect(zip.file('project.json')).toBeDefined();
  });
});
