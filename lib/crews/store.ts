export type CrewRecord = {
  id: string;
  name: string;
  description: string;
  agents: string[];
  workflowType: 'sequential' | 'parallel' | 'conditional';
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  createdAt: string;
  updatedAt: string;
};

let crews: CrewRecord[] = [];

export const crewStore = {
  list: () => crews,
  getById: (id: string) => crews.find((crew) => crew.id === id),
  create: (crew: CrewRecord) => {
    crews = [...crews, crew];
    return crew;
  },
  update: (id: string, updates: Partial<CrewRecord>) => {
    const existing = crews.find((crew) => crew.id === id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as CrewRecord;
    crews = crews.map((crew) => (crew.id === id ? updated : crew));
    return updated;
  },
  remove: (id: string) => {
    crews = crews.filter((crew) => crew.id !== id);
  },
};