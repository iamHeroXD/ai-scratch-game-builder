import { NextRequest, NextResponse } from 'next/server';
import { Sb3Importer } from '@/engine/importer';
import { Sb3Serializer } from '@/engine/serializer';
import { PreviewRunner } from '@/engine/preview-runner';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  try {
    const { currentProjectJson, title } = await req.json();
    if (!currentProjectJson) {
      return NextResponse.json({ error: 'Missing currentProjectJson.' }, { status: 400 });
    }

    const tempZip = new JSZip();
    tempZip.file('project.json', JSON.stringify(currentProjectJson));
    const zipData = await tempZip.generateAsync({ type: 'uint8array' });
    const { project } = await Sb3Importer.importProject(zipData);

    const sb3Bytes = await Sb3Serializer.exportToUint8Array(project);
    const html = await PreviewRunner.generatePlayerHtml(sb3Bytes, title || project.name);

    return NextResponse.json({
      success: true,
      html,
    });
  } catch (err: any) {
    console.error('Preview packaging error:', err);
    return NextResponse.json(
      { error: 'Failed to generate preview: ' + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
