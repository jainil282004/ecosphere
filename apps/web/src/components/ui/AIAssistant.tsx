import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, TrendingUp, AlertTriangle, Lightbulb, Trash2 } from 'lucide-react';
import { useAICopilot } from '@/features/ai/AICopilotContext';
import clsx from 'clsx';

const SUGGESTED_PROMPTS = [
  { text: 'Summarize ESG performance', icon: <TrendingUp className="w-4 h-4" /> },
  { text: 'Analyze carbon emissions', icon: <Sparkles className="w-4 h-4" /> },
  { text: 'Suggest sustainability improvements', icon: <Lightbulb className="w-4 h-4" /> },
  { text: 'Identify compliance risks', icon: <AlertTriangle className="w-4 h-4" /> },
];

export function AIAssistant() {
  const { isOpen, togglePanel, closePanel, messages, clearMessages, isThinking, askAI } = useAICopilot();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;
    
    askAI(inputValue.trim());
    setInputValue('');
  };

  // Render basic markdown (bold text)
  const renderMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-emerald-400">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={togglePanel}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 hover:bg-emerald-500 hover:scale-105 transition-all duration-300 group"
          >
            <Sparkles className="w-6 h-6" />
            
            {/* Pulse Ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 group-hover:animate-ping" />
            
            {/* Tooltip */}
            <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-800 text-slate-200 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700">
              Ask EcoSphere AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] z-50 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
                    <Bot className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">EcoSphere AI Copilot</h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearMessages}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={closePanel}
                  className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={clsx(
                    'flex flex-col gap-1 max-w-[85%]',
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-medium">
                      {msg.role === 'user' ? 'You' : 'EcoSphere AI'}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.chartContext && (
                    <div className="text-xs bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-300 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      Analyzing: {msg.chartContext.title}
                    </div>
                  )}

                  <div
                    className={clsx(
                      'p-3 rounded-2xl text-sm leading-relaxed shadow-sm',
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                    )}
                  >
                    {msg.isStreaming && msg.content === '' ? (
                      <div className="flex items-center gap-1 h-5 px-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Suggested Prompts (only show if no recent user messages) */}
              {messages.filter(m => m.role === 'user').length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 gap-2 mt-8"
                >
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Suggested Actions</p>
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => askAI(prompt.text)}
                      className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl text-left transition-all duration-200 group text-sm text-slate-300 hover:text-slate-100 hover:border-emerald-500/30"
                    >
                      <div className="text-emerald-400/70 group-hover:text-emerald-400">
                        {prompt.icon}
                      </div>
                      {prompt.text}
                    </button>
                  ))}
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything about your ESG data..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  disabled={isThinking}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isThinking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-emerald-600/10 disabled:hover:text-emerald-400"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-slate-500">
                  AI responses may not always be 100% accurate. Verify critical data.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
