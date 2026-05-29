import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useSettings } from '../../contexts/SettingsContext';

/**
 * Componente que gestiona los controles globales del juego (Sonido, Tema, Idioma).
 * Utiliza localStorage para persistir las preferencias del usuario.
 */
const GameControls: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  // Inicializa el modo oscuro desde localStorage o por defecto activado
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-dark');
    return saved !== null ? JSON.parse(saved) : true;
  });

  /**
   * Efecto para aplicar la clase de tema al elemento raíz (html)
   * y guardar la preferencia en localStorage.
   */
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
    localStorage.setItem('theme-dark', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <div className="absolute top-8 right-8 flex gap-4 z-10 animate-fade-in-down">
      {/* Botón de Control de Música */}
      <button 
        onClick={() => updateSettings({ ...settings, isMusicEnabled: !settings.isMusicEnabled })}
        className="p-3 border border-accent-gray bg-panel/50 text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all duration-300 rounded-sm group shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        title="Alternar Música"
      >
        {settings.isMusicEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* Botón de Control de Tema (Oscuro/Claro) */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="p-3 border border-accent-gray bg-panel/50 text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all duration-300 rounded-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        title="Alternar Modo"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Selector de Idioma */}
      <LanguageSelector />
    </div>
  );
};

export default GameControls;

