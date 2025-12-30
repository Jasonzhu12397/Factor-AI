
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Send, RefreshCw, Layers, Database, Copy, Check } from './Icons';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  selectedModel: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading, onSendMessage, selectedModel }) => {
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-12 py-10 custom-scrollbar space-y-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mb-8 animate-in zoom-in duration-500">
              <span className="text-5xl">🐳</span>
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
              你好，我是小鲸鱼
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-10">
              我已经准备好通过 <span className="text-indigo-600 dark:text-indigo-400 font-black">{selectedModel}</span> 为您提供支持。您可以问我任何问题，或者通过知识库让我更聪明。
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              {["帮我写一段代码", "解释这个文档", "制定一个计划", "随机聊聊"].map(t => (
                <button key={t} onClick={() => onSendMessage(t)} className="p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:border-indigo-500 transition-all active:scale-95">
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 group animate-in slide-in-from-bottom-4 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-indigo-600 text-white'}`}>
                {msg.role === 'user' ? 'YOU' : '🐳'}
              </div>
              <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`relative px-5 py-4 rounded-3xl text-[15px] leading-relaxed font-medium shadow-sm border ${msg.role === 'user' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-white rounded-tr-none' : 'bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  
                  {msg.role === 'assistant' && (
                    <button onClick={() => handleCopy(msg.id, msg.content)} className="absolute -right-10 top-0 p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all">
                      {copiedId === msg.id ? <Check size={16}/> : <Copy size={16}/>}
                    </button>
                  )}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.sources.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black border border-indigo-100 dark:border-indigo-900/30">
                        <Database size={10} /> {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4 animate-in fade-in duration-300">
             <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 animate-pulse">🐳</div>
             <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl rounded-tl-none px-6 py-4 flex gap-2 items-center shadow-sm">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <span className="ml-2 text-xs font-black text-slate-400 uppercase tracking-widest">小鲸鱼正在思考...</span>
             </div>
          </div>
        )}
      </div>

      <div className="p-6 md:p-10 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-all duration-500"></div>
            <div className="relative flex items-end gap-2 p-3 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-slate-200 dark:border-slate-800 transition-all">
              <textarea
                rows={1} value={inputValue} disabled={isLoading}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
                placeholder="给小鲸鱼发送指令..."
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none px-4 py-3 text-[15px] font-bold placeholder:text-slate-400"
              />
              <button type="submit" disabled={!inputValue.trim() || isLoading} className={`p-3.5 rounded-2xl transition-all ${inputValue.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-100 hover:scale-105 active:scale-95' : 'text-slate-400 bg-slate-200 dark:bg-slate-800'}`}>
                {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </form>
          <div className="mt-4 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
            <span>Factor RAG Engine v2.0</span>
            <div className="flex gap-4">
              <span>Markdown Supported</span>
              <span>Encrypted Local Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
