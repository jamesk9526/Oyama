import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { attachmentQueries } from '@/lib/db/queries';

const getAbsolutePath = (relativePath: string) => {
  return path.join(process.cwd(), '.data', relativePath);
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const attachments = attachmentQueries.getByIds([id]);
    const attachment = attachments[0];

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const absolutePath = getAbsolutePath(attachment.path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    attachmentQueries.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}