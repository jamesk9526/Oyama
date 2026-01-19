import { OllamaProvider } from './ollama';
import { OpenAICompatibleProvider } from './openai';
import type { ILLMProvider } from './base';
import type { ProviderType } from '@/types';

class ProviderRegistry {
  private providers: Map<string, ILLMProvider> = new Map();

  register(id: string, provider: ILLMProvider): void {
    this.providers.set(id, provider);
  }

  get(id: string): ILLMProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): ILLMProvider[] {
    return Array.from(this.providers.values());
  }

  remove(id: string): void {
    this.providers.delete(id);
  }

  clear(): void {
    this.providers.clear();
  }
}

export const providerRegistry = new ProviderRegistry();

// Initialize default providers
export const initializeProviders = () => {
  // Default Ollama provider
  providerRegistry.register('ollama-default', new OllamaProvider());
  
  console.log('✅ Providers initialized');
};

export const createProvider = (
  type: ProviderType,
  name: string,
  config: { baseUrl?: string; apiKey?: string }
): ILLMProvider => {
  switch (type) {
    case 'ollama':
      return new OllamaProvider(config.baseUrl);
    case 'openai':
      return new OpenAICompatibleProvider(
        name,
        config.baseUrl || 'https://api.openai.com/v1',
        config.apiKey
      );
    case 'openai-compatible':
      return new OpenAICompatibleProvider(
        name,
        config.baseUrl || '',
        config.apiKey
      );
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
};

export { OllamaProvider, OpenAICompatibleProvider };
export type { ILLMProvider };
