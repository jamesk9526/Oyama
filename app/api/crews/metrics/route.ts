import { NextRequest, NextResponse } from 'next/server';
import { crewQueries, crewRunQueries } from '@/lib/db/queries';

export async function GET() {
  const crews = crewQueries.getAll();
  const runs = crewRunQueries.listRuns(200);
  
  const metrics = crews.map((crew) => {
    const crewRuns = runs.filter((run) => run.crewId === crew.id);
    const completedRuns = crewRuns.filter((run) => run.status === 'completed');
    const failedRuns = crewRuns.filter((run) => run.status === 'failed');
    
    const avgDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum, run) => {
          if (!run.startedAt || !run.completedAt) return sum;
          const duration = new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime();
          return sum + duration;
        }, 0) / completedRuns.length
      : 0;

    return {
      id: crew.id,
      name: crew.name,
      totalRuns: crewRuns.length,
      successfulRuns: completedRuns.length,
      failedRuns: failedRuns.length,
      successRate: crewRuns.length > 0 ? (completedRuns.length / crewRuns.length) * 100 : 0,
      avgDuration: Math.round(avgDuration),
      lastRun: crewRuns[0]?.startedAt || null,
    };
  });

  const summary = {
    totalCrews: crews.length,
    totalRuns: runs.length,
    activeCrews: metrics.filter((m) => m.totalRuns > 0).length,
    avgSuccessRate: metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
      : 0,
  };

  return NextResponse.json({ metrics, summary });
}
