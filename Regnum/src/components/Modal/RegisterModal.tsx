import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
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

            <form className="space-y-4 font-spectral">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1 ml-1">Nombre de Usuario</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input 
                    type="text" 
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
                    placeholder="••••••••"
                    className="w-full bg-panel/50 border border-accent-gray py-2 pl-10 pr-4 text-sm focus:border-primary-gold focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button 
                type="button"
                className="w-full bg-primary-gold text-bg-main py-3 mt-6 font-cinzel text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#c4a47a] transition-all shadow-lg"
              >
                Completar Registro
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegisterModal;
