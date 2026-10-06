import { MuscleGroup, PlannedExercise } from './exercise';

// The type of workout plan
export type PlanType = 'split' | 'fullBody';

// A single day of work in a split plan
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// A single workout day definition (e.g., "Chest & Triceps on Monday")
export interface PlanDay {
  id: string;
  name: string;            // Auto-generated: "Workout 1", "Workout 2", etc.
  muscleGroups: MuscleGroup[];
  exercises: PlannedExercise[];
}

// Split plan: specific muscle groups on specific days
export interface SplitPlan {
  type: 'split';
  schedule: Record<DayOfWeek, string | null>; // PlanDay id or null (rest day)
  workoutDays: PlanDay[];
}

// Full body plan: same workout with configurable rest days
export interface FullBodyPlan {
  type: 'fullBody';
  restDaysBetween: number;  // e.g., 1 = every other day, 2 = every third day
  workoutDay: PlanDay;
}

// Union type for the active plan
export type WorkoutPlan = SplitPlan | FullBodyPlan;

// Metadata wrapper for persistence
export interface StoredPlan {
  plan: WorkoutPlan;
  createdAt: string;  // ISO date
  updatedAt: string;  // ISO date
}
