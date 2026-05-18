import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sword, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BattleTransitionProps {
  onComplete: () => void;
}

const BattleTransition: React.FC<BattleTransitionProps> = ({ onComplete }) => {
  const { t } = useTranslation();

  useEffect(() => {
    // Total animation duration before calling onComplete
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Background Shield */}
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
          className="absolute text-accent-gray/50"
        >
          <Shield size={160} strokeWidth={1} fill="rgba(30,30,30,0.8)" className="drop-shadow-[0_0_15px_rgba(166,138,100,0.3)]" />
        </motion.div>

        {/* Left Sword */}
        <motion.div
          className="absolute text-primary-gold"
          initial={{ x: -300, y: -300, opacity: 0, rotate: -45 }}
          animate={{ x: -25, y: -10, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 250, damping: 20 }}
        >
          <Sword size={100} strokeWidth={1.5} className="drop-shadow-[0_0_10px_rgba(166,138,100,0.8)]" />
        </motion.div>

        {/* Right Sword (flipped) */}
        <motion.div
          className="absolute text-primary-gold"
          initial={{ x: 300, y: -300, opacity: 0, rotate: 45, scaleX: -1 }}
          animate={{ x: 25, y: -10, opacity: 1, rotate: 0, scaleX: -1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 250, damping: 20 }}
        >
          <Sword size={100} strokeWidth={1.5} className="drop-shadow-[0_0_10px_rgba(166,138,100,0.8)]" />
        </motion.div>

        {/* Impact Flash/Particle */}
        <motion.div
          className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_40px_20px_rgba(255,255,255,0.8)]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2.5, 0], opacity: [0, 1, 0] }}
          transition={{ delay: 0.55, duration: 0.3, ease: "easeOut" }}
        />
        
        {/* Screen Shake effect on the container */}
        <motion.div
          className="absolute inset-0 border-2 border-primary-gold/0 rounded-full"
          animate={{ 
            x: [0, -5, 5, -3, 3, 0],
            y: [0, 5, -5, 3, -3, 0],
            opacity: [0, 0.5, 0] 
          }}
          transition={{ delay: 0.55, duration: 0.4 }}
        />
      </div>

      <motion.h2
        className="mt-12 text-xl md:text-3xl tracking-[0.3em] font-cinzel text-gold-gradient uppercase drop-shadow-[0_0_10px_rgba(166,138,100,0.8)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        {t('menu.preparingBattle', 'Preparando Batalla...')}
      </motion.h2>
    </motion.div>
  );
};

export default BattleTransition;
