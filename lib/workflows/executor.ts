import type { Agent } from '@/types';
import type {
  WorkflowDefinition,
  WorkflowStepResult,
  WorkflowExecutionResult,
  WorkflowContext,
  ExecutorOptions,
  WorkflowStepCallback,
} from './types';

/**
 * WorkflowExecutor - Core engine for executing multi-agent workflows
 * 
 * Supports multiple workflow types:
 * - Sequential: Agents process in order, passing output to next
 * - Parallel: All agents process simultaneously with same input
 * - Conditional: Agents execute based on conditions
 * - Round-Robin: Sequential processing with multiple iterations
 * 
 * @example
 * ```typescript
 * const executor = new WorkflowExecutor(agents, {
 *   model: 'llama2',
 *   temperature: 0.7,
 *   timeout: 30000
 * });
 * 
 * const result = await executor.execute(
 *   'crew-123',
 *   'Research Team',
 *   { type: 'sequential', agents: ['agent-1', 'agent-2'] },
 *   'Analyze market trends'
 * );
 * ```
 */
export class WorkflowExecutor {
  private options: ExecutorOptions;
  private agents: Agent[];
  private context: WorkflowContext;

  /**
   * Creates a new WorkflowExecutor instance
   * 
   * @param agents - Array of agent objects to use in workflows
   * @param options - Execution configuration (model, temperature, timeout, etc.)
   */
  constructor(agents: Agent[], options: ExecutorOptions) {
    this.agents = agents;
    this.options = options;
    this.context = {
      variables: {},
      previousResults: [],
    };
  }

  /**
   * Execute a workflow with the given definition
   * 
   * @param crewId - Unique identifier for the crew
   * @param crewName - Human-readable name of the crew
   * @param workflow - Workflow definition including type and configuration
   * @param initialInput - Starting input/prompt for the workflow
   * @returns Promise resolving to execution result with steps and output
   * 
   * @throws {Error} If workflow execution fails or times out
   */
  async execute(
    crewId: string,
    crewName: string,
    workflow: WorkflowDefinition,
    initialInput: string
  ): Promise<WorkflowExecutionResult> {
    return this.executeWithCallbacks(crewId, crewName, workflow, initialInput);
  }

  /**
   * Execute a workflow with step callbacks for real-time updates
   * 
   * @param crewId - Unique identifier for the crew
   * @param crewName - Human-readable name of the crew
   * @param workflow - Workflow definition
   * @param initialInput - Starting input/prompt
   * @param onStep - Optional callback invoked after each step completes
   * @returns Promise resolving to execution result
   * 
   * @internal
   */
  async executeWithCallbacks(
    crewId: string,
    crewName: string,
    workflow: WorkflowDefinition,
    initialInput: string,
    onStep?: WorkflowStepCallback
  ): Promise<WorkflowExecutionResult> {
    const startTime = new Date();
    const results: WorkflowStepResult[] = [];

    try {
      switch (workflow.type) {
        case 'sequential':
          await this.executeSequential(workflow, initialInput, results, onStep);
          break;
        case 'parallel':
          await this.executeParallel(workflow, initialInput, results, onStep);
          break;
        case 'conditional':
          await this.executeConditional(workflow, initialInput, results, onStep);
          break;
        default:
          throw new Error(`Unknown workflow type: ${workflow.type}`);
      }

      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      return {
        crewId,
        crewName,
        workflowType: workflow.type,
        steps: results,
        success: results.every((r) => r.success),
        totalDuration,
        startTime,
        endTime,
      };
    } catch (error) {
      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      return {
        crewId,
        crewName,
        workflowType: workflow.type,
        steps: results,
        success: false,
        totalDuration,
        startTime,
        endTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute steps sequentially, passing output to next step
   */
  private async executeSequential(
    workflow: WorkflowDefinition,
    initialInput: string,
    results: WorkflowStepResult[],
    onStep?: WorkflowStepCallback
  ): Promise<void> {
    let currentInput = initialInput;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const input = step.input || currentInput;

      const result = await this.executeStep(i, step.agentId, input);
      results.push(result);
      onStep?.(result);

      if (!result.success) {
        throw new Error(`Step ${i + 1} failed: ${result.error}`);
      }

      // Pass output to next step
      currentInput = result.output;
      this.context.previousResults.push(result);
    }
  }

  /**
   * Execute all steps in parallel
   */
  private async executeParallel(
    workflow: WorkflowDefinition,
    initialInput: string,
    results: WorkflowStepResult[],
    onStep?: WorkflowStepCallback
  ): Promise<void> {
    const promises = workflow.steps.map((step, index) => {
      const input = step.input || initialInput;
      return this.executeStep(index, step.agentId, input);
    });

    const stepResults = await Promise.allSettled(promises);

    for (let i = 0; i < stepResults.length; i++) {
      const settledResult = stepResults[i];
      
      if (settledResult.status === 'fulfilled') {
        results.push(settledResult.value);
        this.context.previousResults.push(settledResult.value);
        onStep?.(settledResult.value);
      } else {
        // Create error result for rejected promise
        const errorResult: WorkflowStepResult = {
          stepIndex: i,
          agentId: workflow.steps[i].agentId,
          agentName: this.getAgentName(workflow.steps[i].agentId),
          input: workflow.steps[i].input || initialInput,
          output: '',
          success: false,
          error: settledResult.reason?.message || 'Unknown error',
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
        };
        results.push(errorResult);
        onStep?.(errorResult);
      }
    }

    // Check if any step failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      throw new Error(
        `${failures.length} step(s) failed in parallel execution`
      );
    }
  }

