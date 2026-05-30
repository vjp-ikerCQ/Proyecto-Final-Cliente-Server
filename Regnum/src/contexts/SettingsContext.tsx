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

export const SFX_KEYS = {
  CLICK: 'https://res.cloudinary.com/drvgncidb/video/upload/v1779100080/click_tsrxnd.wav',
  POWER_UP: 'https://res.cloudinary.com/drvgncidb/video/upload/v1779099971/powerUp_s09d5o.wav',
  JUMP: 'https://res.cloudinary.com/drvgncidb/video/upload/v1779099971/jump_rkds9x.wav',
  EXPLOSION: 'https://res.cloudinary.com/drvgncidb/video/upload/v1779099971/explosion_kmjzyu.wav',
  HIT_HURT: 'https://res.cloudinary.com/drvgncidb/video/upload/v1779099971/hitHurt_upfnpu.wav',
  SWORD_CLASH: 'https://res.cloudinary.com/drvgncidb/video/upload/v1/sword-clash_gj0zkn.mp3'
};

export const MUSIC_KEYS = {
  MENU: '/audio/menu.mp3',
  BATTLE: 'https://res.cloudinary.com/drvgncidb/video/upload/v1779101394/battle_music_usxcot.mp3'
};

interface SettingsContextType {
  settings: GameSettings;
  updateSettings: (newSettings: GameSettings) => void;
  saveSettings: () => void;
  revertSettings: (originalSettings: GameSettings) => void;
  playMusic: (src: string) => void;
  stopMusic: () => void;
  playSfx: (src?: string) => void;
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
      
      musicRef.current.addEventListener('error', () => {
        if (!musicRef.current) return;
        const currentSrc = musicRef.current.src;
        if (currentSrc.includes('cloudinary.com')) {
          let fallback = '';
          if (currentSrc.includes('splash2')) {
            fallback = '/regnumhollow_2026/background/splash2.mp3';
          } else if (currentSrc.includes('menu')) {
            fallback = '/regnumhollow_2026/music/menu.mp3';
          } else if (currentSrc.includes('battle')) {
            fallback = '/regnumhollow_2026/music/battle_music_usxcot.mp3';
          }
          if (fallback) {
            console.warn(`Music failed to load from Cloudinary. Falling back to local: ${fallback}`);
            musicRef.current.src = fallback;
            musicRef.current.play().catch(err => console.log("Playback error on fallback music:", err));
          }
        }
      });
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

  const playSfx = (src?: string) => {
    if (!settings.isSfxEnabled) return;
    const sfxSrc = src || SFX_KEYS.CLICK;
    const audio = new Audio(sfxSrc);
    audio.volume = settings.sfxVolume;
    audio.play().catch(err => console.log("SFX play blocked by browser:", err));
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      saveSettings,
      revertSettings,
      playMusic,
      stopMusic,
      playSfx
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
