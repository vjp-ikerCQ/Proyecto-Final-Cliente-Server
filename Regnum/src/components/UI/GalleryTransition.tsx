import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';

interface GalleryTransitionProps {
  onComplete: () => void;
}

const GalleryTransition: React.FC<GalleryTransitionProps> = ({ onComplete }) => {
  const { settings } = useSettings();
  const hasPlayed = useRef(false);

  useEffect(() => {
    // Duración corta para el reparto de cartas (1.5s)
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);

    if (hasPlayed.current) return;
    hasPlayed.current = true;

    let audio: HTMLAudioElement | null = null;
    if (settings.isSfxEnabled) {
      audio = new Audio('https://res.cloudinary.com/drvgncidb/video/upload/v1779449354/card-shuffle_dyqs13.ogg');
      audio.volume = settings.sfxVolume;
      audio.play().catch(err => console.log("SFX play blocked by browser:", err));

      // Limit audio playback to 1.5 seconds
      setTimeout(() => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }, 1500);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete, settings.isSfxEnabled, settings.sfxVolume]);

  // Posiciones para las cartas siendo repartidas
  const cards = [
    { id: 1, rotate: -25, x: -80, y: 20, delay: 0.2 },
    { id: 2, rotate: -5, x: -25, y: -10, delay: 0.4 },
    { id: 3, rotate: 15, x: 30, y: -20, delay: 0.6 },
    { id: 4, rotate: 35, x: 80, y: 10, delay: 0.8 },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Mazo central */}
        <motion.div 
          className="absolute w-20 h-32 bg-[#0a0a0a] border border-primary-gold/30 rounded-md shadow-[0_0_15px_rgba(166,138,100,0.2)]"
          initial={{ scale: 0, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
            {/* Patrón del dorso */}
            <div className="absolute inset-1 border border-primary-gold/10 rounded-[4px] bg-menu-pattern opacity-30" />
        </motion.div>

        {/* Cartas repartidas */}
        {cards.map(card => (
          <motion.div
            key={card.id}
            className="absolute w-20 h-32 bg-[#121212] border-2 border-primary-gold rounded-md shadow-2xl"
            initial={{ scale: 0.5, x: 0, y: 0, opacity: 0 }}
            animate={{ scale: 1, x: card.x, y: card.y, rotate: card.rotate, opacity: 1 }}
            transition={{ delay: card.delay, type: 'spring', stiffness: 250, damping: 20 }}
          >
             <div className="absolute inset-1 border border-primary-gold/50 rounded-sm bg-[#1a1a1a]" />
          </motion.div>
        ))}
      </div>

      <motion.h2
        className="mt-12 text-lg md:text-2xl tracking-[0.4em] font-cinzel text-primary-gold uppercase drop-shadow-[0_0_10px_rgba(166,138,100,0.8)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        Abriendo Colección...
      </motion.h2>
    </motion.div>
  );
};

export default GalleryTransition;
