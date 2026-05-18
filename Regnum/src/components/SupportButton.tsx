import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Ticket, Check, AlertCircle } from 'lucide-react';

interface SupportButtonProps {
  user: { name: string; isGuest: boolean } | null;
}

export default function SupportButton({ user }: SupportButtonProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [tipoProblema, setTipoProblema] = useState('Error/Bug');
  const [asunto, setAsunto] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const MAX_CHARS = 500;

  // Sistema de Cooldown
  useEffect(() => {
    const lastTime = localStorage.getItem('support_cooldown');
    if (lastTime) {
      const diff = Date.now() - parseInt(lastTime);
      const remaining = 5 * 60 * 1000 - diff; // 5 minutos
      if (remaining > 0) {
        setCooldown(Math.ceil(remaining / 1000));
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [isOpen]); // Recalcular al abrir el modal

  // Solo mostrar en login y menú
  if (location.pathname !== '/login' && location.pathname !== '/menu') {
    return null;
  }

  const handleSend = async () => {
    if (!mensaje.trim() || mensaje.length > MAX_CHARS) return;
    if (tipoProblema === 'Otro' && !asunto.trim()) return;
    if (cooldown > 0) return;
    
    setEnviando(true);
    setStatus('idle');
    
    const ticketId = "TK-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const nombreJugador = user?.name || "Invitado";
    const pantallaActual = location.pathname === '/login' ? 'Login' : 'Menú Principal';
    
    const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1505898673169633443/6OkHxa5kdfbfSNZc0PrgDCMHqGiGSuMrCkIimWxlZyNWnGUz01zomwNbf_0c4htnagJ5";

    const fields = [
      {
        name: "🆔 ID del Ticket",
        value: `\`${ticketId}\``,
        inline: true
      },
      {
        name: "👤 Jugador",
        value: nombreJugador,
        inline: true
      },
      {
        name: "📂 Tipo",
        value: tipoProblema,
        inline: true
      },
      {
        name: "🌐 Pantalla",
        value: pantallaActual,
        inline: true
      }
    ];

    if (tipoProblema === 'Otro') {
      fields.push({
        name: "📌 Asunto",
        value: asunto,
        inline: false
      });
    }

    fields.push({
      name: "📝 Mensaje",
      value: mensaje,
      inline: false
    });

    const payload = {
      embeds: [
        {
          title: "🎫 Nuevo Ticket de Soporte",
          color: 10914404, // Color dorado (#a68a64)
          fields: fields,
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Guardar también en la base de datos local
      fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: nombreJugador,
          type: tipoProblema,
          message: mensaje
        })
      }).catch(err => console.error("Error al guardar ticket en DB:", err));

      if (response.ok) {
        localStorage.setItem('support_cooldown', Date.now().toString());
        setCooldown(5 * 60); // 5 minutos en segundos
        setStatus('success');
        setMensaje('');
        setAsunto('');
        setTipoProblema('Error/Bug');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus('error');
    } finally {
      setEnviando(false);
    }
  };

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <>
      {/* Botón flotante */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-panel border border-accent-gray px-6 py-3 rounded-lg shadow-2xl hover:bg-surface-hover transition-all duration-300 z-50 cursor-pointer group"
      >
        <span className="font-cinzel font-bold flex items-center gap-2 transition-colors">
          <span className="text-gold-gradient group-hover:text-white transition-colors">Soporte</span>
          <Ticket className="w-5 h-5 text-primary-gold" />
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-modal border border-accent-gray p-6 rounded-lg w-full max-w-md font-spectral animate-fade-in-up">
            <h2 className="font-cinzel text-2xl text-gold-gradient mb-6 text-center">Ticket de Soporte</h2>
            
            {status === 'success' ? (
              <div className="text-center mb-6 py-4">
                <div className="w-16 h-16 bg-surface-card border border-primary-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary-gold" />
                </div>
                <p className="text-text-main text-lg mb-2">¡Ticket enviado con éxito!</p>
                <p className="text-secondary-theme text-sm">Nuestro equipo revisará tu caso en Discord.</p>
                <button 
                  onClick={() => { setIsOpen(false); setStatus('idle'); }}
                  className="mt-6 bg-primary-gold text-black font-cinzel font-bold px-6 py-2 rounded-lg hover:brightness-110 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : user?.isGuest ? (
              <div className="text-center mb-6 py-4">
                <div className="w-16 h-16 bg-surface-card border border-accent-gray rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-text-muted" />
                </div>
                <p className="text-text-main text-lg mb-2">Debes registrarte para enviar tickets.</p>
                <p className="text-secondary-theme text-sm">Los usuarios invitados no tienen acceso a esta función.</p>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="mt-6 bg-panel-secondary text-text-main font-cinzel px-6 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-secondary-theme mb-2 font-cinzel text-sm">Tipo de Problema</label>
                  <select 
                    value={tipoProblema}
                    onChange={(e) => setTipoProblema(e.target.value)}
                    className="w-full bg-panel-secondary border border-accent-gray text-text-main p-3 rounded-lg focus:outline-none focus:border-primary-gold transition-colors cursor-pointer"
                  >
                    <option value="Error/Bug">Error / Bug</option>
                    <option value="Cuenta">Problema con la cuenta</option>
                    <option value="Sugerencia">Sugerencia</option>
                    <option value="Reporte">Reportar Jugador</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {tipoProblema === 'Otro' && (
                  <div className="mb-4 animate-fade-in-down">
                    <label className="block text-secondary-theme mb-2 font-cinzel text-sm">Asunto</label>
                    <input 
                      type="text" 
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      placeholder="Escribe el asunto del reporte..."
                      className="w-full bg-panel-secondary border border-accent-gray text-text-main p-3 rounded-lg focus:outline-none focus:border-primary-gold transition-colors"
                    />
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <label className="block text-secondary-theme font-cinzel text-sm">Mensaje</label>
                    <span className={`text-sm ${mensaje.length > MAX_CHARS ? 'text-red-500' : 'text-text-muted'}`}>
                      {mensaje.length} / {MAX_CHARS}
                    </span>
                  </div>
                  <textarea 
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value.substring(0, MAX_CHARS))}
                    placeholder="Describe tu problema o duda..."
                    className="w-full bg-panel-secondary border border-accent-gray text-text-main p-3 rounded-lg h-36 resize-none focus:outline-none focus:border-primary-gold transition-colors custom-scrollbar"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-500 text-sm mb-4 text-center">Hubo un error al enviar el ticket. Inténtalo de nuevo.</p>
                )}

                <div className="flex justify-end gap-3 font-cinzel text-sm">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="bg-panel-secondary text-text-main px-5 py-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={enviando || !mensaje.trim() || (tipoProblema === 'Otro' && !asunto.trim()) || cooldown > 0}
                    className={`px-5 py-2 rounded-lg font-bold transition-all duration-300 ${
                      enviando || !mensaje.trim() || (tipoProblema === 'Otro' && !asunto.trim()) || cooldown > 0
                        ? 'bg-accent-gray text-text-muted cursor-not-allowed' 
                        : 'bg-primary-gold text-black hover:brightness-110 cursor-pointer'
                    }`}
                  >
                    {enviando 
                      ? 'Enviando...' 
                      : cooldown > 0 
                        ? `Espera (${formatCooldown(cooldown)})` 
                        : 'Enviar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
