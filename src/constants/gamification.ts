/**
 * Gamification constants.
 * XP thresholds, level calculations, and stickman evolution parameters.
 */

// XP required to reach each level (cumulative).
// Level 1 = 0 XP. Level 100 ≈ 50,000 XP.
// Formula: totalXP = level^2 * 5  (simple quadratic curve)
export const XP_PER_LEVEL_SQUARED_FACTOR = 5;

/**
 * Calculate the level for a given XP amount.
 */
export function calculateLevel(xp: number): number {
  const level = Math.floor(Math.sqrt(xp / XP_PER_LEVEL_SQUARED_FACTOR));
  return Math.max(1, Math.min(100, level));
}

/**
 * Calculate cumulative XP needed for a specific level.
 */
export function xpForLevel(level: number): number {
  return level * level * XP_PER_LEVEL_SQUARED_FACTOR;
}

/**
 * Calculate progress within the current level (0.0 to 1.0).
 */
export function levelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const range = nextLevelXp - currentLevelXp;
  if (range <= 0) return 1;
  return Math.min(1, (xp - currentLevelXp) / range);
}

/**
 * Calculate muscle mass (0–100) from level.
 * Direct 1:1 mapping — level IS muscle mass for stickman rendering.
 */
export function calculateMuscleMass(level: number): number {
  return Math.max(0, Math.min(100, level));
}

// ──── XP Rewards ────

/** XP earned per completed workout */
export const XP_PER_WORKOUT = 100;

/** Bonus XP per completed set */
export const XP_PER_SET = 5;

/** Streak bonus multiplier: XP * (1 + streak * STREAK_MULTIPLIER) */
export const STREAK_MULTIPLIER = 0.05;

/** Maximum streak multiplier cap */
export const MAX_STREAK_MULTIPLIER = 2.0;

/**
 * Calculate total XP earned for a workout.
 */
export function calculateWorkoutXP(
  completedSets: number,
  currentStreak: number,
): number {
  const baseXP = XP_PER_WORKOUT + completedSets * XP_PER_SET;
  const streakBonus = Math.min(
    1 + currentStreak * STREAK_MULTIPLIER,
    MAX_STREAK_MULTIPLIER,
  );
  return Math.round(baseXP * streakBonus);
}

// ──── Level Up Plan ────

/** Default percentage increase when "Level Up Plan" is pressed */
export const LEVEL_UP_WEIGHT_PERCENTAGE = 5; // 5% increase
