import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart2, Shield, Sword, Skull, Clock } from 'lucide-react';
import type { UserStats } from '../../types/index';
import { getUserStats } from '../../services/userService';

/**
 * Propiedades del componente StatsModal
 */
interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string };
}

/**
 * Modal que muestra las estadísticas del jugador actual.
 * Los datos se obtienen del servicio userService para facilitar
 * la futura integración con la base de datos.
 */
const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, user }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carga las estadísticas cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getUserStats(user.name).then(data => {
        setUserStats(data);
        setIsLoading(false);
      });
    }
  }, [isOpen, user.name]);

  // Si no hay datos todavía, preparamos una lista vacía para el mapeo
  const statsList = userStats ? [
    { label: 'Partidas Jugadas', value: userStats.gamesPlayed.toString(), icon: <BarChart2 className="text-blue-400" size={24} /> },
    { label: 'Partidas Ganadas', value: userStats.gamesWon.toString(), icon: <Sword className="text-green-400" size={24} /> },
    { label: 'Partidas Perdidas', value: userStats.gamesLost.toString(), icon: <Skull className="text-red-400" size={24} /> },
    { label: 'Tasa de Victoria', value: userStats.winRate, icon: <Shield className="text-yellow-400" size={24} /> },
    { label: 'Tiempo de Juego', value: userStats.playTime, icon: <Clock className="text-purple-400" size={24} /> },
  ] : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Capa de fondo oscura con desenfoque */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Contenedor principal del Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#121214] border border-primary-gold/30 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Ornamentos dorados en las esquinas */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-gold/20" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-gold/20" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-gold/20" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-gold/20" />

            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BarChart2 className="text-primary-gold" size={28} />
                <h2 className="text-3xl font-black tracking-widest uppercase font-cinzel text-gold-gradient">
                  Estadísticas
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <p className="mb-8 text-gray-400 font-spectral italic text-lg border-b border-white/5 pb-4">
              Registro del Reino para <span className="text-primary-gold not-italic font-bold">{user.name}</span>
            </p>

            {/* Cuadrícula de Estadísticas */}
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="py-20 text-center text-primary-gold/50 font-cinzel animate-pulse">
                  Consultando registros reales...
                </div>
              ) : (
                statsList.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-panel/30 border border-white/5 hover:border-primary-gold/20 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-black/40 rounded-sm group-hover:scale-110 transition-transform">
                        {stat.icon}
                      </div>
                      <span className="text-sm tracking-widest uppercase text-gray-400 font-cinzel">
                        {stat.label}
                      </span>
                    </div>
                    <span className="text-xl font-bold font-spectral text-primary-gold">
                      {stat.value}
                    </span>
                  </motion.div>
                ))
              )}
            </div>

            {/* Línea decorativa inferior */}
            <div className="mt-8 flex justify-center opacity-20">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-gold to-transparent" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StatsModal;
