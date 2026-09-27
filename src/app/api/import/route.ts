import { NextRequest, NextResponse } from 'next/server';
import { Sb3Importer } from '@/engine/importer';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const { project, rawSb3, analysis } = await Sb3Importer.importProject(arrayBuffer);

    return NextResponse.json({
      success: true,
      title: file.name.replace(/\.sb3$/i, ''),
      projectJson: rawSb3,
      analysis,
    });
  } catch (err: any) {
    console.error('Import error:', err);
    return NextResponse.json(
      { error: 'Failed to import .sb3 file: ' + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
