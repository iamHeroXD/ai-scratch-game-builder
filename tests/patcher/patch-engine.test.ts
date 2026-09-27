import { describe, it, expect } from 'vitest';
import { buildPlatformerProject } from '@/engine/mechanics/platformer';
import { PatchEngine } from '@/patcher/patch-engine';
import { ProjectPatch } from '@/engine/types';

describe('PatchEngine', () => {
  it('adds an extra enemy sprite to an existing project', () => {
    const project = buildPlatformerProject({ title: 'Tweak Test' });
    const initialSpriteCount = project.sprites.length;

    const patch: ProjectPatch = {
      id: 'p1',
      version: 2,
      timestamp: new Date().toISOString(),
      instruction: 'Add another enemy',
      operations: [
        {
          op: 'add_sprite',
          payload: { name: 'Patrol_Slime_2', type: 'enemy', x: 120, y: -90 },
          description: 'Added Patrol_Slime_2',
        },
      ],
    };

    const res = PatchEngine.applyPatch(project, patch);
    expect(res.success).toBe(true);
    expect(project.sprites.length).toBe(initialSpriteCount + 1);
    expect(project.getSprite('Patrol_Slime_2')).toBeDefined();
  });

  it('adds and renames variables correctly', () => {
    const project = buildPlatformerProject({ title: 'Var Test' });

    const patch: ProjectPatch = {
      id: 'p2',
      version: 2,
      timestamp: new Date().toISOString(),
      instruction: 'Add multiplier and rename',
      operations: [
        {
          op: 'add_variable',
          payload: { name: 'BonusMult', value: 2 },
          description: 'Add BonusMult',
        },
        {
          op: 'rename_identifier',
          payload: { kind: 'variable', oldName: 'BonusMult', newName: 'ScoreMultiplier' },
          description: 'Rename BonusMult to ScoreMultiplier',
        },
      ],
    };

    const res = PatchEngine.applyPatch(project, patch);
    expect(res.success).toBe(true);
    expect(project.getGlobalVariableId('ScoreMultiplier')).toBeDefined();
  });
});
