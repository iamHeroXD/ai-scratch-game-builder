import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/ai/gemini';
import { PatchEngine } from '@/patcher/patch-engine';
import { ProjectValidator } from '@/validator/validator';
import { ProjectRepairer } from '@/validator/repair';
import { Sb3Serializer } from '@/engine/serializer';
import { Sb3Importer } from '@/engine/importer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { currentProjectJson, instruction, apiKey, model } = body;

    if (!currentProjectJson || !instruction) {
      return NextResponse.json(
        { error: 'Both currentProjectJson and an instruction are required.' },
        { status: 400 }
      );
    }

    // 1. Pack current json into binary and re-import into AST
    const tempZip = new (await import('jszip')).default();
    tempZip.file('project.json', JSON.stringify(currentProjectJson));
    const zipData = await tempZip.generateAsync({ type: 'uint8array' });
    const { project } = await Sb3Importer.importProject(zipData);

    // 2. Generate summary of existing project for AI
    const analysis = Sb3Importer.analyze(project, currentProjectJson);
    const summary = `Project "${project.name}" has ${analysis.spriteCount} sprites: [${analysis.sprites.map((s) => s.name).join(', ')}]. Variables: [${analysis.globalVariables.join(', ')}]. Broadcasts: [${analysis.broadcasts.join(', ')}].`;

    // 3. AI determines surgical patch
    const patch = await GeminiService.generatePatch(summary, instruction, apiKey, model);

    // 4. Apply patch
    const patchResult = PatchEngine.applyPatch(project, patch);

    // 5. Validate & repair
    let valResult = ProjectValidator.validate(project);
    let repairsApplied: string[] = [];
    if (!valResult.valid) {
      const repairResult = ProjectRepairer.autoRepair(project);
      repairsApplied = repairResult.repairsApplied;
      valResult = ProjectValidator.validate(project);
    }

    const { projectJson } = Sb3Serializer.getProjectJson(project);
    const updatedAnalysis = Sb3Importer.analyze(project, projectJson);

    return NextResponse.json({
      success: true,
      patch,
      patchResult,
      repairsApplied,
      validation: valResult,
      analysis: updatedAnalysis,
      updatedProjectJson: projectJson,
    });
  } catch (err: any) {
    console.error('Error modifying project:', err);
    return NextResponse.json(
      { error: 'Failed to modify project: ' + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
