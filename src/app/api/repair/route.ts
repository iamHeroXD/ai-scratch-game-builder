import { NextRequest, NextResponse } from 'next/server';
import { Sb3Importer } from '@/engine/importer';
import { ProjectValidator } from '@/validator/validator';
import { ProjectRepairer } from '@/validator/repair';
import { Sb3Serializer } from '@/engine/serializer';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  try {
    const { currentProjectJson } = await req.json();
    if (!currentProjectJson) {
      return NextResponse.json({ error: 'Missing currentProjectJson.' }, { status: 400 });
    }

    const tempZip = new JSZip();
    tempZip.file('project.json', JSON.stringify(currentProjectJson));
    const zipData = await tempZip.generateAsync({ type: 'uint8array' });
    const { project } = await Sb3Importer.importProject(zipData);

    const repairResult = ProjectRepairer.autoRepair(project);
    const finalVal = ProjectValidator.validate(project);
    const { projectJson } = Sb3Serializer.getProjectJson(project);
    const analysis = Sb3Importer.analyze(project, projectJson);

    return NextResponse.json({
      success: repairResult.success,
      attempts: repairResult.attempts,
      repairsApplied: repairResult.repairsApplied,
      validation: finalVal,
      analysis,
      repairedProjectJson: projectJson,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to repair project: ' + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
