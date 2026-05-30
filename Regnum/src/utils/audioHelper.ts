export const CARD_SFX_MAP: Record<string, Record<number, string>> = {
  bastos: {
    1: 'basto_1_xwgfkm.mp3',
    2: 'basto_2_pcfl1c.mp3',
    3: 'basto_3.mp3',
    4: 'basto_4_xptryf.mp3',
    5: 'basto_5_ylelg5.mp3',
    6: 'basto_6_ltfb42.wav',
    7: 'basto_7_n04isb.mp3',
    8: 'basto_8_ik8hgx.wav',
    9: 'basto_9_ubqqm3.mp3',
    10: 'basto_10_bfgiby.mp3',
    11: 'basto_11.mp3',
    12: 'basto_12_i420zl.wav',
  },
  copas: {
    2: 'copa_2_ecfzhm.wav',
    3: 'copa_3_jkizp3.wav',
    4: 'copa_4_b2xiwm.mp3',
    7: 'copa_7_s65yzg.mp3',
    8: 'copa_8_ormfzu.mp3',
    9: 'copa_9_xhrnlr.wav',
    10: 'copa_10_mvcjc5.wav',
    11: 'copa_11_rohwfa.mp3',
    // Fallbacks for missing copas (1, 5, 6, 12)
    1: 'copa_2_ecfzhm.wav',
    5: 'copa_3_jkizp3.wav',
    6: 'copa_4_b2xiwm.mp3',
    12: 'copa_10_mvcjc5.wav',
  },
  espadas: {
    1: 'espada_1_mnntzk.mp3',
    2: 'espada_2_rcuweu.mp3',
    3: 'espada_3_nfsery.wav',
    4: 'espada_4_ycjrvu.wav',
    5: 'espada_5_mcqkji.mp3',
    6: 'espada_6_e8nmjr.wav',
    7: 'espada_7_p6puqo.mp3',
    8: 'espada_8_phrsxc.mp3',
    9: 'espada_9_mnoqsi.mp3',
    10: 'espada_10_uijoib.mp3',
    11: 'espada_11_ugn1ky.mp3',
    12: 'espada_12_xjonk2.mp3',
  },
  oros: {
    1: 'oro_1_xvaxax.ogg',
    2: 'oro_2_zgfwha.mp3',
    3: 'oro_3_gglvda.wav',
    4: 'oro_4_qatxfw.mp3',
    5: 'oro_5_sa2lgn.mp3',
    6: 'oro_6_rxp38s.wav',
    7: 'oro_7_ehifkb.mp3',
    8: 'oro_8_efqtdw.mp3',
    9: 'oro_9_o1u1zu.wav',
    10: 'oro_10_aaw46r.mp3',
    11: 'oro_11_rqw2e0.mp3',
    12: 'oro_12_wca6uy.wav',
  }
};

/**
 * Plays an audio file trying Cloudinary first, falling back to local if it fails.
 */
export const playSfxWithFallback = (
  cloudinaryPath: string,
  localPath: string,
  volume: number = 0.5
) => {
  const audio = new Audio(cloudinaryPath);
  audio.volume = volume;

  let failed = false;
  const handleError = () => {
    if (failed) return;
    failed = true;
    console.warn(`Cloudinary audio failed to load: ${cloudinaryPath}. Playing local: ${localPath}`);
    const fallbackAudio = new Audio(localPath);
    fallbackAudio.volume = volume;
    fallbackAudio.play().catch(e => console.error("Local fallback SFX failed to play:", e));
  };

  audio.addEventListener('error', handleError);
  audio.play().catch((err) => {
    // Autoplay policy or instant error. If load error, 'error' event fires.
    console.log("SFX play init:", err);
  });
};

/**
 * Returns URLs for card sound effects (Cloudinary and local)
 */
export const getCardSfxUrls = (suit: string, rank: number) => {
  const normalizedSuit = suit.toLowerCase();
  const suitMap = CARD_SFX_MAP[normalizedSuit];
  if (!suitMap) return null;

  const filename = suitMap[rank];
  if (!filename) return null;

  return {
    cloudinary: `https://res.cloudinary.com/drvgncidb/video/upload/Assets/Folders/Home/regnumhollow/sfx/${normalizedSuit}/${filename}`,
    local: `/regnumhollow_2026/sfx/${normalizedSuit}/${filename}`
  };
};

/**
 * Returns URLs for attack sound effects (Cloudinary and local)
 */
export const getAttackSfxUrls = (filename: string) => {
  return {
    cloudinary: `https://res.cloudinary.com/drvgncidb/video/upload/Assets/Folders/Home/regnumhollow/sfx/${filename}`,
    local: `/regnumhollow_2026/sfx/${filename}`
  };
};

/**
 * Returns URLs for generic sound effects like card select and card pick (Cloudinary and local)
 */
export const getGenericSfxUrls = (filename: string) => {
  return {
    cloudinary: `https://res.cloudinary.com/drvgncidb/video/upload/Assets/Folders/Home/regnumhollow/sfx/${filename}`,
    local: `/regnumhollow_2026/sfx/${filename}`
  };
};
