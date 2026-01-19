import { BaseLLMProvider } from './base';
import type { LLMRequest, LLMResponse, StreamChunk } from '@/types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export class OpenAICompatibleProvider extends BaseLLMProvider {
  name: string;
  type = 'openai-compatible';

  constructor(
    name: string,
    private baseUrl: string,
    private apiKey?: string
  ) {
    super();
    this.name = name;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json();
      return data.data?.map((m: any) => m.id) || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const abortController = this.createAbortController();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens,
          stream: false,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${error}`);
      }

      const data: OpenAIChatResponse = await response.json();

      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    }
  }

  async chatStream(
    request: LLMRequest,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const abortController = this.createAbortController();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            
            if (data === '[DONE]') {
              onChunk({ content: '', done: true });
              return;
            }

            try {
              const parsed: OpenAIStreamChunk = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              const isDone = parsed.choices[0]?.finish_reason !== null;

              onChunk({
                content,
                done: isDone,
                metadata: {
                  model: parsed.model,
                },
              });

              if (isDone) {
                return;
              }
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }
}
