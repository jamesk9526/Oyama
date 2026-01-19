import { NextRequest, NextResponse } from 'next/server';
import { crewRunQueries, crewRunStepQueries } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const run = crewRunQueries.getRun(id);
  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  const steps = crewRunStepQueries.listSteps(id);
  return NextResponse.json({ run, steps });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const run = crewRunQueries.getRun(id);
  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  crewRunQueries.deleteRun(id);
  return NextResponse.json({ success: true });
}
