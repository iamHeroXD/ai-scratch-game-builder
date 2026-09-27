import { NextRequest, NextResponse } from 'next/server';
import { Sb3Importer } from '@/engine/importer';
import { Sb3Serializer } from '@/engine/serializer';
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

    const projectTitle = title || project.name || 'Scratch_Game';
    project.name = projectTitle;

    const sb3Bytes = await Sb3Serializer.exportToUint8Array(project);
    const filename = Sb3Serializer.getSafeFilename(projectTitle);

    return new NextResponse(Buffer.from(sb3Bytes) as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/x.scratch.sb3',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': sb3Bytes.length.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to export .sb3: ' + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
