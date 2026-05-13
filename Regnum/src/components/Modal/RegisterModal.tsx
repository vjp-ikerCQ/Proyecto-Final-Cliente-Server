import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = React.useState({
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: ''
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({ nombre: '', email: '', password: '', confirmarPassword: '' });
        }, 2000);
      } else {
        setError(data.message || 'Error al registrar usuario');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-full max-w-md bg-bg-main border border-accent-gray p-8 relative overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary-gold opacity-50" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary-gold opacity-50" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary-gold opacity-50" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary-gold opacity-50" />

            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-primary-gold transition-colors">
              <X size={20} />
            </button>

            <h2 className="text-2xl font-cinzel text-primary-gold mb-6 tracking-widest uppercase text-center">Unirse a la Orden</h2>

            <form onSubmit={handleSubmit} className="space-y-4 font-spectral">
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 p-2 text-[10px] text-red-200 text-center uppercase">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-900/30 border border-green-500/50 p-2 text-[10px] text-green-200 text-center uppercase">
                  ¡Registro exitoso! Iniciando...
                </div>
              )}

              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1 ml-1">Nombre de Usuario</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input 
                    type="text" 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre..."
                    className="w-full bg-panel/50 border border-accent-gray py-2 pl-10 pr-4 text-sm focus:border-primary-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="ejemplo@correo.com"
                    className="w-full bg-panel/50 border border-accent-gray py-2 pl-10 pr-4 text-sm focus:border-primary-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1 ml-1">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-panel/50 border border-accent-gray py-2 pl-10 pr-4 text-sm focus:border-primary-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1 ml-1">Repetir Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input 
                    type="password" 
                    name="confirmarPassword"
                    value={formData.confirmarPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full bg-panel/50 border border-accent-gray py-2 pl-10 pr-4 text-sm focus:border-primary-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full ${loading ? 'bg-gray-700' : 'bg-primary-gold'} text-bg-main py-3 mt-6 font-cinzel text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#c4a47a] transition-all shadow-lg active:scale-95`}
              >
                {loading ? 'Procesando...' : 'Completar Registro'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegisterModal;
