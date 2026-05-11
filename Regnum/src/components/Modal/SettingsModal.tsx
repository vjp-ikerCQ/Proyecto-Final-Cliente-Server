import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Music,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Back Button (Top Left) */}
          <button
            onClick={onClose}
            className="absolute top-8 left-8 flex items-center gap-2 text-primary-gold hover:text-white transition-colors group"
          >
            <div className="border border-primary-gold p-1 group-hover:bg-primary-gold group-hover:text-bg-dark transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="font-cinzel text-sm uppercase tracking-widest">Volver</span>
          </button>

          <motion.div
            className="w-full max-w-2xl bg-bg-dark border border-accent-gray relative overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-gold -translate-x-1 -translate-y-1 opacity-50" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary-gold translate-x-1 -translate-y-1 opacity-50" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary-gold -translate-x-1 translate-y-1 opacity-50" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary-gold translate-x-1 translate-y-1 opacity-50" />

            <div className="p-8 md:p-12">
              <h2 className="text-4xl font-cinzel text-primary-gold mb-10 tracking-[0.2em] uppercase">Ajustes</h2>

              <div className="space-y-10 font-spectral">
                {/* Audio Section */}
                <section>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 border-b border-accent-gray pb-2">Audio</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-sm text-gray-400">Volumen General</span>
                      <div className="flex-1 flex items-center gap-4">
                        <input
                          type="range"
                          className="w-full accent-primary-gold h-1 bg-accent-gray rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-primary-gold font-cinzel w-8">100%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Volume2 size={16} />
                        <span className="text-sm">Efectos de Sonido</span>
                      </div>
                      <Toggle />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Music size={16} />
                        <span className="text-sm">Música</span>
                      </div>
                      <Toggle defaultChecked />
                    </div>
                  </div>
                </section>

                {/* Graphics Section */}
                <section>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 border-b border-accent-gray pb-2">Gráficos</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Calidad de Animaciones</span>
                      <div className="relative">
                        <select className="appearance-none bg-secondary-gray border border-accent-gray text-gray-300 text-xs py-2 px-8 font-cinzel focus:outline-none focus:border-primary-gold cursor-pointer">
                          <option>Baja</option>
                          <option>Media</option>
                          <option selected>Alta</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Efectos de Partículas</span>
                      <Toggle defaultChecked />
                    </div>
                  </div>
                </section>

                {/* Game Section */}
                <section>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 border-b border-accent-gray pb-2">Juego</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Mostrar Consejos</span>
                      <Toggle />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Velocidad de Animaciones</span>
                      <div className="relative">
                        <select className="appearance-none bg-secondary-gray border border-accent-gray text-gray-300 text-xs py-2 px-8 font-cinzel focus:outline-none focus:border-primary-gold cursor-pointer">
                          <option>Lenta</option>
                          <option selected>Normal</option>
                          <option>Rápida</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Action Buttons */}
              <div className="mt-12 flex flex-col md:flex-row gap-4">
                <button className="flex-1 bg-primary-gold text-bg-dark py-4 font-cinzel text-sm uppercase tracking-widest font-bold hover:bg-[#c4a47a] transition-all shadow-[0_0_15px_rgba(166,138,100,0.3)]">
                  Guardar Cambios
                </button>
                <button className="flex-1 border border-accent-gray text-gray-400 py-4 font-cinzel text-sm uppercase tracking-widest hover:border-primary-gold hover:text-white transition-all">
                  Restaurar Predeterminados
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Toggle: React.FC<{ defaultChecked?: boolean }> = ({ defaultChecked }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
    <div className="w-11 h-5 bg-accent-gray rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-primary-gold after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-gold/20 peer-checked:after:bg-primary-gold"></div>
  </label>
);

export default SettingsModal;
