import React from 'react';
import { motion } from 'framer-motion';

const FireParticles: React.FC = () => {
  const particles = Array.from({ length: 30 });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 rounded-full bg-gradient-to-t from-orange-600 via-red-500 to-transparent"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: window.innerHeight + 10,
            opacity: Math.random() * 0.5 + 0.2,
            scale: Math.random() * 4 + 2
          }}
          animate={{ 
            y: -100,
            x: `calc(${Math.random() * window.innerWidth}px + ${Math.random() * 100 - 50}px)`,
            opacity: 0,
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: Math.random() * 5 + 3,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 5
          }}
          style={{
            width: Math.random() * 6 + 2,
            height: Math.random() * 10 + 5,
            filter: 'blur(1px)'
          }}
        />
      ))}
      
      {/* Glow at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-900/20 to-transparent blur-3xl" />
    </div>
  );
};

export default FireParticles;
