/**
 * Code Execution Types and Interfaces
 */

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
  executionTime: number; // milliseconds
  language: string;
}

export interface ExecutionPolicy {
  maxTimeout: number; // milliseconds
  maxMemory: number; // bytes
  allowedLanguages: string[];
  enableNetworking: boolean;
  enableFileAccess: boolean;
}

export interface CodeExecutorConfig {
  policy: ExecutionPolicy;
  verbose: boolean;
}

// Default execution policy - secure by default
export const DEFAULT_POLICY: ExecutionPolicy = {
  maxTimeout: 5000, // 5 seconds
  maxMemory: 128 * 1024 * 1024, // 128 MB
  allowedLanguages: ['javascript', 'js', 'typescript', 'ts', 'node'],
  enableNetworking: false,
  enableFileAccess: false,
};

export const DEFAULT_CONFIG: CodeExecutorConfig = {
  policy: DEFAULT_POLICY,
  verbose: false,
};
