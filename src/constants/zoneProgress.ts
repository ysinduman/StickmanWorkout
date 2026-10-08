import { MuscleZone } from './zones';

export const ZONE_BAR_SIZE = 100;
export const ZONE_SEED_XP = 12;
export const ZONE_XP_PER_WORKOUT = 40;

export interface ZoneBar {
  xp: number;
  level: number;
}

export function emptyZoneBar(): ZoneBar {
  return { xp: 0, level: 0 };
}

export type HotStartBonus = 0 | 8 | 20;

/** 60% +0, 30% +8, 10% +20. Added on top of the 12% seed, never instead of it. */
export function rollHotStart(random: number = Math.random()): HotStartBonus {
  if (random < 0.6) return 0;
  if (random < 0.9) return 8;
  return 20;
}

/** 20% chance to thicken the limb one extra step. Does not replace the 12% seed. */
export function rollDoubleStep(random: number = Math.random()): boolean {
  return random < 0.2;
}

export function addXpToBar(
  bar: ZoneBar,
  amount: number,
  roll: () => HotStartBonus = rollHotStart,
  rollExtraStep: () => boolean = rollDoubleStep,
): ZoneBar & { leveledUp: boolean; hotStart: HotStartBonus | null; doubleStep: boolean } {
  let xp = bar.xp + amount;
  let level = bar.level;
  let leveledUp = false;
  let hotStart: HotStartBonus | null = null;
  let doubleStep = false;
  while (xp >= ZONE_BAR_SIZE) {
    const overflow = xp - ZONE_BAR_SIZE;
    const bonus = roll();
    hotStart = bonus;
    level += 1;
    leveledUp = true;
    if (rollExtraStep()) {
      level += 1;
      doubleStep = true;
    }
    xp = ZONE_SEED_XP + bonus + overflow;
  }
  return { xp, level, leveledUp, hotStart, doubleStep };
}

export type ZoneBars = Record<MuscleZone, ZoneBar>;
