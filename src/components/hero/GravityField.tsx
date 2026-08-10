import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefObject,
} from "react";

/**
 * GravityField — cinematic cursor-gravity star field for the homepage hero.
 *
 * A dark, minimal Canvas particle system where the pointer behaves like a
 * gentle gravitational field: nearby stars are pulled softly toward the
 * cursor (never snapping to it), brighten a little as they get close, and
 * ease back to their resting position once the pointer moves away. A few
 * very faint connection lines appear only between stars close to the
 * cursor. Everything is `pointer-events-none` and sits behind the hero copy.
 *
 * All tunable values live in CONFIG below.
 */

export type GravityFieldHandle = {
  /** Pull nearby particles gently toward a viewport point (used for CTA magnetism). */
  attractTo: (clientX: number, clientY: number) => void;
  /** Release the magnetic attraction and let particles drift back. */
  release: () => void;
};

// ---------------------------------------------------------------------------
// CONFIG — every tunable value for the effect lives here.
// ---------------------------------------------------------------------------
const CONFIG = {
  // Particle counts, scaled by container area and clamped to a range per
  // device tier (per spec: desktop 1000–1800, tablet 600–1000, mobile 300–500).
  particleCount: {
    desktop: { min: 1000, max: 1800 },
    tablet: { min: 600, max: 1000 },
    mobile: { min: 300, max: 500 },
  },
  // Breakpoints (px) used to pick a device tier.
  breakpoints: { tablet: 768, desktop: 1024 },

  // Cursor gravity radius per tier. Mobile is 0 — no cursor, so no gravity,
  // only ambient drift.
  gravityRadius: { desktop: 220, tablet: 150, mobile: 0 },
  // Max pull offset (px) a particle can be dragged from its resting spot.
  gravityStrength: 26,
  // How quickly a particle's pull eases toward the target offset (reaction).
  gravityEase: 0.1,
  // How quickly a particle eases back toward its resting position once the
  // cursor moves away (damping so it never overshoots).
  returnEase: 0.045,
  // Lerp factor for the smoothed cursor position (targetMouse -> smoothMouse).
  cursorSmoothing: 0.14,

  // Faint connection lines, only ever drawn between particles that are both
  // inside the interaction radius.
  connectionDistance: 85,
  maxConnectionsPerParticle: 3,
  connectionOpacity: 0.14,

  // Resting particle look.
  sizeRange: [0.6, 1.6] as [number, number],
  alphaRange: [0.08, 0.32] as [number, number],
  // Extra boost applied at the closest point to the cursor.
  activeAlphaBoost: 0.45,
  activeSizeBoost: 1.5,
  glowAlpha: 0.1,

  // Ambient independent motion (always on, even with no cursor).
  driftSpeed: 0.05,
  wanderAmplitude: 5,
  twinkleRange: [0.55, 1] as [number, number],

  // Secondary "magnetic" attraction used for CTA hover (separate, larger,
  // gentler pull — matches the site's existing magnetic-button language).
  magnetRadius: 260,
  magnetStrength: 22,

  maxDevicePixelRatio: 2,
} as const;

type Tier = "mobile" | "tablet" | "desktop";

type Particle = {
  ox: number; // resting (origin) x
  oy: number; // resting (origin) y
  x: number; // rendered x
  y: number; // rendered y
  dx: number; // current gravity offset x
  dy: number; // current gravity offset y
  vx: number; // slow ambient drift velocity
  vy: number;
  size: number;
  baseAlpha: number;
  phase: number;
  twinkleSpeed: number;
  twinklePhase: number;
  glow: number; // 0..1 proximity glow, eased
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function readColor(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}

function withAlpha(oklchColor: string, alpha: number) {
  // oklchColor looks like "oklch(0.75 0.2 120)" — inject an alpha channel.
  return oklchColor.replace(/\)\s*$/, ` / ${alpha})`);
}

