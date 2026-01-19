import { NextRequest, NextResponse } from 'next/server';
import { templateQueries } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const template = templateQueries.getById(id);
  
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const body = await request.json();
  const variables = body.variables || {};
  
  let interpolated = template.body;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    interpolated = interpolated.replace(regex, String(value));
  }

  return NextResponse.json({
    content: interpolated,
    systemAdditions: template.systemAdditions || '',
  });
}
