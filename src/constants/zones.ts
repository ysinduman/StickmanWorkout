import type { MuscleGroup } from '../types/exercise';

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

export function muscleGroupForZone(zone: MuscleZone): MuscleGroup {
  switch (zone) {
    case 'leftArm':
    case 'rightArm':
      return 'arms';
    case 'shoulders':
      return 'shoulders';
    case 'back':
      return 'back';
    case 'abs':
      return 'core';
    case 'glutes':
    case 'legs':
      return 'legs';
    default:
      return 'legs';
  }
}

/** Server body-part ids highlighted when this zone is the priority. */
export function bodyPartsForZone(zone: MuscleZone): string[] {
  switch (zone) {
    case 'leftArm':
    case 'rightArm':
      return ['biceps', 'triceps', 'forearms'];
    case 'shoulders':
      return ['shoulders'];
    case 'back':
      return ['back'];
    case 'abs':
      return ['abs'];
    case 'glutes':
      return ['glutes'];
    case 'legs':
      return ['quadriceps', 'hamstrings', 'calves'];
    default:
      return [];
  }
}
