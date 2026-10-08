import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StampState {
  highestStamp: number | null;
  recordStamp: (count: number) => void;
  clearStamp: () => void;
}

export const useStampStore = create<StampState>()(
  persist(
    (set, get) => ({
      highestStamp: null,
      recordStamp: (count) => {
        const current = get().highestStamp ?? 0;
        if (count >= 3 && count > current) {
          set({ highestStamp: count });
        } else if (count >= 3 && get().highestStamp == null) {
          set({ highestStamp: count });
        }
      },
      clearStamp: () => set({ highestStamp: null }),
    }),
    {
      name: 'stickman-stamp-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
