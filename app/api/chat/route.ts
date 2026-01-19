import { NextRequest, NextResponse } from 'next/server';
import { OllamaProvider } from '@/lib/providers/ollama';

interface ChatRequest {
  message: string;
  model: string;
  agentId?: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    const {
      message,
      model,
      systemPrompt = 'You are a helpful AI assistant.',
      temperature = 0.7,
      topP = 0.9,
      maxTokens = 2048,
      stream = false,
    } = body;

    if (!message || !model) {
      return NextResponse.json(
        { error: 'message and model are required' },
        { status: 400 }
      );
    }

    // Create Ollama provider (could be configurable in future)
    const provider = new OllamaProvider();

    // Build message history with system prompt
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder();
      let fullResponse = '';

      const customStream = new ReadableStream({
        async start(controller) {
          try {
            await provider.chatStream(
              {
                model,
                messages: messages as any,
                temperature,
                topP,
                maxTokens,
              },
              (chunk) => {
                fullResponse += chunk.content;
                // Send each chunk as a Server-Sent Event
                const data = `data: ${JSON.stringify({ chunk: chunk.content })}\n\n`;
                controller.enqueue(encoder.encode(data));
              }
            );

            // Send completion signal
            const completeData = `data: ${JSON.stringify({ complete: true, response: fullResponse })}\n\n`;
            controller.enqueue(encoder.encode(completeData));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
            controller.close();
          }
        },
      });

      return new NextResponse(customStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response (fallback)
    let fullResponse = '';

    try {
      await provider.chatStream(
        {
          model,
          messages: messages as any,
          temperature,
          topP,
          maxTokens,
        },
        (chunk) => {
          fullResponse += chunk.content;
        }
      );

      return NextResponse.json({
        response: fullResponse,
        model,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      });
    } catch (error) {
      console.error('Ollama API error:', error);
      return NextResponse.json(
        {
          error: 'Failed to get response from Ollama. Make sure Ollama is running at http://localhost:11434',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
