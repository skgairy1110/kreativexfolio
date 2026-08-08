import { forwardRef, useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ParticleNetwork,
  type ParticleNetworkHandle,
} from "@/components/hero/ParticleNetwork";

/**
 * Full-bleed animated background for the homepage hero: a soft moving
 * atmosphere, a fine grain, and an interactive particle/network canvas.
 * Everything here is `pointer-events-none` and `aria-hidden` — it never
 * intercepts clicks or affects navigation, it just sits behind the copy.
 */
export const NeuralNetworkHero = forwardRef<
  ParticleNetworkHandle,
  { className?: string }
>(function NeuralNetworkHero({ className }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      {/* Layer 1 — deep charcoal base */}
      <div className="absolute inset-0 bg-background" />

      {/* Layer 3 — slow atmospheric glow (sits under the canvas, over the base) */}
      {!reduce && (
        <div className="absolute inset-0">
          <div className="atmosphere-blob atmosphere-blob--a" />
          <div className="atmosphere-blob atmosphere-blob--b" />
          <div className="atmosphere-blob atmosphere-blob--core" />
        </div>
      )}

      {/* Layer 2 — particle / network canvas */}
      <div className="absolute inset-0">
        <ParticleNetwork ref={ref} containerRef={containerRef} />
      </div>

      {/* vignette so the typography always reads clearly */}
      <div className="hero-vignette absolute inset-0" />

      {/* fine grain, matching the site's existing noise texture */}
      <div className="noise pointer-events-none absolute inset-0 opacity-60" />

      <HeroCursor containerRef={containerRef} enabled={!reduce} />
    </div>
  );
});

function HeroCursor({
  containerRef,
  enabled,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
}) {
  const dotRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [magnetic, setMagnetic] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    let raf = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;

    const onMove = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      setVisible(inside);
      if (!inside) return;
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
      const target = e.target as HTMLElement | null;
      setMagnetic(Boolean(target?.closest("[data-hero-cta]")));
    };
    const onLeave = () => setVisible(false);

    const tick = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      if (dotRef.current)
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [enabled, containerRef]);

  if (!enabled) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-10 -ml-1 -mt-1 hidden rounded-full bg-primary transition-[width,height,opacity] duration-200 ease-out md:block"
      style={{
        width: magnetic ? 14 : 6,
        height: magnetic ? 14 : 6,
        opacity: visible ? 1 : 0,
        boxShadow: magnetic
          ? "0 0 0 1px color-mix(in oklab, var(--color-primary) 40%, transparent), 0 0 28px 6px color-mix(in oklab, var(--color-primary) 35%, transparent)"
          : "0 0 16px 3px color-mix(in oklab, var(--color-primary) 30%, transparent)",
      }}
    />
  );
}
