import { NextRequest, NextResponse } from 'next/server';
import { memoryQueries } from '@/lib/db/queries';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    memoryQueries.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    );
  }
}
