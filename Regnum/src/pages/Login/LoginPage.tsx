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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-main bg-menu-pattern relative overflow-hidden transition-colors duration-500">
      
      {/* Global Controls */}
      <GameControls />

      {/* Title Section */}
      <header className="mb-12 text-center animate-fade-in-down">
        <h1 className="text-6xl md:text-8xl font-cinzel-decorative text-gold-gradient mb-2 drop-shadow-2xl">
          Regnum Hollow
        </h1>
        <p className="font-cinzel text-sm md:text-base tracking-[0.4em] text-gray-500 uppercase">
          Voluntas Vincit
        </p>
      </header>

      {/* Login Box */}
      <main className="w-full max-w-md animate-fade-in-up [animation-delay:300ms]">
        <div className="bg-panel/30 border border-accent-gray p-10 relative">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-gold -translate-x-1 -translate-y-1 opacity-60" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-gold translate-x-1 -translate-y-1 opacity-60" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-gold -translate-x-1 translate-y-1 opacity-60" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-gold translate-x-1 translate-y-1 opacity-60" />

          <form onSubmit={handleLogin} className="space-y-6 font-spectral">
            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 ml-1">
                Nombre de Caballero
              </label>
              <div className="relative group">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary-gold transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu nombre..."
                  className="w-full bg-bg-main/50 border border-accent-gray py-3 pl-10 pr-4 text-sm focus:border-primary-gold focus:outline-none transition-all placeholder:text-gray-700 text-text-main"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary-gold transition-colors" />
                <input
                  type="password"
                  placeholder="Tu clave secreta..."
                  className="w-full bg-bg-main/50 border border-accent-gray py-3 pl-10 pr-4 text-sm focus:border-primary-gold focus:outline-none transition-all placeholder:text-gray-700 text-text-main"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-gold/80 text-bg-main py-4 font-cinzel text-xs uppercase tracking-[0.3em] font-bold hover:bg-primary-gold transition-all shadow-xl hover:scale-[1.01] active:scale-[0.98]"
            >
              Entrar al Reino
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-accent-gray/30" />
              <span className="text-[10px] uppercase tracking-widest text-gray-600">o</span>
              <div className="h-px flex-1 bg-accent-gray/30" />
            </div>

            <button
              type="button"
              onClick={handleGuestEntry}
              className="w-full border border-accent-gray text-gray-400 py-3 font-cinzel text-xs uppercase tracking-[0.2em] hover:border-primary-gold hover:text-white transition-all"
            >
              Continuar como Invitado
            </button>
          </form>
        </div>

        {/* Register Link */}
        <div className="mt-8 text-center animate-fade-in-up [animation-delay:500ms]">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-primary-gold transition-all"
          >
            ¿Nuevo en el reino? <span className="font-bold border-b border-primary-gold/30">Regístrate aquí</span>
          </button>
        </div>
      </main>

      <footer className="absolute bottom-8 text-center opacity-30 text-[10px] uppercase tracking-[0.3em] font-spectral text-text-main">
        <p>Un proyecto de DAW - 2026</p>
        <p className="mt-1">Cuatro palos. Un solo reino.</p>
      </footer>

      {/* Register Modal */}
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </div>
  );
};

export default LoginPage;
