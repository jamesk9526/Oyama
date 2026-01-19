import { NextRequest, NextResponse } from 'next/server';
import { agentQueries } from '@/lib/db/queries';

export async function GET() {
  const agents = agentQueries.getAll();
  
  // Calculate performance metrics
  const metrics = agents.map((agent) => {
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      totalUses: 0, // TODO: Track actual usage from chat/crew runs
      lastUsed: null,
      avgResponseTime: 0,
      successRate: 100,
    };
  });

  const summary = {
    totalAgents: agents.length,
    activeAgents: agents.length,
    mostUsed: metrics[0]?.name || 'N/A',
    roleDistribution: agents.reduce((acc, agent) => {
      acc[agent.role] = (acc[agent.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return NextResponse.json({ metrics, summary });
}
