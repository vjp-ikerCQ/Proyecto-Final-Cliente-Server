import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Music,
  ArrowLeft,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { useSettings, type GameSettings } from '../../contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, saveSettings, revertSettings } = useSettings();
  
  // Keep track of settings when the modal was opened
  const originalSettings = useRef<GameSettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);
  const hasSaved = useRef(false);

  useEffect(() => {
    if (isOpen) {
      originalSettings.current = { ...settings };
      hasSaved.current = false;
      setShowSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleBack = () => {
    if (!hasSaved.current) {
      revertSettings(originalSettings.current);
    }
    onClose();
  };

  const handleSave = () => {
    saveSettings();
    hasSaved.current = true;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  const handleRestore = () => {
    const DEFAULT_SETTINGS: GameSettings = {
      musicVolume: 0.5,
      sfxVolume: 0.5,
      isMusicEnabled: true,
      isSfxEnabled: true,
      animQuality: 'Alta',
      particlesEnabled: true,
      showTips: true,
      animSpeed: 'Normal',
    };
    updateSettings(DEFAULT_SETTINGS);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-modal-backdrop backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Back Button (Top Left) */}
          <button
            onClick={handleBack}
            className="absolute top-8 left-8 flex items-center gap-2 text-primary-gold hover:text-white transition-colors group"
          >
            <div className="border border-primary-gold p-1 group-hover:bg-primary-gold group-hover:text-bg-dark transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="font-cinzel text-sm uppercase tracking-widest">Volver</span>
          </button>

          <motion.div
            className="w-full max-w-2xl bg-modal border border-accent-gray relative overflow-hidden"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  className="absolute inset-0 z-50 bg-bg-dark/90 backdrop-blur-md flex flex-col items-center justify-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <CheckCircle2 size={64} className="text-primary-gold" />
                  </motion.div>
                  <p className="font-cinzel text-xl text-primary-gold tracking-widest uppercase">Ajustes Guardados</p>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <h3 className="text-xs uppercase tracking-[0.3em] text-muted mb-6 border-b border-accent-gray pb-2">Audio</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-sm text-gray-400">Volumen General</span>
                      <div className="flex-1 flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={settings.musicVolume}
                          onChange={(e) => updateSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
                          className="w-full accent-primary-gold h-1 bg-accent-gray rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs text-primary-gold font-cinzel w-8">{Math.round(settings.musicVolume * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Volume2 size={16} />
                        <span className="text-sm">Efectos de Sonido</span>
                      </div>
                      <Toggle 
                        checked={settings.isSfxEnabled} 
                        onChange={() => updateSettings({ ...settings, isSfxEnabled: !settings.isSfxEnabled })} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-400">
                        <Music size={16} />
                        <span className="text-sm">Música</span>
                      </div>
                      <Toggle 
                        checked={settings.isMusicEnabled} 
                        onChange={() => updateSettings({ ...settings, isMusicEnabled: !settings.isMusicEnabled })} 
                      />
                    </div>
                  </div>
                </section>

                {/* Game Section */}
                <section>
                  <h3 className="text-xs uppercase tracking-[0.3em] text-muted mb-6 border-b border-accent-gray pb-2">Juego</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Mostrar Consejos</span>
                      <Toggle 
                        checked={settings.showTips} 
                        onChange={() => updateSettings({ ...settings, showTips: !settings.showTips })} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Velocidad de Animaciones</span>
                      <div className="relative">
                        <select 
                          value={settings.animSpeed}
                          onChange={(e) => updateSettings({ ...settings, animSpeed: e.target.value as any })}
                          className="appearance-none bg-secondary-gray border border-accent-gray text-gray-300 text-xs py-2 px-8 font-cinzel focus:outline-none focus:border-primary-gold cursor-pointer"
                        >
                          <option value="Lenta">Lenta</option>
                          <option value="Normal">Normal</option>
                          <option value="Rápida">Rápida</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Action Buttons */}
              <div className="mt-12 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-primary-gold text-bg-dark py-4 font-cinzel text-sm uppercase tracking-widest font-bold hover:bg-[#c4a47a] transition-all shadow-[0_0_15px_rgba(166,138,100,0.3)]"
                >
                  Guardar Cambios
                </button>
                <button 
                  onClick={handleRestore}
                  className="flex-1 border border-accent-gray text-secondary-theme py-4 font-cinzel text-sm uppercase tracking-widest hover:border-primary-gold hover:text-text-main transition-all"
                >
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

const Toggle: React.FC<{ checked?: boolean; onChange?: () => void }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input 
      type="checkbox" 
      className="sr-only peer" 
      checked={checked} 
      onChange={onChange} 
    />
    <div className="w-11 h-5 bg-accent-gray rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-primary-gold after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-gold/20 peer-checked:after:bg-primary-gold"></div>
  </label>
);

export default SettingsModal;
