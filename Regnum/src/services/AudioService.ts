import { cld } from '../cloudinary';

class AudioService {
  private music: HTMLAudioElement | null = null;
  private isMusicOn: boolean = true;

  constructor() {
    this.isMusicOn = localStorage.getItem('music-on') !== 'false';
    
    // Generating the URL using Cloudinary SDK
    const musicUrl = cld.video('backgroundmusicforvideos-medieval-irish-celtic-ireland-music-311693_qhnwry').toURL();
    
    this.music = new Audio(musicUrl);
    this.music.loop = true;
  }


  public playMusic() {
    if (this.music && this.isMusicOn) {
      this.music.play().catch(error => {
        console.warn("Autoplay blocked or audio error:", error);
      });
    }
  }

  public playSoundEffect(publicId: string) {
    if (!this.isMusicOn) return; // Or separate setting for SFX

    // For SFX, we create a one-shot audio element
    // Cloudinary URL pattern for audio (resource_type: video)
    const sfxUrl = `https://res.cloudinary.com/drvgncidb/video/upload/${publicId}.mp3`;
    const sfx = new Audio(sfxUrl);
    sfx.play().catch(e => console.error("Error playing SFX:", e));
  }

  public pauseMusic() {

    if (this.music) {
      this.music.pause();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicOn = enabled;
    localStorage.setItem('music-on', JSON.stringify(enabled));
    if (enabled) {
      this.playMusic();
    } else {
      this.pauseMusic();
    }
  }

  public isEnabled(): boolean {
    return this.isMusicOn;
  }
}

export const audioService = new AudioService();
