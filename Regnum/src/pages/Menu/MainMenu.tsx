import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword,
  Trophy,
  BookOpen,
  Settings,
  LogOut,
  Pen,
  Coins,
  Wine
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import SettingsModal from '../../components/Modal/SettingsModal';
import StatsModal from '../../components/Modal/StatsModal';
import RankingsModal from '../../components/Modal/RankingsModal';
import GameControls from '../../components/UI/GameControls';
import FireParticles from '../../components/UI/FireParticles';
import { BarChart2 } from 'lucide-react';

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
  // Estados para controlar la visibilidad de los modales
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isRankingsOpen, setIsRankingsOpen] = useState(false);
  
  const navigate = useNavigate();

  // Definición de las opciones del menú principal
  const menuItems = [
    { id: 'new-game', text: 'Nueva Partida', icon: <Sword size={20} />, primary: true },
    { id: 'rankings', text: 'Rankings', icon: <Trophy size={20} />, primary: false },
    { id: 'gallery', text: 'Galería de Cartas', icon: <BookOpen size={20} />, primary: false },
    { id: 'settings', text: 'Ajustes', icon: <Settings size={20} />, primary: false },
    { id: 'exit', text: 'Salir', icon: <LogOut size={20} />, primary: false },
  ];

  /**
   * Maneja las acciones de cada botón del menú
   */
  const handleAction = (id: string) => {
    console.log('Menú - Acción pulsada:', id);
    switch (id) {
      case 'settings':
        setIsSettingsOpen(true);
        break;
      case 'gallery':
        navigate('/gallery');
        break;
      case 'rankings':
        setIsRankingsOpen(true);
        break;
      case 'exit':
        // Simulación de salida recargando la página
        window.location.reload();
        break;
      default:
        console.log('Acción no implementada:', id);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 overflow-hidden bg-menu-pattern transition-all duration-500">

      {/* Partículas de fuego ambientales */}
      <FireParticles />

      {/* Controles globales (Sonido, Tema) */}
      <GameControls />

      {/* Botón de Estadísticas (Superior Izquierda) */}
      <div className="absolute top-8 left-8 z-10 animate-fade-in-down">
        <button
          onClick={() => setIsStatsOpen(true)}
          className="p-3 border border-accent-gray bg-panel/50 text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all duration-300 rounded-sm flex items-center gap-2 group shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          title="Ver Estadísticas"
        >
          <BarChart2 size={20} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs uppercase tracking-widest font-cinzel hidden md:block">Estadísticas</span>
        </button>
      </div>

      {/* Cabecera con el título del juego */}
      <header className="mb-12 text-center animate-fade-in-down relative z-10">
        <h1 className="mb-2 text-5xl font-black tracking-widest uppercase md:text-7xl font-cinzel-decorative text-gold-gradient drop-shadow-[0_0_20px_rgba(166,138,100,0.5)]">
          Regnum Hollow
        </h1>
        <div className="flex items-center justify-center gap-6">
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-accent-gray to-transparent" />
          <span className="text-sm tracking-widest uppercase font-cinzel text-gray-400">
            Bienvenido, {user.name}
          </span>
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-accent-gray to-transparent" />
        </div>
      </header>

      {/* Contenedor de botones principales */}
      <main className="flex flex-col gap-6 w-full max-w-[400px] animate-fade-in-up [animation-delay:300ms] relative z-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleAction(item.id)}
            className={`
              relative flex flex-col items-center justify-center gap-2 p-6 transition-all duration-300 group overflow-hidden
              ${item.primary
                ? 'bg-primary-gold text-bg-main border-primary-gold font-extrabold shadow-[0_0_25px_rgba(166,138,100,0.4)] hover:scale-[1.03] hover:bg-[#c4a47a] hover:shadow-[0_0_40px_rgba(166,138,100,0.6)]'
                : 'bg-panel/40 text-text-main/70 border border-accent-gray hover:bg-panel/80 hover:border-primary-gold hover:text-text-main hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(166,138,100,0.15)]'
              }
            `}
          >
            {/* Ornamentos de esquina */}
            <CornerDecoration />

            {/* Brillo animado al pasar el ratón */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

            <div className={`${item.primary ? 'text-bg-main drop-shadow-sm' : 'text-primary-gold group-hover:text-white transition-colors'}`}>
              {item.icon}
            </div>
            <span className="text-base tracking-[0.2em] uppercase font-cinzel">
              {item.text}
            </span>
          </button>
        ))}
      </main>

      {/* Pie de página con iconos de palos */}
      <footer className="mt-16 text-center animate-fade-in-up [animation-delay:600ms] relative z-10">
        <div className="flex justify-center gap-5 mb-8">
          <Sword className="text-[#ff4d4d] opacity-60 hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(255,77,77,0.5)]" size={18} />
          <Pen className="text-[#00ff66] opacity-60 hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]" size={18} />
          <Coins className="text-[#ffcc00] opacity-60 hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(255,204,0,0.5)]" size={18} />
          <Wine className="text-[#00ccff] opacity-60 hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(0,204,255,0.5)]" size={18} />
        </div>
        <p className="text-sm italic opacity-50 font-spectral tracking-wide text-text-main">
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
      </AnimatePresence>
    </div>
  );
};

export default MainMenu;
