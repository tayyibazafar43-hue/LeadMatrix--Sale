import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  alphaSpeed: number;
  baseAlpha: number;
  vx: number;
  vy: number;
}

const STAR_COLORS = [
  '#ffffff', // White
  '#ef4444', // Red
  '#facc15', // Yellow
  '#f472b6', // Pink
  '#c084fc', // Purple
  '#60a5fa', // Blue
  '#22d3ee', // Cyan
  '#fb923c', // Orange
  '#f59e0b', // Gold
];

export const GalaxyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize 280 background stars
    const starCount = Math.min(300, Math.floor((width * height) / 4500));
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.6,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        alpha: Math.random() * 0.7 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.3,
        alphaSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      // 1. Clear background with deep midnight galaxy gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#030712'); // Deepest obsidian black
      bgGrad.addColorStop(0.4, '#040d21'); // Deep midnight navy
      bgGrad.addColorStop(0.7, '#081226'); // Midnight space blue
      bgGrad.addColorStop(1, '#020617'); // Dark slate cosmos
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Distant cosmic nebulas with soft colored glows
      const nebula1 = ctx.createRadialGradient(width * 0.25, height * 0.3, 20, width * 0.25, height * 0.3, width * 0.45);
      nebula1.addColorStop(0, 'rgba(16, 185, 129, 0.07)'); // Emerald core glow
      nebula1.addColorStop(0.5, 'rgba(56, 189, 248, 0.03)'); // Cyan fringe
      nebula1.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(width * 0.8, height * 0.65, 30, width * 0.8, height * 0.65, width * 0.5);
      nebula2.addColorStop(0, 'rgba(139, 92, 246, 0.06)'); // Purple cosmic haze
      nebula2.addColorStop(0.6, 'rgba(59, 130, 246, 0.02)'); // Blue mist
      nebula2.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      const nebula3 = ctx.createRadialGradient(width * 0.5, height * 0.9, 10, width * 0.5, height * 0.9, width * 0.35);
      nebula3.addColorStop(0, 'rgba(234, 88, 12, 0.04)'); // Subtle amber/gold dust
      nebula3.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = nebula3;
      ctx.fillRect(0, 0, width, height);

      // 3. Render twinkling stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (!prefersReducedMotion) {
          star.alpha += star.alphaSpeed;
          if (star.alpha > star.baseAlpha + 0.3 || star.alpha < star.baseAlpha - 0.25 || star.alpha < 0.1) {
            star.alphaSpeed = -star.alphaSpeed;
          }

          star.x += star.vx;
          star.y += star.vy;

          if (star.x < 0) star.x = width;
          if (star.x > width) star.x = 0;
          if (star.y < 0) star.y = height;
          if (star.y > height) star.y = 0;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0.05, Math.min(1, star.alpha));
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.size > 1.4 ? 6 : 2;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
};
