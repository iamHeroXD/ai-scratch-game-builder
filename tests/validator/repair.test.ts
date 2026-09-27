import { describe, it, expect } from 'vitest';
import { GameProject } from '@/engine/project';
import { Blocks } from '@/engine/blocks';
import { ProjectValidator } from '@/validator/validator';
import { ProjectRepairer } from '@/validator/repair';

describe('ProjectRepairer', () => {
  it('automatically repairs missing variables and missing green flag starters', () => {
    const project = new GameProject('Repairable Project');
    const player = project.addSprite('Player');

    // Missing variable
    const script = Blocks.whenBroadcastReceived('TEST', 'bc_test');
    script.chain(Blocks.setVariable('Score', 'v_missing_score', 10));
    player.addScript(script);

    // Initial validation fails
    const initialVal = ProjectValidator.validate(project);
    expect(initialVal.valid).toBe(false);

    // Run repair
    const repairResult = ProjectRepairer.autoRepair(project);
    expect(repairResult.success).toBe(true);
    expect(repairResult.repairsApplied.length).toBeGreaterThanOrEqual(1);

    // Final validation passes
    const finalVal = ProjectValidator.validate(project);
    expect(finalVal.valid).toBe(true);
    expect(project.getGlobalVariableId('Score')).toBeDefined();
  });
});
