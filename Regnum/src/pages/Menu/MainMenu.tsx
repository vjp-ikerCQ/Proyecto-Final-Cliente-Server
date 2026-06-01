import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import {
  Sword,
  Trophy,
  BookOpen,
  Settings,
  LogOut,
  Pen,
  Coins,
  Wine,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import SettingsModal from '../../components/Modal/SettingsModal';
import StatsModal from '../../components/Modal/StatsModal';
import RankingsModal from '../../components/Modal/RankingsModal';
import DifficultyModal from '../../components/Modal/DifficultyModal';
import GameControls from '../../components/UI/GameControls';
import FireParticles from '../../components/UI/FireParticles';
import AtmosphereParticles from '../../components/AtmosphereParticles';
import { BarChart2 } from 'lucide-react';

import { useSettings, MUSIC_KEYS } from '../../contexts/SettingsContext';

import GalleryTransition from '../../components/UI/GalleryTransition';
import LogoutTransition from '../../components/UI/LogoutTransition';

/**
 * Propiedades para el componente MainMenu
 */
interface MainMenuProps {
  user: { name: string; isGuest: boolean };
}

/**
 * Decoración de esquinas para los botones del menú
 */
const CornerDecoration = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" />
  </>
);

/**
 * Componente principal del Menú de Inicio
 */
