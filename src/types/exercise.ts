// Muscle groups available in the app
export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

// Exercise type: weight-based or time-based (e.g., Plank)
export type ExerciseType = 'weight' | 'time';

// A single exercise definition from the library
export interface Exercise {
  id: string;
  name: string;           // i18n key (e.g., 'exercises.benchPress')
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  defaultSets: number;
  defaultReps?: number;   // For weight-based exercises
  defaultTimeSeconds?: number; // For time-based exercises (e.g., 120 for 2min plank)
  defaultWeightKg?: number;
}

// A planned set within a workout plan
export interface PlannedSet {
  setNumber: number;
  targetReps?: number;       // For weight exercises
  targetWeightKg?: number;   // For weight exercises
  targetTimeSeconds?: number; // For time exercises (e.g., Plank)
}

// An exercise as configured in a plan (with target sets/reps/weights)
export interface PlannedExercise {
  exerciseId: string;
  sets: PlannedSet[];
}

// A completed set (actual performance during workout)
export interface CompletedSet {
  setNumber: number;
  actualReps?: number;
  actualWeightKg?: number;
  actualTimeSeconds?: number;
  completed: boolean;
}

// A completed exercise in a workout session
export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
}
