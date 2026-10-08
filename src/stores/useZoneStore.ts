import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MuscleZone, MUSCLE_ZONES } from '../constants/zones';
import {
  addXpToBar,
  emptyZoneBar,
  HotStartBonus,
  ZONE_XP_PER_WORKOUT,
  ZoneBars,
} from '../constants/zoneProgress';

function emptyBars(): ZoneBars {
  return MUSCLE_ZONES.reduce((bars, zone) => {
    bars[zone] = emptyZoneBar();
    return bars;
  }, {} as ZoneBars);
}

interface ZoneState {
  bars: ZoneBars;
  doubleStepsKept: number;
  lastHotStart: { zone: MuscleZone; bonus: HotStartBonus } | null;
  addPinnedWorkoutXp: (zone: MuscleZone) => {
    xpGained: number;
    level: number;
    leveledUp: boolean;
    hotStart: HotStartBonus | null;
    doubleStep: boolean;
  };
}

export const useZoneStore = create<ZoneState>()(
  persist(
    (set, get) => ({
      bars: emptyBars(),
      doubleStepsKept: 0,
      lastHotStart: null,

      addPinnedWorkoutXp: (zone) => {
        const current = get().bars[zone] ?? emptyZoneBar();
        const next = addXpToBar(current, ZONE_XP_PER_WORKOUT);
        set({
          bars: {
            ...get().bars,
            [zone]: { xp: next.xp, level: next.level },
          },
          lastHotStart:
            next.hotStart == null ? get().lastHotStart : { zone, bonus: next.hotStart },
          doubleStepsKept: get().doubleStepsKept + (next.doubleStep ? 1 : 0),
        });
        return {
          xpGained: ZONE_XP_PER_WORKOUT,
          level: next.level,
          leveledUp: next.leveledUp,
          hotStart: next.hotStart,
          doubleStep: next.doubleStep,
        };
      },
    }),
    {
      name: 'stickman-zone-store',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ZoneState> | undefined;
        return {
          ...current,
          ...saved,
          bars: { ...emptyBars(), ...(saved?.bars ?? {}) },
        };
      },
    },
  ),
);
