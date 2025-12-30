
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';
import { Menu, Sun, Moon, Settings, X, Layers, Database } from './components/Icons';
import { ChatSession, Message, Model, AIProvider, KnowledgeBase } from './types';
import { aiService } from './services/aiService';

const DEFAULT_PROVIDERS: AIProvider[] = [
  { id: 'local-ollama', name: 'Ollama (Local)', type: 'ollama', baseUrl: 'http://localhost:11434', enabled: true },
  { id: 'deepseek', name: 'DeepSeek (Cloud)', type: 'openai-compatible', baseUrl: 'https://api.deepseek.com', apiKey: '', enabled: false }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(() => {
    const saved = localStorage.getItem('knowledge_bases');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [providers, setProviders] = useState<AIProvider[]>(() => {
    const saved = localStorage.getItem('ai_providers');
    return saved ? JSON.parse(saved) : DEFAULT_PROVIDERS;
  });
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const getSystemPrompt = (modelName: string, context?: string) => {
    let prompt = `你叫“小鲸鱼”，是一个聪明、友好的 AI 助手。
你的来历：你是基于 Factor Web GUI 架构开发的 RAG 增强型智能伙伴。
当前状态：你正在调用模型 [${modelName}] 为用户提供服务。`;

    if (context) {
      prompt += `\n\n【知识库增强模式已开启】
以下是从用户私有知识库中检索到的相关片段，请结合这些信息回答用户的问题。如果检索到的内容与问题无关，请根据你的通用知识回答。
---知识库片段开始---
${context}
---知识库片段结束---`;
    }

    prompt += `\n回答要求：如果用户询问你是谁，请回答“你好，我是小鲸鱼”。如果你正在使用知识库回答，可以适当提及。`;
    return prompt;
  };

  useEffect(() => {
    const savedSessions = localStorage.getItem('ollama_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0 && !currentSessionId) setCurrentSessionId(parsed[0].id);
    }
    if (localStorage.getItem('dark_mode') === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ollama_sessions', JSON.stringify(sessions));
    localStorage.setItem('ai_providers', JSON.stringify(providers));
    localStorage.setItem('knowledge_bases', JSON.stringify(knowledgeBases));
  }, [sessions, providers, knowledgeBases]);

  const fetchAllModels = useCallback(async () => {
    let allModels: Model[] = [];
    for (const provider of providers) {
      if (!provider.enabled) continue;
      if (provider.type === 'ollama') {
        const local = await aiService.getOllamaModels(provider.baseUrl);
        allModels = [...allModels, ...local];
      } else if (provider.id === 'deepseek' && provider.apiKey) {
        allModels.push({ id: 'deepseek-chat', name: 'DeepSeek-V3', providerId: provider.id });
        allModels.push({ id: 'deepseek-reasoner', name: 'DeepSeek-R1', providerId: provider.id });
      }
    }
    setModels(allModels);
    if (allModels.length > 0 && !selectedModelId) setSelectedModelId(allModels[0].id);
  }, [providers, selectedModelId]);

  useEffect(() => { fetchAllModels(); }, [fetchAllModels]);

  const handleSendMessage = async (content: string) => {
    const currentModel = models.find(m => m.id === selectedModelId);
    if (!currentModel) return;

    const currentProvider = providers.find(p => p.id === currentModel.providerId);
    if (!currentProvider) return;

    let targetId = currentSessionId;
    let currentSession = sessions.find(s => s.id === targetId);

    // 如果没有当前会话，创建一个新的
    if (!targetId || !currentSession) {
      targetId = Date.now().toString();
      currentSession = { 
        id: targetId, 
        title: content.slice(0, 30), 
        messages: [], 
        modelId: selectedModelId, 
        providerId: currentProvider.id, 
        createdAt: Date.now(), 
        updatedAt: Date.now() 
      };
      setSessions(prev => [currentSession!, ...prev]);
      setCurrentSessionId(targetId);
    }

    // 检索 RAG 知识库 (针对中文优化)
    let context = "";
    if (currentSession?.knowledgeBaseId) {
      const kb = knowledgeBases.find(k => k.id === currentSession?.knowledgeBaseId);
      if (kb) {
        const relevantDocs = kb.documents.filter(doc => {
          // 只要用户输入的关键词中包含文档中的内容，就视为相关
          const searchTerms = content.length > 4 ? [content.slice(0, 4), content.slice(-4)] : [content];
          return searchTerms.some(term => doc.content.includes(term));
        }).slice(0, 3);
        context = relevantDocs.map(d => `[来源: ${d.name}]\n${d.content.slice(0, 800)}`).join('\n\n');
      }
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() };
    
    // 立即更新 UI 显示用户消息
    setSessions(prev => prev.map(s => s.id === targetId ? { 
      ...s, 
      messages: [...s.messages, userMsg], 
      updatedAt: Date.now(),
      title: s.messages.length === 0 ? content.slice(0, 30) : s.title 
    } : s));
    
    setIsLoading(true);
    const assistantMsgId = (Date.now() + 1).toString();
    let assistantContent = '';

    // 构建发送给模型的完整历史记录（包含刚刚产生的 userMsg）
    const history = [
      { role: 'system', content: getSystemPrompt(currentModel.name, context) },
      ...currentSession.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: content }
    ];

    await aiService.chatStream(
      currentProvider,
      selectedModelId,
      history,
      (chunk) => {
        assistantContent += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id === targetId) {
            const hasAssistant = s.messages.some(m => m.id === assistantMsgId);
            return {
              ...s,
              messages: hasAssistant
                ? s.messages.map(m => m.id === assistantMsgId ? { ...m, content: assistantContent } : m)
                : [...s.messages, { id: assistantMsgId, role: 'assistant', content: assistantContent, timestamp: Date.now() }]
            };
          }
          return s;
        }));
      },
      () => setIsLoading(false),
      (err) => { 
        console.error("Chat Error:", err); 
        setIsLoading(false); 
        alert("对话出错了，请检查模型连接或 API Key 设置。");
      }
    );
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className={`flex h-full w-full overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewSession={() => {
          const id = Date.now().toString();
          setSessions(prev => [{ id, title: '新对话', messages: [], modelId: selectedModelId, providerId: '', createdAt: Date.now(), updatedAt: Date.now() }, ...prev]);
          setCurrentSessionId(id);
          setActiveTab('chat');
        }}
        onDeleteSession={(id) => {
          setSessions(prev => prev.filter(s => s.id !== id));
          if (currentSessionId === id) setCurrentSessionId(null);
        }}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isOpen={isSidebarOpen}
        models={models}
        selectedModel={selectedModelId}
        onSelectModel={setSelectedModelId}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
        <header className="h-14 flex items-center justify-between px-4 border-b dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu size={20}/></button>}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter tracking-widest">Little Whale AI • RAG</span>
              <span className="text-sm font-bold truncate max-w-[150px]">{activeTab === 'chat' ? (currentSession?.title || '新对话') : '知识库管理'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'chat' && currentSession && (
              <select 
                value={currentSession.knowledgeBaseId || ''} 
                onChange={(e) => {
                  const kbId = e.target.value;
                  setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, knowledgeBaseId: kbId } : s));
                }}
                className="text-xs font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <option value="">未挂载知识库</option>
                {knowledgeBases.map(kb => <option key={kb.id} value={kb.id}>📚 {kb.name}</option>)}
              </select>
            )}
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Settings size={20}/></button>
            <button onClick={() => { setIsDarkMode(!isDarkMode); document.documentElement.classList.toggle('dark'); localStorage.setItem('dark_mode', String(!isDarkMode)); }} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
          </div>
        </header>

        {activeTab === 'chat' ? (
          <ChatContainer
            messages={currentSession?.messages || []}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            selectedModel={models.find(m => m.id === selectedModelId)?.name || '未选择模型'}
            isOllamaActive={true}
          />
        ) : (
          <KnowledgeBaseManager 
            knowledgeBases={knowledgeBases} 
            onUpdate={setKnowledgeBases}
          />
        )}
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold">小鲸鱼引擎设置</h3>
              <button onClick={() => setShowSettings(false)} className="hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {providers.map((p, idx) => (
                <div key={p.id} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{p.name}</span>
                    <input type="checkbox" checked={p.enabled} onChange={(e) => {
                      const next = [...providers];
                      next[idx].enabled = e.target.checked;
                      setProviders(next);
                    }} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400">接口地址</label>
                    <input type="text" value={p.baseUrl} onChange={(e) => { const next = [...providers]; next[idx].baseUrl = e.target.value; setProviders(next); }} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  {p.type === 'openai-compatible' && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400">API Key</label>
                      <input type="password" value={p.apiKey || ''} onChange={(e) => { const next = [...providers]; next[idx].apiKey = e.target.value; setProviders(next); }} placeholder="sk-..." className="w-full px-3 py-2 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-6 border-t dark:border-slate-800 flex justify-end">
              <button onClick={() => { setShowSettings(false); fetchAllModels(); }} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">保存配置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
