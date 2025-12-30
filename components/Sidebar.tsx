
import React from 'react';
import { Plus, MessageSquare, Trash2, Cpu, Settings, X, Layers } from './Icons';
import { ChatSession, OllamaModel } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onToggleSidebar: () => void;
  isOpen: boolean;
  models: OllamaModel[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onToggleSidebar,
  isOpen,
  models,
  selectedModel,
  onSelectModel,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}
      `}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-indigo-600 dark:text-indigo-400">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <Layers size={20} />
            </div>
            <span>Factor</span>
          </div>
          <button 
            onClick={onToggleSidebar}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Model Selector */}
        <div className="px-4 py-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Active Model
          </label>
          <div className="relative group">
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {models.length === 0 ? (
                <option value="">No models found...</option>
              ) : (
                models.map((m) => (
                  <option key={m.digest} value={m.name}>
                    {m.name} ({m.details.parameter_size})
                  </option>
                ))
              )}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Cpu size={14} />
            </div>
          </div>
        </div>

        {/* New Session Button */}
        <div className="px-4 py-4">
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar space-y-1">
          <div className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            History
          </div>
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400">No conversations yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`
                  group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all
                  ${currentSessionId === session.id 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}
                `}
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare size={18} className="shrink-0" />
                <span className="flex-1 text-sm font-medium truncate pr-6">
                  {session.title || 'Untitled Chat'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className={`
                    absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-all
                    ${currentSessionId === session.id ? 'opacity-100' : ''}
                  `}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
