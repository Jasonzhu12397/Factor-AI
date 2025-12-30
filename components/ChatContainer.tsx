
import React, { useRef, useEffect } from 'react';
import { Message, Role } from '../types';
import { Send, Cpu, AlertCircle, RefreshCw } from './Icons';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  selectedModel: string;
  isOllamaActive: boolean;
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  onSendMessage,
  selectedModel,
  isOllamaActive
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading || !isOllamaActive) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const adjustTextAreaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 relative overflow-hidden">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-8 custom-scrollbar space-y-8"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400">
              <Cpu size={48} className="animate-pulse-soft" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Factor</h2>
              <p className="text-slate-500 dark:text-slate-400">
                A powerful local interface for your AI models. Start a conversation to see it in action.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {['Explain Quantum Physics', 'Write a React Hook', 'Help me debug my code', 'Tell me a short story'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSendMessage(prompt)}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-left hover:border-indigo-500 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' 
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'}
              `}>
                <div className="flex items-center gap-2 mb-1.5 opacity-60 text-xs font-bold uppercase tracking-widest">
                  {msg.role === 'user' ? 'You' : (selectedModel || 'Assistant')}
                </div>
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4 md:gap-6 justify-start">
             <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-8 bg-gradient-to-t from-white dark:from-slate-950 via-white dark:via-slate-950 to-transparent">
        <div className="max-w-4xl mx-auto">
          {!isOllamaActive && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
              <AlertCircle size={18} />
              <span>Ollama is not responding. Ensure it's running locally on port 11434 with CORS enabled.</span>
            </div>
          )}
          
          <form 
            onSubmit={handleSubmit}
            className={`
              relative flex items-end gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all
              ${!isOllamaActive ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              disabled={!isOllamaActive || isLoading}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustTextAreaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder={isOllamaActive ? "Message your AI assistant..." : "Ollama connection required"}
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none px-3 py-2.5 text-sm md:text-base placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !isOllamaActive}
              className={`
                p-2.5 rounded-xl transition-all shrink-0
                ${inputValue.trim() && !isLoading && isOllamaActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95' 
                  : 'text-slate-400 bg-slate-200 dark:bg-slate-800'}
              `}
            >
              {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </form>
          <div className="mt-3 text-center text-[10px] md:text-xs text-slate-400 font-medium tracking-tight">
            Powered by Ollama • Local Privacy • Optimized for {selectedModel || 'Factor'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
