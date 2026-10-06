import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DEFAULT_USER_PROFILE } from '../types';
import { calculateLevel, calculateMuscleMass, calculateWorkoutXP } from '../constants/gamification';

interface UserState extends UserProfile {
  // Actions
  addXP: (completedSets: number) => number; // returns XP earned
  resetStreak: () => void;
  incrementStreak: () => void;
  setStreak: (streak: number) => void;
  updateLastWorkoutDate: (date: string) => void;
  getProfile: () => UserProfile;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_USER_PROFILE,

      addXP: (completedSets: number): number => {
        const state = get();
        const xpEarned = calculateWorkoutXP(completedSets, state.currentStreak);
        const newXP = state.xp + xpEarned;
        const newLevel = calculateLevel(newXP);
        const newMuscleMass = calculateMuscleMass(newLevel);

        set({
          xp: newXP,
          level: newLevel,
          muscleMass: newMuscleMass,
          totalWorkouts: state.totalWorkouts + 1,
        });

        return xpEarned;
      },

      resetStreak: () => {
        set({ currentStreak: 0 });
      },

      incrementStreak: () => {
        set((state) => {
          const newStreak = state.currentStreak + 1;
          return {
            currentStreak: newStreak,
            longestStreak: Math.max(state.longestStreak, newStreak),
          };
        });
      },

      setStreak: (streak: number) => {
        set((state) => ({
          currentStreak: streak,
          longestStreak: Math.max(state.longestStreak, streak),
        }));
      },

      updateLastWorkoutDate: (date: string) => {
        set({ lastWorkoutDate: date });
      },

      getProfile: (): UserProfile => {
        const { addXP, resetStreak, incrementStreak, updateLastWorkoutDate, getProfile, ...profile } = get();
        return profile;
      },
    }),
    {
      name: 'stickman-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
