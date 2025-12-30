
export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export type ProviderType = 'ollama' | 'openai-compatible';

export interface AIProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string;
  apiKey?: string;
  enabled: boolean;
}

export interface Model {
  id: string;
  name: string;
  providerId: string;
  size?: string;
  family?: string;
}

export interface Document {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
  createdAt: number;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documents: Document[];
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  providerId: string;
  knowledgeBaseId?: string; // 关联的知识库
  createdAt: number;
  updatedAt: number;
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: Role;
    content: string;
  };
  done: boolean;
}
