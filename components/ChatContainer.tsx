
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, Cpu, AlertCircle, RefreshCw } from './Icons';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  selectedModel: string;
  isOllamaActive: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages, isLoading, onSendMessage, selectedModel, isOllamaActive
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 relative overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar space-y-8">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-600 animate-bounce">
              <span className="text-4xl">🐳</span>
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2 tracking-tighter">你好，我是小鲸鱼</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                我已准备好为你提供服务，当前模型驱动为 <span className="text-indigo-500 font-bold">{selectedModel}</span>。
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                  <span className="text-sm">🐳</span>
                </div>
              )}
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed font-medium shadow-sm border ${msg.role === 'user' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-black uppercase tracking-widest">
                  {msg.role === 'user' ? 'YOU' : 'LITTLE WHALE'}
                </div>
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4 justify-start">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 animate-pulse"><span className="text-sm">🐳</span></div>
             <div className="bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl px-4 py-3 flex space-x-2 items-center">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 bg-gradient-to-t from-white dark:from-slate-950">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border dark:border-slate-800 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            <textarea
              rows={1} value={inputValue} disabled={isLoading}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }}}
              placeholder="对小鲸鱼说点什么吧..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none px-3 py-2 text-sm md:text-base font-medium"
            />
            <button type="submit" disabled={!inputValue.trim() || isLoading} className={`p-3 rounded-xl transition-all ${inputValue.trim() && !isLoading ? 'bg-indigo-600 text-white shadow-lg active:scale-95' : 'text-slate-400 bg-slate-200 dark:bg-slate-800'}`}>
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
          <div className="mt-3 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-50">
            Powered by Factor • Local & Cloud Hybrid Engine
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
