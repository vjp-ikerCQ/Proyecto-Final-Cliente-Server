import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { type CardData } from '../../../utils/cardData';

interface JokerAnimationOverlayProps {
  jokerCard: CardData;
  onComplete: () => void;
}

export const JokerAnimationOverlay: React.FC<JokerAnimationOverlayProps> = ({
  jokerCard,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isJoker3 = jokerCard.rank === 3;
    const isJoker1 = jokerCard.rank === 1;
    const icons: string[] = isJoker3
      ? ['💀', '🃏', '💀', '🃏', '💀', '🃏']
      : isJoker1
        ? ['🃏', '⇄', '🃏', '⇄', '🃏', '⇄']
        : ['🃏', '↩', '🃏', '↩', '🃏', '↩'];
    const label = isJoker3 ? 'RESURRECCIÓN' : isJoker1 ? 'INTERCAMBIO' : 'RETORNO';
    const cardImagePath = jokerCard.image;
    const W = window.innerWidth;
    const H = window.innerHeight;

    let destroyed = false;

    const sceneConfig = {
      key: 'JokerScene',
      preload(this: Phaser.Scene) {
        this.load.image('jokerCard', cardImagePath);
      },
      create(this: Phaser.Scene) {
        const cx = W / 2;
        const cy = H / 2;

        // Dark overlay
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.65);
        bg.fillRect(0, 0, W, H);
        bg.setAlpha(0);
        this.tweens.add({ targets: bg, alpha: 1, duration: 300 });

        // Purple glow aura
        const aura = this.add.graphics();
        aura.fillStyle(0x6d28d9, 0.25);
        aura.fillCircle(cx, cy, 185);
        aura.lineStyle(2, 0xa855f7, 0.9);
        aura.strokeCircle(cx, cy, 185);
        aura.setAlpha(0);
        this.tweens.add({ targets: aura, alpha: 1, duration: 500 });
        // Pulse the aura
        this.tweens.add({
          targets: aura,
          alpha: { from: 0.7, to: 1 },
          duration: 700,
          yoyo: true,
          repeat: -1,
          delay: 600,
        });

        // Card dimensions
        const cardW = Math.min(W * 0.19, 155);
        const cardH = cardW * 1.5;

        // Card starts below screen
        const card = this.add.image(cx, H + cardH, 'jokerCard');
        card.setDisplaySize(cardW, cardH);

        // Fly up to center with overshoot
        this.tweens.add({
          targets: card,
          y: cy,
          duration: 580,
          ease: 'Back.Out',
        });

        // Border outline appears after card arrives
        const border = this.add.graphics();
        border.setAlpha(0);
        this.time.delayedCall(640, () => {
          border.lineStyle(3, 0xa855f7, 1);
          border.strokeRoundedRect(
            cx - cardW / 2 - 6,
            cy - cardH / 2 - 6,
            cardW + 12,
            cardH + 12,
            6,
          );
          this.tweens.add({ targets: border, alpha: 1, duration: 200 });
          // Pulse border
          this.tweens.add({
            targets: border,
            alpha: { from: 0.45, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            delay: 300,
          });
        });

        // Card scale pulse after it arrives
        this.time.delayedCall(680, () => {
          const sx = card.scaleX;
          const sy = card.scaleY;
          this.tweens.add({
            targets: card,
            scaleX: sx * 1.055,
            scaleY: sy * 1.055,
            duration: 620,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut',
          });
        });

        // Orbiting icons
        const orbitRadius = cardW * 1.85;
        const numIcons = icons.length;
        const orbitTexts: Phaser.GameObjects.Text[] = [];

        icons.forEach((icon, i) => {
          const fontSize = Math.max(18, Math.floor(W * 0.023));
          const t = this.add.text(cx, cy, icon, {
            fontSize: `${fontSize}px`,
            color: '#d8b4fe',
          });
          t.setOrigin(0.5, 0.5);
          t.setAlpha(0);
          this.tweens.add({
            targets: t,
            alpha: 1,
            duration: 220,
            delay: 480 + i * 65,
          });
          orbitTexts.push(t);
        });

        // Orbit update loop
        let totalAngle = 0;
        this.time.addEvent({
          delay: 16,
          loop: true,
          callback: () => {
            totalAngle += 0.021;
            orbitTexts.forEach((t, i) => {
              const angle = totalAngle + (i / numIcons) * Math.PI * 2;
              t.setPosition(
                cx + Math.cos(angle) * orbitRadius,
                cy + Math.sin(angle) * orbitRadius,
              );
            });
          },
        });

        // Label below card
        const labelObj = this.add.text(cx, cy + cardH / 2 + 30, label, {
          fontSize: '14px',
          color: '#c084fc',
          fontStyle: 'bold',
          letterSpacing: 5,
        });
        labelObj.setOrigin(0.5, 0.5);
        labelObj.setAlpha(0);
        this.tweens.add({ targets: labelObj, alpha: 1, duration: 280, delay: 720 });

        // Fade out everything after 2.2s then emit done
        this.time.delayedCall(2200, () => {
          const all = [bg, aura, card, border, labelObj, ...orbitTexts];
          this.tweens.add({
            targets: all,
            alpha: 0,
            duration: 320,
            onComplete: () => {
              if (!destroyed) {
                destroyed = true;
                this.game.events.emit('joker-animation-done');
              }
            },
          });
        });
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: W,
      height: H,
      transparent: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scene: sceneConfig as any,
    });

    game.events.once('joker-animation-done', () => {
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
      style={{ pointerEvents: 'all' }}
    />
  );
};
