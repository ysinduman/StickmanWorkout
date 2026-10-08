import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveWorkout, CompletedWorkout, CompletedExercise, CompletedSet } from '../types';
import { PlanDay } from '../types';

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  history: CompletedWorkout[];

  // Actions
  startWorkout: (planDay: PlanDay) => void;
  updateExerciseProgress: (exerciseId: string, sets: CompletedSet[]) => void;
  finishWorkout: (exercises: CompletedExercise[], xpEarned: number) => CompletedWorkout;
  cancelWorkout: () => void;
  addCompletedWorkout: (workout: CompletedWorkout) => void;
  getWorkoutsByMonth: (year: number, month: number) => CompletedWorkout[];
  getWorkoutByDate: (date: string) => CompletedWorkout | undefined;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
      history: [],

      startWorkout: (planDay: PlanDay) => {
        const exercises: CompletedExercise[] = planDay.exercises.map((ex) => {
          const sourceSets = ex.sets?.length
            ? ex.sets
            : [{ setNumber: 1, targetReps: 10, targetWeightKg: 0, targetTimeSeconds: 60 }];
          return {
            exerciseId: ex.exerciseId,
            sets: sourceSets.map((s) => ({
              setNumber: s.setNumber,
              actualReps: s.targetReps,
              actualWeightKg: s.targetWeightKg,
              actualTimeSeconds: s.targetTimeSeconds,
              completed: false,
            })),
          };
        });

        set({
          activeWorkout: {
            planDay,
            startedAt: new Date().toISOString(),
            exercises,
          },
        });
      },

      updateExerciseProgress: (exerciseId: string, sets: CompletedSet[]) => {
        const active = get().activeWorkout;
        if (!active) return;

        set({
          activeWorkout: {
            ...active,
            exercises: active.exercises.map((ex) =>
              ex.exerciseId === exerciseId ? { ...ex, sets } : ex
            ),
          },
        });
      },

      finishWorkout: (exercises: CompletedExercise[], xpEarned: number): CompletedWorkout => {
        const active = get().activeWorkout;
        if (!active) throw new Error('No active workout to finish');

        const completed: CompletedWorkout = {
          id: generateId(),
          planDayId: active.planDay.id,
          planDayName: active.planDay.name,
          date: getTodayDate(),
          startedAt: active.startedAt,
          completedAt: new Date().toISOString(),
          exercises,
          xpEarned,
        };

        set((state) => ({
          activeWorkout: null,
          history: [...state.history, completed],
        }));

        return completed;
      },

      cancelWorkout: () => {
        set({ activeWorkout: null });
      },

      addCompletedWorkout: (workout: CompletedWorkout) => {
        set((state) => ({
          history: [...state.history, workout],
        }));
      },

      getWorkoutsByMonth: (year: number, month: number): CompletedWorkout[] => {
        const prefix = `${year}-${String(month).padStart(2, '0')}`;
        return get().history.filter((w) => w.date.startsWith(prefix));
      },

      getWorkoutByDate: (date: string): CompletedWorkout | undefined => {
        return get().history.find((w) => w.date === date);
      },
    }),
    {
      name: 'stickman-workout-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
