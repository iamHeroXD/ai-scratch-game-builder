import { NextRequest, NextResponse } from 'next/server';
import { Sb3Importer } from '@/engine/importer';
import { ProjectValidator } from '@/validator/validator';
import { DiagnosticFormatter } from '@/validator/diagnostics';
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

    const validation = ProjectValidator.validate(project);
    const summary = DiagnosticFormatter.formatSummary(validation.issues);

    const formattedIssues = validation.issues.map((i) => ({
      ...i,
      formatted: DiagnosticFormatter.formatIssue(i),
    }));

    return NextResponse.json({
      valid: validation.valid,
      issues: formattedIssues,
      metrics: validation.metrics,
      summaryText: summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to validate: ' + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
