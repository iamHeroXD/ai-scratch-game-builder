import { describe, it, expect } from 'vitest';
import { GameProject } from '@/engine/project';
import { Sb3Serializer } from '@/engine/serializer';
import { Blocks } from '@/engine/blocks';
import JSZip from 'jszip';

describe('Sb3Serializer', () => {
  it('serializes a minimal project to project.json and .sb3 ZIP archive', async () => {
    const project = new GameProject('Test Mini Project');
    const player = project.addSprite('Player');

    const { costume, asset } = player.addCostume(
      'default',
      '<svg><rect width="10" height="10"/></svg>',
      5,
      5
    );
    project.registerAsset(asset);

    const hat = Blocks.whenFlagClicked();
    hat.chain(Blocks.moveSteps(10));
    player.addScript(hat);

    // 1. Check JSON format
    const { projectJson, jsonString } = Sb3Serializer.getProjectJson(project);
    expect(projectJson.targets.length).toBe(2);
    expect(projectJson.targets[0].isStage).toBe(true);
    expect(projectJson.targets[1].name).toBe('Player');
    expect(projectJson.meta.semver).toBe('3.0.0');

    // 2. Build ZIP
    const zipData = await Sb3Serializer.exportToUint8Array(project);
    expect(zipData.length).toBeGreaterThan(0);

    // 3. Inspect ZIP contents
    const unzipped = await JSZip.loadAsync(zipData);
    expect(unzipped.file('project.json')).toBeDefined();
    expect(unzipped.file(costume.md5ext)).toBeDefined();

    const storedSvg = await unzipped.file(costume.md5ext)?.async('text');
    expect(storedSvg).toBe('<svg><rect width="10" height="10"/></svg>');
  });

  it('generates clean filenames', () => {
    expect(Sb3Serializer.getSafeFilename('My Awesome Game! #1')).toBe('My_Awesome_Game_1.sb3');
  });
});
