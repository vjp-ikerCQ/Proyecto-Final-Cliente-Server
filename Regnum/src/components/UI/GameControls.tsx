import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sun, Moon } from 'lucide-react';

const GameControls: React.FC = () => {
  // Initialize state from localStorage or defaults
  const [isMusicOn, setIsMusicOn] = useState(() => {
    const saved = localStorage.getItem('music-on');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-dark');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Apply theme class to root and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
    localStorage.setItem('theme-dark', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Save music preference to localStorage
  useEffect(() => {
    localStorage.setItem('music-on', JSON.stringify(isMusicOn));
  }, [isMusicOn]);

  return (
    <div className="absolute top-8 right-8 flex gap-4 z-10 animate-fade-in-down">
      <button 
        onClick={() => setIsMusicOn(!isMusicOn)}
        className="p-3 border border-accent-gray bg-panel/50 text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all duration-300 rounded-sm group"
        title="Alternar Música"
      >
        {isMusicOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="p-3 border border-accent-gray bg-panel/50 text-primary-gold hover:bg-primary-gold hover:text-bg-main transition-all duration-300 rounded-sm"
        title="Alternar Modo"
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
};

export default GameControls;
