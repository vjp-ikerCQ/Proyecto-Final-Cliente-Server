import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, BarChart2, Shield, Sword, Skull, Clock, Trash2 } from 'lucide-react';
import type { UserStats } from '../../types/index';
import { getUserStats } from '../../services/userService';
import DeleteAccountModal from './DeleteAccountModal';

/**
 * Propiedades del componente StatsModal
 */
interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; isGuest?: boolean };
}

/**
 * Modal que muestra las estadísticas del jugador actual.
 */
const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Carga las estadísticas cuando el modal se abre
  useEffect(() => {
    if (isOpen && !user.isGuest) {
      setIsLoading(true);
      getUserStats(user.name).then(data => {
        setUserStats(data);
        setIsLoading(false);
      });
    } else if (isOpen && user.isGuest) {
      setIsLoading(false);
    }
  }, [isOpen, user.name, user.isGuest]);

  // Si no hay datos todavía, preparamos una lista vacía para el mapeo
  const statsList = userStats ? [
    { label: t('stats.played'), value: userStats.gamesPlayed.toString(), icon: <BarChart2 className="text-blue-400" size={24} /> },
    { label: t('stats.won'), value: userStats.gamesWon.toString(), icon: <Sword className="text-green-400" size={24} /> },
    { label: t('stats.lost'), value: userStats.gamesLost.toString(), icon: <Skull className="text-red-400" size={24} /> },
    { label: t('stats.winRate'), value: userStats.winRate, icon: <Shield className="text-yellow-400" size={24} /> },
    { label: t('stats.playTime'), value: userStats.playTime, icon: <Clock className="text-purple-400" size={24} /> },
  ] : [];

  return (
    <>
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
              className="relative w-full max-w-lg bg-modal border border-primary-gold/30 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
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
                    {t('stats.title')}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-muted hover:text-text-main transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="mb-8 text-secondary-theme font-spectral italic text-lg border-b border-accent-gray/30 pb-4">
                {t('stats.subtitle')} <span className="text-primary-gold not-italic font-bold">{user.name}</span>
              </p>

              {/* Cuadrícula de Estadísticas o Advertencia de Invitado */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                {user.isGuest ? (
                  <div className="py-12 px-6 text-center border border-primary-gold/10 bg-primary-gold/5 rounded-sm">
                    <div className="inline-flex p-4 bg-primary-gold/10 rounded-full mb-4">
                      <Shield className="text-primary-gold" size={40} />
                    </div>
                    <p className="text-secondary-theme font-spectral text-lg leading-relaxed italic">
                      "{t('stats.guestWarning')}"
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="py-20 text-center text-primary-gold/50 font-cinzel animate-pulse">
                    {t('stats.loading')}
                  </div>
                ) : (
                  statsList.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-surface border border-accent-gray/20 hover:bg-surface-hover hover:border-primary-gold/20 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-icon rounded-sm group-hover:scale-110 transition-transform">
                          {stat.icon}
                        </div>
                        <span className="text-sm tracking-widest uppercase text-secondary-theme font-cinzel">
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

              {/* Botón de Eliminar Cuenta (Solo si no es invitado) */}
              {!user.isGuest && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 border border-red-900/30 text-red-500/50 hover:bg-red-950/30 hover:text-red-500 hover:border-red-500 transition-all font-cinzel text-[10px] uppercase tracking-widest group"
                  >
                    <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                    {t('stats.deleteAccount')}
                  </button>
                </div>
              )}

              {/* Línea decorativa inferior */}
              <div className="mt-8 flex justify-center opacity-20">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-gold to-transparent" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        username={user.name}
      />
    </>
  );
};

export default StatsModal;
