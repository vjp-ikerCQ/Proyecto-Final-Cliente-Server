import React, { useState } from 'react';
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
import GameControls from '../../components/UI/GameControls';
import FireParticles from '../../components/UI/FireParticles';

interface MainMenuProps {
  user: { name: string; isGuest: boolean };
}

const CornerDecoration = () => (
  <>
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" />
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" />
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-40 group-hover:opacity-100 transition-opacity" />
  </>
);

const MainMenu: React.FC<MainMenuProps> = ({ user }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'new-game', text: 'Nueva Partida', icon: <Sword size={20} />, primary: true },
    { id: 'rankings', text: 'Rankings', icon: <Trophy size={20} />, primary: false },
    { id: 'gallery', text: 'Galería de Cartas', icon: <BookOpen size={20} />, primary: false },
    { id: 'settings', text: 'Ajustes', icon: <Settings size={20} />, primary: false },
    { id: 'exit', text: 'Salir', icon: <LogOut size={20} />, primary: false },
  ];

  const handleAction = (id: string) => {
    if (id === 'settings') {
      setIsSettingsOpen(true);
    }
    if (id === 'gallery') {
      navigate('/gallery');
    }
    if (id === 'exit') {
      window.location.reload();
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 overflow-hidden bg-menu-pattern transition-all duration-500">

      {/* Background Particles */}
      <FireParticles />

      {/* Global Controls */}
      <GameControls />

      {/* Header */}
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

      {/* Buttons */}
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
            {/* Corner Ornaments */}
            <CornerDecoration />

            {/* Animated Glow on Hover */}
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

      {/* Footer */}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default MainMenu;
