import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettings, MUSIC_KEYS } from '../../contexts/SettingsContext';

const SPLASH_MUSIC_URL = 'https://res.cloudinary.com/drvgncidb/video/upload/Assets/Folders/Home/regnumhollow/splash2.mp3';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { playMusic } = useSettings();

  // Play splash music after 250ms delay or upon first user interaction
  useEffect(() => {
    const playAttempt = () => {
      playMusic(SPLASH_MUSIC_URL);
    };

    const timer = setTimeout(playAttempt, 250);

    const unlockAudio = () => {
      playAttempt();
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('mousemove', unlockAudio);
    };

    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('mousemove', unlockAudio);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [playMusic]);

  const handleStart = () => {
    playMusic(MUSIC_KEYS.MENU);
    navigate('/login');
  };

  return (
    <motion.div 
      className="relative h-screen w-screen flex flex-col items-center justify-center overflow-hidden cursor-pointer bg-black"
      onClick={handleStart}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
    >
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-out scale-110 hover:scale-100"
        style={{ 
          backgroundImage: `url('/splash_background.png')`,
          filter: 'brightness(0.4) contrast(1.2)'
        }}
      />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.8)_100%)]" />

      {/* Content */}
      <div className="relative z-10 text-center flex flex-col items-center gap-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        >
          <h1 className="text-4xl sm:text-6xl md:text-9xl font-cinzel-decorative text-gold-gradient drop-shadow-[0_0_30px_rgba(166,138,100,0.5)] mb-2 px-4">
            Regnum Hollow
          </h1>
          <p className="font-cinzel text-xs sm:text-lg md:text-2xl tracking-[0.3em] sm:tracking-[0.6em] text-primary-gold/60 uppercase">
            In Manus Fatum
          </p>
        </motion.div>

        <motion.div
          className="mt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="font-cinzel text-sm uppercase tracking-[0.4em] text-white/40">
            Haz clic para entrar al reino
          </span>
        </motion.div>
      </div>

      {/* Decorative Border */}
      <div className="absolute inset-8 border border-primary-gold/10 pointer-events-none" />
      <div className="absolute inset-12 border border-primary-gold/5 pointer-events-none" />
    </motion.div>
  );
};

export default SplashPage;
