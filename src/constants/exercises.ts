import { Exercise } from '../types/exercise';

/**
 * Pre-loaded exercise library.
 * Names use i18n keys — the UI will resolve them via `t('exercises.pushUp')`.
 */
export const EXERCISE_LIBRARY: Exercise[] = [
  // ──── Göğüs & Kollar (Chest & Arms) ────
  {
    id: 'push_up',
    name: 'exercises.pushUp',
    muscleGroup: 'chest',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeightKg: 0, // bodyweight
  },

  // ──── Bacaklar & Kalça (Legs & Glutes) ────
  {
    id: 'squat',
    name: 'exercises.squat',
    muscleGroup: 'legs',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeightKg: 0, // bodyweight
  },

  // ──── Karın & Core (Abs) ────
  {
    id: 'crunches',
    name: 'exercises.crunches',
    muscleGroup: 'core',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 20,
    defaultWeightKg: 0, // bodyweight
  },
  {
    id: 'plank',
    name: 'exercises.plank',
    muscleGroup: 'core',
    type: 'time',
    defaultSets: 3,
    defaultTimeSeconds: 45,
  },
];

/**
 * Helper to look up an exercise by ID from the library.
 */
export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISE_LIBRARY.find((e) => e.id === id);
}

/**
 * Helper to filter exercises by muscle group.
 */
export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return EXERCISE_LIBRARY.filter((e) => e.muscleGroup === muscleGroup);
}
