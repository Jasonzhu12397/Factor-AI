
import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon } from './components/Icons';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import KnowledgeBaseManager from './components/KnowledgeBaseManager';
import { aiService } from './services/aiService';
import { ChatSession, Model, KnowledgeBase, Message, AIProvider } from './types';

// Default provider configuration for local usage
const DEFAULT_PROVIDER: AIProvider = {
  id: 'local-ollama',
  name: 'Ollama',
  type: 'ollama',
  baseUrl: 'http://localhost:11434',
  enabled: true
};

const App: React.FC = () => {
  /* Fix: Add missing state variables for theme, sidebar, active tab, sessions, models, and loading status */
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge'>('chat');
  
  // State for chat sessions and current focus
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // State for models and knowledge base items
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  // Operational status states
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'offline' | 'online'>('offline');

  /* Fix: Correctly define currentSession based on currentSessionId to resolve "Cannot find name 'currentSession'" */
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Poll for backend health status
  useEffect(() => {
    const check = async () => {
      const isAlive = await aiService.checkBackendHealth();
      setBackendStatus(isAlive ? 'online' : 'offline');
    };
    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, []);

  // Initial fetch of available models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      const fetchedModels = await aiService.getModels(DEFAULT_PROVIDER);
      setModels(fetchedModels);
      if (fetchedModels.length > 0 && !selectedModel) {
        setSelectedModel(fetchedModels[0].id);
      }
    };
    fetchModels();
  }, []);

  // Handle outgoing messages and model interaction
  const handleSendMessage = async (content: string) => {
    if (!selectedModel || isLoading) return;

    let sessionId = currentSessionId;
    
    // Auto-create a session if one doesn't exist
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: content.slice(0, 24),
        messages: [],
        modelId: selectedModel,
        providerId: DEFAULT_PROVIDER.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Update session with user message
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, messages: [...s.messages, userMsg], updatedAt: Date.now() } : s
    ));

    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Placeholder for assistant response
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s
    ));

    try {
      // Re-fetch current session state for full context
      const targetSession = sessions.find(s => s.id === sessionId);
      const history = (targetSession ? [...targetSession.messages, userMsg] : [userMsg]).map(m => ({
        role: m.role as string,
        content: m.content
      }));

      await aiService.chatStream(
        DEFAULT_PROVIDER,
        selectedModel,
        history,
        (chunk) => {
          setSessions(prev => prev.map(s => 
            s.id === sessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m)
            } : s
          ));
        },
        () => setIsLoading(false),
        (err) => {
          console.error('Chat stream error:', err);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setActiveTab('chat');
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  return (
    <div className={`flex h-full w-full overflow-hidden font-sans ${isDarkMode ? 'dark' : ''}`}>
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isOpen={isSidebarOpen}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 transition-colors duration-300">
        <header className="h-16 flex items-center justify-between px-6 border-b dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <Menu size={20}/>
              </button>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Little Whale Engine</span>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${backendStatus === 'online' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                   <div className={`w-1 h-1 rounded-full ${backendStatus === 'online' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
                   {backendStatus === 'online' ? 'RAG BACKEND ACTIVE' : 'LOCAL ONLY'}
                </div>
              </div>
              <span className="text-sm font-black truncate max-w-[200px]">
                {activeTab === 'chat' ? (currentSession?.title || '未开始对话') : '知识库控制台'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        
        {activeTab === 'chat' ? (
          <ChatContainer 
            messages={currentSession?.messages || []}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            selectedModel={selectedModel}
          />
        ) : (
          <KnowledgeBaseManager 
            knowledgeBases={knowledgeBases}
            onUpdate={setKnowledgeBases}
          />
        )}
      </main>
    </div>
  );
};

export default App;
