import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const generateMockResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  if (lowerInput.includes('csr') || lowerInput.includes('volunteer')) {
    return 'To log CSR hours, head over to the Employee Corner and click "Log Volunteer Hours". This requires approval from your manager before XP is awarded!';
  }
  if (lowerInput.includes('carbon') || lowerInput.includes('footprint')) {
    return 'Your company\'s Carbon Footprint is measured across Scope 1, 2, and 3 emissions. Check the main Dashboard for real-time totals and the Reports page for variance trends.';
  }
  if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
    return 'Hello there! I am the Ecosphere AI Assistant. How can I help you be more sustainable today?';
  }
  if (lowerInput.includes('joke')) {
    return 'Why did the leaf go to the doctor? Because it was feeling a little green! 🍃';
  }
  if (lowerInput.includes('xp') || lowerInput.includes('level')) {
    return 'You earn XP by participating in challenges, logging CSR hours, and submitting ESG reports. Check your Gamification profile to see your current level and badges!';
  }
  
  return 'That is a great question! While my advanced AI brain is still processing that specific query, you can explore the Dashboard or Employee Corner to find most features!';
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I am Ecosphere AI. Ask me how to log CSR hours, check carbon footprints, or earn XP!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(userMessage.content),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] transition hover:scale-105 hover:bg-brand-400"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/95 shadow-panel backdrop-blur-xl sm:w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20">
            <Sparkles className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Ecosphere AI</h3>
            <p className="text-xs text-brand-400">Online</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-full p-2 text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          aria-label="Close Assistant"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                msg.role === 'assistant'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'bg-accent-500/20 text-accent-300'
              }`}
            >
              {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-accent-600/90 text-white rounded-tr-sm'
                  : 'bg-white/[0.04] text-slate-200 border border-white/[0.05] rounded-tl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-white/[0.05] bg-white/[0.04] px-4 py-3">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-white/[0.06] bg-white/[0.02] p-4">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask about ESG, ${user?.firstName || 'User'}...`}
            className="w-full rounded-full border border-white/[0.08] bg-ink-950 px-4 py-2.5 pr-12 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-400 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
