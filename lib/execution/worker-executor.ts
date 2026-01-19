/**
 * Node.js Worker Thread Code Executor
 * Phase 1: Safe JavaScript/TypeScript execution in isolated workers
 */

import { Worker } from 'worker_threads';
import path from 'path';
import { ExecutionResult, ExecutionPolicy, DEFAULT_POLICY } from './types';
import { sanitizeCode } from './sanitizer';

/**
 * Execute code in an isolated worker thread
 * Safe, fast, and no external dependencies needed
 */
export async function executeCodeInWorker(
  code: string,
  policy: ExecutionPolicy = DEFAULT_POLICY
): Promise<ExecutionResult> {
  const language = 'javascript';
  const startTime = Date.now();

  // Sanitize code first
  const sanitization = sanitizeCode(code, policy);
  if (!sanitization.safe) {
    return {
      success: false,
      stdout: '',
      stderr: sanitization.error || 'Code failed security check',
      error: sanitization.error,
      executionTime: Date.now() - startTime,
      language,
    };
  }

  return new Promise((resolve) => {
    let timedOut = false;
    let workerError: string | null = null;

    // Create timeout for execution
    const timeout = setTimeout(() => {
      timedOut = true;
      try {
        worker.terminate();
      } catch (e) {
        // Ignore termination errors
      }
      resolve({
        success: false,
        stdout: '',
        stderr: `Code execution timeout (${policy.maxTimeout}ms exceeded)`,
        error: `Timeout after ${policy.maxTimeout}ms`,
        executionTime: Date.now() - startTime,
        language,
      });
    }, policy.maxTimeout);

    // Create and setup worker
    const worker = new Worker(
      `
      const { parentPort } = require('worker_threads');
      const vm = require('vm');
      
      parentPort.on('message', (message) => {
        try {
          const { code, policy } = message;
          
          // Create sandbox context with safe globals
          const sandbox = {
            console: {
              log: (...args) => parentPort.postMessage({ type: 'log', data: args.join(' ') }),
              error: (...args) => parentPort.postMessage({ type: 'error', data: args.join(' ') }),
              warn: (...args) => parentPort.postMessage({ type: 'warn', data: '[WARN] ' + args.join(' ') }),
              info: (...args) => parentPort.postMessage({ type: 'info', data: '[INFO] ' + args.join(' ') }),
              debug: (...args) => parentPort.postMessage({ type: 'debug', data: '[DEBUG] ' + args.join(' ') }),
            },
            Math,
            JSON,
            Array,
            Object,
            String,
            Number,
            Boolean,
            Date,
            RegExp,
            Map,
            Set,
            Promise,
            Error,
            TypeError,
            RangeError,
            parseInt,
            parseFloat,
            isNaN,
            isFinite,
            encodeURI,
            encodeURIComponent,
            decodeURI,
            decodeURIComponent,
          };
          
          // Execute code in sandbox
          const script = new vm.Script(code);
          const result = script.runInNewContext(sandbox, {
            timeout: policy.maxTimeout,
            displayErrors: true,
          });
          
          if (result !== undefined) {
            parentPort.postMessage({ type: 'result', data: result });
          }
          
          parentPort.postMessage({ type: 'complete', success: true });
        } catch (error) {
          parentPort.postMessage({
            type: 'error',
            data: error instanceof Error ? error.message : String(error),
          });
          parentPort.postMessage({ type: 'complete', success: false });
        }
      });
      `,
      { eval: true }
    );

    // Collect output
    const stdoutLines: string[] = [];
    const stderrLines: string[] = [];

    worker.on('message', (message) => {
      if (timedOut) return;

      switch (message.type) {
        case 'log':
        case 'info':
        case 'debug':
          stdoutLines.push(message.data);
          break;
        case 'warn':
        case 'error':
          stderrLines.push(message.data);
          break;
        case 'result':
          stdoutLines.push(`→ ${JSON.stringify(message.data)}`);
          break;
        case 'complete':
          clearTimeout(timeout);
          try {
            worker.terminate();
          } catch (e) {
            // Ignore
          }

          resolve({
            success: message.success,
            stdout: stdoutLines.join('\n'),
            stderr: stderrLines.join('\n'),
            error: workerError || undefined,
            executionTime: Date.now() - startTime,
            language,
          });
          break;
      }
    });

    worker.on('error', (error) => {
      if (timedOut) return;
      clearTimeout(timeout);
      workerError = error.message;
      try {
        worker.terminate();
      } catch (e) {
        // Ignore
      }
      resolve({
        success: false,
        stdout: '',
        stderr: error.message,
        error: error.message,
        executionTime: Date.now() - startTime,
        language,
      });
    });

    worker.on('exit', (code) => {
      if (timedOut) return;
      if (code !== 0 && !workerError) {
        clearTimeout(timeout);
        resolve({
          success: false,
          stdout: stdoutLines.join('\n'),
          stderr: stderrLines.join('\n'),
          error: `Worker exited with code ${code}`,
          executionTime: Date.now() - startTime,
          language,
        });
      }
    });

    // Send code to worker
    worker.postMessage({ code, policy });
  });
}

/**
 * Execute code synchronously (for testing, not recommended for production)
 * Falls back to worker thread if available
 */
export async function executeCode(code: string, policy: ExecutionPolicy = DEFAULT_POLICY): Promise<ExecutionResult> {
  return executeCodeInWorker(code, policy);
}
