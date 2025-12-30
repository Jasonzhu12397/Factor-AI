
import React from 'react';
import { Plus, MessageSquare, Trash2, Cpu, X, Layers, Database } from './Icons';
import { ChatSession, Model } from '../types';

interface SidebarProps {
  activeTab: 'chat' | 'knowledge';
  onTabChange: (tab: 'chat' | 'knowledge') => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onToggleSidebar: () => void;
  isOpen: boolean;
  models: Model[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab, onTabChange, sessions, currentSessionId, onSelectSession, onNewSession, onDeleteSession,
  onToggleSidebar, isOpen, models, selectedModel, onSelectModel,
}) => {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden" onClick={onToggleSidebar} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-2xl text-indigo-600 dark:text-indigo-400">
            <div className="p-1.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <Layers size={22} />
            </div>
            <span className="tracking-tighter">FACTOR</span>
          </div>
          <button onClick={onToggleSidebar} className="p-2 lg:hidden"><X size={20} /></button>
        </div>

        <div className="px-4 py-2 flex gap-1">
          <button onClick={() => onTabChange('chat')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            <MessageSquare size={14} /> 对话
          </button>
          <button onClick={() => onTabChange('knowledge')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
            <Database size={14} /> 知识库
          </button>
        </div>

        {activeTab === 'chat' && (
          <>
            <div className="px-4 py-4 space-y-4">
              <div className="relative">
                <select value={selectedModel} onChange={(e) => onSelectModel(e.target.value)} className="w-full pl-3 pr-10 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold appearance-none cursor-pointer">
                  {models.map((m) => <option key={m.id} value={m.id}>{m.providerId === 'local-ollama' ? '🏠 ' : '☁️ '}{m.name}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><Cpu size={16} /></div>
              </div>
              <button onClick={onNewSession} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95">
                <Plus size={18} /> 新对话
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 custom-scrollbar space-y-1">
              {sessions.map((session) => (
                <div key={session.id} className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`} onClick={() => onSelectSession(session.id)}>
                  <MessageSquare size={18} className="shrink-0" />
                  <span className="flex-1 text-sm font-bold truncate pr-6">{session.title}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} className="absolute right-2 p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
