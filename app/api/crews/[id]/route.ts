import { NextRequest, NextResponse } from 'next/server';
import { crewQueries } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const crew = crewQueries.getById(id);
  if (!crew) {
    return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
  }

  return NextResponse.json(crew);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();
  const updated = crewQueries.update(id, body);
  if (!updated) {
    return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const crew = crewQueries.getById(id);
  if (!crew) {
    return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
  }

  crewQueries.delete(id);
  return NextResponse.json({ success: true });
}
