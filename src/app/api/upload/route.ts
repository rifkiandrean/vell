
import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

// Initialize Google Cloud Storage
const storage = new Storage();

const bucketName = process.env.GCS_BUCKET_NAME;

if (!bucketName) {
  throw new Error("GCS_BUCKET_NAME environment variable is not set.");
}

const bucket = storage.bucket(bucketName);

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;
  const directory = data.get('directory') as string | undefined;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file found.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitize the original filename and make it unique
  const originalFilename = file.name.split('.').slice(0, -1).join('.');
  const sanitizedFilename = originalFilename.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const fileExtension = file.name.split('.').pop();
  let filename = `${sanitizedFilename}-${Date.now()}.${fileExtension}`;
  
  if (directory) {
      filename = `${directory.replace(/\/$/, '')}/${filename}`;
  }

  const gcsFile = bucket.file(filename);

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  try {
    await new Promise((resolve, reject) => {
      const writeStream = gcsFile.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.type,
        },
      });

      writeStream.on('error', (err) => {
        console.error('Failed to write to GCS:', err);
        reject(err);
      });

      writeStream.on('finish', () => {
        resolve(true);
      });
      
      stream.pipe(writeStream);
    });

    // Make the file public
    await gcsFile.makePublic();

    // Return the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
    return NextResponse.json({ success: true, filePath: publicUrl });

  } catch (error: any) {
    console.error('Failed to upload file:', error);
    return NextResponse.json({ success: false, error: 'Failed to save file.', message: error.message }, { status: 500 });
  }
}
