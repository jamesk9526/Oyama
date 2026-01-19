import { NextResponse } from 'next/server';

// Mock templates storage
let templates: any[] = [];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const template = templates.find((t) => t.id === params.id);
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  return NextResponse.json(template);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const data = await request.json();
  const index = templates.findIndex((t) => t.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  templates[index] = { ...templates[index], ...data, updatedAt: new Date().toISOString() };
  return NextResponse.json(templates[index]);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  templates = templates.filter((t) => t.id !== params.id);
  return NextResponse.json({ success: true });
}
