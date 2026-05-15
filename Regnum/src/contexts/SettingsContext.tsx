import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  isMusicEnabled: boolean;
  isSfxEnabled: boolean;
  animQuality: 'Baja' | 'Media' | 'Alta';
  particlesEnabled: boolean;
  showTips: boolean;
  animSpeed: 'Lenta' | 'Normal' | 'Rápida';
}

interface SettingsContextType {
  settings: GameSettings;
  updateSettings: (newSettings: GameSettings) => void;
  saveSettings: () => void;
  revertSettings: (originalSettings: GameSettings) => void;
  playMusic: (src: string) => void;
  stopMusic: () => void;
}

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

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('regnum_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const musicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!musicRef.current) {
      musicRef.current = new Audio();
      musicRef.current.loop = true;
    }
  }, []);

  // Apply audio settings whenever they change (Live Preview support)
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = settings.musicVolume;
      musicRef.current.muted = !settings.isMusicEnabled;
    }
  }, [settings.musicVolume, settings.isMusicEnabled]);

  const updateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
  };

  const saveSettings = () => {
    localStorage.setItem('regnum_settings', JSON.stringify(settings));
  };

  const revertSettings = (originalSettings: GameSettings) => {
    setSettings(originalSettings);
  };

  const playMusic = (src: string) => {
    if (musicRef.current) {
      const fullSrc = src.startsWith('http') ? src : window.location.origin + src;
      if (musicRef.current.src !== fullSrc) {
        musicRef.current.src = src;
      }
      musicRef.current.play().catch(err => console.log("Audio play blocked by browser:", err));
    }
  };

  const stopMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      saveSettings,
      revertSettings,
      playMusic,
      stopMusic
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
