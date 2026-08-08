import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefObject,
} from "react";

export type ParticleNetworkHandle = {
  /** Pull nearby particles gently toward a viewport point (used for CTA magnetism). */
  attractTo: (clientX: number, clientY: number) => void;
  /** Release the magnetic attraction and let particles drift back. */
  release: () => void;
};

type Particle = {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  hue: 0 | 1 | 2; // 0 = soft white, 1 = primary, 2 = secondary accent
  phase: number;
  twinkleSpeed: number;
  twinklePhase: number;
  dx: number;
  dy: number;
  glow: number;
};

type Ripple = { x: number; y: number; start: number };

const MAX_LINK_DIST = 128;
const REPEL_RADIUS = 190;
const REPEL_STRENGTH = 22;
const MAGNET_RADIUS = 260;
const MAGNET_STRENGTH = 34;
const RETURN_EASE = 0.055;
const REACT_EASE = 0.12;
const ACTIVE_RADIUS = 68;
const IDLE_MS = 3600;
const RIPPLE_DURATION = 1100;
const RIPPLE_MAX_RADIUS = 260;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isCoarsePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

function withAlpha(oklchColor: string, alpha: number) {
  // oklchColor looks like "oklch(0.75 0.2 120)" — inject an alpha channel.
  return oklchColor.replace(/\)\s*$/, ` / ${alpha})`);
}

function readColor(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}

