
import { Model, Message, AIProvider } from '../types';

export const aiService = {
  // 获取 Ollama 本地模型
  async getOllamaModels(baseUrl: string): Promise<Model[]> {
    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        providerId: 'local-ollama',
        size: m.details?.parameter_size
      }));
    } catch {
      return [];
    }
  },

  // 统一流式对话接口
  async chatStream(
    provider: AIProvider,
    modelId: string,
    messages: { role: string; content: string }[],
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (err: any) => void
  ) {
    try {
      const isOllama = provider.type === 'ollama';
      const url = isOllama ? `${provider.baseUrl}/api/chat` : `${provider.baseUrl}/chat/completions`;
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      }

      const body = isOllama 
        ? { model: modelId, messages, stream: true }
        : { model: modelId, messages, stream: true };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream not supported');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        if (isOllama) {
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const json = JSON.parse(line);
            if (json.message?.content) onChunk(json.message.content);
            if (json.done) onDone();
          }
        } else {
          // OpenAI 兼容格式解析
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const cleanLine = line.replace(/^data: /, '').trim();
            if (!cleanLine || cleanLine === '[DONE]') continue;
            try {
              const json = JSON.parse(cleanLine);
              const content = json.choices[0]?.delta?.content;
              if (content) onChunk(content);
            } catch (e) {}
          }
        }
      }
      onDone();
    } catch (error) {
      onError(error);
    }
  }
};
