import { getExerciseById } from '../constants/exercises';
import { CompletedExercise } from '../types';

export interface CompletionExercise {
  exercise_id: string;
  reps?: number;
  duration_seconds?: number;
}

export function createIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const value = Math.floor(Math.random() * 16);
    const next = char === 'x' ? value : (value & 0x3) | 0x8;
    return next.toString(16);
  });
}

export function buildCompletionExercises(exercises: CompletedExercise[]): CompletionExercise[] {
  const totals = new Map<string, CompletionExercise>();

  exercises.forEach(exercise => {
    const definition = getExerciseById(exercise.exerciseId);
    if (!definition) {
      return;
    }
    const completed = exercise.sets.filter(set => set.completed);
    const current = totals.get(exercise.exerciseId) ?? { exercise_id: exercise.exerciseId };

    if (definition.type === 'time') {
      const seconds = completed.reduce((sum, set) => sum + (set.actualTimeSeconds ?? 0), 0);
      current.duration_seconds = (current.duration_seconds ?? 0) + seconds;
    } else {
      const reps = completed.reduce((sum, set) => sum + (set.actualReps ?? 0), 0);
      current.reps = (current.reps ?? 0) + reps;
    }
    totals.set(exercise.exerciseId, current);
  });

  return Array.from(totals.values()).filter(line => (line.reps ?? 0) > 0 || (line.duration_seconds ?? 0) > 0);
}

export function completionErrorKey(message: string): string {
  const codes = [
    'hourly_limit',
    'daily_limit',
    'invalid_reps',
    'invalid_duration',
    'workout_too_short',
    'workout_too_long',
    'workout_too_small',
    'unknown_exercise',
    'invalid_payload',
    'not_authenticated',
    'profile_missing',
    'username_taken',
  ];
  if (message.includes('duplicate key')) {
    return 'username_taken';
  }
  return codes.find(code => message.includes(code)) ?? 'request_failed';
}
