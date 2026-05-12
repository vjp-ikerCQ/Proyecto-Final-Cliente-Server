import React, { useState } from 'react';
import { User, Lock, UserPlus } from 'lucide-react';
import RegisterModal from '../../components/Modal/RegisterModal';
import GameControls from '../../components/UI/GameControls';

interface LoginPageProps {
  onLogin: (name: string, isGuest: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleGuestEntry = () => {
    onLogin('Invitado', true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username, false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-between p-4 md:p-6 bg-bg-main bg-menu-pattern relative overflow-hidden transition-colors duration-500">
      
      {/* Global Controls */}
      <GameControls />

      {/* Title Section */}
      <header className="mt-6 md:mt-12 text-center animate-fade-in-down px-4 shrink-0">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-cinzel-decorative text-gold-gradient mb-1 md:mb-2 drop-shadow-2xl">
          Regnum Hollow
        </h1>
        <p className="font-cinzel text-[9px] sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.4em] text-gray-500 uppercase">
          Voluntas Vincit
        </p>
      </header>

      {/* Login Box */}
      <main className="w-full max-w-sm md:max-w-md animate-fade-in-up [animation-delay:300ms] px-4 shrink">
        <div className="bg-panel/30 border border-accent-gray p-6 md:p-10 relative">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary-gold -translate-x-1 -translate-y-1 opacity-60" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary-gold translate-x-1 -translate-y-1 opacity-60" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary-gold -translate-x-1 translate-y-1 opacity-60" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary-gold translate-x-1 translate-y-1 opacity-60" />

          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6 font-spectral">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 ml-1">
                Nombre de Caballero
              </label>
              <div className="relative group">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary-gold transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tu nombre..."
                  className="w-full bg-bg-main/50 border border-accent-gray py-2.5 md:py-3 pl-10 pr-4 text-xs focus:border-primary-gold focus:outline-none transition-all text-text-main"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-gold/80 text-bg-main py-3 md:py-4 font-cinzel text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold hover:bg-primary-gold transition-all shadow-xl active:scale-95"
            >
              Entrar al Reino
            </button>

            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-accent-gray/30" />
              <span className="text-[8px] uppercase tracking-widest text-gray-600">o</span>
              <div className="h-px flex-1 bg-accent-gray/30" />
            </div>

            <button
              type="button"
              onClick={handleGuestEntry}
              className="w-full border border-accent-gray text-gray-400 py-2.5 md:py-3 font-cinzel text-[10px] md:text-xs uppercase tracking-[0.2em] hover:border-primary-gold hover:text-white transition-all active:scale-95"
            >
              Invitado
            </button>
          </form>
        </div>

        {/* Register Link */}
        <div className="mt-4 md:mt-8 text-center">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-primary-gold transition-all"
          >
            ¿Eres nuevo? <span className="font-bold border-b border-primary-gold/30 ml-1">Regístrate</span>
          </button>
        </div>
      </main>

      <footer className="mb-4 text-center opacity-30 text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-spectral text-text-main shrink-0">
        <p>DAW - 2026 • Cuatro palos. Un solo reino.</p>
      </footer>

      {/* Register Modal */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
};

export default LoginPage;
