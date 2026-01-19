import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { attachmentQueries, type Attachment } from '@/lib/db/queries';

const getUploadsDir = () => {
  const baseDir = path.join(process.cwd(), '.data');
  const uploadsDir = path.join(baseDir, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scopeType = searchParams.get('scopeType') as Attachment['scopeType'] | null;
    const scopeId = searchParams.get('scopeId');

    if (!scopeType || !scopeId) {
      return NextResponse.json(
        { error: 'scopeType and scopeId are required' },
        { status: 400 }
      );
    }

    const attachments = attachmentQueries.getByScope(scopeType, scopeId);
    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const scopeType = formData.get('scopeType') as Attachment['scopeType'] | null;
    const scopeId = formData.get('scopeId') as string | null;

    if (!file || !scopeType || !scopeId) {
      return NextResponse.json(
        { error: 'file, scopeType, and scopeId are required' },
        { status: 400 }
      );
    }

    const uploadsDir = getUploadsDir();
    const id = uuidv4();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativePath = path.join('uploads', `${id}_${safeName}`);
    const filePath = path.join(uploadsDir, `${id}_${safeName}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const attachment: Attachment = {
      id,
      scopeType,
      scopeId,
      name: file.name,
      path: relativePath,
      mime: file.type || 'application/octet-stream',
      size: buffer.length,
      createdAt: new Date().toISOString(),
    };

    const created = attachmentQueries.create(attachment);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}