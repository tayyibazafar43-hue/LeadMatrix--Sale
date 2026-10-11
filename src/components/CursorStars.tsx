import React, { useEffect, useRef } from 'react';

interface CursorStarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
}

const TRAIL_COLORS = [
  '#ffffff', // White
  '#ef4444', // Red
  '#facc15', // Yellow
  '#f472b6', // Pink
  '#c084fc', // Purple
  '#60a5fa', // Blue
  '#22d3ee', // Cyan
  '#fb923c', // Orange
  '#fbbf24', // Gold
  '#10b981', // Emerald accent
];

export const CursorStars: React.FC = () => {
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
    if (prefersReducedMotion) return;

    let particles: CursorStarParticle[] = [];
    const MAX_PARTICLES = 100;

    let lastMouseX = -100;
    let lastMouseY = -100;
    let lastMoveTime = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only generate stars if the cursor has moved sufficiently
      if (dist > 3) {
        lastMoveTime = now;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        // Spawn 2-3 colorful micro stars
        const spawnCount = Math.min(3, Math.max(1, Math.floor(dist / 8)));
        for (let i = 0; i < spawnCount; i++) {
          if (particles.length >= MAX_PARTICLES) {
            particles.shift(); // Remove oldest to maintain performance
          }

          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 0.9 + 0.2;
          const color = TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)];
          const maxLife = Math.floor(Math.random() * 35 + 65); // ~1.1 to 1.8 seconds at 60fps

          particles.push({
            x: e.clientX + (Math.random() - 0.5) * 8,
            y: e.clientY + (Math.random() - 0.5) * 8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.15, // Gentle cosmic drift
            size: Math.random() * 2.2 + 1.2,
            color,
            life: maxLife,
            maxLife,
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 0.08,
          });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Function to draw a 4-pointed micro star
    const drawSparkle = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      rotation: number
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.beginPath();
      for (let i = 0; i < 4; i++) {
        c.lineTo(Math.cos((i * Math.PI) / 2) * radius, Math.sin((i * Math.PI) / 2) * radius);
        c.lineTo(
          Math.cos((i * Math.PI) / 2 + Math.PI / 4) * (radius * 0.35),
          Math.sin((i * Math.PI) / 2 + Math.PI / 4) * (radius * 0.35)
        );
      }
      c.closePath();
      c.fill();
      c.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 1;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.vx *= 0.98; // gentle deceleration
        p.vy *= 0.98;

        const progress = p.life / p.maxLife; // 1 -> 0
        const alpha = Math.sin((progress * Math.PI) / 2); // Smooth ease-out fade

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;

        // Render sparkle star
        drawSparkle(ctx, p.x, p.y, p.size * (0.8 + progress * 0.4), p.rotation);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ display: 'block' }}
      aria-hidden="true"
    />
  );
};
