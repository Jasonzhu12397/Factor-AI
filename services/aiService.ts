
import { Model, AIProvider } from '../types';

const BACKEND_URL = 'http://localhost:8000';

export const aiService = {
  async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  async getModels(provider: AIProvider): Promise<Model[]> {
    try {
      const baseUrl = provider.baseUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        providerId: provider.id,
        size: m.details?.parameter_size
      }));
    } catch (e) {
      console.error('Fetch models error:', e);
      return [];
    }
  },

  // 将文档同步到后端向量库
  async syncDocument(kbId: string, name: string, content: string) {
    const formData = new FormData();
    formData.append('kb_id', kbId);
    formData.append('name', name);
    formData.append('content', content);

    try {
      const res = await fetch(`${BACKEND_URL}/api/documents`, {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (e) {
      console.error('Sync document failed:', e);
      return null;
    }
  },

  async chatStream(
    provider: AIProvider,
    modelId: string,
    messages: { role: string; content: string }[],
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (err: any) => void,
    kbId?: string // 传入当前使用的知识库 ID
  ) {
    const useEnhanced = await this.checkBackendHealth();
    
    try {
      const url = useEnhanced ? `${BACKEND_URL}/api/chat` : `${provider.baseUrl.replace(/\/$/, '')}/api/chat`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: true,
          knowledge_base_id: kbId
        }),
      });

      if (!response.ok) throw new Error("Backend connection failed");

      const reader = response.body?.getReader();
      if (!reader) return;
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
            const data = JSON.parse(line);
            // 处理后端传回的 sources 信息
            if (data.sources) {
              // 这里的来源处理可以根据需要回调 UI 展示
              console.log('RAG Sources:', data.sources);
              continue;
            }
            if (data.message?.content) onChunk(data.message.content);
            if (data.done) onDone();
          } catch (e) {
            // 解析失败通常是由于非 JSON 行或流中断
          }
        }
      }
    } catch (error: any) {
      onError(error.message);
    }
  }
};
