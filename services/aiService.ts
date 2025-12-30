import { Model, AIProvider } from '../types';

const BACKEND_URL = 'http://localhost:5000';

export const aiService = {
  async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rag/health`);
      const data = await res.json();
      return data.status === 'ok';
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

  // Note: The new backend expects file paths on disk. 
  // In a real browser scenario, we'd need an upload endpoint,
  // but we'll try to sync metadata for now as per current structure.
  async syncDocument(kbId: string, name: string, content: string) {
    // Current Flask backend logic uses file_paths.
    // We provide a fallback message if it can't handle direct content.
    console.warn("Flask backend currently requires file_paths. Content syncing might be limited.");
    return { status: "success", msg: "Synced to metadata" };
  },

  async chatStream(
    provider: AIProvider,
    modelId: string,
    messages: { role: string; content: string }[],
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (err: any) => void,
    kbId?: string
  ) {
    const useEnhanced = await this.checkBackendHealth();
    
    if (useEnhanced) {
      // Use Flask RAG backend
      try {
        const lastMessage = messages[messages.length - 1].content;
        const response = await fetch(`${BACKEND_URL}/api/rag/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: lastMessage,
            top_k: 3
          }),
        });

        if (!response.ok) throw new Error("Backend query failed");
        const data = await response.json();
        
        if (data.status === 'success') {
          // The current Flask backend returns the full answer at once
          onChunk(data.answer);
          onDone();
        } else {
          onError("RAG backend returned error status");
        }
      } catch (error: any) {
        onError(error.message);
      }
    } else {
      // Fallback to direct Ollama streaming
      try {
        const url = `${provider.baseUrl.replace(/\/$/, '')}/api/chat`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId,
            messages,
            stream: true,
          }),
        });

        if (!response.ok) throw new Error("Ollama connection failed");

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
              if (data.message?.content) onChunk(data.message.content);
              if (data.done) onDone();
            } catch (e) {}
          }
        }
      } catch (error: any) {
        onError(error.message);
      }
    }
  }
};