/** A four-point star flare — the "shine" a star gets when the cursor is near it. */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
  color: string,
) {
  if (radius <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = "lighter";

  const arm = (x1: number, y1: number, x2: number, y2: number) => {
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, withAlpha(color, 0));
    grad.addColorStop(0.5, withAlpha(color, alpha));
    grad.addColorStop(1, withAlpha(color, 0));
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  ctx.lineWidth = Math.max(0.6, radius * 0.045);
  arm(-radius, 0, radius, 0);
  arm(0, -radius, 0, radius);

  ctx.lineWidth = Math.max(0.4, radius * 0.025);
  const diag = radius * 0.6;
  arm(-diag, -diag, diag, diag);
  arm(-diag, diag, diag, -diag);

  ctx.restore();
}

export const ParticleNetwork = forwardRef<
  ParticleNetworkHandle,
  { containerRef: RefObject<HTMLDivElement | null> }
>(function ParticleNetwork({ containerRef }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const magnetRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  useImperativeHandle(ref, () => ({
    attractTo(clientX, clientY) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      magnetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
        active: true,
      };
    },
    release() {
      magnetRef.current.active = false;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const touch = isCoarsePointer();

    const colorWhite = readColor("--foreground", "oklch(0.97 0.01 90)");
    const colorPrimary = readColor("--primary", "oklch(0.75 0.20 120)");
    const colorAccent = readColor("--accent", "oklch(0.86 0.13 88)");
    const colors = [colorWhite, colorPrimary, colorAccent];

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Particle[] = [];
    let raf = 0;
    let running = true;

    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, inside: false };
    let lastMoveAt = 0;
    const ripples: Ripple[] = [];
    let constellation: {
      ids: number[];
      start: number;
      duration: number;
    } | null = null;
    let nextConstellationAt = performance.now() + 3000 + Math.random() * 3000;

    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));

    const particleCount = (w: number, h: number) => {
      const area = w * h;
      if (touch) return Math.round(clamp(area / 9000, 150, 300));
      return Math.round(clamp(area / 2600, 500, 1000));
    };

    const seedParticles = () => {
      const count = reduced
        ? Math.round(clamp((width * height) / 6000, 120, 260))
        : particleCount(width, height);
      particles = new Array(count).fill(0).map(() => {
        const ox = Math.random() * width;
        const oy = Math.random() * height;
        const hueRoll = Math.random();
        return {
          ox,
          oy,
          x: ox,
          y: oy,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          size: Math.random() * 1.6 + 0.6,
          baseAlpha: Math.random() * 0.45 + 0.12,
          hue: hueRoll > 0.93 ? 2 : hueRoll > 0.78 ? 1 : 0,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.0006 + Math.random() * 0.0016,
          twinklePhase: Math.random() * Math.PI * 2,
          dx: 0,
          dy: 0,
          glow: 0,
        };
      });
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    resize();

    const onPointerMove = (e: PointerEvent) => {
      if (touch) return;
      const rect = container.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      pointer.inside = inside;
      if (inside) {
        pointer.tx = e.clientX - rect.left;
        pointer.ty = e.clientY - rect.top;
        lastMoveAt = performance.now();
      }
    };

    const onPointerLeave = () => {
      pointer.inside = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) return;
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        start: performance.now(),
      });
      if (ripples.length > 4) ripples.shift();
    };

    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("blur", onPointerLeave);
      document.addEventListener("mouseleave", onPointerLeave);
    }

    const drawFrame = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      if (!reduced) {
        // smooth cursor inertia
        pointer.x += (pointer.tx - pointer.x) * 0.18;
        pointer.y += (pointer.ty - pointer.y) * 0.18;
      }

      const idle = !reduced && now - lastMoveAt > IDLE_MS;
      const activity = idle ? 0.55 : 1;

      // occasional constellation shimmer
      if (!reduced && now > nextConstellationAt && particles.length > 12) {
        const seed = Math.floor(Math.random() * particles.length);
        const ids = [seed];
        for (let i = 0; i < particles.length && ids.length < 5; i++) {
          if (i === seed) continue;
          const dx = particles[i].ox - particles[seed].ox;
          const dy = particles[i].oy - particles[seed].oy;
          if (Math.hypot(dx, dy) < MAX_LINK_DIST * 1.3) ids.push(i);
        }
        constellation = {
          ids,
          start: now,
          duration: 2600 + Math.random() * 1400,
        };
        nextConstellationAt = now + 4000 + Math.random() * 5000;
      }
      if (constellation && now - constellation.start > constellation.duration)
        constellation = null;

      // update particles
      for (const p of particles) {
        if (!reduced) {
          p.ox += p.vx;
          p.oy += p.vy;
          if (p.ox < -20) p.ox = width + 20;
          if (p.ox > width + 20) p.ox = -20;
          if (p.oy < -20) p.oy = height + 20;
          if (p.oy > height + 20) p.oy = -20;

          const wanderX = Math.sin(now * 0.00028 + p.phase) * 6;
          const wanderY = Math.cos(now * 0.00033 + p.phase) * 6;

          let tdx = 0;
          let tdy = 0;
          let glowTarget = 0;

          if (pointer.inside) {
            const distX = p.ox + wanderX - pointer.x;
            const distY = p.oy + wanderY - pointer.y;
            const dist = Math.hypot(distX, distY);
            if (dist < REPEL_RADIUS && dist > 0.001) {
              const force = (1 - dist / REPEL_RADIUS) ** 2;
              tdx += (distX / dist) * force * REPEL_STRENGTH;
              tdy += (distY / dist) * force * REPEL_STRENGTH;
            }
            if (dist < ACTIVE_RADIUS) {
              glowTarget = 1 - dist / ACTIVE_RADIUS;
            }
          }

          if (magnetRef.current.active) {
            const mdx = magnetRef.current.x - p.ox;
            const mdy = magnetRef.current.y - p.oy;
            const mdist = Math.hypot(mdx, mdy);
            if (mdist < MAGNET_RADIUS && mdist > 0.001) {
              const force = (1 - mdist / MAGNET_RADIUS) ** 2;
              tdx += (mdx / mdist) * force * MAGNET_STRENGTH;
              tdy += (mdy / mdist) * force * MAGNET_STRENGTH;
            }
          }

          for (const r of ripples) {
            const age = now - r.start;
            if (age > RIPPLE_DURATION) continue;
            const progress = age / RIPPLE_DURATION;
            const ringRadius = progress * RIPPLE_MAX_RADIUS;
            const rdx = p.ox - r.x;
            const rdy = p.oy - r.y;
            const rdist = Math.hypot(rdx, rdy);
            const band = Math.abs(rdist - ringRadius);
            if (band < 34 && rdist > 0.001) {
              const fade = (1 - progress) * (1 - band / 34);
              tdx += (rdx / rdist) * fade * 10;
              tdy += (rdy / rdist) * fade * 10;
            }
          }

          const ease = tdx || tdy ? REACT_EASE : RETURN_EASE;
          p.dx += (tdx - p.dx) * ease;
          p.dy += (tdy - p.dy) * ease;
          p.glow += (glowTarget - p.glow) * 0.12;

          p.x = p.ox + wanderX + p.dx;
          p.y = p.oy + wanderY + p.dy;
        } else {
          p.x = p.ox;
          p.y = p.oy;
        }
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (now - ripples[i].start > RIPPLE_DURATION) ripples.splice(i, 1);
      }

      // spatial grid for neighbor lookups
      const cell = MAX_LINK_DIST;
      const cols = Math.max(1, Math.ceil(width / cell));
      const rows = Math.max(1, Math.ceil(height / cell));
      const grid: number[][] = new Array(cols * rows);
      for (let i = 0; i < grid.length; i++) grid[i] = [];
      const cellOf = (x: number, y: number) => {
        const cx = clamp(Math.floor(x / cell), 0, cols - 1);
        const cy = clamp(Math.floor(y / cell), 0, rows - 1);
        return cy * cols + cx;
      };
      particles.forEach((p, i) => grid[cellOf(p.x, p.y)].push(i));

      // connections
      ctx.lineWidth = 1;
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const baseIdx = grid[cy * cols + cx];
          if (!baseIdx.length) continue;
          for (let ny = cy; ny <= Math.min(rows - 1, cy + 1); ny++) {
            for (
              let nx = ny === cy ? cx : Math.max(0, cx - 1);
              nx <= Math.min(cols - 1, cx + 1);
              nx++
            ) {
              const neighborIdx = grid[ny * cols + nx];
              for (const i of baseIdx) {
                for (const j of neighborIdx) {
                  if (j <= i) continue;
                  const a = particles[i];
                  const b = particles[j];
                  const dx = a.x - b.x;
                  const dy = a.y - b.y;
                  const dist = Math.hypot(dx, dy);
                  if (dist >= MAX_LINK_DIST) continue;
                  let alpha = (1 - dist / MAX_LINK_DIST) * 0.16 * activity;
                  let color = colorWhite;
                  if (a.glow > 0.15 || b.glow > 0.15) {
                    alpha *= 1 + Math.max(a.glow, b.glow) * 2.2;
                    color = colorPrimary;
                  }
                  if (
                    constellation &&
                    constellation.ids.includes(i) &&
                    constellation.ids.includes(j)
                  ) {
                    const cAge =
                      (now - constellation.start) / constellation.duration;
                    const pulse = Math.sin(cAge * Math.PI) * 0.5;
                    alpha += pulse * 0.35;
                    color = colorAccent;
                  }
                  if (alpha <= 0.004) continue;
                  ctx.strokeStyle = withAlpha(color, Math.min(alpha, 0.85));
                  ctx.beginPath();
                  ctx.moveTo(a.x, a.y);
                  ctx.lineTo(b.x, b.y);
                  ctx.stroke();
                }
              }
            }
          }
        }
      }

      // particles — each one twinkles gently, and "shines" into a sparkle near the cursor
      for (const p of particles) {
        const twinkle = reduced
          ? 1
          : 0.55 + 0.45 * Math.sin(now * p.twinkleSpeed + p.twinklePhase);
        const size = p.size + p.glow * 1.8;
        const alpha = Math.min(
          1,
          (p.baseAlpha * twinkle + p.glow * 0.55) * activity,
        );
        ctx.fillStyle = withAlpha(colors[p.hue], alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
        if (p.glow > 0.2) {
          ctx.fillStyle = withAlpha(colorPrimary, p.glow * 0.14);
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (p.glow > 0.3) {
          drawSparkle(
            ctx,
            p.x,
            p.y,
            6 + p.glow * 16,
            Math.min(0.9, p.glow),
            colors[p.hue] === colorWhite ? colorPrimary : colors[p.hue],
          );
        }
      }

      // ambient glow around the cursor
      if (!reduced && pointer.inside) {
        const grad = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          170,
        );
        grad.addColorStop(0, withAlpha(colorPrimary, 0.06));
        grad.addColorStop(1, withAlpha(colorPrimary, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 170, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced && running) raf = requestAnimationFrame(drawFrame);
    };

    if (reduced) {
      drawFrame(performance.now());
    } else {
      raf = requestAnimationFrame(drawFrame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("mouseleave", onPointerLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="block h-full w-full" />;
});
