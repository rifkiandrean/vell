
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file found.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitize the original filename and make it unique
  const originalFilename = file.name.split('.').slice(0, -1).join('.');
  const sanitizedFilename = originalFilename.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const fileExtension = file.name.split('.').pop();
  const filename = `${sanitizedFilename}-${Date.now()}.${fileExtension}`;

  const path = join(process.cwd(), 'public/uploads', filename);
  
  try {
    await writeFile(path, buffer);
    console.log(`File saved to ${path}`);
    
    // Return the public path
    const publicPath = `/uploads/${filename}`;
    return NextResponse.json({ success: true, filePath: publicPath });

  } catch (error) {
    console.error('Failed to write file:', error);
    return NextResponse.json({ success: false, error: 'Failed to save file.' }, { status: 500 });
  }
}
