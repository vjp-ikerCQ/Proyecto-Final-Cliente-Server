import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

interface LogoutTransitionProps {
  onComplete: () => void;
}

const LogoutTransition: React.FC<LogoutTransitionProps> = ({ onComplete }) => {
  useEffect(() => {
    // Total animation duration before calling onComplete
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative flex flex-col items-center justify-center w-64 h-64">
        {/* Crown dropping and fading */}
        <motion.div
          className="text-primary-gold"
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={{ 
            opacity: [1, 1, 0],
            scale: [1, 1.1, 0.5],
            y: [0, -20, 80],
            rotate: [0, -10, 20],
            filter: ["drop-shadow(0 0 10px rgba(166,138,100,0.8))", "drop-shadow(0 0 30px rgba(166,138,100,1))", "drop-shadow(0 0 0px rgba(166,138,100,0))"]
          }}
          transition={{ duration: 1.8, ease: "easeInOut", times: [0, 0.4, 1] }}
        >
          <Crown size={120} strokeWidth={1} />
        </motion.div>

        {/* Small particle puff on drop */}
        <motion.div
          className="absolute bottom-10 w-4 h-4 bg-primary-gold/50 rounded-full blur-sm"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 8, 12], opacity: [0, 0.8, 0] }}
          transition={{ delay: 1.2, duration: 0.6 }}
        />
      </div>

      <motion.h2
        className="mt-4 text-xl md:text-3xl tracking-[0.4em] font-cinzel text-gray-500 uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 0.3, duration: 1.8, times: [0, 0.2, 1] }}
      >
        El Rey Ha Caído
      </motion.h2>
    </motion.div>
  );
};

export default LogoutTransition;
