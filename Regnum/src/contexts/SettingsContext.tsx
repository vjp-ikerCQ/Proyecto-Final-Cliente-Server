import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createAudioWithFallback } from '../utils/audioFallback';

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

/** Estructura de un recurso de audio con fallback Cloudinary ↔ Local */
export interface AudioResource {
  cloudinary: string;
  local: string;
}

/**
 * URLs de SFX con soporte de fallback local.
 * Cloudinary primero, después /public/audio/regnum/sfx/ como respaldo.
 */
export const SFX_KEYS = {
  CLICK: { cloudinary: 'v1779100080/click_tsrxnd.wav', local: '/audio/regnum/sfx/click_tsrxnd.wav' },
  POWER_UP: { cloudinary: 'v1779099971/powerUp_s09d5o.wav', local: '/audio/regnum/sfx/powerUp_s09d5o.wav' },
  JUMP: { cloudinary: 'v1779099971/jump_rkds9x.wav', local: '/audio/regnum/sfx/jump_rkds9x.wav' },
  EXPLOSION: { cloudinary: 'v1779099971/explosion_kmjzyu.wav', local: '/audio/regnum/sfx/explosion_kmjzyu.wav' },
  HIT_HURT: { cloudinary: 'v1779099971/hitHurt_upfnpu.wav', local: '/audio/regnum/sfx/hitHurt_upfnpu.wav' },
  SWORD_CLASH: { cloudinary: 'v1/sword-clash_gj0zkn.mp3', local: '/audio/regnum/sfx/sword-clash_gj0zkn.mp3' },
  CARD_BASTOS: { cloudinary: 'Assets/Folders/Home/regnumhollow/sfx/bastos/basto_card_pick.mp3', local: '/audio/regnum/sfx/bastos/basto_1_xwgfkm.mp3' },
  CARD_COPAS: { cloudinary: 'Assets/Folders/Home/regnumhollow/sfx/copas/copa_card_pick.mp3', local: '/audio/regnum/sfx/copas/copa_2_ecfzhm.wav' },
  CARD_ESPADAS: { cloudinary: 'Assets/Folders/Home/regnumhollow/sfx/espadas/espada_card_pick.mp3', local: '/audio/regnum/sfx/espadas/espada_1_mnntzk.mp3' },
  CARD_OROS: { cloudinary: 'Assets/Folders/Home/regnumhollow/sfx/oros/oro_card_pick.mp3', local: '/audio/regnum/sfx/oros/oro_1_xvaxax.ogg' },
  ATTACK_SLASH: { cloudinary: 'v1779099971/attack_slash_mtslrj.wav', local: '/audio/regnum/sfx/attack_slash_mtslrj.wav' },
  ATTACK_ORB: { cloudinary: 'v1779099971/attack_orb_w2rbj3.wav', local: '/audio/regnum/sfx/attack_orb_w2rbj3.wav' },
  ATTACK_THUNDER: { cloudinary: 'v1779099971/attack_thunder_jxnbdd.wav', local: '/audio/regnum/sfx/attack_thunder_jxnbdd.wav' },
  ATTACK_BANISH: { cloudinary: 'v1779099971/attack_banish_rpqru6.wav', local: '/audio/regnum/sfx/attack_banish_rpqru6.wav' },
  ATTACK_4DOT: { cloudinary: 'v1779099971/attack_4dot_blgg4w.wav', local: '/audio/regnum/sfx/attack_4dot_blgg4w.wav' },
  ATTACK_FULTHIM: { cloudinary: 'v1779099971/attack_fulthim_wsmqob.wav', local: '/audio/regnum/sfx/attack_fulthim_wsmqob.wav' },
  ATTACK_TAKE: { cloudinary: 'v1779099971/attack_take_rmpvvw.wav', local: '/audio/regnum/sfx/attack_take_rmpvvw.wav' },
  ATTACK_SWAP: { cloudinary: 'v1779099971/attack_swap_c2ahx3.wav', local: '/audio/regnum/sfx/attack_swap_c2ahx3.wav' },
  ATTACK_JOKER_CHANGE: { cloudinary: 'v1779099971/attack_joker_change_jacz1b.wav', local: '/audio/regnum/sfx/attack_joker_change_jacz1b.wav' },
} as const;

export const MUSIC_KEYS = {
  MENU: { cloudinary: 'v1779100080/menu.mp3', local: '/audio/regnum/music/menu.mp3' },
  BATTLE: { cloudinary: 'v1779101394/battle_music_usxcot.mp3', local: '/audio/regnum/music/battle_music_usxcot.mp3' },
} as const;

interface SettingsContextType {
  settings: GameSettings;
  updateSettings: (newSettings: GameSettings) => void;
  saveSettings: () => void;
  revertSettings: (originalSettings: GameSettings) => void;
  /** Reproduce música desde una URL directa (Cloudinary o local) */
  playMusic: (src: string) => void;
  /** Detiene la música actual */
  stopMusic: () => void;
  /** Reproduce un SFX desde una URL directa */
  playSfx: (src?: string) => void;
  /** Reproduce un SFX con fallback automático Cloudinary → Local */
  playSfxResource: (resource: AudioResource) => void;
  /** Reproduce música con fallback automático Cloudinary → Local */
  playMusicResource: (resource: AudioResource) => void;
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

  const playMusicResource = (resource: AudioResource) => {
    if (!settings.isMusicEnabled || !musicRef.current) return;
    const audio = createAudioWithFallback(resource.cloudinary, resource.local, settings.musicVolume, true);
    // Reemplazar el manejador de música actual
    if (musicRef.current) {
      musicRef.current.pause();
    }
    musicRef.current = audio;
  };

  const stopMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
    }
  };

  const playSfx = (src?: string) => {
    if (!settings.isSfxEnabled) return;
    const sfxSrc = src || `/audio/regnum/sfx/click_tsrxnd.wav`;
    const audioUrl = sfxSrc.startsWith('http') ? sfxSrc : window.location.origin + sfxSrc;
    const audio = new Audio(audioUrl);
    audio.volume = settings.sfxVolume;
    audio.play().catch(err => console.log("SFX play blocked by browser:", err));
  };

  const playSfxResource = (resource: AudioResource) => {
    if (!settings.isSfxEnabled) return;
    createAudioWithFallback(resource.cloudinary, resource.local, settings.sfxVolume, false);
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      saveSettings,
      revertSettings,
      playMusic,
      stopMusic,
      playSfx,
      playSfxResource,
      playMusicResource,
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