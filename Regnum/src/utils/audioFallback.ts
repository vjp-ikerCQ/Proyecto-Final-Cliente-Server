/**
 * Audio Fallback Utility
 * 
 * Intenta reproducir audio desde Cloudinary primero.
 * Si falla (sin conexión, recurso no encontrado, etc.),
 * cae automáticamente a los archivos locales en /public/audio/regnum/.
 * 
 * Uso:
 *   playWithFallback(urlCloudinary, urlLocal, volume)
 *     .then(() => console.log('Audio reproducido correctamente'))
 *     .catch(() => console.warn('No se pudo reproducir el audio'));
 */

const CLOUDINARY_BASE = 'https://res.cloudinary.com/drvgncidb/video/upload';

/**
 * Intenta reproducir un audio desde Cloudinary. Si falla,
 * usa el archivo local como respaldo.
 * @param cloudinaryPath Ruta dentro de Cloudinary (sin URL base)
 * @param localPath Ruta del archivo local (relativa a /public)
 * @param volume Volumen (0-1)
 * @param isLoop Si el audio debe repetirse
 * @returns El elemento HTMLAudioElement creado
 */
export function createAudioWithFallback(
  cloudinaryPath: string,
  localPath: string,
  volume: number = 0.5,
  isLoop: boolean = false
): HTMLAudioElement {
  const audio = new Audio();
  audio.volume = volume;
  audio.loop = isLoop;

  // Intentar Cloudinary primero
  const cloudinaryUrl = `${CLOUDINARY_BASE}/${cloudinaryPath}`;
  audio.src = cloudinaryUrl;

  // Si falla, usar local
  audio.addEventListener('error', () => {
    console.warn(
      `⚠️ AudioFallback: Cloudinary no disponible para "${cloudinaryPath}". Usando local: ${localPath}`
    );
    audio.src = window.location.origin + localPath;
    audio.load();
    audio.play().catch(err => {
      console.error(`❌ AudioFallback: Error al reproducir local: ${err.message}`);
    });
  });

  audio.play().catch(() => {
    // El evento 'error' se encargará del fallback
    // Si el error fue por autoplay policy, no hacemos nada
  });

  return audio;
}

/**
 * Crea y reproduce un efecto de sonido (SFX) con fallback.
 * @param cloudinaryPath Ruta dentro de Cloudinary
 * @param localPath Ruta local
 * @param volume Volumen
 * @returns Promise que resuelve si se reproduce, rechaza si no
 */
export function playSfxWithFallback(
  cloudinaryPath: string,
  localPath: string,
  volume: number = 0.5
): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.volume = volume;

    const cloudinaryUrl = `${CLOUDINARY_BASE}/${cloudinaryPath}`;
    audio.src = cloudinaryUrl;

    audio.addEventListener('canplaythrough', () => {
      audio.play().then(resolve).catch(reject);
    });

    audio.addEventListener('error', () => {
      console.warn(
        `⚠️ AudioFallback: Cloudinary no disponible. Usando local: ${localPath}`
      );
      audio.src = window.location.origin + localPath;
      audio.addEventListener('canplaythrough', () => {
        audio.play().then(resolve).catch(reject);
      });
      audio.addEventListener('error', () => {
        reject(new Error(`No se pudo reproducir ni Cloudinary ni local: ${localPath}`));
      });
      audio.load();
    });

    audio.load();
  });
}

export default {
  createAudioWithFallback,
  playSfxWithFallback,
};