/** Provisional copy and geometry; chapter artwork comes in a later pass. */
export const CHAPTERS = [
  {
    word: "Awaken",
    line: "A little space to begin.",
    phase: "Dawn",
    time: "05:50",
    p: 0,
  },
  {
    word: "Breathe",
    line: "Come back to your own rhythm.",
    phase: "Morning",
    time: "07:10",
    p: 0.33,
  },
  {
    word: "Flow",
    line: "Find room for a little movement.",
    phase: "Daylight",
    time: "10:30",
    p: 0.66,
  },
  {
    word: "Rest",
    line: "Let the day settle around you.",
    phase: "Evening",
    time: "19:30",
    p: 1,
  },
] as const;

export const LAYERS = [
  { name: "sky", speed: 0.15 },
  { name: "far", speed: 0.4 },
  { name: "mid", speed: 0.7 },
  { name: "near", speed: 1 },
  { name: "foreground", speed: 1.25 },
] as const;
export type LayerName = (typeof LAYERS)[number]["name"];

export const DAYLIGHT = [
  {
    p: 0,
    minutes: 350,
    skyTop: "#bda9a0",
    skyBottom: "#f1e7d3",
    lightTint: "#d9902b",
    shadowTint: "#635262",
    sunY: 35,
  },
  {
    p: 0.33,
    minutes: 430,
    skyTop: "#d7c9aa",
    skyBottom: "#f1e7d3",
    lightTint: "#f4cf83",
    shadowTint: "#73644e",
    sunY: 14,
  },
  {
    p: 0.66,
    minutes: 630,
    skyTop: "#becdc4",
    skyBottom: "#eee3c9",
    lightTint: "#fff0bc",
    shadowTint: "#5a6652",
    sunY: 0,
  },
  {
    p: 1,
    minutes: 1170,
    skyTop: "#1e2740",
    skyBottom: "#9c7c80",
    lightTint: "#b4552f",
    shadowTint: "#1e2740",
    sunY: 44,
  },
] as const;

export const CHAPTER_EDGES = [0, 0.165, 0.495, 0.83, 1] as const;
export const linear = (p: number) => p;

export function chapterAt(p: number) {
  return p < CHAPTER_EDGES[1]
    ? 0
    : p < CHAPTER_EDGES[2]
      ? 1
      : p < CHAPTER_EDGES[3]
        ? 2
        : 3;
}

export function clockTime(minutes: number) {
  const whole = Math.round(minutes);
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}
