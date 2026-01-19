import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { crewQueries } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const crew = crewQueries.getById(id);
  
  if (!crew) {
    return NextResponse.json({ error: 'Crew not found' }, { status: 404 });
  }

  const cloned = {
    ...crew,
    id: uuidv4(),
    name: `${crew.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = crewQueries.create(cloned);
  return NextResponse.json(created, { status: 201 });
}
