import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  pulse: number;
};

const PALETTE = [
  220, 28, 18, 145, 200, 340, 45, 280, 95,
];

export function AmbientBackground({
  density = 38,
  className = "",
}: {
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const orbitRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed(width, height);
    }

    function seed(w: number, h: number) {
      const count = Math.round(density * (w / 1200));
      nodesRef.current = Array.from({ length: Math.max(18, count) }, (_, i) => {
        const hue = PALETTE[i % PALETTE.length];
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1.6 + Math.random() * 2.2,
          hue,
          pulse: Math.random() * Math.PI * 2,
        };
      });
    }

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      // Soft globe arc — humanity around the world
      orbitRef.current += reduceMotion ? 0 : 0.0008;
      const cx = w * 0.78;
      const cy = h * 0.55;
      const rad = Math.min(w, h) * 0.42;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(orbitRef.current);
      ctx.strokeStyle = "hsla(158, 60%, 30%, 0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, rad, rad * (0.18 + i * 0.16), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Latitude dots representing people across the globe
      ctx.fillStyle = "hsla(158, 60%, 30%, 0.12)";
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad * 0.34;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const nodes = nodesRef.current;

      // Move & draw connecting AI lines
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!reduceMotion) {
          n.x += n.vx;
          n.y += n.vy;
          n.pulse += 0.012;
        }
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.hypot(dx, dy);
          const max = 165;
          if (dist < max) {
            const alpha = (1 - dist / max) * 0.18;
            const grad = ctx.createLinearGradient(n.x, n.y, m.x, m.y);
            grad.addColorStop(0, `hsla(${n.hue}, 70%, 50%, ${alpha})`);
            grad.addColorStop(1, `hsla(${m.hue}, 70%, 50%, ${alpha})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes — diverse people
      for (const n of nodes) {
        const pulse = 0.7 + Math.sin(n.pulse) * 0.3;
        // Halo
        const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        halo.addColorStop(0, `hsla(${n.hue}, 75%, 55%, ${0.22 * pulse})`);
        halo.addColorStop(1, `hsla(${n.hue}, 75%, 55%, 0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.fillStyle = `hsla(${n.hue}, 70%, 45%, 0.85)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    resize();
    draw();
    const onResize = () => {
      resize();
      if (reduceMotion) draw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [density]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      data-testid="ambient-background"
    >
      <canvas ref={canvasRef} className="block w-full h-full opacity-70 dark:opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F6]/0 via-[#FAF9F6]/10 to-[#FAF9F6]/60 dark:from-background/0 dark:via-background/20 dark:to-background/70" />
    </div>
  );
}
