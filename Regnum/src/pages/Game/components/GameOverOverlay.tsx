import React, { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Crown, ShieldOff, RotateCcw, Home, Trophy, Flame } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { createAudioWithFallback } from '../../../utils/audioFallback';

interface GameOverOverlayProps {
  result: 'victory' | 'defeat';
  userName: string;
  onRestart: () => void;
  onMainMenu: () => void;
  /** Si es una rendición (derrota deshonrosa) */
  dishonorable?: boolean;
}

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  flicker: boolean;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  waveFrequency: number;
  waveAmplitude: number;
  angle: number;
  decay: number;
}

interface Smoke {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  growth: number;
  decay: number;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  result,
  userName,
  onRestart,
  onMainMenu,
  dishonorable = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings, stopMusic } = useSettings();

  // Play result audio on mount with Cloudinary fallback
  useEffect(() => {
    // Stop battle music first
    stopMusic();
    const volume = settings.sfxVolume ?? 0.5;
    if (result === 'victory') {
      createAudioWithFallback(
        'Assets/Folders/Home/regnumhollow/background/winning-loop.mp3',
        '/audio/regnum/background/winning-loop.mp3',
        volume,
        true  // loop
      );
    } else {
      // Defeat SFX (local fallback)
      createAudioWithFallback(
        'Assets/Folders/Home/regnumhollow/background/mixkit-circus-lose.wav',
        '/audio/regnum/background/mixkit-circus-lose.wav',
        volume,
        false
      );

      // Solo en derrota normal (no rendición), reproducir voz de narrador
      if (!dishonorable) {
        const voices = [
          {
            cloudinary: 'Assets/Folders/Home/regnumhollow/background/battle_lost.mp3',
            local: '/audio/regnum/background/battle_lost.mp3',
          },
          {
            cloudinary: 'Assets/Folders/Home/regnumhollow/background/battle_lost.mp3',
            local: '/audio/regnum/background/battle_lost.mp3',
          },
          {
            cloudinary: 'Assets/Folders/Home/regnumhollow/background/battle_lost.mp3',
            local: '/audio/regnum/background/battle_lost.mp3',
          },
        ];
        const voice = voices[Math.floor(Math.random() * voices.length)];
        setTimeout(() => {
          createAudioWithFallback(voice.cloudinary, voice.local, volume, false);
        }, 800);
      }
    }
  }, [result, settings.sfxVolume, stopMusic]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let sparkles: Sparkle[] = [];
    let embers: Ember[] = [];
    let smokes: Smoke[] = [];
    let rayAngle = 0;

    // Ajustar tamaño del canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Paletas de color medievales premium
    const goldColors = [
      'rgba(212, 187, 146, #ALPHA#)', // Gold
      'rgba(166, 138, 100, #ALPHA#)', // Darker Gold
      'rgba(255, 215, 0, #ALPHA#)',   // Pure Gold
      'rgba(255, 239, 180, #ALPHA#)', // Champagne/Light
      'rgba(230, 180, 80, #ALPHA#)',  // Warm Amber
    ];

    const fireColors = [
      'rgba(239, 68, 68, #ALPHA#)',   // Red
      'rgba(249, 115, 22, #ALPHA#)',  // Orange
      'rgba(245, 158, 11, #ALPHA#)',  // Amber
      'rgba(220, 38, 38, #ALPHA#)',   // Crimson
      'rgba(60, 10, 10, #ALPHA#)',    // Charcoal/Dark Red
    ];

    const createExplosion = (x: number, y: number, count: number = 30) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        const colorTemplate = goldColors[Math.floor(Math.random() * goldColors.length)];
        const alpha = Math.random() * 0.7 + 0.3;

        sparkles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 2), // tendecia a explotar ligeramente arriba
          size: Math.random() * 3 + 1.5,
          color: colorTemplate.replace('#ALPHA#', alpha.toString()),
          alpha: alpha,
          decay: Math.random() * 0.015 + 0.008,
          gravity: 0.12,
          flicker: Math.random() > 0.4,
        });
      }
    };

    // Crear fuegos artificiales esporádicos para la victoria
    let lastExplosionTime = 0;

    // Loop de animación principal
    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result === 'victory') {
        // --- ESTRUCTURA DE VICTORIA ---
        // 1. Dibujar destello de fondo (glow central)
        const radialGlow = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          50,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) / 2
        );
        radialGlow.addColorStop(0, 'rgba(166, 138, 100, 0.12)');
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Dibujar rayos celestiales dorados rotatorios
        rayAngle += 0.002;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.strokeStyle = 'rgba(166, 138, 100, 0.015)';
        ctx.lineWidth = 4;
        const rayCount = 18;
        for (let i = 0; i < rayCount; i++) {
          ctx.rotate((Math.PI * 2) / rayCount + rayAngle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, Math.max(canvas.width, canvas.height));
          ctx.stroke();
        }
        ctx.restore();

        // 3. Crear explosiones aleatorias de vez en cuando
        if (timestamp - lastExplosionTime > 1200) {
          const rx = Math.random() * (canvas.width - 200) + 100;
          const ry = Math.random() * (canvas.height / 2) + 100;
          createExplosion(rx, ry, Math.floor(Math.random() * 20) + 20);
          lastExplosionTime = timestamp;
        }

        // 4. Crear brillo ambiental lento flotando hacia arriba
        if (Math.random() < 0.1) {
          const colorTemplate = goldColors[Math.floor(Math.random() * goldColors.length)];
          const alpha = Math.random() * 0.4 + 0.1;
          sparkles.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -(Math.random() * 1.2 + 0.5),
            size: Math.random() * 2 + 1,
            color: colorTemplate.replace('#ALPHA#', alpha.toString()),
            alpha: alpha,
            decay: Math.random() * 0.003 + 0.001,
            gravity: -0.01, // flotando levemente
            flicker: true,
          });
        }

        // 5. Dibujar y actualizar partículas
        sparkles = sparkles.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.alpha -= p.decay;

          if (p.alpha <= 0) return false;

          // Dibujar partícula
          ctx.save();
          ctx.beginPath();
          if (p.flicker && Math.random() > 0.5) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          } else {
            ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.alpha})`);
          }
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Resplandor
          if (p.size > 2) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(212, 187, 146, 0.6)';
            ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
          }
          ctx.restore();

          return true;
        });

      } else {
        // --- ESTRUCTURA DE DERROTA ---
        // 1. Dibujar vignette rojo pulsante
        const pulse = 0.05 * Math.sin(timestamp * 0.002) + 0.92;
        const vignette = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          200,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) * 0.7
        );
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, `rgba(30, 4, 4, ${0.4 * pulse})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Generar cenizas/humo
        if (Math.random() < 0.15) {
          smokes.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 50,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(Math.random() * 1.5 + 1.0),
            size: Math.random() * 30 + 20,
            alpha: Math.random() * 0.12 + 0.05,
            color: 'rgba(30, 30, 30, #ALPHA#)',
            growth: Math.random() * 0.12 + 0.05,
            decay: Math.random() * 0.0012 + 0.0006,
          });
        }

        // 3. Generar ascuas ardiendo que suben flotando en onda sinusoidal
        if (Math.random() < 0.4) {
          const colorTemplate = fireColors[Math.floor(Math.random() * fireColors.length)];
          const alpha = Math.random() * 0.6 + 0.4;
          embers.push({
            x: Math.random() * canvas.width,
            y: canvas.height + 20,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(Math.random() * 2.0 + 1.2),
            size: Math.random() * 3.5 + 1.0,
            alpha: alpha,
            color: colorTemplate.replace('#ALPHA#', alpha.toString()),
            waveFrequency: Math.random() * 0.02 + 0.005,
            waveAmplitude: Math.random() * 1.5 + 0.5,
            angle: Math.random() * Math.PI * 2,
            decay: Math.random() * 0.004 + 0.002,
          });
        }

        // 4. Dibujar humo
        smokes = smokes.filter((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.size += s.growth;
          s.alpha -= s.decay;

          if (s.alpha <= 0) return false;

          ctx.beginPath();
          ctx.fillStyle = s.color.replace('#ALPHA#', s.alpha.toString());
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
          return true;
        });

        // 5. Dibujar ascuas
        embers = embers.filter((e) => {
          e.angle += e.waveFrequency;
          e.x += e.vx + Math.sin(e.angle) * e.waveAmplitude * 0.1;
          e.y += e.vy;
          e.alpha -= e.decay;

          if (e.alpha <= 0) return false;

          ctx.save();
          ctx.beginPath();
          ctx.fillStyle = e.color.replace(/[\d.]+\)$/, `${e.alpha})`);
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          return true;
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Lanzar primera explosión inicial de victoria
    if (result === 'victory') {
      setTimeout(() => {
        createExplosion(canvas.width / 2, canvas.height / 3, 50);
        createExplosion(canvas.width / 3, canvas.height / 2, 35);
        createExplosion((canvas.width * 2) / 3, canvas.height / 2, 35);
      }, 300);
    }

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [result]);

  const isVic = result === 'victory';

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 35, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120, damping: 15 },
    },
  };

  const badgeVariants: Variants = {
    hidden: { scale: 0.2, rotate: -45, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 150, damping: 12, delay: 0.2 },
    },
  };

  const crownSparkleVariants: Variants = {
    animate: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      filter: [
        'drop-shadow(0 0 10px rgba(212,187,146,0.6))',
        'drop-shadow(0 0 25px rgba(255,215,0,0.9))',
        'drop-shadow(0 0 10px rgba(212,187,146,0.6))',
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const brokenShieldVariants: Variants = {
    animate: {
      y: [0, -3, 0],
      rotate: [0, -3, 3, -2, 0],
      filter: [
        'drop-shadow(0 0 8px rgba(220,38,38,0.5))',
        'drop-shadow(0 0 20px rgba(239,68,68,0.8))',
        'drop-shadow(0 0 8px rgba(220,38,38,0.5))',
      ],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 overflow-hidden font-spectral">
      {/* Canvas para partículas interactivas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Contenedor principal con efectos glassmorphism medieval */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`relative ${dishonorable ? 'max-w-2xl' : 'max-w-lg'} w-full z-20 p-8 md:p-12 rounded-3xl border text-center backdrop-blur-xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden ${
          isVic
            ? 'bg-[#080d08]/75 border-primary-gold/45 shadow-[0_0_50px_rgba(166,138,100,0.15)]'
            : 'bg-[#0f0909]/75 border-red-950/45 shadow-[0_0_50px_rgba(220,38,38,0.1)]'
        }`}
      >
        {/* Adornos esquineros estilo manuscrito medieval */}
        <div className={`absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 opacity-35 ${isVic ? 'border-primary-gold' : 'border-red-700'}`} />
        <div className={`absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 opacity-35 ${isVic ? 'border-primary-gold' : 'border-red-700'}`} />
        <div className={`absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 opacity-35 ${isVic ? 'border-primary-gold' : 'border-red-700'}`} />
        <div className={`absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 opacity-35 ${isVic ? 'border-primary-gold' : 'border-red-700'}`} />

        {/* 1. Emblem Medallón central */}
        <motion.div variants={badgeVariants} className="flex justify-center mb-6 relative">
          {/* Brillos mágicos tras el emblema */}
          <div
            className={`absolute w-32 h-32 rounded-full filter blur-2xl opacity-45 -z-10 animate-pulse ${
              isVic ? 'bg-primary-gold/30' : 'bg-red-600/20'
            }`}
          />

          <motion.div
            variants={isVic ? crownSparkleVariants : brokenShieldVariants}
            animate="animate"
            className={`w-24 h-24 rounded-full flex items-center justify-center border-2 shadow-inner bg-gradient-to-b ${
              isVic
                ? 'from-[#1c1813] to-[#0c0a08] border-primary-gold/60 shadow-[0_0_20px_rgba(166,138,100,0.3)]'
                : 'from-[#1a0e0e] to-[#0b0505] border-red-900/60 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
            }`}
          >
            {isVic ? (
              <Crown className="w-12 h-12 text-[#ffcc00] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            ) : (
              <ShieldOff className="w-12 h-12 text-red-500 filter drop-shadow-[0_2px_4px_rgba(220,38,38,0.6)]" />
            )}
          </motion.div>
        </motion.div>

        {/* 2. Título de Victoria o Derrota */}
        <motion.h1
          variants={itemVariants}
          className={`text-5xl md:text-7xl font-cinzel font-black tracking-[0.08em] mb-4 drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)] ${
            isVic
              ? 'text-gold-gradient bg-clip-text'
              : 'text-transparent bg-gradient-to-b from-red-500 via-red-600 to-red-800 bg-clip-text'
          }`}
          style={{
            WebkitBackgroundClip: 'text',
          }}
        >
          {isVic ? 'VICTORIA' : dishonorable ? 'RENDICIÓN DESHONROSA' : 'DERROTA'}
        </motion.h1>

        {/* Separador de línea con florón */}
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 my-4 opacity-75">
          <div className={`h-px w-16 bg-gradient-to-r ${isVic ? 'from-transparent to-primary-gold' : 'from-transparent to-red-600'}`} />
          {isVic ? (
            <Trophy className="w-3.5 h-3.5 text-primary-gold" />
          ) : (
            <Flame className="w-3.5 h-3.5 text-red-500" />
          )}
          <div className={`h-px w-16 bg-gradient-to-l ${isVic ? 'from-transparent to-primary-gold' : 'from-transparent to-red-600'}`} />
        </motion.div>

        {/* 3. Mensaje e Historial/Contexto del jugador */}
        <motion.div variants={itemVariants} className="space-y-3 mb-10 max-w-sm mx-auto">
          <h3 className="text-white text-lg font-cinzel uppercase tracking-[0.2em] font-semibold">
            {isVic ? `¡Larga vida, Sir ${userName}!` : `Tu reino ha caído, ${userName}`}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed font-spectral">
            {isVic
              ? 'Has demostrado una destreza táctica legendaria en el tablero. Tu nombre se cantará en las tabernas de todo Regnum por generaciones.'
              : dishonorable
                ? 'Tu cobardía ha manchado el honor de tu linaje. Los gritos de los tuyos resuenan en la oscuridad mientras el trono cae en manos del enemigo.'
                : 'La implacable voluntad del enemigo ha prevalecido sobre tu ejército. Los estandartes se han quemado y la oscuridad acecha el trono.'}
          </p>
        </motion.div>

        {/* 4. Botones de acción */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Botón Volver a Jugar */}
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRestart}
            className={`relative flex items-center justify-center gap-2.5 w-full sm:flex-1 py-4 px-8 font-cinzel font-black uppercase tracking-[0.2em] text-[11px] rounded-lg border transition-all duration-300 shadow-lg cursor-pointer ${
              isVic
                ? 'bg-gradient-to-b from-[#d4bb92]/20 to-[#a68a64]/10 text-primary-gold border-primary-gold/50 hover:border-primary-gold hover:shadow-[0_0_20px_rgba(166,138,100,0.3)]'
                : 'bg-gradient-to-b from-red-950/40 to-red-950/20 text-red-400 border-red-900/40 hover:border-red-500 hover:text-red-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Volver a Jugar</span>
            {/* Sheen de luz animado en hover */}
            <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          </motion.button>

          {/* Botón Menú Principal */}
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onMainMenu}
            className="flex items-center justify-center gap-2.5 w-full sm:flex-1 py-4 px-8 font-cinzel font-semibold uppercase tracking-[0.2em] text-[11px] bg-white/[0.03] text-gray-300 rounded-lg border border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-white/20 transition-all duration-300 shadow-md cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Menú Principal</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};
