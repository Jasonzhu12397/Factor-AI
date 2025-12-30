
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import { Menu, Sun, Moon } from './components/Icons';
import { ChatSession, Message, OllamaModel } from './types';
import { ollamaService } from './services/ollamaService';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isOllamaActive, setIsOllamaActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Persistence
  useEffect(() => {
    const savedSessions = localStorage.getItem('ollama_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      }
    }

    const savedDarkMode = localStorage.getItem('dark_mode');
    if (savedDarkMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ollama_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Fetch Models
  const fetchModels = useCallback(async () => {
    const fetchedModels = await ollamaService.getModels();
    setModels(fetchedModels);
    setIsOllamaActive(fetchedModels.length > 0);
    if (fetchedModels.length > 0 && !selectedModel) {
      setSelectedModel(fetchedModels[0].name);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchModels();
    // Poll for status
    const interval = setInterval(fetchModels, 10000);
    return () => clearInterval(interval);
  }, [fetchModels]);

  const handleToggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('dark_mode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      model: selectedModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newId);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedModel) return;

    let targetSessionId = currentSessionId;
    let currentSessions = [...sessions];

    // Create session if none exists
    if (!targetSessionId) {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
        id: newId,
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [],
        model: selectedModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      currentSessions = [newSession, ...sessions];
      setSessions(currentSessions);
      setCurrentSessionId(newId);
      targetSessionId = newId;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const updatedSessions = currentSessions.map(s => {
      if (s.id === targetSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMsg],
          updatedAt: Date.now(),
          title: s.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : s.title
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    let assistantContent = '';

    const session = updatedSessions.find(s => s.id === targetSessionId);
    const chatHistory = session?.messages.map(m => ({ role: m.role, content: m.content })) || [];

    await ollamaService.chatStream(
      selectedModel,
      chatHistory,
      (chunk) => {
        assistantContent += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id === targetSessionId) {
            const hasAssistant = s.messages.find(m => m.id === assistantMsgId);
            if (hasAssistant) {
              return {
                ...s,
                messages: s.messages.map(m => m.id === assistantMsgId ? { ...m, content: assistantContent } : m)
              };
            } else {
              return {
                ...s,
                messages: [...s.messages, { id: assistantMsgId, role: 'assistant', content: assistantContent, timestamp: Date.now() }]
              };
            }
          }
          return s;
        }));
      },
      () => {
        setIsLoading(false);
      },
      (error) => {
        console.error(error);
        setIsLoading(false);
      }
    );
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-full w-full overflow-hidden font-sans">
      <Sidebar
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

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Local Node</span>
              <span className="text-sm font-semibold truncate max-w-[200px]">
                {currentSession?.title || 'Untitled Chat'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleToggleDarkMode}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <ChatContainer
          messages={currentSession?.messages || []}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          selectedModel={selectedModel}
          isOllamaActive={isOllamaActive}
        />
      </main>
    </div>
  );
};

export default App;
