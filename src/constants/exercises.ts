import { Exercise } from '../types/exercise';

/**
 * Pre-loaded exercise library.
 * Names use i18n keys — the UI will resolve them via `t('exercises.pushUp')`.
 */
export const EXERCISE_LIBRARY: Exercise[] = [
  // ──── Chest ────
  {
    id: 'push_up',
    name: 'exercises.pushUp',
    muscleGroup: 'chest',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeightKg: 0,  // bodyweight
  },
  {
    id: 'bench_press',
    name: 'exercises.benchPress',
    muscleGroup: 'chest',
    type: 'weight',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeightKg: 40,
  },

  // ──── Back ────
  {
    id: 'pull_up',
    name: 'exercises.pullUp',
    muscleGroup: 'back',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 8,
    defaultWeightKg: 0,  // bodyweight
  },
  {
    id: 'deadlift',
    name: 'exercises.deadlift',
    muscleGroup: 'back',
    type: 'weight',
    defaultSets: 4,
    defaultReps: 8,
    defaultWeightKg: 60,
  },

  // ──── Legs ────
  {
    id: 'squat',
    name: 'exercises.squat',
    muscleGroup: 'legs',
    type: 'weight',
    defaultSets: 4,
    defaultReps: 10,
    defaultWeightKg: 50,
  },

  // ──── Arms ────
  {
    id: 'dumbbell_curl',
    name: 'exercises.dumbbellCurl',
    muscleGroup: 'arms',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeightKg: 10,
  },
  {
    id: 'triceps_extension',
    name: 'exercises.tricepsExtension',
    muscleGroup: 'arms',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 12,
    defaultWeightKg: 8,
  },

  // ──── Core ────
  {
    id: 'plank',
    name: 'exercises.plank',
    muscleGroup: 'core',
    type: 'time',
    defaultSets: 3,
    defaultTimeSeconds: 60,
  },
  {
    id: 'crunches',
    name: 'exercises.crunches',
    muscleGroup: 'core',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 20,
    defaultWeightKg: 0,
  },
  {
    id: 'leg_raises',
    name: 'exercises.legRaises',
    muscleGroup: 'core',
    type: 'weight',
    defaultSets: 3,
    defaultReps: 15,
    defaultWeightKg: 0,
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
