import { CompletedExercise } from './exercise';
import { PlanDay } from './plan';

// A completed workout session
export interface CompletedWorkout {
  id: string;
  planDayId: string;       // Reference to the PlanDay that was executed
  planDayName: string;     // Snapshot of the plan day name at time of workout
  date: string;            // ISO date string (YYYY-MM-DD)
  startedAt: string;       // ISO datetime
  completedAt: string;     // ISO datetime
  exercises: CompletedExercise[];
  xpEarned: number;
}

// An active (in-progress) workout session
export interface ActiveWorkout {
  planDay: PlanDay;
  startedAt: string;       // ISO datetime
  exercises: CompletedExercise[];  // Tracks progress during workout
}

// Post-workout adjustment (user corrects actual performance)
export interface WorkoutAdjustment {
  exerciseId: string;
  setNumber: number;
  actualReps?: number;
  actualWeightKg?: number;
  actualTimeSeconds?: number;
}
