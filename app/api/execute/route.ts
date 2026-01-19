import { NextRequest, NextResponse } from 'next/server';
import { executeCode, DEFAULT_POLICY } from '@/lib/execution';

interface ExecuteRequest {
  code: string;
  language?: string;
  timeout?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();
    const { code, timeout = 5000 } = body;

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Limit timeout
    const maxTimeout = Math.min(timeout, 30000); // Max 30 seconds

    // Execute code with custom timeout
    const result = await executeCode(code, {
      ...DEFAULT_POLICY,
      maxTimeout,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      {
        success: false,
        stdout: '',
        stderr: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        language: 'javascript',
      },
      { status: 500 }
    );
  }
}
