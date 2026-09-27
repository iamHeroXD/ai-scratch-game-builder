import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/ai/gemini';
import { GameCompiler } from '@/ai/compiler';
import { ProjectValidator } from '@/validator/validator';
import { ProjectRepairer } from '@/validator/repair';
import { Sb3Serializer } from '@/engine/serializer';
import { Sb3Importer } from '@/engine/importer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const mode = body.mode || 'standard';
    const apiKey = body.apiKey || req.headers.get('x-gemini-key') || undefined;
    const model = body.model || undefined;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'A game description prompt is required.' }, { status: 400 });
    }

    const stages: Array<{ stage: string; timestamp: string; details?: string }> = [];

    // Stage 1: Intent Analysis
    stages.push({ stage: 'Understanding request', timestamp: new Date().toISOString() });
    const intent = await GeminiService.analyzeIntent(prompt, apiKey, model);

    // Stage 2: Game Design
    stages.push({
      stage: 'Designing game architecture',
      timestamp: new Date().toISOString(),
      details: `Genre: ${intent.genre}, Entities: ${intent.entities.length}, Levels: ${intent.levels}`,
    });
    const spec = await GeminiService.designGame(intent, apiKey, model);

    // Stage 3: Project Compilation
    stages.push({ stage: 'Compiling Scratch AST & scripts', timestamp: new Date().toISOString() });
    const project = GameCompiler.compile(spec);

    // Stage 4: Validation
    stages.push({ stage: 'Validating project integrity', timestamp: new Date().toISOString() });
    let valResult = ProjectValidator.validate(project);

    // Stage 5: Self-healing repair if any errors detected
    let repairsApplied: string[] = [];
    if (!valResult.valid) {
      stages.push({ stage: 'Repairing detected issues', timestamp: new Date().toISOString() });
      const repairResult = ProjectRepairer.autoRepair(project);
      repairsApplied = repairResult.repairsApplied;
      valResult = ProjectValidator.validate(project);
    }

    // Stage 6: Packaging
    stages.push({ stage: 'Packaging project', timestamp: new Date().toISOString() });
    const { projectJson } = Sb3Serializer.getProjectJson(project);
    const safeFilename = Sb3Serializer.getSafeFilename(project.name);
    const analysis = Sb3Importer.analyze(project, projectJson);

    stages.push({ stage: 'Ready', timestamp: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      title: project.name,
      genre: spec.genre,
      projectJson,
      safeFilename,
      stages,
      repairsApplied,
      validation: valResult,
      analysis,
      spec,
    });
  } catch (err: any) {
    console.error('Error generating game:', err);
    return NextResponse.json(
      {
        error: 'Failed to generate game: ' + (err.message || String(err)),
        details: err.stack,
      },
      { status: 500 }
    );
  }
}
