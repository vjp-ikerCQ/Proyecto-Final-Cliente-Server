import React, { useState, useEffect } from 'react';
import { User, Lock, Scale, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RegisterModal from '../../components/Modal/RegisterModal';
import GameControls from '../../components/UI/GameControls';
import { useSettings, MUSIC_KEYS } from '../../contexts/SettingsContext';

interface LoginPageProps {
  onLogin: (name: string, isGuest: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const { playMusic } = useSettings();

  useEffect(() => {
    playMusic(MUSIC_KEYS.MENU);
  }, [playMusic]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Estados para Apelación de Baneo
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [bannedUser, setBannedUser] = useState('');
  const [appealMessage, setAppealMessage] = useState('');
  const [appealSending, setAppealSending] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState(false);
  const [appealError, setAppealError] = useState(false);

  const triggerFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.warn("La solicitud de pantalla completa fue rechazada o bloqueada por el navegador:", err);
      });
    }
  };

  const handleGuestEntry = () => {
    triggerFullscreen();
    onLogin('Invitado', true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBannedUser('');
    
    if (!username.trim() || !password.trim()) {
      setError(t('login.error_empty'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: username, password: password }),
      });
      const data = await response.json();
      if (data.success) {
        triggerFullscreen();
        onLogin(data.usuario.nombre, false);
      } else {
        setError(data.message || t('login.error_empty'));
        // Si el estado es 403 o el mensaje contiene baneo/baneado/baneada, activamos apelación
        if (response.status === 403 || data.message?.toLowerCase().includes('banead')) {
          setBannedUser(username);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('login.error_server'));
    } finally {
      setLoading(false);
    }
  };

  const handleAppealSubmit = async () => {
    if (!appealMessage.trim()) return;
    setAppealSending(true);
    setAppealError(false);

    const ticketId = "AP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1505898673169633443/6OkHxa5kdfbfSNZc0PrgDCMHqGiGSuMrCkIimWxlZyNWnGUz01zomwNbf_0c4htnagJ5";

    const payload = {
      embeds: [
        {
          title: "⚖️ Nueva Apelación de Baneo",
          color: 13631488, // Rojo oscuro medieval (#cf142b)
          fields: [
            {
              name: "🆔 ID de Apelación",
              value: `\`${ticketId}\``,
              inline: true
            },
            {
              name: "👤 Jugador Baneado",
              value: bannedUser,
              inline: true
            },
            {
              name: "📂 Tipo",
              value: "Apelación de Baneo",
              inline: true
            },
            {
              name: "🌐 Pantalla",
              value: "Login (Apelación)",
              inline: true
            },
            {
              name: "📝 Mensaje de Apelación",
              value: appealMessage,
              inline: false
            }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      // 1. Enviar a Discord Webhook
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 2. Guardar en Base de Datos de tickets
      await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: bannedUser,
          type: 'Apelación',
          message: `[APELACIÓN DE BANEO] - ${appealMessage}`
        })
      }).catch(err => console.error("Error al guardar ticket en DB:", err));

      if (response.ok) {
        setAppealSuccess(true);
        setAppealMessage('');
      } else {
        setAppealError(true);
      }
    } catch (error) {
      console.error("Error al enviar apelación:", error);
      setAppealError(true);
    } finally {
      setAppealSending(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-between p-4 md:p-6 bg-bg-main bg-menu-pattern relative overflow-hidden transition-colors duration-500">
      
      <GameControls />

      <header className="mt-6 md:mt-12 text-center animate-fade-in-down px-4 shrink-0">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-cinzel-decorative text-gold-gradient mb-1 md:mb-2 drop-shadow-2xl">
          Regnum Hollow
        </h1>
        <p className="font-cinzel text-[9px] sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.4em] text-gray-500 uppercase">
          {t('login.subtitle')}
        </p>
      </header>

      <main className="w-full max-w-sm md:max-w-md animate-fade-in-up [animation-delay:300ms] px-4 shrink">
        <div className="bg-panel/30 border border-accent-gray p-6 md:p-10 relative">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary-gold -translate-x-1 -translate-y-1 opacity-60" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary-gold translate-x-1 -translate-y-1 opacity-60" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary-gold -translate-x-1 translate-y-1 opacity-60" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary-gold translate-x-1 translate-y-1 opacity-60" />

          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6 font-spectral">
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 p-4 text-[10px] text-red-200 text-center uppercase tracking-widest flex flex-col items-center gap-3">
                <span>{error}</span>
                {bannedUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppealMessage('');
                      setAppealSuccess(false);
                      setAppealError(false);
                      setShowAppealModal(true);
                    }}
                    className="px-4 py-2 bg-red-800/80 hover:bg-red-700 border border-red-500/30 text-white rounded font-cinzel text-[9px] uppercase tracking-[0.2em] font-black transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-95"
                  >
                    Apelar Baneo
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 ml-1">
                {t('login.username')}
              </label>
              <div className="relative group">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary-gold transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('login.usernamePlaceholder')}
                  className="w-full bg-bg-main/50 border border-accent-gray py-2.5 md:py-3 pl-10 pr-4 text-xs focus:border-primary-gold focus:outline-none transition-all text-text-main"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 ml-1">
                {t('login.password')}
              </label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary-gold transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="w-full bg-bg-main/50 border border-accent-gray py-2.5 md:py-3 pl-10 pr-4 text-xs focus:border-primary-gold focus:outline-none transition-all text-text-main"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-primary-gold/80 hover:bg-primary-gold'} text-bg-main py-3 md:py-4 font-cinzel text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold transition-all shadow-xl active:scale-95`}
            >
              {loading ? t('login.loading') : t('login.submit')}
            </button>

            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-accent-gray/30" />
              <span className="text-[8px] uppercase tracking-widest text-gray-600">{t('login.divider')}</span>
              <div className="h-px flex-1 bg-accent-gray/30" />
            </div>

            <button
              type="button"
              onClick={handleGuestEntry}
              className="w-full border border-accent-gray text-gray-400 py-2.5 md:py-3 font-cinzel text-[10px] md:text-xs uppercase tracking-[0.2em] hover:border-primary-gold hover:text-white transition-all active:scale-95"
            >
              {t('login.guest')}
            </button>
          </form>
        </div>

        <div className="mt-4 md:mt-8 text-center">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-primary-gold transition-all"
          >
            {t('login.register')} <span className="font-bold border-b border-primary-gold/30 ml-1">{t('login.registerLink')}</span>
          </button>
        </div>
      </main>

      <footer className="mb-4 text-center opacity-30 text-[8px] md:text-[10px] uppercase tracking-[0.3em] font-spectral text-text-main shrink-0">
        <p>{t('footer')}</p>
      </footer>

      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />

      {/* Modal de Apelación de Baneo */}
      {showAppealModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-modal border border-red-900/40 p-6 rounded-lg w-full max-w-md font-spectral animate-fade-in-up shadow-[0_0_40px_rgba(239,68,68,0.1)] relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-600 -translate-x-1 -translate-y-1 opacity-55" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-600 translate-x-1 -translate-y-1 opacity-55" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-600 -translate-x-1 translate-y-1 opacity-55" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-600 translate-x-1 translate-y-1 opacity-55" />
            
            <h2 className="font-cinzel text-xl text-red-500 mb-6 text-center tracking-widest font-black uppercase">Apelar Baneo</h2>
            
            {appealSuccess ? (
              <div className="text-center mb-6 py-4">
                <div className="w-16 h-16 bg-red-950/20 border border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-text-main text-base mb-2">¡Apelación enviada con éxito!</p>
                <p className="text-secondary-theme text-xs">El equipo de administración revisará tu caso en Discord.</p>
                <button 
                  onClick={() => setShowAppealModal(false)}
                  className="mt-6 bg-red-800/80 hover:bg-red-700 text-white font-cinzel font-bold px-6 py-2 rounded-lg transition-colors cursor-pointer text-xs"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-center">
                  <div className="w-12 h-12 bg-red-950/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Scale className="w-6 h-6 text-red-500" />
                  </div>
                  <p className="text-sm text-text-main">
                    Estás apelando el baneo de la cuenta: <span className="text-red-400 font-bold font-cinzel">{bannedUser}</span>
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="block text-secondary-theme font-cinzel text-xs uppercase tracking-wider">Mensaje de Apelación</label>
                    <span className={`text-xs ${appealMessage.length > 500 ? 'text-red-500' : 'text-text-muted'}`}>
                      {appealMessage.length} / 500
                    </span>
                  </div>
                  <textarea 
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value.substring(0, 500))}
                    placeholder="Escribe aquí los motivos o justificación para que los administradores revisen tu caso..."
                    className="w-full bg-panel-secondary border border-red-900/30 text-text-main p-3 rounded-lg h-36 resize-none focus:outline-none focus:border-red-500 transition-colors custom-scrollbar placeholder:text-gray-600 text-xs"
                  />
                </div>

                {appealError && (
                  <p className="text-red-500 text-xs mb-4 text-center">Hubo un error al enviar la apelación. Inténtalo de nuevo.</p>
                )}

                <div className="flex justify-end gap-3 font-cinzel text-xs">
                  <button 
                    onClick={() => setShowAppealModal(false)}
                    className="bg-panel-secondary text-text-main px-5 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAppealSubmit}
                    disabled={appealSending || !appealMessage.trim()}
                    className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 ${
                      appealSending || !appealMessage.trim()
                        ? 'bg-accent-gray text-text-muted cursor-not-allowed' 
                        : 'bg-red-800/80 text-white hover:bg-red-700 border border-red-500/30 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    }`}
                  >
                    {appealSending ? 'Enviando...' : 'Enviar Apelación'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
