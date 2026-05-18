import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldOff } from 'lucide-react';

interface SurrenderTransitionProps {
  onComplete: () => void;
}

const SurrenderTransition: React.FC<SurrenderTransitionProps> = ({ onComplete }) => {
  useEffect(() => {
    // Total animation duration before calling onComplete
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Shield shaking and breaking */}
        <motion.div
          className="absolute text-red-600"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1, 1, 0.9, 1.1, 0],
            opacity: [0, 1, 1, 1, 1, 1, 0],
            rotate: [0, -5, 5, -10, 10, -15, 15, 0],
            filter: ["drop-shadow(0 0 0px red)", "drop-shadow(0 0 20px red)", "drop-shadow(0 0 50px red)", "drop-shadow(0 0 0px red)"]
          }}
          transition={{ duration: 2.2, times: [0, 0.15, 0.25, 0.4, 0.6, 0.75, 1] }}
        >
          <ShieldOff size={160} strokeWidth={1} fill="rgba(30,0,0,0.8)" className="drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
        </motion.div>

        {/* Impact Flash/Particle */}
        <motion.div
          className="absolute w-6 h-6 bg-red-500 rounded-full shadow-[0_0_60px_30px_rgba(220,38,38,1)]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 4, 0], opacity: [0, 1, 0] }}
          transition={{ delay: 1.6, duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Screen Shake effect on the container */}
        <motion.div
          className="absolute inset-0 border-2 border-red-500/0 rounded-full"
          animate={{ 
            x: [0, -15, 15, -10, 10, -5, 5, 0],
            y: [0, 15, -15, 10, -10, 5, -5, 0],
            opacity: [0, 0.8, 0] 
          }}
          transition={{ delay: 1.6, duration: 0.6 }}
        />
      </div>

      <motion.h2
        className="mt-12 text-xl md:text-3xl tracking-[0.3em] font-cinzel text-red-500 uppercase drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Derrota Deshonrosa
      </motion.h2>
    </motion.div>
  );
};

export default SurrenderTransition;
