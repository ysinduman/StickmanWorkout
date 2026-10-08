import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutPlan, StoredPlan, PlanDay } from '../types';
import { LEVEL_UP_WEIGHT_PERCENTAGE } from '../constants/gamification';
import { planDayScheduledOn } from '../utils/todayPlan';

interface PlanState {
  storedPlan: StoredPlan | null;
  isCreating: boolean;

  // Actions
  setPlan: (plan: WorkoutPlan) => void;
  updatePlan: (plan: WorkoutPlan) => void;
  deletePlan: () => void;
  setIsCreating: (creating: boolean) => void;
  levelUpPlan: (percentage?: number) => void;
  getTodayPlanDay: (historyDates?: string[], now?: Date) => PlanDay | null;
  hasPlan: () => boolean;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      storedPlan: null,
      isCreating: false,

      setPlan: (plan: WorkoutPlan) => {
        const now = new Date().toISOString();
        set({
          storedPlan: {
            plan,
            createdAt: now,
            updatedAt: now,
          },
          isCreating: false,
        });
      },

      updatePlan: (plan: WorkoutPlan) => {
        const current = get().storedPlan;
        set({
          storedPlan: {
            plan,
            createdAt: current?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      deletePlan: () => {
        set({ storedPlan: null });
      },

      setIsCreating: (creating: boolean) => {
        set({ isCreating: creating });
      },

      levelUpPlan: (percentage = LEVEL_UP_WEIGHT_PERCENTAGE) => {
        const { storedPlan } = get();
        if (!storedPlan) return;

        const multiplier = 1 + percentage / 100;
        const plan = { ...storedPlan.plan };

        const bumpSets = (planDay: PlanDay): PlanDay => ({
          ...planDay,
          exercises: planDay.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((s) => ({
              ...s,
              targetWeightKg: s.targetWeightKg
                ? Math.round(s.targetWeightKg * multiplier * 2) / 2 // Round to 0.5
                : s.targetWeightKg,
            })),
          })),
        });

        if (plan.type === 'split') {
          plan.workoutDays = plan.workoutDays.map(bumpSets);
        } else {
          plan.workoutDay = bumpSets(plan.workoutDay);
        }

        set({
          storedPlan: {
            ...storedPlan,
            plan,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      getTodayPlanDay: (historyDates: string[] = [], now: Date = new Date()): PlanDay | null => {
        const { storedPlan } = get();
        if (!storedPlan) return null;
        return planDayScheduledOn(storedPlan.plan, now, historyDates);
      },

      hasPlan: (): boolean => {
        return get().storedPlan !== null;
      },
    }),
    {
      name: 'stickman-plan-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
