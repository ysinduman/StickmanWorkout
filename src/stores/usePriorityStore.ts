import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MuscleZone } from '../constants/zones';

interface PriorityState {
  pinnedZone: MuscleZone | null;
  pinZone: (zone: MuscleZone) => void;
  clearPin: () => void;
}

export const usePriorityStore = create<PriorityState>()(
  persist(
    (set) => ({
      pinnedZone: null,
      pinZone: (zone) => set({ pinnedZone: zone }),
      clearPin: () => set({ pinnedZone: null }),
    }),
    {
      name: 'stickman-priority-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
