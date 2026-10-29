import type { MuscleGroup } from '../types/exercise';

/**
 * 4 Temel Kas Bölgesi:
 * 1. Gövde (Torso: Göğüs, Sırt, Omuz)
 * 2. Kol (Arms: Biceps, Triceps, Ön kol)
 * 3. Karın (Abs: Karın, Core)
 * 4. Bacak (Legs: Ön bacak, Arka bacak, Kalf)
 */
export const MUSCLE_ZONES = [
  'torso',
  'arms',
  'abs',
  'legs',
] as const;

export type MuscleZone = (typeof MUSCLE_ZONES)[number];

export function muscleGroupForZone(zone: MuscleZone | string): MuscleGroup {
  switch (zone) {
    case 'torso':
    case 'chest':
    case 'back':
    case 'shoulders':
      return 'chest';
    case 'arms':
    case 'leftArm':
    case 'rightArm':
      return 'arms';
    case 'abs':
    case 'core':
      return 'core';
    case 'legs':
    case 'glutes':
    default:
      return 'legs';
  }
}

/** Server body-part ids highlighted when this zone is the priority. */
export function bodyPartsForZone(zone: MuscleZone | string): string[] {
  switch (zone) {
    case 'torso':
    case 'chest':
    case 'back':
    case 'shoulders':
      return ['torso', 'chest', 'back', 'shoulders'];
    case 'arms':
    case 'leftArm':
    case 'rightArm':
      return ['arms', 'biceps', 'triceps', 'forearms', 'leftArm', 'rightArm'];
    case 'abs':
    case 'core':
      return ['abs', 'core'];
    case 'legs':
    case 'glutes':
      return ['legs', 'quadriceps', 'hamstrings', 'calves', 'glutes'];
    default:
      return [];
  }
}

/** Map any specific or legacy muscle group to one of the 4 canonical zones: torso, arms, abs, legs */
export function zoneForMuscleGroup(group: MuscleGroup | string): MuscleZone {
  switch (group) {
    case 'torso':
    case 'chest':
    case 'back':
    case 'shoulders':
      return 'torso';
    case 'arms':
    case 'biceps':
    case 'triceps':
    case 'forearms':
    case 'leftArm':
    case 'rightArm':
      return 'arms';
    case 'abs':
    case 'core':
      return 'abs';
    case 'legs':
    case 'glutes':
    case 'quadriceps':
    case 'hamstrings':
    case 'calves':
    default:
      return 'legs';
  }
}
