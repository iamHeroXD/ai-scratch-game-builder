import { describe, it, expect } from 'vitest';
import { buildPlatformerProject } from '@/engine/mechanics/platformer';
import { buildShooterProject } from '@/engine/mechanics/shooter';
import { buildClickerProject } from '@/engine/mechanics/clicker';
import { buildTopdownProject } from '@/engine/mechanics/topdown';
import { ProjectValidator } from '@/validator/validator';

describe('Game Mechanics Generators', () => {
  it('builds a valid platformer with double jump and passes validation', () => {
    const platformer = buildPlatformerProject({ title: 'Sky Runner', doubleJump: true });
    expect(platformer.getSprite('Player')).toBeDefined();
    expect(platformer.getSprite('Platform')).toBeDefined();
    expect(platformer.getSprite('Coin')).toBeDefined();
    expect(platformer.getSprite('Enemy')).toBeDefined();

    const result = ProjectValidator.validate(platformer);
    expect(result.valid).toBe(true);
    expect(result.metrics.spriteCount).toBeGreaterThanOrEqual(5);
  });

  it('builds a valid space shooter with boss phase and passes validation', () => {
    const shooter = buildShooterProject({ title: 'Space Ace' });
    expect(shooter.getSprite('Player')).toBeDefined();
    expect(shooter.getSprite('Projectile')).toBeDefined();
    expect(shooter.getSprite('Enemy')).toBeDefined();
    expect(shooter.getSprite('Boss')).toBeDefined();

    const result = ProjectValidator.validate(shooter);
    expect(result.valid).toBe(true);
  });

  it('builds a valid clicker game with CPS and upgrades and passes validation', () => {
    const clicker = buildClickerProject({ title: 'Cookie Tycoon' });
    expect(clicker.getSprite('Big_Coin')).toBeDefined();
    expect(clicker.getSprite('Upgrade_AutoMiner')).toBeDefined();
    expect(clicker.getSprite('Upgrade_Power')).toBeDefined();

    const result = ProjectValidator.validate(clicker);
    expect(result.valid).toBe(true);
  });

  it('builds a valid top-down adventure and passes validation', () => {
    const topdown = buildTopdownProject({ title: 'Maze Dungeon' });
    expect(topdown.getSprite('Player')).toBeDefined();
    expect(topdown.getSprite('Wall')).toBeDefined();
    expect(topdown.getSprite('Key')).toBeDefined();
    expect(topdown.getSprite('Exit_Door')).toBeDefined();

    const result = ProjectValidator.validate(topdown);
    expect(result.valid).toBe(true);
  });
});