function getTier(width: number): Tier {
  if (width < CONFIG.breakpoints.tablet) return "mobile";
  if (width < CONFIG.breakpoints.desktop) return "tablet";
  return "desktop";
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const GravityField = forwardRef<
  GravityFieldHandle,
  { containerRef: RefObject<HTMLDivElement | null> }
>(function GravityField({ containerRef }, ref) {
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

    const colorStar = readColor("--foreground", "oklch(0.97 0.01 90)");
    const colorGlow = readColor("--primary", "oklch(0.75 0.20 120)");

    let width = 0;
    let height = 0;
    let dpr = Math.min(
      window.devicePixelRatio || 1,
      CONFIG.maxDevicePixelRatio,
    );
    let particles: Particle[] = [];
    let tier: Tier = "desktop";
    let raf = 0;
    let running = true;

    // targetMouse -> smoothMouse (lerp), per the spec's interaction chain.
    const pointer = {
      targetX: -9999,
      targetY: -9999,
      smoothX: -9999,
      smoothY: -9999,
      inside: false,
    };

    const seedParticles = () => {
      tier = getTier(width);
      const range = CONFIG.particleCount[tier];
      const area = width * height;
      // Scale roughly by area, clamped to this tier's configured range.
      const count = Math.round(clamp(area / 1500, range.min, range.max));
      particles = new Array(count).fill(0).map(() => {
        const ox = Math.random() * width;
        const oy = Math.random() * height;
        return {
          ox,
          oy,
          x: ox,
          y: oy,
          dx: 0,
          dy: 0,
          vx: (Math.random() - 0.5) * CONFIG.driftSpeed,
          vy: (Math.random() - 0.5) * CONFIG.driftSpeed,
          size:
            CONFIG.sizeRange[0] +
            Math.random() * (CONFIG.sizeRange[1] - CONFIG.sizeRange[0]),
          baseAlpha:
            CONFIG.alphaRange[0] +
            Math.random() * (CONFIG.alphaRange[1] - CONFIG.alphaRange[0]),
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.0004 + Math.random() * 0.0012,
          twinklePhase: Math.random() * Math.PI * 2,
          glow: 0,
        };
      });
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDevicePixelRatio);
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

    // Mobile has no cursor — skip gravity listeners entirely and only run
    // the ambient drift/twinkle animation.
    const gravityEnabled = !reduced && getTier(width) !== "mobile";

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      pointer.inside = inside;
      if (inside) {
        pointer.targetX = e.clientX - rect.left;
        pointer.targetY = e.clientY - rect.top;
      }
    };
    const onPointerLeave = () => {
      pointer.inside = false;
    };

    if (gravityEnabled) {
      window.addEventListener("pointermove", onPointerMove, {
        passive: true,
      });
      window.addEventListener("blur", onPointerLeave);
      document.addEventListener("mouseleave", onPointerLeave);
    }

    const drawFrame = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      // Recompute tier's gravity radius each frame (cheap, tier is stable
      // between resizes) so tablet/desktop feel distinct.
      const gravityRadius = CONFIG.gravityRadius[tier];

      if (gravityEnabled && pointer.inside) {
        pointer.smoothX +=
          (pointer.targetX - pointer.smoothX) * CONFIG.cursorSmoothing;
        pointer.smoothY +=
          (pointer.targetY - pointer.smoothY) * CONFIG.cursorSmoothing;
      }

      // Track which particles are currently inside the interaction radius,
      // for the sparse connection-line pass below.
      const activeIdx: number[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!reduced) {
          // Ambient drift of the resting position, wrapped at the edges.
          p.ox += p.vx;
          p.oy += p.vy;
          if (p.ox < -20) p.ox = width + 20;
          if (p.ox > width + 20) p.ox = -20;
          if (p.oy < -20) p.oy = height + 20;
          if (p.oy > height + 20) p.oy = -20;

          const wanderX =
            Math.sin(now * 0.00026 + p.phase) * CONFIG.wanderAmplitude;
          const wanderY =
            Math.cos(now * 0.00031 + p.phase) * CONFIG.wanderAmplitude;

          let targetDx = 0;
          let targetDy = 0;
          let glowTarget = 0;

          if (gravityEnabled && pointer.inside && gravityRadius > 0) {
            const px = p.ox + wanderX;
            const py = p.oy + wanderY;
            const distX = pointer.smoothX - px;
            const distY = pointer.smoothY - py;
            const dist = Math.hypot(distX, distY);
            if (dist < gravityRadius && dist > 0.001) {
              // Nonlinear falloff — attraction strengthens sharply near the cursor.
              const force = (1 - dist / gravityRadius) ** 2;
              targetDx += (distX / dist) * force * CONFIG.gravityStrength;
              targetDy += (distY / dist) * force * CONFIG.gravityStrength;
              glowTarget = force;
              activeIdx.push(i);
            }
          }

          // Separate, gentler magnetic pull toward an explicit CTA target.
          if (magnetRef.current.active) {
            const mdx = magnetRef.current.x - p.ox;
            const mdy = magnetRef.current.y - p.oy;
            const mdist = Math.hypot(mdx, mdy);
            if (mdist < CONFIG.magnetRadius && mdist > 0.001) {
              const force = (1 - mdist / CONFIG.magnetRadius) ** 2;
              targetDx += (mdx / mdist) * force * CONFIG.magnetStrength;
              targetDy += (mdy / mdist) * force * CONFIG.magnetStrength;
            }
          }

          // Ease toward the target offset (attraction) or back toward zero
          // (return), with damping so motion never snaps or overshoots.
          const ease =
            targetDx || targetDy ? CONFIG.gravityEase : CONFIG.returnEase;
          p.dx += (targetDx - p.dx) * ease;
          p.dy += (targetDy - p.dy) * ease;
          p.glow += (glowTarget - p.glow) * 0.12;

          p.x = p.ox + wanderX + p.dx;
          p.y = p.oy + wanderY + p.dy;
        } else {
          p.x = p.ox;
          p.y = p.oy;
        }
      }

      // Sparse connection lines — only among particles already inside the
      // interaction radius, capped per-particle so it never becomes a web.
      if (gravityEnabled && activeIdx.length > 1) {
        ctx.lineWidth = 1;
        const degree = new Map<number, number>();
        for (let a = 0; a < activeIdx.length; a++) {
          const i = activeIdx[a];
          if ((degree.get(i) ?? 0) >= CONFIG.maxConnectionsPerParticle)
            continue;
          for (let b = a + 1; b < activeIdx.length; b++) {
            const j = activeIdx[b];
            if ((degree.get(j) ?? 0) >= CONFIG.maxConnectionsPerParticle)
              continue;
            const pa = particles[i];
            const pb = particles[j];
            const dx = pa.x - pb.x;
            const dy = pa.y - pb.y;
            const dist = Math.hypot(dx, dy);
            if (dist >= CONFIG.connectionDistance) continue;
            const proximity = Math.max(pa.glow, pb.glow);
            const alpha =
              (1 - dist / CONFIG.connectionDistance) *
              CONFIG.connectionOpacity *
              (0.4 + proximity * 0.6);
            if (alpha <= 0.004) continue;
            ctx.strokeStyle = withAlpha(colorStar, alpha);
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
            degree.set(i, (degree.get(i) ?? 0) + 1);
            degree.set(j, (degree.get(j) ?? 0) + 1);
          }
        }
      }

      // Draw particles — subtle by default, slightly brighter/larger and
      // faintly glowing the closer they are to the cursor.
      for (const p of particles) {
        const twinkle = reduced
          ? 1
          : CONFIG.twinkleRange[0] +
            (CONFIG.twinkleRange[1] - CONFIG.twinkleRange[0]) *
              (0.5 + 0.5 * Math.sin(now * p.twinkleSpeed + p.twinklePhase));

        const size = p.size + p.glow * CONFIG.activeSizeBoost;
        const alpha = Math.min(
          1,
          p.baseAlpha * twinkle + p.glow * CONFIG.activeAlphaBoost,
        );

        if (p.glow > 0.12) {
          ctx.fillStyle = withAlpha(colorGlow, p.glow * CONFIG.glowAlpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = withAlpha(colorStar, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (running && !reduced) raf = requestAnimationFrame(drawFrame);
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
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("mouseleave", onPointerLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="block h-full w-full"
      style={{ pointerEvents: "none" }}
    />
  );
});
