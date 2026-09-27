import { describe, it, expect } from 'vitest';
import { buildPlatformerProject } from '@/engine/mechanics/platformer';
import { Sb3Serializer } from '@/engine/serializer';

describe('@turbowarp/packager Integration', () => {
  it('loads project with packager and initializes configuration', async () => {
    const project = buildPlatformerProject({ title: 'Packager Test' });
    const sb3Data = await Sb3Serializer.exportToUint8Array(project);

    const Packager = await import('@turbowarp/packager');
    const loaded = await (Packager as any).loadProject(sb3Data.buffer);
    expect(loaded).toBeDefined();

    const packager = new (Packager as any).Packager();
    packager.project = loaded;
    expect(packager.project).toBe(loaded);
  });
});
