import type { LLMRequest, LLMResponse, StreamChunk } from '@/types';

export interface ILLMProvider {
  name: string;
  type: string;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
  chat(request: LLMRequest): Promise<LLMResponse>;
  chatStream(request: LLMRequest, onChunk: (chunk: StreamChunk) => void): Promise<void>;
  cancel(): void;
}

export abstract class BaseLLMProvider implements ILLMProvider {
  abstract name: string;
  abstract type: string;
  protected abortController: AbortController | null = null;

  abstract isAvailable(): Promise<boolean>;
  abstract listModels(): Promise<string[]>;
  abstract chat(request: LLMRequest): Promise<LLMResponse>;
  abstract chatStream(request: LLMRequest, onChunk: (chunk: StreamChunk) => void): Promise<void>;

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  protected createAbortController(): AbortController {
    this.abortController = new AbortController();
    return this.abortController;
  }
}
