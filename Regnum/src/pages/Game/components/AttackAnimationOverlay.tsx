import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { type CardData } from '../../../utils/cardData';
import { playSfxWithFallback } from '../../../utils/audioFallback';
import { SFX_KEYS } from '../../../contexts/SettingsContext';

interface AttackAnimationOverlayProps {
  attackerCard: CardData;
  targetCard?: CardData | null;
  isDirect: boolean;
  isHeal: boolean;
  isPlayerAttacker: boolean;
  attackerSlotIndex: number;
  targetSlotIndex?: number;
  onComplete: () => void;
}

export const AttackAnimationOverlay: React.FC<AttackAnimationOverlayProps> = ({
  attackerCard,
  targetCard: _targetCard,
  isDirect,
  isHeal,
  isPlayerAttacker,
  attackerSlotIndex,
  targetSlotIndex,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      onComplete();
      return;
    }

    // Reproducir SFX de ataque según el rol de la carta (con fallback local)
    const role = attackerCard.role.toUpperCase();
    const rank = attackerCard.rank;
    const suit = attackerCard.suit;

    // Mapa de sonidos según rol/tipo de ataque
    const attackSoundMap: Record<string, { cloudinary: string; local: string }> = {
      'AS': SFX_KEYS.ATTACK_FULTHIM,
      'ASESINO': SFX_KEYS.ATTACK_SLASH,
      'BESTIA': SFX_KEYS.ATTACK_4DOT,
      'PERRO': SFX_KEYS.ATTACK_4DOT,
      'JABALI': SFX_KEYS.ATTACK_4DOT,
      'SERPIENTE': SFX_KEYS.ATTACK_4DOT,
      'TORO': SFX_KEYS.ATTACK_4DOT,
      'TANQUE': SFX_KEYS.ATTACK_BANISH,
      'CLERIGO': SFX_KEYS.ATTACK_ORB,
      'CURANDERO': SFX_KEYS.ATTACK_ORB,
      'TIRADOR': SFX_KEYS.ATTACK_TAKE,
      'PICARO': SFX_KEYS.ATTACK_SWAP,
      'MAGO': SFX_KEYS.ATTACK_THUNDER,
      'SOTA': SFX_KEYS.ATTACK_SLASH,
      'CABALLO': SFX_KEYS.ATTACK_TAKE,
      'REY': SFX_KEYS.ATTACK_FULTHIM,
    };

    // Elegir sonido según el rol; si es heal, usar orb
    const sfxKey = isHeal ? SFX_KEYS.ATTACK_ORB : (attackSoundMap[role] || SFX_KEYS.ATTACK_SLASH);
    playSfxWithFallback(sfxKey.cloudinary, sfxKey.local, 0.3).catch(() => {});

    const W = window.innerWidth;
    const H = window.innerHeight;

    // Helper: Obtener coordenadas del DOM
    const getCenterCoords = (elementId: string) => {
      const el = document.getElementById(elementId);
      if (!el) {
        // Fallbacks si no se encuentra en DOM
        if (elementId.includes('player-board-slot')) {
          const idx = parseInt(elementId.split('-').pop() || '0');
          return { x: W * 0.3 + idx * W * 0.2, y: H * 0.65, w: 100, h: 150 };
        }
        if (elementId.includes('opponent-board-slot')) {
          const idx = parseInt(elementId.split('-').pop() || '0');
          return { x: W * 0.3 + idx * W * 0.2, y: H * 0.25, w: 100, h: 150 };
        }
        if (elementId.includes('opponent-face')) {
          return { x: W * 0.35, y: H * 0.05, w: 200, h: 40 };
        }
        if (elementId.includes('player-face')) {
          return { x: W * 0.65, y: H * 0.05, w: 200, h: 40 };
        }
        return { x: W / 2, y: H / 2, w: 100, h: 150 };
      }
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        w: rect.width,
        h: rect.height,
      };
    };

    // Identificar IDs correspondientes
    const attackerId = isPlayerAttacker
      ? `player-board-slot-${attackerSlotIndex}`
      : `opponent-board-slot-${attackerSlotIndex}`;

    let targetId = '';
    if (isHeal) {
      targetId = isPlayerAttacker
        ? `player-board-slot-${targetSlotIndex}`
        : `opponent-board-slot-${targetSlotIndex}`;
    } else if (isDirect) {
      targetId = isPlayerAttacker ? 'opponent-face' : 'player-face';
    } else {
      targetId = isPlayerAttacker
        ? `opponent-board-slot-${targetSlotIndex}`
        : `player-board-slot-${targetSlotIndex}`;
    }

    const start = getCenterCoords(attackerId);
    const end = getCenterCoords(targetId);

    let destroyed = false;

    // Configuración de la escena de Phaser
    const sceneConfig = {
      key: 'AttackScene',
      preload(this: Phaser.Scene) {
        // Generar texturas de partículas al vuelo usando Graphics
        // 1. Sparkle (Chispa de brillo blanca)
        const brushSparkle = this.add.graphics();
        brushSparkle.fillStyle(0xffffff, 1);
        brushSparkle.fillCircle(4, 4, 4);
        brushSparkle.generateTexture('sparkle', 8, 8);
        brushSparkle.destroy();

        // 2. Heal Cross (Cruz de curación verde)
        const brushCross = this.add.graphics();
        brushCross.lineStyle(2, 0xffffff, 1);
        brushCross.strokeLineShape(new Phaser.Geom.Line(4, 0, 4, 8));
        brushCross.strokeLineShape(new Phaser.Geom.Line(0, 4, 8, 4));
        brushCross.generateTexture('heal_cross', 8, 8);
        brushCross.destroy();

        // 3. Fire Particle (Fuego ardiente)
        const brushFire = this.add.graphics();
        brushFire.fillStyle(0xffffff, 1);
        brushFire.fillCircle(6, 6, 6);
        brushFire.generateTexture('fire_particle', 12, 12);
        brushFire.destroy();

        // 4. Bubble (Burbujas de agua)
        const brushBubble = this.add.graphics();
        brushBubble.lineStyle(1.5, 0xffffff, 1);
        brushBubble.strokeCircle(5, 5, 4);
        brushBubble.generateTexture('bubble', 10, 10);
        brushBubble.destroy();
      },

      create(this: Phaser.Scene) {
        // Determinar el rol/categoría del atacante
        const role = attackerCard.role.toUpperCase();
        const rank = attackerCard.rank;
        const suit = attackerCard.suit;

        // Color del palo para acentos estéticos
        const suitColorHex =
          suit === 'espadas' ? 0xff4d4d :
          suit === 'copas' ? 0x00ccff :
          suit === 'oros' ? 0xffcc00 :
          suit === 'bastos' ? 0x00ff66 : 0xa855f7;

        // Callback al finalizar
        const finish = () => {
          if (!destroyed) {
            destroyed = true;
            this.game.events.emit('attack-animation-done');
          }
        };

        // --- ANIMACIONES ESPECÍFICAS POR ROL ---

        // A. CASO ESPECIAL: CURACIÓN (Healer/Curandero)
        if (isHeal) {
          // Espiral mágica de curación en el objetivo
          this.add.particles(end.x, end.y, 'heal_cross', {
            speed: { min: 20, max: 70 },
            angle: { min: -180, max: 180 },
            scale: { start: 1.5, end: 0 },
            lifespan: 1000,
            gravityY: -40,
            blendMode: 'ADD',
            color: [0x22c55e, 0x4ade80, 0xfacc15], // Verde esmeralda y oro
            maxParticles: 45,
          });

          this.add.particles(end.x, end.y, 'sparkle', {
            speed: { min: 30, max: 90 },
            scale: { start: 1, end: 0 },
            lifespan: 800,
            gravityY: -20,
            blendMode: 'ADD',
            color: [0xffffff, 0x86efac],
            maxParticles: 30,
          });

          // Aura circular expansiva
          const circle = this.add.graphics();
          circle.lineStyle(3, 0x22c55e, 0.8);
          circle.strokeCircle(end.x, end.y, 10);

          this.tweens.add({
            targets: circle,
            scaleX: 6,
            scaleY: 6,
            alpha: 0,
            duration: 750,
            ease: 'Cubic.Out',
            onComplete: () => {
              circle.destroy();
            }
          });

          // Texto flotante de sanación
          const text = this.add.text(end.x, end.y - 40, '+5 HP', {
            fontSize: '18px',
            color: '#22c55e',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
          });
          text.setOrigin(0.5);
          this.tweens.add({
            targets: text,
            y: end.y - 100,
            alpha: 0,
            duration: 1000,
            ease: 'Quad.Out',
            onComplete: () => {
              text.destroy();
              finish();
            }
          });

          return;
        }

        // B. CASO ESPECIAL: AS (Rango 1)
        if (rank === 1) {
          if (suit === 'oros') {
            // DRAGÓN ROJO: Fuego cruzado devastador
            this.cameras.main.flash(400, 239, 68, 68);
            
            // Fuego emanando del centro hacia los lados
            this.add.particles(W / 2, H / 2, 'fire_particle', {
              speed: { min: 100, max: 400 },
              angle: { min: -180, max: 180 },
              scale: { start: 3, end: 0 },
              lifespan: 1200,
              blendMode: 'ADD',
              color: [0xef4444, 0xf97316, 0xeab308, 0x000000],
              maxParticles: 150,
            });

            const textLegend = this.add.text(W / 2, H / 2, '¡DRAGÓN ROJO!', {
              fontSize: '42px',
              fontStyle: 'bold',
              color: '#f97316',
              stroke: '#000000',
              strokeThickness: 6,
              letterSpacing: 8
            }).setOrigin(0.5).setScale(0.5).setAlpha(0);

            this.tweens.add({
              targets: textLegend,
              scaleX: 1.2,
              scaleY: 1.2,
              alpha: 1,
              duration: 500,
              yoyo: true,
              hold: 400,
              ease: 'Back.Out',
              onComplete: () => {
                this.cameras.main.shake(300, 0.015);
                textLegend.destroy();
                finish();
              }
            });

          } else if (suit === 'copas') {
            // MUJER DE LA COPA: Remolino venenoso y curativo
            this.add.particles(end.x, end.y, 'bubble', {
              speed: { min: 50, max: 150 },
              scale: { start: 2, end: 0 },
              lifespan: 1000,
              blendMode: 'ADD',
              color: [0x00ccff, 0x8b5cf6, 0x10b981], // Místico
              maxParticles: 100
            });

            const textLegend = this.add.text(end.x, end.y - 120, 'VORTEX DE PURIFICACIÓN', {
              fontSize: '18px',
              fontStyle: 'bold',
              color: '#00ccff',
              stroke: '#000000',
              strokeThickness: 4,
              letterSpacing: 2
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
              targets: textLegend,
              y: end.y - 150,
              alpha: 1,
              duration: 400,
              yoyo: true,
              hold: 600,
              onComplete: () => {
                textLegend.destroy();
                finish();
              }
            });

          } else if (suit === 'espadas') {
            // GRAN ESPADACHÍN: Ataque en cruz
            this.cameras.main.flash(300, 239, 68, 68);

            const slashGraphic = this.add.graphics();
            slashGraphic.lineStyle(8, 0xffffff, 1);
            
            // Dibujar cruz
            slashGraphic.strokeLineShape(new Phaser.Geom.Line(end.x - 120, end.y - 120, end.x + 120, end.y + 120));
            slashGraphic.strokeLineShape(new Phaser.Geom.Line(end.x + 120, end.y - 120, end.x - 120, end.y + 120));
            slashGraphic.setAlpha(0);

            this.add.particles(end.x, end.y, 'sparkle', {
              speed: { min: 100, max: 350 },
              scale: { start: 2, end: 0 },
              lifespan: 600,
              blendMode: 'ADD',
              color: [0xff3333, 0xff9999, 0xffffff],
              maxParticles: 80
            });

            this.tweens.add({
              targets: slashGraphic,
              alpha: 1,
              duration: 100,
              yoyo: true,
              hold: 250,
              onComplete: () => {
                this.cameras.main.shake(200, 0.01);
                slashGraphic.destroy();
                finish();
              }
            });

          } else if (suit === 'bastos') {
            // TROLL DE MAZA: Golpe masivo en área
            const club = this.add.graphics();
            club.fillStyle(0x78350f, 0.9);
            club.fillRect(-15, -200, 30, 200);
            club.x = end.x;
            club.y = end.y;
            club.angle = -60;

            // Caída violenta de la maza
            this.tweens.add({
              targets: club,
              angle: 15,
              duration: 350,
              ease: 'Back.In',
              onComplete: () => {
                this.cameras.main.shake(350, 0.02);
                club.destroy();

                this.add.particles(end.x, end.y, 'sparkle', {
                  speed: { min: 80, max: 200 },
                  angle: { min: -180, max: 0 },
                  scale: { start: 2.5, end: 0 },
                  lifespan: 800,
                  color: [0xa1a1aa, 0x78350f, 0x451a03],
                  maxParticles: 60
                });

                this.time.delayedCall(600, finish);
              }
            });
          }
          return;
        }

        // C. REY (Rank 12): Ataque directo celestial
        if (role === 'REY') {
          const goldBeam = this.add.graphics();
          // Gradiente dorado
          goldBeam.fillStyle(0xfacc15, 0.15);
          goldBeam.fillRect(end.x - 45, 0, 90, H);
          goldBeam.fillStyle(0xffffff, 0.6);
          goldBeam.fillRect(end.x - 10, 0, 20, H);
          goldBeam.setAlpha(0);

          // Emitter flotante
          this.add.particles(end.x, end.y, 'sparkle', {
            x: { min: end.x - 40, max: end.x + 40 },
            y: { min: 0, max: end.y },
            speedY: { min: 100, max: 300 },
            scale: { start: 1.5, end: 0 },
            blendMode: 'ADD',
            color: [0xfacc15, 0xffe4e6, 0xffffff],
            lifespan: 1200,
            maxParticles: 60,
          });

          // Animación de aparición de rayo
          this.tweens.add({
            targets: goldBeam,
            alpha: 1,
            duration: 200,
            yoyo: true,
            hold: 400,
            onComplete: () => {
              goldBeam.destroy();
              
              // Corona dorada de impacto
              const crownText = this.add.text(end.x, end.y - 20, '👑', {
                fontSize: '48px',
              }).setOrigin(0.5).setScale(0);

              this.tweens.add({
                targets: crownText,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 600,
                ease: 'Back.Out',
                onComplete: () => {
                  crownText.destroy();
                  finish();
                }
              });
            }
          });
          return;
        }

        // D. ASESINO (Rank 2): Slases venenosos veloces
        if (role === 'ASESINO') {
          const slashContainer = this.add.graphics();
          slashContainer.lineStyle(4, 0xa855f7, 0.9); // Morado neón

          // Humo venenoso
          this.add.particles(end.x, end.y, 'sparkle', {
            speed: { min: 20, max: 90 },
            scale: { start: 2.5, end: 0 },
            lifespan: 700,
            color: [0xa855f7, 0x22c55e, 0x000000],
            blendMode: 'ADD',
            maxParticles: 40,
          });

          // Trazos rápidos
          this.time.delayedCall(100, () => {
            slashContainer.strokeLineShape(new Phaser.Geom.Line(end.x - 50, end.y - 50, end.x + 50, end.y + 50));
            this.cameras.main.shake(80, 0.005);
          });
          this.time.delayedCall(250, () => {
            slashContainer.strokeLineShape(new Phaser.Geom.Line(end.x + 50, end.y - 50, end.x - 50, end.y + 50));
            this.cameras.main.shake(80, 0.005);
          });
          this.time.delayedCall(400, () => {
            slashContainer.lineStyle(5, 0x22c55e, 1); // Tajo final venenoso
            slashContainer.strokeLineShape(new Phaser.Geom.Line(end.x - 70, end.y, end.x + 70, end.y));
            this.cameras.main.shake(120, 0.008);
          });

          this.time.delayedCall(700, () => {
            slashContainer.destroy();
            finish();
          });
          return;
        }

        // E. BESTIA (Rank 3): Garras espectrales
        if (role === 'BESTIA' || role === 'PERRO' || role === 'JABALI' || role === 'SERPIENTE' || role === 'TORO') {
          const claw = this.add.graphics();
          claw.lineStyle(5, 0xef4444, 0.95);
          claw.setAlpha(0);

          // Animación de 3 garras descendentes
          this.tweens.add({
            targets: claw,
            alpha: 1,
            duration: 100,
            onComplete: () => {
              claw.strokeLineShape(new Phaser.Geom.Line(end.x - 35, end.y - 50, end.x - 15, end.y + 50));
              claw.strokeLineShape(new Phaser.Geom.Line(end.x - 10, end.y - 60, end.x + 10, end.y + 40));
              claw.strokeLineShape(new Phaser.Geom.Line(end.x + 15, end.y - 50, end.x + 35, end.y + 50));
              
              this.cameras.main.shake(120, 0.007);

              this.add.particles(end.x, end.y, 'sparkle', {
                speed: { min: 40, max: 150 },
                scale: { start: 1.5, end: 0 },
                lifespan: 500,
                color: [0x7f1d1d, 0xef4444],
                maxParticles: 35,
              });

              this.tweens.add({
                targets: claw,
                alpha: 0,
                delay: 250,
                duration: 200,
                onComplete: () => {
                  claw.destroy();
                  finish();
                }
              });
            }
          });
          return;
        }

        // F. TANQUE (Rank 4): Golpe de escudo sísmico
        if (role === 'TANQUE') {
          const shield = this.add.graphics();
          shield.lineStyle(4, 0xca8a04, 0.95);
          shield.fillStyle(0x854d0e, 0.4);
          
          // Dibujar forma de escudo medieval
          const shieldPath = new Phaser.Curves.Path(end.x - 30, end.y - 40);
          shieldPath.lineTo(end.x + 30, end.y - 40);
          shieldPath.lineTo(end.x + 25, end.y + 10);
          shieldPath.lineTo(end.x, end.y + 40);
          shieldPath.lineTo(end.x - 25, end.y + 10);
          shieldPath.closePath();
          
          shieldPath.draw(shield);
          shield.setScale(2);
          shield.y = end.y - 120;
          shield.x = end.x;
          shield.setAlpha(0);

          this.tweens.add({
            targets: shield,
            y: end.y,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 300,
            ease: 'Back.In',
            onComplete: () => {
              this.cameras.main.shake(200, 0.014);
              
              // Pedazos de piedra
              this.add.particles(end.x, end.y, 'sparkle', {
                speed: { min: 30, max: 120 },
                scale: { start: 2, end: 0.3 },
                lifespan: 800,
                color: [0xca8a04, 0x78350f, 0x71717a],
                maxParticles: 40,
              });

              this.tweens.add({
                targets: shield,
                alpha: 0,
                duration: 300,
                delay: 200,
                onComplete: () => {
                  shield.destroy();
                  finish();
                }
              });
            }
          });
          return;
        }

        // G. TIRADOR (Rank 7): Flecha mágica de largo alcance
        if (role === 'TIRADOR') {
          const arrow = this.add.graphics();
          arrow.lineStyle(3, 0xffffff, 1);
          arrow.fillStyle(suitColorHex, 0.8);
          // Dibujar punta de flecha
          arrow.strokeLineShape(new Phaser.Geom.Line(-25, 0, 5, 0));
          arrow.fillTriangle(5, -6, 5, 6, 15, 0);

          arrow.x = start.x;
          arrow.y = start.y;

          // Apuntar al objetivo
          const angle = Phaser.Math.Angle.Between(start.x, start.y, end.x, end.y);
          arrow.setRotation(angle);

          // Emitter para la estela de la flecha
          const trail = this.add.particles(0, 0, 'sparkle', {
            speed: { min: 10, max: 30 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            color: [suitColorHex, 0xffffff],
            follow: arrow,
          });

          this.tweens.add({
            targets: arrow,
            x: end.x,
            y: end.y,
            duration: 320,
            ease: 'Quad.In',
            onComplete: () => {
              arrow.destroy();
              trail.destroy();

              // Destello al impactar
              this.cameras.main.shake(100, 0.008);
              this.add.particles(end.x, end.y, 'sparkle', {
                speed: { min: 80, max: 220 },
                scale: { start: 1.5, end: 0 },
                lifespan: 500,
                blendMode: 'ADD',
                color: [suitColorHex, 0xffffff],
                maxParticles: 40,
              });

              this.time.delayedCall(500, finish);
            }
          });
          return;
        }

        // H. PICARO (Rank 8): Tajo y robo de monedas brillantes
        if (role === 'PICARO') {
          const slash = this.add.graphics();
          slash.lineStyle(3, 0x00ccff, 1);
          slash.strokeLineShape(new Phaser.Geom.Line(end.x - 60, end.y - 30, end.x + 60, end.y + 30));
          slash.setAlpha(0);

          this.tweens.add({
            targets: slash,
            alpha: 1,
            duration: 100,
            yoyo: true,
            hold: 100,
            onComplete: () => {
              slash.destroy();

              // Spawn de monedas voladoras desde objetivo a atacante
              const coinGroup: Phaser.GameObjects.Text[] = [];
              const numCoins = 7;

              for (let i = 0; i < numCoins; i++) {
                const coin = this.add.text(
                  end.x + Phaser.Math.Between(-30, 30),
                  end.y + Phaser.Math.Between(-30, 30),
                  '🪙',
                  { fontSize: '16px' }
                ).setOrigin(0.5);
                coinGroup.push(coin);

                // Volar hacia el atacante con retraso y curvas
                this.tweens.add({
                  targets: coin,
                  x: start.x,
                  y: start.y,
                  scaleX: 0.5,
                  scaleY: 0.5,
                  alpha: 0.6,
                  duration: 550,
                  delay: i * 70,
                  ease: 'Back.In',
                  onComplete: () => {
                    coin.destroy();
                    if (i === numCoins - 1) {
                      // Brillo verde/azul en el pícaro
                      this.add.particles(start.x, start.y, 'sparkle', {
                        speed: { min: 20, max: 60 },
                        scale: { start: 1.2, end: 0 },
                        lifespan: 400,
                        color: [0x3b82f6, 0xeab308],
                        maxParticles: 15
                      });
                      this.time.delayedCall(400, finish);
                    }
                  }
                });
              }
            }
          });
          return;
        }

        // I. MAGO (Rank 9): Círculo rúnico arcano y rayo
        if (role === 'MAGO') {
          const runes = this.add.graphics();
          runes.lineStyle(2, 0xa855f7, 0.85);
          runes.strokeCircle(end.x, end.y, 45);
          runes.strokeCircle(end.x, end.y, 35);
          
          // Pequeñas estrellas de runas
          runes.strokeTriangle(
            end.x, end.y - 35,
            end.x + 30, end.y + 15,
            end.x - 30, end.y + 15
          );
          runes.setScale(0);
          runes.x = end.x;
          runes.y = end.y;

          this.tweens.add({
            targets: runes,
            scaleX: 1,
            scaleY: 1,
            angle: 180,
            duration: 400,
            ease: 'Circ.Out',
            onComplete: () => {
              // Impacto de Rayo Arcano
              this.cameras.main.flash(200, 168, 85, 247);
              runes.destroy();

              const bolt = this.add.graphics();
              bolt.lineStyle(5, 0xffffff, 1);
              bolt.fillStyle(0xa855f7, 0.4);

              // Trazar relámpago en zigzag
              const path = [
                {x: end.x + Phaser.Math.Between(-30, 30), y: 0},
                {x: end.x + Phaser.Math.Between(-15, 15), y: end.y * 0.4},
                {x: end.x + Phaser.Math.Between(-25, 25), y: end.y * 0.75},
                {x: end.x, y: end.y}
              ];
              
              bolt.beginPath();
              bolt.moveTo(path[0].x, path[0].y);
              bolt.lineTo(path[1].x, path[1].y);
              bolt.lineTo(path[2].x, path[2].y);
              bolt.lineTo(path[3].x, path[3].y);
              bolt.strokePath();

              this.add.particles(end.x, end.y, 'sparkle', {
                speed: { min: 80, max: 250 },
                scale: { start: 2, end: 0 },
                lifespan: 600,
                blendMode: 'ADD',
                color: [0xa855f7, 0xffffff],
                maxParticles: 50,
              });

              this.tweens.add({
                targets: bolt,
                alpha: 0,
                duration: 150,
                delay: 150,
                onComplete: () => {
                  bolt.destroy();
                  finish();
                }
              });
            }
          });
          return;
        }

        // J. SOTA / JACK (Rank 10): Guadaña espectral que corta en dos
        if (role === 'SOTA') {
          const scythe = this.add.graphics();
          scythe.lineStyle(3, 0x06b6d4, 0.95);
          scythe.fillStyle(0x0891b2, 0.35);

          // Guadaña con forma semicircular
          scythe.beginPath();
          scythe.arc(0, 0, 50, -Math.PI / 2, Math.PI / 2, false);
          scythe.lineTo(-30, 20);
          scythe.closePath();
          scythe.fillPath();
          scythe.strokePath();

          scythe.x = end.x - 100;
          scythe.y = end.y - 30;
          scythe.angle = -45;

          // Tajo en abanico
          this.tweens.add({
            targets: scythe,
            x: end.x + 80,
            y: end.y + 20,
            angle: 135,
            duration: 400,
            ease: 'Cubic.Out',
            onComplete: () => {
              scythe.destroy();
              this.cameras.main.shake(150, 0.009);

              // Línea de corte que brilla en el centro de la carta
              const sliceLine = this.add.graphics();
              sliceLine.lineStyle(4, 0xffffff, 1);
              sliceLine.strokeLineShape(new Phaser.Geom.Line(end.x - 45, end.y + 40, end.x + 45, end.y - 40));

              // Destellos laterales
              this.add.particles(end.x, end.y, 'sparkle', {
                angle: { min: -135, max: 45 },
                speed: { min: 50, max: 180 },
                scale: { start: 1.5, end: 0 },
                lifespan: 500,
                color: [0x06b6d4, 0xffffff],
                maxParticles: 35
              });

              this.tweens.add({
                targets: sliceLine,
                alpha: 0,
                duration: 250,
                delay: 200,
                onComplete: () => {
                  sliceLine.destroy();
                  finish();
                }
              });
            }
          });
          return;
        }

        // K. CABALLO (Rank 11): Carga de lanza metálica
        if (role === 'CABALLO') {
          const lance = this.add.graphics();
          lance.lineStyle(4, 0xcbd5e1, 1);
          lance.fillStyle(0x94a3b8, 0.75);

          // Dibujar lanza larga y afilada
          lance.strokeLineShape(new Phaser.Geom.Line(-60, 0, 10, 0));
          lance.fillTriangle(10, -5, 10, 5, 25, 0);

          lance.x = start.x;
          lance.y = start.y;
          const angle = Phaser.Math.Angle.Between(start.x, start.y, end.x, end.y);
          lance.setRotation(angle);

          // Estela de aire blanco
          const windTrail = this.add.particles(0, 0, 'sparkle', {
            speed: { min: 20, max: 50 },
            scale: { start: 1.5, end: 0 },
            lifespan: 250,
            color: [0xffffff, 0xe2e8f0],
            follow: lance,
          });

          this.tweens.add({
            targets: lance,
            x: end.x,
            y: end.y,
            duration: 280,
            ease: 'Quint.In',
            onComplete: () => {
              lance.destroy();
              windTrail.destroy();
              this.cameras.main.shake(120, 0.01);

              this.add.particles(end.x, end.y, 'sparkle', {
                speed: { min: 100, max: 250 },
                scale: { start: 1.5, end: 0 },
                lifespan: 400,
                color: [0xf8fafc, 0x94a3b8],
                maxParticles: 30
              });

              this.time.delayedCall(450, finish);
            }
          });
          return;
        }

        // L. CLÉRIGO (Rank 5) / OTROS: Ataque básico simple
        // Animación de impacto genérica con chispas del color de la baraja
        const projectile = this.add.graphics();
        projectile.fillStyle(suitColorHex, 0.95);
        projectile.fillCircle(0, 0, 8);
        projectile.x = start.x;
        projectile.y = start.y;

        const basicTrail = this.add.particles(0, 0, 'sparkle', {
          speed: { min: 10, max: 20 },
          scale: { start: 1, end: 0 },
          lifespan: 200,
          color: [suitColorHex],
          follow: projectile,
        } as any);

        this.tweens.add({
          targets: projectile,
          x: end.x,
          y: end.y,
          duration: 350,
          ease: 'Sine.Out',
          onComplete: () => {
            projectile.destroy();
            basicTrail.destroy();

            this.cameras.main.shake(80, 0.005);

            this.add.particles(end.x, end.y, 'sparkle', {
              speed: { min: 60, max: 150 },
              scale: { start: 1.2, end: 0 },
              lifespan: 400,
              blendMode: 'ADD',
              color: [suitColorHex, 0xffffff],
              maxParticles: 20
            });

            this.time.delayedCall(400, finish);
          }
        });
      },
    };

    // Inicializar Phaser
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: W,
      height: H,
      transparent: true,
      scene: sceneConfig as any,
    });

    // Escuchar la señal de fin
    game.events.once('attack-animation-done', () => {
      game.destroy(true);
      onComplete();
    });

    return () => {
      if (!destroyed) {
        destroyed = true;
        game.destroy(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[150] overflow-hidden"
      style={{ pointerEvents: 'all' }} // Prevenir clicks en el tablero mientras dura la animación
    />
  );
};
