// Workflow execution types and interfaces

export type WorkflowType = 'sequential' | 'parallel' | 'conditional';

export interface WorkflowStep {
  agentId: string;
  agentName?: string;
  input?: string;
  condition?: {
    type: 'success' | 'failure' | 'always';
    previousStepIndex?: number;
  };
}

export interface WorkflowDefinition {
  type: WorkflowType;
  steps: WorkflowStep[];
}

export interface WorkflowStepResult {
  stepIndex: number;
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  success: boolean;
  error?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface WorkflowExecutionResult {
  crewId: string;
  crewName: string;
  workflowType: WorkflowType;
  steps: WorkflowStepResult[];
  success: boolean;
  totalDuration: number;
  startTime: Date;
  endTime: Date;
  error?: string;
}

export type WorkflowStepCallback = (result: WorkflowStepResult) => void;

export interface WorkflowContext {
  variables: Record<string, any>;
  previousResults: WorkflowStepResult[];
}

export interface ExecutorOptions {
  ollamaUrl: string;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  timeout?: number; // milliseconds
}
