import { ease } from "./character";

/** Shared breeze, with different branch inertia and local leaf response. */
export function breeze(time: number, seed: number, branch: number) {
  const period = 6.7 + (seed % 7) * 0.37 + branch * 0.19;
  return (
    Math.sin((time * Math.PI * 2) / period + seed + branch * 0.43) +
    Math.sin(time * 0.29 + seed * 0.3) * 0.22
  );
}

export function starlight(day: number, time: number, seed: number) {
  const dawn = 1 - ease((day - seed * 0.04) / 0.16);
  const dusk = ease((day - 0.79 - seed * 0.12) / 0.08);
  return (
    Math.max(dawn * 0.5, dusk) *
    (0.62 + Math.sin(time * (0.38 + seed * 0.37) + seed * 47) * 0.18)
  );
}

export function birdFlight(time: number, width: number, bird: number) {
  // Eight seconds crossing, then nineteen seconds of empty sky. No on-screen wrap.
  const phase = (time % 27) - 5 - bird * 0.48;
  if (phase < 0 || phase > 8) return null;
  const frame = Math.floor(time * 10 + bird) % 4;
  return { x: -20 + ((width + 40) * phase) / 8, wing: [-2, 0, 2, 0][frame] };
}

export function lampFlicker(time: number) {
  return (
    0.94 + Math.sin(time * 3.7) * 0.025 + Math.sin(time * 7.13 + 2) * 0.015
  );
}
