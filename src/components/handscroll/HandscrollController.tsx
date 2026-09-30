"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import {
  CHAPTERS,
  CHAPTER_EDGES,
  DAYLIGHT,
  chapterAt,
  clockTime,
  linear,
} from "./model";
import { JOINTS, PANEL_POSES, TEST_POSES, type Pose } from "./poses";

/** Owns only motion. The complete scene and its initial state are server HTML. */
export default function HandscrollController() {
  useEffect(() => {
    const root = document.getElementById("home");
    const stage = root?.querySelector<HTMLElement>(".hs-stage");
    if (!root || !stage) return;
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    const revealEase = CustomEase.create("handscroll-wipe", "0.22,0.61,0.36,1");
    const media = gsap.matchMedia();

    media.add(
      {
        reduced: "(prefers-reduced-motion: reduce)",
        mobile: "(max-width: 767px)",
        desktop: "(min-width: 768px)",
      },
      (context) => {
        const { reduced, mobile } = context.conditions!;
        root.dataset.ready = "true";
        root.dataset.ambient = "paused";
        const panels = Array.from(
          root.querySelectorAll<HTMLElement>(".hs-panel"),
        );
        if (reduced) {
          const fades = new Set<gsap.core.Tween>();
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const tween = gsap.fromTo(
                  entry.target,
                  { opacity: 0.72 },
                  { opacity: 1, duration: 0.3, ease: revealEase },
                );
                fades.add(tween);
                observer.unobserve(entry.target);
              });
            },
            { threshold: 0.12 },
          );
          panels.forEach((panel) => observer.observe(panel));
          return () => {
            observer.disconnect();
            fades.forEach((tween) => tween.revert());
          };
        }

        const layers = Array.from(
          root.querySelectorAll<HTMLElement>("[data-layer]"),
        );
        const movingLayers = layers.filter(
          (el) => !(mobile && el.dataset.layer === "foreground"),
        );
        const layerSetters = movingLayers.map((el) => ({
          speed: Number(el.dataset.speed),
          set: gsap.quickSetter(el, "x", "px"),
        }));
        const skyPaints = Array.from(
          root.querySelectorAll<HTMLElement>("[data-sky-paint]"),
        );
        const lightPaints = Array.from(
          root.querySelectorAll<HTMLElement>("[data-light-paint]"),
        );
        const sun = root.querySelector<HTMLElement>(".hs-layer-sky .hs-sun")!;
        const setSun = gsap.quickSetter(sun, "y", "svh");
        const copies = Array.from(
          root.querySelectorAll<HTMLElement>("[data-chapter]"),
        );
        const segments = Array.from(
          root.querySelectorAll<HTMLElement>("[data-segment]"),
        );
        const progressBar = root.querySelector<HTMLElement>(
          '[role="progressbar"]',
        )!;
        const clock = root.querySelector<HTMLTimeElement>("[data-clock]")!;
        const phase = root.querySelector<HTMLElement>("[data-phase]")!;
        let width = window.innerWidth;
        let currentChapter = 0;
        let currentPercent = -1;
        let currentTime = "";
        let visible = false;
        let lastInput = -Infinity;
        let pointerDown = false;
        let settleTimer: ReturnType<typeof setTimeout> | undefined;
        const wordTweens = new Set<gsap.core.Tween>();
        const paint = { ...DAYLIGHT[0] } as {
          p: number;
          minutes: number;
          skyTop: string;
          skyBottom: string;
          lightTint: string;
          shadowTint: string;
          sunY: number;
        };
        const timeOfDay = gsap.timeline({
          paused: true,
          defaults: { ease: linear },
        });
        DAYLIGHT.slice(1).forEach((key, i) =>
          timeOfDay.to(
            paint,
            { ...key, duration: key.p - DAYLIGHT[i].p },
            DAYLIGHT[i].p,
          ),
        );

        // Joint sockets keep their local origins, including under a rotated parent.
        // GSAP interpolates the data; only SVG transform attributes are written.
        const rigs = Array.from(
          root.querySelectorAll<SVGSVGElement>("[data-rig]"),
        );
        const rigStates = rigs.map((rig, i) => ({
          rig,
          angles: { ...TEST_POSES[PANEL_POSES[i]] } as Pose,
          joints: JOINTS.map((name) =>
            rig.querySelector<SVGGElement>(`[data-joint="${name}"]`)!,
          ),
        }));
        const poses = gsap.timeline({
          paused: true,
          defaults: { ease: revealEase },
        });
        rigStates.forEach(({ angles }, i) => {
          const next = PANEL_POSES[Math.min(i + 1, 3)];
          poses.to(
            angles,
            { ...TEST_POSES[next], duration: 0.25 },
            Math.max(0, CHAPTERS[i].p - 0.12),
          );
        });
        // An explicit final key keeps pose sampling on the same 0..1 time axis.
        poses.set({}, {}, 1);

        function showChapter(index: number) {
          if (index === currentChapter) return;
          const previous = copies[currentChapter];
          const next = copies[index];
          previous.setAttribute("aria-hidden", "true");
          next.removeAttribute("aria-hidden");
          wordTweens.forEach((tween) => tween.kill());
          wordTweens.clear();
          copies.forEach((copy, i) => {
            if (i !== index && i !== currentChapter)
              gsap.set(copy, { opacity: 0 });
          });
          wordTweens.add(
            gsap.to(previous, {
              opacity: 0,
              duration: 0.2,
              ease: revealEase,
              overwrite: true,
            }),
          );
          gsap.set(next, { opacity: 1 });
          wordTweens.add(
            gsap.fromTo(
              next.querySelector(".hs-word-window"),
              { xPercent: -102 },
              { xPercent: 0, duration: 0.7, ease: revealEase },
            ),
          );
          wordTweens.add(
            gsap.fromTo(
              next.querySelector(".hs-word-reveal"),
              { xPercent: 102 },
              { xPercent: 0, duration: 0.7, ease: revealEase },
            ),
          );
          wordTweens.add(
            gsap.fromTo(
              next.querySelector(".hs-line"),
              { opacity: 0 },
              { opacity: 1, duration: 0.3, ease: revealEase },
            ),
          );
          currentChapter = index;
          phase.textContent = CHAPTERS[index].phase;
          progressBar.setAttribute(
            "aria-valuetext",
            `Chapter ${index + 1} of 4: ${CHAPTERS[index].word}`,
          );
        }

        const camera = { p: 0 };
        function render() {
          const p = camera.p;
          const chapter = chapterAt(p);
          for (const layer of layerSetters)
            layer.set(-p * width * 3 * layer.speed);
          timeOfDay.progress(p);
          poses.time(p);
          // These continuous public tokens are the scene API. Prepainted gradient
          // plates below crossfade instead of repainting a 145vw sky every frame.
          root!.style.setProperty("--sky-top", paint.skyTop);
          root!.style.setProperty("--sky-bottom", paint.skyBottom);
          root!.style.setProperty("--light-tint", paint.lightTint);
          root!.style.setProperty("--shadow-tint", paint.shadowTint);
          root!.style.setProperty("--sun-y", String(paint.sunY));
          root!.dataset.progress = p.toFixed(5);
          setSun(paint.sunY);
          // Earlier opaque sky plates remain underneath the next fading plate.
          // Transparent lighting plates use complementary weights to avoid buildup.
          const keyIndex = p < 0.33 ? 0 : p < 0.66 ? 1 : 2;
          const blend =
            (p - DAYLIGHT[keyIndex].p) /
            (DAYLIGHT[keyIndex + 1].p - DAYLIGHT[keyIndex].p);
          skyPaints.forEach((el, i) => {
            el.style.opacity = String(
              i <= keyIndex ? 1 : i === keyIndex + 1 ? blend : 0,
            );
          });
          lightPaints.forEach((el, i) => {
            el.style.opacity = String(
              i === keyIndex ? 1 - blend : i === keyIndex + 1 ? blend : 0,
            );
          });
          rigStates.forEach(({ joints, angles }, i) => {
            if (Math.abs(i - p * 3) > 1.2) return;
            joints.forEach((joint, j) =>
              joint.setAttribute(
                "transform",
                `rotate(${angles[JOINTS[j]].toFixed(3)})`,
              ),
            );
          });
          showChapter(chapter);
          segments.forEach((el, i) => {
            el.style.transform = `scaleX(${gsap.utils.clamp(0, 1, (p - CHAPTER_EDGES[i]) / (CHAPTER_EDGES[i + 1] - CHAPTER_EDGES[i]))})`;
          });
          const time = clockTime(paint.minutes);
          if (time !== currentTime) {
            clock.textContent = time;
            clock.dateTime = time;
            currentTime = time;
          }
          const percent = Math.round(p * 100);
          if (percent !== currentPercent) {
            progressBar.setAttribute("aria-valuenow", String(percent));
            currentPercent = percent;
          }
        }

        const scroll = gsap.to(camera, {
          p: 1,
          duration: 1,
          ease: linear,
          onUpdate: render,
          scrollTrigger: {
            id: "handscroll",
            trigger: root,
            start: "top top",
            end: () => `+=${root.offsetHeight - stage.offsetHeight}`,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onRefresh: () => {
              width = window.innerWidth;
              render();
            },
            onUpdate: (self) => {
              if (!self.getTween(true) && Math.abs(self.getVelocity()) > 1000)
                root.dataset.fast = "true";
            },
            snap: {
              snapTo: (_value: number, self?: ScrollTrigger) => {
                if (
                  !self ||
                  !visible ||
                  document.hidden ||
                  pointerDown ||
                  Math.abs(self.getVelocity()) > 80 ||
                  performance.now() - lastInput < 180
                )
                  return self?.progress ?? camera.p;
                return gsap.utils.snap(
                  CHAPTERS.map(({ p }) => p),
                  self.progress,
                );
              },
              duration: 0.35,
              delay: 0.95,
              ease: "power2.inOut",
              inertia: false,
            },
          },
        });
        const trigger = scroll.scrollTrigger!;
        function settleBreath() {
          clearTimeout(settleTimer);
          settleTimer = setTimeout(() => {
            root!.dataset.fast = "false";
          }, 600);
        }
        function interruptSnap() {
          lastInput = performance.now();
          trigger.getTween(true)?.kill();
        }
        function press() {
          pointerDown = true;
          interruptSnap();
        }
        function release() {
          pointerDown = false;
        }
        function syncAmbient() {
          root!.dataset.ambient =
            visible && !document.hidden ? "running" : "paused";
          if (document.hidden || !visible) {
            root!.dataset.fast = "false";
            trigger.getTween(true)?.kill();
          }
        }
        const observer = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            syncAmbient();
          },
          { threshold: 0.01 },
        );
        observer.observe(stage);
        document.addEventListener("visibilitychange", syncAmbient);
        window.addEventListener("scroll", settleBreath, { passive: true });
        window.addEventListener("wheel", interruptSnap, { passive: true });
        window.addEventListener("touchstart", press, { passive: true });
        window.addEventListener("touchend", release, { passive: true });
        window.addEventListener("touchcancel", release, { passive: true });
        window.addEventListener("pointerdown", press, { passive: true });
        window.addEventListener("pointerup", release, { passive: true });
        window.addEventListener("pointercancel", release, { passive: true });
        window.addEventListener("keydown", interruptSnap);
        render();

        return () => {
          observer.disconnect();
          clearTimeout(settleTimer);
          wordTweens.forEach((tween) => tween.kill());
          trigger.kill();
          scroll.kill();
          timeOfDay.kill();
          poses.kill();
          document.removeEventListener("visibilitychange", syncAmbient);
          window.removeEventListener("scroll", settleBreath);
          window.removeEventListener("wheel", interruptSnap);
          window.removeEventListener("touchstart", press);
          window.removeEventListener("touchend", release);
          window.removeEventListener("touchcancel", release);
          window.removeEventListener("pointerdown", press);
          window.removeEventListener("pointerup", release);
          window.removeEventListener("pointercancel", release);
          window.removeEventListener("keydown", interruptSnap);
          // Restore server poses when switching to reduced motion at runtime.
          rigStates.forEach(({ joints }, i) =>
            joints.forEach((joint, j) =>
              joint.setAttribute(
                "transform",
                `rotate(${TEST_POSES[PANEL_POSES[i]][JOINTS[j]]})`,
              ),
            ),
          );
          layers.forEach((el) => {
            el.style.transform = "";
          });
          copies.forEach((el, i) => {
            el.style.opacity = i === 0 ? "1" : "0";
            if (i) el.setAttribute("aria-hidden", "true");
            else el.removeAttribute("aria-hidden");
          });
          root.dataset.ambient = "paused";
          root.dataset.fast = "false";
        };
      },
    );
    return () => {
      media.revert();
      delete root.dataset.ready;
    };
  }, []);
  return null;
}
