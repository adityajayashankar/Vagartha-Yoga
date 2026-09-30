export type Joint = [number, number];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const ease = (n: number) => {
  const x = clamp(n);
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Shorter inhale, suspension, longer exhale, rest. No whole-body scaling. */
export function breath(time: number) {
  const durations = [5.4, 5.9, 5.6];
  let phase = time % 16.9;
  let duration = durations[0];
  for (const d of durations) {
    duration = d;
    if (phase < d) break;
    phase -= d;
  }
  const q = phase / duration;
  return q < 0.36 ? ease(q / 0.36) : q < 0.43 ? 1 : 1 - ease((q - 0.43) / 0.51);
}

export function blink(time: number) {
  // A 23-second authored phrase, including one double blink.
  return [4.5, 11.3, 11.65, 16.85, 22.4].some((at) => {
    const q = (time % 23.1) - at;
    return q >= 0 && q < 0.18;
  });
}

/** Grounded -> inhale -> lift -> hold -> long descent -> settle. Once per visit. */
export function levitation(elapsed: number) {
  if (elapsed < 1.4 || elapsed > 9.5) return 0;
  if (elapsed < 3.6) return ease((elapsed - 1.4) / 2.2);
  if (elapsed < 5.2)
    return 1 + Math.sin(((elapsed - 3.6) * Math.PI) / 1.6) * 0.035;
  return 1 - ease((elapsed - 5.2) / 4.3);
}

type Key = {
  at: number;
  hip: Joint;
  left: Joint;
  right: Joint;
  arms: number;
};
// Feet remain on the mat during the rise. The balancing foot lifts only AFTER
// the pelvis reaches standing. Reversing scroll retraces the same joint path.
const keys: Key[] = [
  { at: 0, hip: [0, -15], left: [-8, 5], right: [8, 3], arms: 0 },
  { at: 1, hip: [0, -15], left: [-8, 5], right: [8, 3], arms: 1 },
  { at: 2, hip: [0, -15], left: [-8, 5], right: [8, 3], arms: 2 },
  { at: 2.1, hip: [-2, -14], left: [-8, 5], right: [8, 3], arms: 1.9 },
  { at: 2.22, hip: [-4, -19], left: [-11, 5], right: [19, 5], arms: 0.3 },
  { at: 2.36, hip: [-4, -34], left: [-11, 5], right: [20, 5], arms: 0 },
  { at: 2.52, hip: [-3, -55], left: [-11, 5], right: [20, 5], arms: 0 },
  { at: 2.66, hip: [-2, -68], left: [-11, 5], right: [20, 5], arms: 0 },
  { at: 2.76, hip: [-3, -69], left: [-11, 5], right: [17, -4], arms: 0.5 },
  { at: 2.88, hip: [-3, -69], left: [-11, 5], right: [0, -24], arms: 2.8 },
  { at: 3, hip: [-3, -68], left: [-11, 5], right: [-2, -29], arms: 3 },
  { at: 3.1, hip: [-3, -68], left: [-11, 5], right: [-2, -28], arms: 3 },
  { at: 3.22, hip: [-3, -68], left: [-11, 5], right: [17, -4], arms: 2.8 },
  { at: 3.34, hip: [-2, -66], left: [-11, 5], right: [20, 5], arms: 0.6 },
  { at: 3.48, hip: [-2, -51], left: [-11, 5], right: [20, 5], arms: 0 },
  { at: 3.62, hip: [0, -32], left: [-11, 5], right: [19, 5], arms: 0 },
  { at: 3.76, hip: [0, -19], left: [-8, 5], right: [13, 5], arms: 0 },
  { at: 3.88, hip: [0, -15], left: [-8, 5], right: [8, 3], arms: 0 },
  { at: 4, hip: [0, -15], left: [-8, 5], right: [8, 3], arms: 0 },
];

/** Two-bone IK keeps limbs the same length through intermediate frames. */
export function chain(
  root: Joint,
  target: Joint,
  upper: number,
  lower: number,
  side: number,
): Joint[] {
  const dx = target[0] - root[0],
    dy = target[1] - root[1];
  const distance = Math.max(0.001, Math.hypot(dx, dy));
  const d = Math.min(
    upper + lower,
    Math.max(Math.abs(upper - lower) + 0.01, distance),
  );
  const ux = dx / distance,
    uy = dy / distance;
  const along = (upper * upper - lower * lower + d * d) / (2 * d);
  const across = Math.sqrt(Math.max(0, upper * upper - along * along)) * side;
  return [
    root,
    [root[0] + ux * along - uy * across, root[1] + uy * along + ux * across],
    [root[0] + ux * d, root[1] + uy * d],
  ];
}

export function characterPose(state: number, time: number) {
  const s = Math.max(0, Math.min(4, state));
  const index = keys.findIndex((key) => key.at >= s);
  const b = keys[Math.max(0, index)],
    a = keys[Math.max(0, index - 1)];
  const q = ease((s - a.at) / (b.at - a.at || 1));
  const point = (name: "hip" | "left" | "right"): Joint => [
    mix(a[name][0], b[name][0], q),
    mix(a[name][1], b[name][1], q),
  ];
  const hip = point("hip");
  const balance = ease(1 - Math.abs(s - 3) * 6);
  hip[0] += Math.sin(time * 1.13) * 0.65 * balance;
  return {
    hip,
    left: chain([hip[0] - 8, hip[1]], point("left"), 38, 36, 1),
    right: chain([hip[0] + 8, hip[1]], point("right"), 38, 36, -1),
    arms: mix(a.arms, b.arms, q),
    balance,
    // Delayed secondary response to weight transfer, not unrelated body bobbing.
    transfer: (Math.sin(q * Math.PI) * (b.hip[1] - a.hip[1])) / 22,
  };
}
