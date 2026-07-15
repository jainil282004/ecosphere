import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  chartContext?: {
    title: string;
    data: any;
  };
  isStreaming?: boolean;
}

interface AICopilotContextType {
  isOpen: boolean;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  
  isThinking: boolean;
  setIsThinking: (val: boolean) => void;

  askAI: (prompt: string, context?: any) => Promise<void>;
}

const AICopilotContext = createContext<AICopilotContextType | undefined>(undefined);

export function AICopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'ai',
    content: 'Hello! I am your **EcoSphere AI Copilot**. How can I assist you with your ESG performance today?',
    timestamp: new Date()
  }]);
  const [isThinking, setIsThinking] = useState(false);

  const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);
  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...msg,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date()
    }]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'ai',
      content: 'Hello! I am your **EcoSphere AI Copilot**. How can I assist you with your ESG performance today?',
      timestamp: new Date()
    }]);
  }, []);

  // Central function to send prompt to backend AI service
  const askAI = async (prompt: string, context?: any) => {
    if (!isOpen) openPanel();
    
    // Add User Message
    const userMsgId = Math.random().toString(36).substring(7);
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      chartContext: context
    }]);

    setIsThinking(true);

    try {
      // Add empty AI message that we will "stream" into
      const aiMsgId = Math.random().toString(36).substring(7);
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'ai',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      // Call Backend API
      const response = await fetch('http://localhost:3000/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context })
      });

      if (!response.ok) throw new Error('AI Service Error');

      const data = await response.json();
      const aiResponseText = data.response || "I couldn't generate a response for that.";

      // Simulate streaming for aesthetic UX
      setIsThinking(false);
      let currentText = '';
      const words = aiResponseText.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        await new Promise(r => setTimeout(r, 40)); // 40ms per word
        currentText += words[i] + ' ';
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: currentText } : m));
      }
      
      // Finalize
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: aiResponseText, isStreaming: false } : m));

    } catch (error) {
      console.error('Failed to ask AI:', error);
      setIsThinking(false);
      addMessage({
        role: 'ai',
        content: 'I am currently experiencing connection issues. Please try again later.'
      });
    }
  };

  return (
    <AICopilotContext.Provider value={{
      isOpen, togglePanel, openPanel, closePanel,
      messages, addMessage, clearMessages,
      isThinking, setIsThinking, askAI
    }}>
      {children}
    </AICopilotContext.Provider>
  );
}

export function useAICopilot() {
  const context = useContext(AICopilotContext);
  if (context === undefined) {
    throw new Error('useAICopilot must be used within an AICopilotProvider');
  }
  return context;
}
