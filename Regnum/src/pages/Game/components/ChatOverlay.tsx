import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  from: 'player' | 'bot';
  text: string;
  timestamp: number;
  expired: boolean;
}

interface ChatOverlayProps {
  messages: ChatMessage[];
  visible: boolean;
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  toggleChat: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  messages,
  visible,
  input,
  setInput,
  sendMessage,
  toggleChat,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto‑scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, visible]);

  // Focus input when chat becomes visible
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed left-4 top-1/2 z-[250] flex flex-col w-auto max-w-sm -translate-y-1/2 p-4"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
        >
          {/* Semi‑transparent glass panel */}
          <div className="w-full max-w-md md:max-w-lg bg-panel bg-[#00000080] backdrop-blur-md rounded-xl shadow-2xl flex flex-col custom-scrollbar overflow-hidden">
            {/* Header with close button */}
            <div className="flex justify-between items-center p-2 border-b border-white/5">
              <h2 className="text-primary-gold font-cinzel text-lg uppercase tracking-wider">
                Chat del Duelo
              </h2>
              <button
                onClick={toggleChat}
                className="text-gray-400 hover:text-primary-gold transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Message list */}
            <div
              ref={containerRef}
              className="flex-1 p-2 overflow-y-auto space-y-2"
            >
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  className={`flex ${msg.from === 'player' ? 'justify-end' : 'justify-start'} `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      msg.from === 'player'
                        ? 'bg-primary-gold text-black'
                        : 'bg-surface text-white'
                    } ${msg.expired ? 'opacity-30' : 'opacity-100'} transition-opacity`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Input */}
            <div className="flex items-center p-2 border-t border-white/5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje…"
                className="flex-1 bg-bg-main text-text-main border border-white/10 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-gold"
              />
              <button
                onClick={sendMessage}
                className="ml-2 py-1 px-3 bg-primary-gold text-black font-bold rounded hover:bg-white transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
