import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type CombatLog } from '../hooks/useGameState';

interface CombatLogOverlayProps {
  logs: CombatLog[];
  visible: boolean;
  toggleLog: () => void;
}

export const CombatLogOverlay: React.FC<CombatLogOverlayProps> = ({ logs, visible, toggleLog }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al fondo cuando llegan nuevos mensajes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, visible]);

  const getLogColor = (type: CombatLog['type']) => {
    switch (type) {
      case 'attack': return 'text-red-400';
      case 'heal': return 'text-emerald-400';
      case 'synergy': return 'text-primary-gold';
      case 'system': return 'text-gray-300';
      default: return 'text-white';
    }
  };

  const getBorderColor = (type: CombatLog['type']) => {
    switch (type) {
      case 'attack': return 'border-red-500/50 bg-red-950/20';
      case 'heal': return 'border-emerald-500/50 bg-emerald-950/20';
      case 'synergy': return 'border-primary-gold/50 bg-primary-gold/10';
      case 'system': return 'border-white/20 bg-white/5';
      default: return 'border-white/20';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed z-[250] flex flex-col w-auto max-w-xs md:max-w-sm p-4 bottom-[80px] left-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-4 md:left-auto"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
        >
          <div className="w-full bg-[#000000a0] backdrop-blur-md rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col custom-scrollbar overflow-hidden border border-white/10 h-[300px] md:h-[450px]">
            {/* Cabecera */}
            <div className="flex justify-between items-center p-3 border-b border-white/5 bg-black/40">
              <h2 className="text-primary-gold font-cinzel text-sm md:text-base uppercase tracking-widest flex items-center gap-2">
                <span className="text-[10px]">⚔</span> Registro
              </h2>
              <button
                onClick={toggleLog}
                className="text-gray-400 hover:text-primary-gold transition-colors text-lg"
              >
                ✕
              </button>
            </div>
            
            {/* Lista de mensajes */}
            <div
              ref={containerRef}
              className="flex-1 p-3 overflow-y-auto space-y-2 text-[11px] md:text-xs font-spectral"
            >
              {logs.length === 0 && (
                <div className="text-gray-500 italic text-center mt-8">El combate ha comenzado...</div>
              )}
              {logs.map(log => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`leading-relaxed border-l-2 pl-2.5 py-1.5 rounded-r pr-2 shadow-sm ${getLogColor(log.type)} ${getBorderColor(log.type)}`}
                >
                  <div className="text-[9px] text-gray-500 mb-0.5 opacity-70 font-sans">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  {log.text}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
