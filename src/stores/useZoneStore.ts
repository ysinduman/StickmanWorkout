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
        const base = emptyBars();
        if (saved?.bars) {
          const raw = saved.bars as Record<string, any>;
          // Migrate legacy or custom keys
          const armLvl = Math.max(raw.arms?.level ?? 0, raw.leftArm?.level ?? 0, raw.rightArm?.level ?? 0);
          const armXp = Math.max(raw.arms?.xp ?? 0, raw.leftArm?.xp ?? 0, raw.rightArm?.xp ?? 0);
          const torsoLvl = Math.max(raw.torso?.level ?? 0, raw.shoulders?.level ?? 0, raw.back?.level ?? 0, raw.chest?.level ?? 0);
          const torsoXp = Math.max(raw.torso?.xp ?? 0, raw.shoulders?.xp ?? 0, raw.back?.xp ?? 0, raw.chest?.xp ?? 0);
          const absLvl = Math.max(raw.abs?.level ?? 0, raw.core?.level ?? 0);
          const absXp = Math.max(raw.abs?.xp ?? 0, raw.core?.xp ?? 0);
          const legLvl = Math.max(raw.legs?.level ?? 0, raw.glutes?.level ?? 0);
          const legXp = Math.max(raw.legs?.xp ?? 0, raw.glutes?.xp ?? 0);

          base.arms = { level: armLvl, xp: armXp };
          base.torso = { level: torsoLvl, xp: torsoXp };
          base.abs = { level: absLvl, xp: absXp };
          base.legs = { level: legLvl, xp: legXp };
        }
        return {
          ...current,
          ...saved,
          bars: base,
        };
      },
    },
  ),
);
