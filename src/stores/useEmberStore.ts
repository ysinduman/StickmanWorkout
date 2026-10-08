import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EMBER_SHELF, EMBERS_PER_WORKOUT, ShelfItemId } from '../constants/emberShelf';

interface EmberState {
  embers: number;
  owned: ShelfItemId[];
  earnFromWorkout: () => number;
  rollKeptDayBonus: () => boolean;
  buy: (id: ShelfItemId) => boolean;
}

export const useEmberStore = create<EmberState>()(
  persist(
    (set, get) => ({
      embers: 0,
      owned: [],

      earnFromWorkout: () => {
        set((state) => ({ embers: state.embers + EMBERS_PER_WORKOUT }));
        return EMBERS_PER_WORKOUT;
      },

      rollKeptDayBonus: () => {
        if (Math.random() >= 0.25) return false;
        set((state) => ({ embers: state.embers + 1 }));
        return true;
      },

      buy: (id) => {
        const item = EMBER_SHELF.find((entry) => entry.id === id);
        if (!item) return false;
        const { embers, owned } = get();
        if (owned.includes(id) || embers < item.price) return false;
        set({ embers: embers - item.price, owned: [...owned, id] });
        return true;
      },
    }),
    {
      name: 'stickman-ember-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
