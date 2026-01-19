/**
 * Code Sanitization and Validation
 * Prevents execution of dangerous code patterns
 */

import { ExecutionPolicy } from './types';

// Dangerous modules that should never be imported
const BLOCKED_MODULES = [
  'fs', 'fs/promises',
  'path',
  'os',
  'child_process',
  'exec',
  'spawn',
  'fork',
  'net',
  'dgram',
  'http',
  'https',
  'http2',
  'socket.io',
  'ws',
  'cluster',
  'process',
  'vm',
  'repl',
  'crypto',
  'stream',
  'buffer',
];

// Dangerous global functions and properties
const BLOCKED_GLOBALS = [
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'process',
  'require',
  '__dirname',
  '__filename',
];

/**
 * Check if code contains blocked imports or function calls
 */
export function sanitizeCode(code: string, policy: ExecutionPolicy): { safe: boolean; error?: string } {
  // Language validation
  if (policy.allowedLanguages.length > 0) {
    // Basic check - could be enhanced
    const isAllowed = policy.allowedLanguages.some(
      (lang) => lang.toLowerCase() === 'javascript' || lang.toLowerCase() === 'js'
    );
    if (!isAllowed) {
      return {
        safe: false,
        error: `Language not supported. Allowed: ${policy.allowedLanguages.join(', ')}`,
      };
    }
  }

  // Check for blocked modules
  for (const module of BLOCKED_MODULES) {
    const patterns = [
      new RegExp(`require\\s*\\(\\s*['"]\s*${module.replace(/\//g, '\\/')}`, 'gi'),
      new RegExp(`from\\s+['"]\s*${module.replace(/\//g, '\\/')}\s*['"]`, 'gi'),
      new RegExp(`import\\s+.*\\s+from\\s+['"]\s*${module.replace(/\//g, '\\/')}\s*['"]`, 'gi'),
    ];

    for (const pattern of patterns) {
      if (pattern.test(code)) {
        return {
          safe: false,
          error: `Blocked module: ${module}. For security, file system and network access are disabled.`,
        };
      }
    }
  }

  // Check for blocked globals if policy disallows them
  if (!policy.enableFileAccess) {
    const fsGlobals = ['readFile', 'writeFile', 'readdir', 'mkdir', 'rmdir', 'unlink'];
    for (const global of fsGlobals) {
      if (new RegExp(`\\b${global}\\b`, 'g').test(code)) {
        return {
          safe: false,
          error: `File system access is disabled: ${global}`,
        };
      }
    }
  }

  if (!policy.enableNetworking) {
    const netGlobals = ['fetch', 'XMLHttpRequest', 'socket', 'Server', 'createServer'];
    for (const global of netGlobals) {
      if (new RegExp(`\\b${global}\\b`, 'g').test(code)) {
        return {
          safe: false,
          error: `Network access is disabled: ${global}`,
        };
      }
    }
  }

  return { safe: true };
}

/**
 * Wrap code in sandbox context with limited globals
 */
export function createSandboxContext(): Record<string, any> {
  const logs: string[] = [];
  const errors: string[] = [];

  return {
    // Console for output capture
    console: {
      log: (...args: any[]) => {
        logs.push(args.map(arg => String(arg)).join(' '));
      },
      error: (...args: any[]) => {
        errors.push(args.map(arg => String(arg)).join(' '));
      },
      warn: (...args: any[]) => {
        errors.push(`[WARN] ${args.map(arg => String(arg)).join(' ')}`);
      },
      info: (...args: any[]) => {
        logs.push(`[INFO] ${args.map(arg => String(arg)).join(' ')}`);
      },
      debug: (...args: any[]) => {
        logs.push(`[DEBUG] ${args.map(arg => String(arg)).join(' ')}`);
      },
    },

    // Safe globals
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
    WeakMap,
    WeakSet,
    Promise,
    Symbol,
    Error,
    TypeError,
    RangeError,
    SyntaxError,

    // Utility functions
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURI,
    encodeURIComponent,
    decodeURI,
    decodeURIComponent,

    // Logging helpers
    __logs: logs,
    __errors: errors,
  };
}

/**
 * Get captured output from sandbox context
 */
export function getCapturedOutput(context: Record<string, any>): {
  stdout: string;
  stderr: string;
} {
  return {
    stdout: (context.__logs || []).join('\n'),
    stderr: (context.__errors || []).join('\n'),
  };
}
