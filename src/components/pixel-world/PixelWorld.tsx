"use client";

import { useEffect, useRef, type RefObject } from "react";
import { layers, paint, type WorldMode, type WorldMotion } from "./renderer";
import { ease, levitation } from "./animation/character";

type Props = {
  mode: WorldMode;
  scene?: number;
  motion?: RefObject<WorldMotion>;
  className?: string;
  label?: string;
  showCharacter?: boolean;
};

/** Six independent, low-resolution canvases keep thousands of living pixels off React's render path. */
export default function PixelWorld({
  mode,
  scene = 0,
  motion,
  className = "",
  label,
  showCharacter = true,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const actorVisible = useRef(showCharacter);
  useEffect(() => {
    actorVisible.current = showCharacter;
    root.current?.dispatchEvent(new Event("world:refresh"));
  }, [showCharacter]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const surfaces = layers.map((layer) => {
      const canvas = el.querySelector<HTMLCanvasElement>(
        `[data-layer="${layer}"]`,
      )!;
      return { layer, canvas, context: canvas.getContext("2d") };
    });
    if (surfaces.some((surface) => !surface.context)) {
      el.dataset.unavailable = "true";
      return;
    }
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = preference.matches,
      visible = false,
      width = 1,
      height = 1;
    let request = 0,
      last = 0,
      clock = 0,
      disposed = false,
      frameCount = 0;
    let floatStarted: number | null = null;
    let floatCompleted = false;
    let characterTick = -1;
    let characterProgress = 0;
    const fallback: WorldMotion = { progress: 0.4, entrance: 1, invitation: 0 };
    const render = (time: number) => {
      if (disposed) return;
      const state = motion?.current ?? fallback;
      const eligible =
        mode === "hero" ||
        (mode === "journey" && state.progress > 0.985) ||
        (mode === "moment" && scene === 4);
      if (
        !reduced &&
        visible &&
        actorVisible.current &&
        eligible &&
        !floatCompleted &&
        floatStarted === null
      )
        floatStarted = time;
      if (floatStarted !== null && time - floatStarted > 9.5)
        floatCompleted = true;
      // Scrubbing away lowers the guide continuously rather than cancelling at a threshold.
      const lift =
        !reduced && !floatCompleted && floatStarted !== null
          ? levitation(time - floatStarted) *
            (mode === "hero"
              ? 1 - ease(state.progress * 2)
              : mode === "journey"
                ? ease((state.progress - 0.94) / 0.045)
                : 1)
          : 0;
      const tick = Math.floor(time * 10);
      if (tick !== characterTick || reduced) {
        characterTick = tick;
        characterProgress = state.progress;
      }
      for (const surface of surfaces)
        paint(surface.layer, surface.context!, {
          width,
          height,
          time,
          mode,
          scene,
          motion:
            surface.layer === "life"
              ? { ...state, progress: characterProgress }
              : state,
          reduced,
          levitation: lift,
          showCharacter: actorVisible.current,
        });
      // Diagnostics describe actual rendered frames, useful for animation and pause tests.
      el.dataset.frame = String(++frameCount);
      el.dataset.progress = state.progress.toFixed(3);
      el.dataset.invitation = state.invitation.toFixed(3);
      el.dataset.entrance = state.entrance.toFixed(3);
      el.dataset.motion = reduced ? "reduced" : "ambient";
      el.dataset.characterCount = actorVisible.current ? "1" : "0";
      el.dataset.lift = lift.toFixed(3);
    };
    const animate = (now: number) => {
      request = 0;
      if (!visible || document.hidden || reduced || disposed) return;
      if (!last || now - last >= 1000 / 24) {
        const delta = last ? Math.min(0.1, (now - last) / 1000) : 0;
        clock += delta;
        last = now;
        render(clock);
      }
      request = requestAnimationFrame(animate);
    };
    const stop = () => {
      cancelAnimationFrame(request);
      request = 0;
      last = 0;
    };
    const wake = () => {
      if (disposed) return;
      stop();
      if (!visible || document.hidden) return;
      render(reduced ? 0 : clock);
      if (!reduced) request = requestAnimationFrame(animate);
    };
    const measure = () => {
      const bounds = el.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        visible = false;
        stop();
        return;
      }
      height = mode === "footer" ? 180 : mode === "vignette" ? 340 : 440;
      width = Math.max(1, Math.round((height * bounds.width) / bounds.height));
      // Pixel resolution is intentionally bounded; DPR never multiplies the work.
      if (width > 1280) {
        height = Math.round((height * 1280) / width);
        width = 1280;
      }
      for (const { canvas } of surfaces) {
        canvas.width = width;
        canvas.height = height;
      }
      render(reduced ? 0 : clock);
    };
    const resize = new ResizeObserver(() => {
      measure();
      wake();
    });
    const visibility = new IntersectionObserver(
      ([entry]) => {
        visible =
          entry.isIntersecting && el.clientWidth > 0 && el.clientHeight > 0;
        wake();
      },
      { rootMargin: "80px" },
    );
    const onPreference = () => {
      reduced = preference.matches;
      wake();
    };
    const onVisibility = () => wake();
    const refresh = () => {
      if (visible) render(reduced ? 0 : clock);
    };
    measure();
    resize.observe(el);
    visibility.observe(el);
    preference.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    el.addEventListener("world:refresh", refresh);
    return () => {
      disposed = true;
      stop();
      resize.disconnect();
      visibility.disconnect();
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      el.removeEventListener("world:refresh", refresh);
    };
  }, [mode, scene, motion]);

  return (
    <div
      ref={root}
      className={`pixel-world pixel-world--${mode} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-world={mode}
    >
      {layers.map((layer) => (
        <canvas key={layer} data-layer={layer} aria-hidden="true" />
      ))}
      <noscript>
        <span className="world-fallback">
          An open-air yoga practice, from the first light of dawn to moonlit
          calm.
        </span>
      </noscript>
    </div>
  );
}