const MainMenu: React.FC<MainMenuProps> = ({ user }) => {
  const { t } = useTranslation();
  const { playMusic, playSfx } = useSettings();
  
  // Estados para controlar la visibilidad de los modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isRankingsOpen, setIsRankingsOpen] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isGalleryTransitioning, setIsGalleryTransitioning] = useState(false);
  const [isLogoutTransitioning, setIsLogoutTransitioning] = useState(false);
  
  const navigate = useNavigate();

  // Reproducir música del menú al montar (con fallback Cloudinary ↔ Local)
  useEffect(() => {
    playMusic(MUSIC_KEYS.MENU.local);
  }, [playMusic]);

  const menuItems = [];

  // El admin no puede jugar, solo gestionar
  if (user.name !== 'admin') {
    menuItems.push({ id: 'new-game', text: t('menu.newGame'), icon: <Sword size={20} />, primary: true });
  }

  menuItems.push(
    { id: 'rankings', text: t('menu.rankings'), icon: <Trophy size={20} />, primary: false },
    { id: 'gallery', text: t('menu.gallery'), icon: <BookOpen size={20} />, primary: false },
    { id: 'settings', text: t('menu.settings'), icon: <Settings size={20} />, primary: false },
  );

  if (user.name === 'admin') {
    // Para el admin, el botón de gestionar es el principal
    menuItems.push({ id: 'admin', text: 'Admin', icon: <Shield size={20} />, primary: true });
  }

  menuItems.push({ id: 'exit', text: t('menu.exit'), icon: <LogOut size={20} />, primary: false });

  /**
   * Maneja las acciones de cada botón del menú
   */
  const handleAction = (id: string) => {
    playSfx();
    console.log('Menú - Acción pulsada:', id);
    switch (id) {
      case 'new-game':
        setIsDifficultyOpen(true);
        break;
      case 'settings':
        setIsSettingsOpen(true);
        break;
      case 'gallery':
        setIsGalleryTransitioning(true);
        break;
      case 'rankings':
        setIsRankingsOpen(true);
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'exit':
        setIsLogoutTransitioning(true);
        break;
      default:
        console.log('Acción no implementada:', id);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-between h-screen p-4 md:p-8 overflow-hidden bg-menu-pattern transition-all duration-500">

      {/* Partículas ambientales */}
      <AtmosphereParticles />
      <FireParticles />

      {/* Controles globales (Sonido, Tema) */}
      <GameControls />

      {/* Botón de Estadísticas (Superior Izquierda) */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 animate-fade-in-down">
        <button
          onClick={() => {
            playSfx();
            setIsStatsOpen(true);
          }}
          className="p-2 md:p-3 border border-accent-gray bg-panel/50 text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all duration-300 rounded-sm flex items-center gap-2 group shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          title="Ver Estadísticas"
        >
          <BarChart2 size={16} className="group-hover:scale-110 transition-transform md:w-5 md:h-5" />
          <span className="text-[10px] md:text-xs uppercase tracking-widest font-cinzel hidden lg:block">Estadísticas</span>
        </button>
      </div>

      {/* Cabecera con el título del juego */}
      <header className="mt-4 md:mt-0 text-center animate-fade-in-down relative z-10 px-4 shrink-0">
        <h1 className="mb-1 text-3xl sm:text-5xl md:text-7xl font-black tracking-widest uppercase font-cinzel-decorative text-gold-gradient drop-shadow-[0_0_20px_rgba(166,138,100,0.5)]">
          Regnum Hollow
        </h1>
        <div className="flex items-center justify-center gap-2 md:gap-6">
          <div className="h-px w-6 md:w-20 bg-gradient-to-r from-transparent via-accent-gray to-transparent" />
          <span className="text-[8px] md:text-sm tracking-widest uppercase font-cinzel text-gray-400">
            {t('menu.welcome')}, {user.name}
          </span>
          <div className="h-px w-6 md:w-20 bg-gradient-to-r from-transparent via-accent-gray to-transparent" />
        </div>
      </header>

      {/* Contenedor de botones principales */}
      <main className="flex flex-col gap-2 md:gap-4 w-full max-w-[260px] sm:max-w-[400px] animate-fade-in-up [animation-delay:300ms] relative z-10 px-2 shrink">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleAction(item.id)}
            className={`
              relative flex flex-col items-center justify-center gap-0.5 md:gap-2 p-2.5 md:p-5 transition-all duration-300 group overflow-hidden shrink-0
              ${item.primary
                ? 'bg-primary-gold text-bg-main border-primary-gold font-extrabold shadow-[0_0_20px_rgba(166,138,100,0.3)] active:scale-95'
                : 'bg-panel/40 text-text-main/70 border border-accent-gray hover:bg-panel/80 hover:border-primary-gold hover:text-text-main active:scale-95'
              }
            `}
          >
            <CornerDecoration />
            <div className={`${item.primary ? 'text-bg-main' : 'text-primary-gold group-hover:text-white'} transition-colors`}>
              {React.cloneElement(item.icon as React.ReactElement<{ size?: number }>, { size: (typeof window !== 'undefined' && window.innerWidth < 768) ? 14 : 20 })}
            </div>
            <span className="text-[10px] md:text-base tracking-[0.2em] uppercase font-cinzel">
              {item.text}
            </span>
          </button>
        ))}
      </main>

      {/* Pie de página con iconos de palos */}
      <footer className="mb-4 md:mb-0 text-center animate-fade-in-up [animation-delay:600ms] relative z-10 shrink-0">
        <div className="flex justify-center gap-4 md:gap-5 mb-2 md:mb-6">
          <Sword className="text-[#ff4d4d] opacity-60 w-3.5 h-3.5 md:w-5 md:h-5" />
          <Pen className="text-[#00ff66] opacity-60 w-3.5 h-3.5 md:w-5 md:h-5" />
          <Coins className="text-[#ffcc00] opacity-60 w-3.5 h-3.5 md:w-5 md:h-5" />
          <Wine className="text-[#00ccff] opacity-60 w-3.5 h-3.5 md:w-5 md:h-5" />
        </div>
        <p className="text-[9px] md:text-sm italic opacity-50 font-spectral tracking-wide text-text-main px-4">
          "La baraja decidirá tu reino"
        </p>
      </footer>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}

        {isStatsOpen && (
          <StatsModal
            isOpen={isStatsOpen}
            onClose={() => setIsStatsOpen(false)}
            user={user}
          />
        )}

        {isRankingsOpen && (
          <RankingsModal
            isOpen={isRankingsOpen}
            onClose={() => setIsRankingsOpen(false)}
          />
        )}

        {isDifficultyOpen && (
          <DifficultyModal
            isOpen={isDifficultyOpen}
            onClose={() => setIsDifficultyOpen(false)}
          />
        )}

        {isGalleryTransitioning && (
          <GalleryTransition onComplete={() => navigate('/gallery')} />
        )}

        {isLogoutTransitioning && (
          <LogoutTransition onComplete={() => navigate('/')} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainMenu;