  /**
   * Execute steps with conditional branching
   */
  private async executeConditional(
    workflow: WorkflowDefinition,
    initialInput: string,
    results: WorkflowStepResult[],
    onStep?: WorkflowStepCallback
  ): Promise<void> {
    let currentInput = initialInput;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      // Check if step should be executed based on condition
      if (step.condition) {
        const shouldExecute = this.evaluateCondition(step.condition, results);
        if (!shouldExecute) {
          // Skip this step
          continue;
        }
      }

      const input = step.input || currentInput;
      const result = await this.executeStep(i, step.agentId, input);
      results.push(result);
      onStep?.(result);

      // Update context for next steps
      currentInput = result.output;
      this.context.previousResults.push(result);
    }
  }

  /**
   * Evaluate a condition to determine if step should execute
   */
  private evaluateCondition(
    condition: { type: string; previousStepIndex?: number },
    results: WorkflowStepResult[]
  ): boolean {
    if (condition.type === 'always') {
      return true;
    }

    if (condition.previousStepIndex === undefined) {
      // If no specific step index, check the last step
      const lastResult = results[results.length - 1];
      if (!lastResult) return condition.type === 'failure';

      if (condition.type === 'success') {
        return lastResult.success;
      } else if (condition.type === 'failure') {
        return !lastResult.success;
      }
    } else {
      // Check specific step
      const targetResult = results.find(
        (r) => r.stepIndex === condition.previousStepIndex
      );
      if (!targetResult) return false;

      if (condition.type === 'success') {
        return targetResult.success;
      } else if (condition.type === 'failure') {
        return !targetResult.success;
      }
    }

    return false;
  }

  /**
   * Execute a single step with an agent
   */
  private async executeStep(
    stepIndex: number,
    agentId: string,
    input: string
  ): Promise<WorkflowStepResult> {
    const startTime = new Date();
    const agent = this.agents.find((a) => a.id === agentId);

    if (!agent) {
      const endTime = new Date();
      return {
        stepIndex,
        agentId,
        agentName: 'Unknown Agent',
        input,
        output: '',
        success: false,
        error: `Agent not found: ${agentId}`,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
      };
    }

    try {
      const output = await this.callAgent(agent, input);
      const endTime = new Date();

      return {
        stepIndex,
        agentId: agent.id,
        agentName: agent.name,
        input,
        output,
        success: true,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
      };
    } catch (error) {
      const endTime = new Date();
      return {
        stepIndex,
        agentId: agent.id,
        agentName: agent.name,
        input,
        output: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
      };
    }
  }

  /**
   * Call an agent with input and get response
   */
  private async callAgent(agent: Agent, input: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.options.timeout || 30000);

    try {
      const response = await fetch(`${this.options.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.options.model,
          prompt: input,
          system: agent.systemPrompt || '',
          temperature: this.options.temperature,
          top_p: this.options.topP,
          max_tokens: this.options.maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || '';
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Get agent name by ID
   */
  private getAgentName(agentId: string): string {
    const agent = this.agents.find((a) => a.id === agentId);
    return agent?.name || 'Unknown Agent';
  }

  /**
   * Get current workflow context
   */
  getContext(): WorkflowContext {
    return { ...this.context };
  }

  /**
   * Reset workflow context
   */
  resetContext(): void {
    this.context = {
      variables: {},
      previousResults: [],
    };
  }
}
