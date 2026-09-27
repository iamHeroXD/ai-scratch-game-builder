import { describe, it, expect } from 'vitest';
import { buildPlatformerProject } from '@/engine/mechanics/platformer';
import { Sb3Serializer } from '@/engine/serializer';
import { Sb3Importer } from '@/engine/importer';

describe('Sb3Importer & Project Analyzer', () => {
  it('imports an exported .sb3 project without loss and generates full metrics', async () => {
    // 1. Generate platformer
    const originalProject = buildPlatformerProject({ title: 'Import Test Project' });
    const sb3Data = await Sb3Serializer.exportToUint8Array(originalProject);

    // 2. Import project back
    const { project, analysis } = await Sb3Importer.importProject(sb3Data);

    // 3. Verify reconstructed AST
    expect(project.name).toBe('Imported Project');
    expect(project.sprites.length).toBe(originalProject.sprites.length);
    expect(project.getSprite('Player')).toBeDefined();
    expect(project.getSprite('Platform')).toBeDefined();
    expect(project.getSprite('Hazard')).toBeDefined();

    // 4. Verify analysis metrics
    expect(analysis.spriteCount).toBeGreaterThanOrEqual(5);
    expect(analysis.costumeCount).toBeGreaterThanOrEqual(5);
    expect(analysis.scriptCount).toBeGreaterThan(0);
    expect(analysis.globalVariables).toContain('Health');
    expect(analysis.globalVariables).toContain('Score');
    expect(analysis.broadcasts).toContain('START_GAME');
    expect(analysis.broadcasts).toContain('GAME_OVER');
  });

  it('throws a helpful error on malformed non-zip data', async () => {
    const invalidData = new TextEncoder().encode('not a valid zip file');
    await expect(Sb3Importer.importProject(invalidData)).rejects.toThrow();
  });
});
