import React, { useEffect, useRef } from 'react';
import { OccasionTheme } from '../themes';

interface SeasonalThemeOverlayProps {
  theme: OccasionTheme;
  enabled: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export const SeasonalThemeOverlay: React.FC<SeasonalThemeOverlayProps> = ({
  theme,
  enabled,
  intensity = 'medium',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || theme.animationType === 'none') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const intensityMultiplier = intensity === 'low' ? 0.5 : intensity === 'high' ? 1.6 : 1.0;

    // --- PARTICLE ENGINES PER ANIMATION TYPE ---
    const type = theme.animationType;

    // 1. SNOWING
    let snowflakes: Array<{
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      windOffset: number;
      windSpeed: number;
      opacity: number;
      twinkle: number;
      isDetailed: boolean;
    }> = [];

    // 2. FIREWORKS & EMBERS
    let embers: Array<{
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
      life: number;
      maxLife: number;
    }> = [];

    let fireworks: Array<{
      x: number;
      y: number;
      targetY: number;
      speedY: number;
      speedX: number;
      exploded: boolean;
      color: string;
      particles: Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        color: string;
        alpha: number;
        decay: number;
        size: number;
      }>;
    }> = [];

    // 3. CONFETTI
    let confetti: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      speedY: number;
      speedX: number;
      angle: number;
      rotationSpeed: number;
      tilt: number;
      tiltAngle: number;
      tiltAngleSpeed: number;
      opacity: number;
    }> = [];

    // 4. HALLOWEEN SPIRITS & BATS
    let spirits: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      wobble: number;
      wobbleSpeed: number;
      opacity: number;
      color: string;
      type: 'orb' | 'bat' | 'wisp';
    }> = [];

    // 5. CHERRY BLOSSOM PETALS
    let petals: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      angle: number;
      angleSpeed: number;
      flip: number;
      flipSpeed: number;
      color: string;
      opacity: number;
    }> = [];

    // 6. SUNLIGHT & GOLDEN BOKEH
    let sunMotes: Array<{
      x: number;
      y: number;
      radius: number;
      baseRadius: number;
      speedY: number;
      speedX: number;
      pulse: number;
      pulseSpeed: number;
      opacity: number;
      color: string;
    }> = [];

    // 7. SHAMROCKS & GOLD DUST
    let shamrocks: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      angle: number;
      rotationSpeed: number;
      opacity: number;
      isGoldDust: boolean;
    }> = [];

    // Initialize counts based on intensity
    if (type === 'snowing') {
      const count = Math.floor(65 * intensityMultiplier);
      for (let i = 0; i < count; i++) {
        snowflakes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 3.5 + 1,
          speedY: Math.random() * 1.4 + 0.6,
          speedX: Math.random() * 0.8 - 0.4,
          windOffset: Math.random() * Math.PI * 2,
          windSpeed: Math.random() * 0.02 + 0.005,
          opacity: Math.random() * 0.7 + 0.3,
          twinkle: Math.random() * 0.05,
          isDetailed: Math.random() > 0.75,
        });
      }
    } else if (type === 'fireworks') {
      const emberCount = Math.floor(45 * intensityMultiplier);
      const emberColors = ['#f59e0b', '#ef4444', '#f97316', '#fbbf24', '#e11d48'];
      for (let i = 0; i < emberCount; i++) {
        embers.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2.5 + 1,
          speedY: -(Math.random() * 1.5 + 0.5),
          speedX: Math.random() * 0.8 - 0.4,
          opacity: Math.random() * 0.8 + 0.2,
          color: emberColors[Math.floor(Math.random() * emberColors.length)],
          life: Math.random() * 100,
          maxLife: Math.random() * 120 + 80,
        });
      }
    } else if (type === 'confetti') {
      const count = Math.floor(45 * intensityMultiplier);
      const colors = ['#dc2626', '#ffffff', '#2563eb', '#1e40af', '#ef4444', '#e2e8f0', '#f59e0b'];
      for (let i = 0; i < count; i++) {
        confetti.push({
          x: Math.random() * width,
          y: Math.random() * height,
          w: Math.random() * 8 + 6,
          h: Math.random() * 5 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedY: Math.random() * 1.8 + 1.0,
          speedX: Math.random() * 1.2 - 0.6,
          angle: Math.random() * Math.PI * 2,
          rotationSpeed: Math.random() * 0.04 - 0.02,
          tilt: Math.random() * 10 - 5,
          tiltAngle: Math.random() * Math.PI,
          tiltAngleSpeed: Math.random() * 0.08 + 0.04,
          opacity: Math.random() * 0.85 + 0.15,
        });
      }
    } else if (type === 'halloween') {
      const count = Math.floor(30 * intensityMultiplier);
      const colors = ['#a855f7', '#c084fc', '#f97316', '#22c55e', '#38bdf8'];
      for (let i = 0; i < count; i++) {
        const pType: 'orb' | 'bat' | 'wisp' = Math.random() > 0.6 ? 'bat' : Math.random() > 0.3 ? 'orb' : 'wisp';
        spirits.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: pType === 'bat' ? Math.random() * 10 + 10 : Math.random() * 8 + 4,
          speedX: (Math.random() * 1.2 - 0.6) * (pType === 'bat' ? 1.5 : 0.8),
          speedY: -(Math.random() * 0.6 + 0.2),
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.04 + 0.02,
          opacity: Math.random() * 0.6 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          type: pType,
        });
      }
    } else if (type === 'blossom') {
      const count = Math.floor(35 * intensityMultiplier);
      const petalColors = ['#fbcfe8', '#f472b6', '#fda4af', '#fff1f2', '#fecdd3'];
      for (let i = 0; i < count; i++) {
        petals.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 7 + 6,
          speedY: Math.random() * 1.2 + 0.6,
          speedX: Math.random() * 1.0 + 0.2,
          angle: Math.random() * Math.PI * 2,
          angleSpeed: Math.random() * 0.03 - 0.015,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.04 + 0.02,
          color: petalColors[Math.floor(Math.random() * petalColors.length)],
          opacity: Math.random() * 0.7 + 0.25,
        });
      }
    } else if (type === 'sunlight') {
      const count = Math.floor(30 * intensityMultiplier);
      const sunColors = ['#fef08a', '#fde047', '#facc15', '#fef9c3', '#fed7aa'];
      for (let i = 0; i < count; i++) {
        const baseR = Math.random() * 6 + 2;
        sunMotes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: baseR,
          baseRadius: baseR,
          speedY: -(Math.random() * 0.6 + 0.2),
          speedX: Math.random() * 0.6 - 0.3,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.03 + 0.01,
          opacity: Math.random() * 0.6 + 0.2,
          color: sunColors[Math.floor(Math.random() * sunColors.length)],
        });
      }
    } else if (type === 'shamrocks') {
      const count = Math.floor(32 * intensityMultiplier);
      for (let i = 0; i < count; i++) {
        const isGold = Math.random() > 0.65;
        shamrocks.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: isGold ? Math.random() * 3 + 2 : Math.random() * 10 + 8,
          speedY: Math.random() * 1.1 + 0.5,
          speedX: Math.random() * 0.8 - 0.4,
          angle: Math.random() * Math.PI * 2,
          rotationSpeed: Math.random() * 0.03 - 0.015,
          opacity: Math.random() * 0.75 + 0.25,
          isGoldDust: isGold,
        });
      }
    }

    let fireworkTimer = 0;

    // --- MAIN RENDER LOOP ---
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (type === 'snowing') {
        snowflakes.forEach((s) => {
          s.windOffset += s.windSpeed;
          s.y += s.speedY;
          s.x += Math.sin(s.windOffset) * 0.7 + s.speedX;

          if (s.y > height + 10) {
            s.y = -10;
            s.x = Math.random() * width;
          }
          if (s.x > width + 10) s.x = -10;
          if (s.x < -10) s.x = width + 10;

          ctx.save();
          ctx.globalAlpha = s.opacity;

          if (s.isDetailed && s.radius > 2.5) {
            // Draw multi-arm snowflake
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const arms = 6;
            for (let a = 0; a < arms; a++) {
              const rad = (a * Math.PI) / 3;
              const x2 = s.x + Math.cos(rad) * s.radius * 1.8;
              const y2 = s.y + Math.sin(rad) * s.radius * 1.8;
              ctx.moveTo(s.x, s.y);
              ctx.lineTo(x2, y2);
            }
            ctx.stroke();
          } else {
            // Soft glowing circle
            const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 1.5);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.6, '#e0f2fe');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
      } else if (type === 'fireworks') {
        // Render rising embers
        embers.forEach((e) => {
          e.life += 1;
          e.y += e.speedY;
          e.x += e.speedX + Math.sin(e.life * 0.05) * 0.3;
          const lifeProgress = e.life / e.maxLife;

          if (e.y < -10 || lifeProgress >= 1) {
            e.y = height + 10;
            e.x = Math.random() * width;
            e.life = 0;
          }

          ctx.save();
          ctx.globalAlpha = Math.sin(lifeProgress * Math.PI) * e.opacity;
          ctx.fillStyle = e.color;
          ctx.shadowColor = e.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Trigger occasional rocket
        fireworkTimer++;
        if (fireworkTimer % Math.floor(90 / intensityMultiplier) === 0) {
          const rocketColors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f97316'];
          fireworks.push({
            x: Math.random() * (width * 0.8) + width * 0.1,
            y: height,
            targetY: Math.random() * (height * 0.45) + height * 0.1,
            speedY: -(Math.random() * 4 + 7),
            speedX: Math.random() * 2 - 1,
            exploded: false,
            color: rocketColors[Math.floor(Math.random() * rocketColors.length)],
            particles: [],
          });
        }

        // Update fireworks
        for (let i = fireworks.length - 1; i >= 0; i--) {
          const fw = fireworks[i];
          if (!fw.exploded) {
            fw.y += fw.speedY;
            fw.x += fw.speedX;

            ctx.save();
            ctx.fillStyle = fw.color;
            ctx.shadowColor = fw.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(fw.x, fw.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (fw.y <= fw.targetY || fw.speedY >= 0) {
              fw.exploded = true;
              const pCount = Math.floor(35 * intensityMultiplier);
              for (let p = 0; p < pCount; p++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 3.5 + 1;
                fw.particles.push({
                  x: fw.x,
                  y: fw.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  color: fw.color,
                  alpha: 1,
                  decay: Math.random() * 0.025 + 0.015,
                  size: Math.random() * 2.5 + 1.2,
                });
              }
            }
          } else {
            // Render explosion particles
            let aliveCount = 0;
            fw.particles.forEach((p) => {
              p.x += p.vx;
              p.y += p.vy;
              p.vy += 0.04; // gravity
              p.vx *= 0.98;
              p.vy *= 0.98;
              p.alpha -= p.decay;

              if (p.alpha > 0) {
                aliveCount++;
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            });

            if (aliveCount === 0) {
              fireworks.splice(i, 1);
            }
          }
        }
      } else if (type === 'confetti') {
        confetti.forEach((c) => {
          c.y += c.speedY;
          c.x += c.speedX + Math.sin(c.angle) * 0.5;
          c.angle += c.rotationSpeed;
          c.tiltAngle += c.tiltAngleSpeed;
          c.tilt = Math.sin(c.tiltAngle) * 8;

          if (c.y > height + 10) {
            c.y = -10;
            c.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.angle);
          ctx.globalAlpha = c.opacity;
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.rect(-c.w / 2, -c.tilt / 2, c.w, Math.abs(c.tilt) + 2);
          ctx.fill();
          ctx.restore();
        });
      } else if (type === 'halloween') {
        spirits.forEach((s) => {
          s.wobble += s.wobbleSpeed;
          s.y += s.speedY;
          s.x += s.speedX + Math.sin(s.wobble) * 0.8;

          if (s.y < -30) {
            s.y = height + 20;
            s.x = Math.random() * width;
          }
          if (s.x > width + 20) s.x = -20;
          if (s.x < -20) s.x = width + 20;

          ctx.save();
          ctx.globalAlpha = s.opacity;

          if (s.type === 'bat') {
            // Draw gentle bat shape
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            const wingW = s.size;
            const wingFlap = Math.sin(s.wobble * 3) * 4;
            ctx.ellipse(s.x, s.y, wingW * 0.25, wingW * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Left wing
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.quadraticCurveTo(s.x - wingW * 0.6, s.y - wingW * 0.4 + wingFlap, s.x - wingW, s.y + wingFlap);
            ctx.quadraticCurveTo(s.x - wingW * 0.5, s.y + wingW * 0.2, s.x, s.y);
            ctx.fill();
            // Right wing
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.quadraticCurveTo(s.x + wingW * 0.6, s.y - wingW * 0.4 + wingFlap, s.x + wingW, s.y + wingFlap);
            ctx.quadraticCurveTo(s.x + wingW * 0.5, s.y + wingW * 0.2, s.x, s.y);
            ctx.fill();
          } else {
            // Ethereal glowing spirit orb
            const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 2);
            grad.addColorStop(0, s.color);
            grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
      } else if (type === 'blossom') {
        petals.forEach((p) => {
          p.y += p.speedY;
          p.x += p.speedX + Math.sin(p.angle) * 0.6;
          p.angle += p.angleSpeed;
          p.flip += p.flipSpeed;

          if (p.y > height + 20) {
            p.y = -20;
            p.x = Math.random() * width;
          }
          if (p.x > width + 20) p.x = -20;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.scale(1, Math.cos(p.flip));
          ctx.globalAlpha = p.opacity;

          // Draw realistic curved petal
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.5, p.size * 0.8, p.size * 0.5, 0, p.size);
          ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.5, -p.size * 0.8, -p.size * 0.5, 0, -p.size);
          ctx.fill();
          ctx.restore();
        });
      } else if (type === 'sunlight') {
        sunMotes.forEach((m) => {
          m.pulse += m.pulseSpeed;
          m.y += m.speedY;
          m.x += m.speedX + Math.sin(m.pulse) * 0.4;
          const currentRadius = m.baseRadius + Math.sin(m.pulse) * 1.5;

          if (m.y < -20) {
            m.y = height + 20;
            m.x = Math.random() * width;
          }
          if (m.x > width + 20) m.x = -20;
          if (m.x < -20) m.x = width + 20;

          ctx.save();
          ctx.globalAlpha = m.opacity * (0.6 + Math.sin(m.pulse) * 0.4);
          const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, currentRadius * 2);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.4, m.color);
          grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(m.x, m.y, currentRadius * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      } else if (type === 'shamrocks') {
        shamrocks.forEach((s) => {
          s.y += s.speedY;
          s.x += s.speedX + Math.sin(s.angle) * 0.5;
          s.angle += s.rotationSpeed;

          if (s.y > height + 20) {
            s.y = -20;
            s.x = Math.random() * width;
          }
          if (s.x > width + 20) s.x = -20;
          if (s.x < -20) s.x = width + 20;

          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(s.angle);
          ctx.globalAlpha = s.opacity;

          if (s.isGoldDust) {
            // Gold sparkle
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(0, 0, s.size, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // 4-leaf clover shape
            ctx.fillStyle = '#10b981';
            const r = s.size * 0.35;
            // 4 leaves
            for (let i = 0; i < 4; i++) {
              ctx.save();
              ctx.rotate((i * Math.PI) / 2);
              ctx.beginPath();
              ctx.arc(0, -r, r, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
            // Tiny center stem
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(r * 0.5, r * 1.5, 0, r * 2);
            ctx.stroke();
          }
          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, enabled, intensity]);

  if (!enabled || theme.animationType === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      id="seasonal-theme-overlay-canvas"
      className="fixed inset-0 pointer-events-none z-30 w-full h-full"
    />
  );
};
