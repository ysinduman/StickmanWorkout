import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CosmeticId, rollCosmeticDrop } from '../constants/cosmetics';

interface CosmeticState {
  owned: CosmeticId[];
  equipped: CosmeticId | null;
  grantDrop: () => CosmeticId;
}

export const useCosmeticStore = create<CosmeticState>()(
  persist(
    (set, get) => ({
      owned: [],
      equipped: null,

      grantDrop: () => {
        const drop = rollCosmeticDrop();
        const owned = get().owned.includes(drop) ? get().owned : [...get().owned, drop];
        set({ owned, equipped: drop });
        return drop;
      },
    }),
    {
      name: 'stickman-cosmetic-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
