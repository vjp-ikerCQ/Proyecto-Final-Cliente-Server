import { useState, useEffect, useRef } from 'react';
import { generateMockBotReply } from './useBotAI'; // Adjust path if needed

export interface ChatMessage {
  id: string;
  from: 'player' | 'bot';
  text: string;
  timestamp: number;
  expired: boolean;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  visible: boolean;
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  toggleChat: () => void;
  resetChat: () => void;
}

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const idCounter = useRef(0);

  // Mark messages as expired after 5 seconds
  useEffect(() => {
    const timers = messages.map(msg => {
      if (!msg.expired) {
        const timer = setTimeout(() => {
          setMessages(prev =>
            prev.map(m => (m.id === msg.id ? { ...m, expired: true } : m))
          );
        }, 5000);
        return timer;
      }
      return null;
    });
    return () => {
      timers.forEach(t => t && clearTimeout(t));
    };
  }, [messages]);

  const addMessage = (from: 'player' | 'bot', text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${idCounter.current++}`,
      from,
      text,
      timestamp: Date.now(),
      expired: false,
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const playerMsg = addMessage('player', input.trim());
    setInput('');
    // Bot reply after short delay
    setTimeout(() => {
      const botText = generateMockBotReply(playerMsg.text);
      addMessage('bot', botText);
    }, 800);
  };

  const toggleChat = () => setVisible(v => !v);

  const resetChat = () => {
    setMessages([]);
    setVisible(false);
    setInput('');
  };

  

  return { messages, visible, input, setInput, sendMessage, toggleChat, resetChat };
};
