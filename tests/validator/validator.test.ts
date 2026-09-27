import { describe, it, expect } from 'vitest';
import { GameProject } from '@/engine/project';
import { Blocks } from '@/engine/blocks';
import { ProjectValidator } from '@/validator/validator';

describe('ProjectValidator', () => {
  it('detects missing variable references', () => {
    const project = new GameProject('Broken Var Project');
    const player = project.addSprite('Player');

    // Reference a variable that does not exist in the project
    const script = Blocks.whenFlagClicked();
    script.chain(Blocks.setVariable('NonExistentVar', 'v_fake_123', 10));
    player.addScript(script);

    const result = ProjectValidator.validate(project);
    expect(result.valid).toBe(false);

    const varIssue = result.issues.find((i) => i.id === 'SEMANTIC_UNKNOWN_VARIABLE');
    expect(varIssue).toBeDefined();
    expect(varIssue?.message).toContain('NonExistentVar');
  });

  it('detects missing green flag starter script', () => {
    const project = new GameProject('No Starter Project');
    const player = project.addSprite('Player');

    // Only broadcast receiver, no green flag
    const script = Blocks.whenBroadcastReceived('TEST', 'bc_test');
    player.addScript(script);

    const result = ProjectValidator.validate(project);
    const starterIssue = result.issues.find((i) => i.id === 'GAMEPLAY_NO_START_SCRIPT');
    expect(starterIssue).toBeDefined();
  });
});
