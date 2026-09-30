export const JOINTS = [
  "hips",
  "torso",
  "head",
  "upperArmL",
  "lowerArmL",
  "upperArmR",
  "lowerArmR",
  "thighL",
  "shinL",
  "thighR",
  "shinR",
] as const;
export type Joint = (typeof JOINTS)[number];
export type Pose = Record<Joint, number>;

/** Local joint rotations in degrees. Three rig checks, not chapter choreography. */
export const TEST_POSES = {
  mountain: {
    hips: 0,
    torso: 0,
    head: 0,
    upperArmL: 8,
    lowerArmL: -8,
    upperArmR: -8,
    lowerArmR: 8,
    thighL: 3,
    shinL: -3,
    thighR: -3,
    shinR: 3,
  },
  reach: {
    hips: 0,
    torso: -3,
    head: 3,
    upperArmL: 163,
    lowerArmL: 10,
    upperArmR: -163,
    lowerArmR: -10,
    thighL: 3,
    shinL: -3,
    thighR: -3,
    shinR: 3,
  },
  warrior: {
    hips: -4,
    torso: 4,
    head: -8,
    upperArmL: 92,
    lowerArmL: -2,
    upperArmR: -92,
    lowerArmR: 2,
    thighL: 46,
    shinL: -46,
    thighR: -38,
    shinR: 23,
  },
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof TEST_POSES;
export const PANEL_POSES: PoseName[] = [
  "mountain",
  "reach",
  "warrior",
  "mountain",
];
