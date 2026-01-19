import { NextResponse } from 'next/server';
import { DEFAULT_AGENTS, DEFAULT_CREWS } from '@/lib/db/default-data';

export async function DELETE() {
  const agentIds = DEFAULT_AGENTS.map((agent) => agent.id);
  const crewIds = DEFAULT_CREWS.map((crew) => crew.id);

  try {
    const { agentQueries, crewQueries } = require('@/lib/db/queries');
    let removedAgents = 0;
    let removedCrews = 0;

    agentIds.forEach((id: string) => {
      try {
        agentQueries.delete(id);
        removedAgents += 1;
      } catch {
        // ignore missing rows
      }
    });

    crewIds.forEach((id: string) => {
      try {
        crewQueries.delete(id);
        removedCrews += 1;
      } catch {
        // ignore missing rows
      }
    });

    try {
      const { getDatabase } = require('@/lib/db/client');
      const db = getDatabase();
      if (crewIds.length > 0) {
        const placeholders = crewIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM crew_agents WHERE crew_id IN (${placeholders})`).run(...crewIds);
      }
    } catch {
      // crew_agents table may not exist
    }

    return NextResponse.json({ removedAgents, removedCrews });
  } catch {
    const { agentStore } = require('@/lib/agents/store');
    const { crewStore } = require('@/lib/crews/store');

    agentIds.forEach((id: string) => agentStore.remove(id));
    crewIds.forEach((id: string) => crewStore.remove(id));

    return NextResponse.json({ removedAgents: agentIds.length, removedCrews: crewIds.length, mode: 'memory' });
  }
}