import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { createAudioWithFallback } from '../../utils/audioFallback';

const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { stopMusic } = useSettings();
  const splashAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any lingering music and play splash sound after 250ms delay
  useEffect(() => {
    stopMusic();
    const timer = setTimeout(() => {
      splashAudioRef.current = createAudioWithFallback(
        'Assets/Folders/Home/regnumhollow/background/splash2.mp3',
        '/audio/regnum/background/splash2.mp3',
        0.5,
        false
      );
    }, 250);
    return () => {
      clearTimeout(timer);
      // Stop splash audio when leaving the page
      if (splashAudioRef.current) {
        splashAudioRef.current.pause();
        splashAudioRef.current.currentTime = 0;
        splashAudioRef.current = null;
      }
    };
  }, [stopMusic]);

  const handleStart = () => {
    // Stop splash audio before navigating
    if (splashAudioRef.current) {
      splashAudioRef.current.pause();
      splashAudioRef.current.currentTime = 0;
      splashAudioRef.current = null;
    }
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
      {/* Background Image - object-cover fills the screen without distortion */}
      <img 
        src="/splash_background.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[10000ms] ease-out scale-110 hover:scale-100"
        style={{ filter: 'brightness(0.4) contrast(1.2)' }}
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