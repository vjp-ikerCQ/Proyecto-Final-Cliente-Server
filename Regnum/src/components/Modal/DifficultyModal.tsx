import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sword, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BattleTransition from '../UI/BattleTransition';

interface DifficultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDifficulty?: (difficulty: 'normal' | 'hard') => void;
}

const DifficultyModal: React.FC<DifficultyModalProps> = ({ isOpen, onClose, onSelectDifficulty }) => {
  const navigate = useNavigate();
  const [showBattleTransition, setShowBattleTransition] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'normal' | 'hard'>('normal');

  const handleSelectDifficulty = (difficulty: 'normal' | 'hard') => {
    setSelectedDifficulty(difficulty);
    setShowBattleTransition(true);
    // NO llamamos onClose aquí — el componente se desmonta antes de que
    // BattleTransition pueda completarse.
  };

  const handleBattleComplete = () => {
    setShowBattleTransition(false);
    // Ahora sí cerramos el modal y navegamos
    onClose();
    if (onSelectDifficulty) {
      onSelectDifficulty(selectedDifficulty);
    } else {
      navigate('/game', { state: { difficulty: selectedDifficulty } });
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showBattleTransition && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-modal-backdrop backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-modal border border-accent-gray relative overflow-hidden"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-gold -translate-x-1 -translate-y-1 opacity-50" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-gold translate-x-1 -translate-y-1 opacity-50" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-gold -translate-x-1 translate-y-1 opacity-50" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-gold translate-x-1 translate-y-1 opacity-50" />

              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 text-center">
                <h2 className="text-2xl font-cinzel text-primary-gold mb-2 tracking-[0.2em] uppercase">
                  Selecciona Dificultad
                </h2>
                <p className="text-xs text-gray-400 font-spectral mb-8 italic">
                  Elige el nivel de desafío de la IA
                </p>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => handleSelectDifficulty('normal')}
                    className="group relative flex items-center justify-center gap-3 p-4 border border-accent-gray bg-panel/40 hover:bg-panel/80 hover:border-blue-400 transition-all active:scale-95 overflow-hidden"
                  >
                    <Shield size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                      <span className="font-cinzel uppercase tracking-widest text-blue-400 font-bold text-sm">
                        Normal
                      </span>
                      <span className="text-[10px] font-spectral text-gray-400 text-left">
                        El bot toma decisiones impulsivas y comete errores.
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectDifficulty('hard')}
                    className="group relative flex items-center justify-center gap-3 p-4 border border-accent-gray bg-panel/40 hover:bg-panel/80 hover:border-red-500 transition-all active:scale-95 overflow-hidden shadow-[0_0_15px_rgba(220,38,38,0.1)]"
                  >
                    <Sword size={20} className="text-red-500 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start">
                      <span className="font-cinzel uppercase tracking-widest text-red-500 font-bold text-sm">
                        Difícil
                      </span>
                      <span className="text-[10px] font-spectral text-gray-400 text-left">
                        El bot analiza cada jugada y busca tu destrucción.
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Transition Animation */}
      <AnimatePresence>
        {showBattleTransition && (
          <BattleTransition onComplete={handleBattleComplete} />
        )}
      </AnimatePresence>
    </>
  );
};

export default DifficultyModal;