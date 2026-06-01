/**
 * Mapa de sonidos para cada carta específica.
 * Intentar Cloudinary primero, fallback a archivos locales en /public/audio/regnum/sfx/.
 */

import { type CardData } from './cardData';

interface CardAudioResource {
  cloudinary: string;
  local: string;
}

/**
 * Obtiene el recurso de audio para una carta específica según su palo y rango.
 */
export function getCardSfx(card: CardData): CardAudioResource {
  const suit = card.suit;
  const rank = card.rank;

  // Si es un Joker
  if (suit === 'jokers') {
    const jokerSounds: Record<string, CardAudioResource> = {
      '1': {
        cloudinary: 'Assets/Folders/Home/regnumhollow/sfx/joker/joker1.wav',
        local: '/audio/regnum/sfx/joker/joker1.wav',
      },
      '2': {
        cloudinary: 'Assets/Folders/Home/regnumhollow/sfx/joker/joker2.wav',
        local: '/audio/regnum/sfx/joker/joker2.wav',
      },
      '3': {
        cloudinary: 'Assets/Folders/Home/regnumhollow/sfx/joker/joker3.wav',
        local: '/audio/regnum/sfx/joker/joker3.wav',
      },
    };
    return jokerSounds[rank.toString()] || jokerSounds['1'];
  }

  // Todas las cartas por palo+rango
  const sfxBySuitRank: Record<string, string> = {
    // Bastos (7 y 8 intercambiados según lo solicitado)
    'bastos-1': 'basto_1_xwgfkm.mp3',
    'bastos-2': 'basto_2_pcfl1c.mp3',
    'bastos-3': 'basto_3.mp3',
    'bastos-4': 'basto_4_xptryf.mp3',
    'bastos-5': 'basto_5_ylelg5.mp3',
    'bastos-6': 'basto_6_ltfb42.wav',
    'bastos-7': 'basto_7_ik8hgx.wav',
    'bastos-8': 'basto_8_n04isb.mp3',
    'bastos-9': 'basto_9_ubqqm3.mp3',
    'bastos-10': 'basto_10_bfgiby.mp3',
    'bastos-11': 'basto_11.mp3',
    'bastos-12': 'basto_12_i420zl.wav',
    // Copas (completado con los nuevos archivos)
    'copas-1': 'copa1.wav',
    'copas-2': 'copa_2_ecfzhm.wav',
    'copas-3': 'copa_3_jkizp3.wav',
    'copas-4': 'copa_4_b2xiwm.mp3',
    'copas-5': 'copa5.wav',
    'copas-6': 'copa6.wav',
    'copas-7': 'copa_7_s65yzg.mp3',
    'copas-8': 'copa_8_ormfzu.mp3',
    'copas-9': 'copa_9_xhrnlr.wav',
    'copas-10': 'copa_10_mvcjc5.wav',
    'copas-11': 'copa_11_rohwfa.wav',
    'copas-12': 'copa12.wav',
    // Espadas (completo)
    'espadas-1': 'espada_1_mnntzk.mp3',
    'espadas-2': 'espada_2_rcuweu.mp3',
    'espadas-3': 'espada_3_nfsery.wav',
    'espadas-4': 'espada_4_ycjrvu.wav',
    'espadas-5': 'espada_5_mcqkji.mp3',
    'espadas-6': 'espada_6_e8nmjr.wav',
    'espadas-7': 'espada_7_p6puqo.mp3',
    'espadas-8': 'espada_8_phrsxc.mp3',
    'espadas-9': 'espada_9_mnoqsi.mp3',
    'espadas-10': 'espada_10_uijoib.mp3',
    'espadas-11': 'espada_11_ugn1ky.mp3',
    'espadas-12': 'espada_12_xjonk2.mp3',
    // Oros (completo)
    'oros-1': 'oro_1_xvaxax.ogg',
    'oros-2': 'oro_2_zgfwha.mp3',
    'oros-3': 'oro_3_gglvda.wav',
    'oros-4': 'oro_4_qatxfw.mp3',
    'oros-5': 'oro_5_sa2lgn.mp3',
    'oros-6': 'oro_6_rxp38s.wav',
    'oros-7': 'oro_7_ehifkb.mp3',
    'oros-8': 'oro_8_efqtdw.mp3',
    'oros-9': 'oro_9_o1u1zu.wav',
    'oros-10': 'oro_10_aaw46r.mp3',
    'oros-11': 'oro_11_rqw2e0.mp3',
    'oros-12': 'oro_12_wca6uy.wav',
  };

  const key = `${suit}-${rank}`;
  const filename = sfxBySuitRank[key];

  if (filename) {
    const suitFolder = suit === 'bastos' ? 'bastos' : suit === 'copas' ? 'copas' : suit === 'espadas' ? 'espadas' : 'oros';
    return {
      cloudinary: `Assets/Folders/Home/regnumhollow/sfx/${suitFolder}/${filename}`,
      local: `/audio/regnum/sfx/${suitFolder}/${filename}`,
    };
  }

  // Fallback genérico
  return {
    cloudinary: 'Assets/Folders/Home/regnumhollow/sfx/card_pick_hand_cq8xhp.mp3',
    local: '/audio/regnum/sfx/card_pick_hand_cq8xhp.mp3',
  };
}

/**
 * Reproduce el sonido específico de una carta.
 */
export function playCardSfx(card: CardData, volume: number = 0.3): void {
  const sfx = getCardSfx(card);
  try {
    const audio = new Audio();
    audio.src = `https://res.cloudinary.com/drvgncidb/video/upload/${sfx.cloudinary}`;
    audio.volume = volume;
    audio.play().catch(() => {
      audio.src = window.location.origin + sfx.local;
      audio.play().catch(() => {});
    });
  } catch {}
}