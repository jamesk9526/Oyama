import { NextRequest, NextResponse } from 'next/server';
import { crewRunQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : 50;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;

  return NextResponse.json(crewRunQueries.listRuns(safeLimit));
}
