
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;
  const directory = data.get('directory') as string | 'uploads';

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file found.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Define the base upload path inside the public directory
  const uploadDir = path.join(process.cwd(), 'public', directory || 'uploads');
  
  try {
    // Ensure the upload directory exists
    await mkdir(uploadDir, { recursive: true });
  } catch (error: any) {
    // Ignore error if directory already exists
    if (error.code !== 'EEXIST') {
      console.error('Failed to create directory:', error);
      return NextResponse.json({ success: false, error: 'Failed to create upload directory.', message: error.message }, { status: 500 });
    }
  }

  // Sanitize the original filename and make it unique
  const originalFilename = file.name.split('.').slice(0, -1).join('.');
  const sanitizedFilename = originalFilename.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const fileExtension = file.name.split('.').pop();
  const filename = `${sanitizedFilename}-${Date.now()}.${fileExtension}`;
  
  // Full path to the file
  const fullPath = path.join(uploadDir, filename);
  
  // Public URL path
  const publicPath = `/${directory || 'uploads'}/${filename}`;

  try {
    // Write the file to the local filesystem
    await writeFile(fullPath, buffer);
    
    // Return the public URL
    return NextResponse.json({ success: true, filePath: publicPath });

  } catch (error: any) {
    console.error('Failed to upload file:', error);
    return NextResponse.json({ success: false, error: 'Failed to save file.', message: error.message }, { status: 500 });
  }
}
