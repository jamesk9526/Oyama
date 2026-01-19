import { NextRequest, NextResponse } from 'next/server';
import { templateQueries } from '@/lib/db/queries';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const template = templateQueries.getById(id);
  
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const cloned = {
    ...template,
    id: uuidv4(),
    name: `${template.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = templateQueries.create(cloned);
  return NextResponse.json(created, { status: 201 });
}
