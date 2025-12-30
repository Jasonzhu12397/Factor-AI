
import { Model, Message, OllamaChatResponse } from '../types';

let OLLAMA_BASE_URL = localStorage.getItem('ollama_base_url') || 'http://localhost:11434';

export const ollamaService = {
  setBaseUrl(url: string) {
    // Ensure URL has no trailing slash
    OLLAMA_BASE_URL = url.replace(/\/$/, '');
    localStorage.setItem('ollama_base_url', OLLAMA_BASE_URL);
  },

  getBaseUrl() {
    return OLLAMA_BASE_URL;
  },

  // Fixed: Replaced OllamaModel with Model from types.ts
  async getModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  },

  async chatStream(
    model: string,
    messages: { role: string; content: string }[],
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ) {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json: OllamaChatResponse = JSON.parse(line);
            if (json.message?.content) {
              onChunk(json.message.content);
            }
            if (json.done) {
              onDone();
            }
          } catch (e) {
            console.error('Error parsing JSON line:', e);
          }
        }
      }
    } catch (error) {
      onError(error);
    }
  }
};
