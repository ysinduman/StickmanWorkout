import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MuscleZone } from '../constants/zones';

function normalizeZone(z: any): MuscleZone | null {
  if (!z) return null;
  if (['torso', 'arms', 'abs', 'legs'].includes(z)) return z as MuscleZone;
  if (z === 'leftArm' || z === 'rightArm') return 'arms';
  if (z === 'shoulders' || z === 'back' || z === 'chest') return 'torso';
  if (z === 'glutes') return 'legs';
  return null;
}

interface PriorityState {
  pinnedZone: MuscleZone | null;
  pinZone: (zone: MuscleZone) => void;
  clearPin: () => void;
}

export const usePriorityStore = create<PriorityState>()(
  persist(
    (set) => ({
      pinnedZone: null,
      pinZone: (zone) => set({ pinnedZone: normalizeZone(zone) }),
      clearPin: () => set({ pinnedZone: null }),
    }),
    {
      name: 'stickman-priority-store',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<PriorityState> | undefined;
        return {
          ...current,
          ...saved,
          pinnedZone: normalizeZone(saved?.pinnedZone),
        };
      },
    },
  ),
);
