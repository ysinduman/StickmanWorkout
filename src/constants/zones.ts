export const MUSCLE_ZONES = [
  'leftArm',
  'rightArm',
  'shoulders',
  'back',
  'abs',
  'glutes',
  'legs',
] as const;

export type MuscleZone = (typeof MUSCLE_ZONES)[number];
