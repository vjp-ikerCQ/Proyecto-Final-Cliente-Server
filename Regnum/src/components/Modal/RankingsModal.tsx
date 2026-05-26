import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Medal, Award } from 'lucide-react';
import type { RankingEntry } from '../../types/index';
import { getRankings } from '../../services/userService';

interface RankingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal que muestra la clasificación de los mejores jugadores.
 */
const RankingsModal: React.FC<RankingsModalProps> = ({ isOpen, onClose }) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carga los rankings al abrir el modal
  useEffect(() => {
    if (isOpen) {
      console.log('Abriendo modal de Rankings...');
      setIsLoading(true);
      getRankings()
        .then(data => {
          console.log('Rankings cargados con éxito:', data);
          // Excluir al administrador de los rankings y recalcular los puestos de forma consecutiva
          const filtered = data
            .filter((entry: RankingEntry) => entry.name?.toLowerCase() !== 'admin')
            .map((entry: RankingEntry, idx: number) => ({
              ...entry,
              rank: idx + 1
            }));
          setRankings(filtered);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error al cargar rankings:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  // Función para obtener el icono según la posición
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="text-yellow-400" size={24} />;
      case 2: return <Medal className="text-gray-300" size={24} />;
      case 3: return <Medal className="text-amber-600" size={24} />;
      default: return <Award className="text-gray-600" size={20} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Fondo desenfocado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-modal-backdrop backdrop-blur-md"
          />

          {/* Contenido del Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl bg-modal border border-primary-gold/20 p-8 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Decoraciones de esquina góticas */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary-gold/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary-gold/10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary-gold/10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary-gold/10 pointer-events-none" />

            {/* Cabecera */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-gold/10 rounded-full">
                  <Trophy className="text-primary-gold" size={32} />
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-[0.2em] uppercase font-cinzel text-gold-gradient">
                    Rankings
                  </h2>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500">Los Maestros del Reino</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-muted hover:text-text-main transition-colors">
                <X size={28} />
              </button>
            </div>

            {/* Lista de Ranking */}
            <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-primary-gold/20 border-t-primary-gold rounded-full animate-spin" />
                  <p className="text-xs tracking-[0.2em] uppercase text-primary-gold/60">Consultando Pergaminos...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {rankings.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        flex items-center justify-between p-5 transition-all duration-300 group
                        ${index < 3 ? 'bg-primary-gold/5 border border-primary-gold/20' : 'bg-surface border border-transparent'}
                        hover:bg-surface-hover hover:translate-x-2
                      `}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-10 flex justify-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-lg font-bold font-cinzel ${index < 3 ? 'text-primary-gold' : 'text-text-main'}`}>
                            {entry.name}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest">Aspirante al Trono</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-2xl font-black font-spectral text-white leading-none">
                          {entry.wins}
                        </span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-tighter">Victorias</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer con separador gótico */}
            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-gold/30 to-transparent" />
              <p className="text-[10px] italic text-gray-600 font-spectral">"Solo los más dignos perdurarán en los anales de la historia"</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RankingsModal;
