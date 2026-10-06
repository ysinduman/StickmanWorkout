// User profile for gamification and streak tracking
export interface UserProfile {
  xp: number;
  level: number;             // 1–100
  muscleMass: number;        // 0–100 (drives Stickman visual)
  currentStreak: number;     // Consecutive active days
  longestStreak: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;  // ISO date (YYYY-MM-DD)
}

// Streak status for a single calendar day
export type DayStatus =
  | 'workout_completed'      // User did their workout — 100% flame
  | 'rest_day_1'             // 1st scheduled rest day after workout — 50% flame
  | 'rest_day_2'             // 2nd scheduled rest day — 30% flame
  | 'rest_day_beyond'        // 3rd+ rest day — flame fading out
  | 'missed'                 // Scheduled workout was missed — streak broken
  | 'future'                 // Not yet reached
  | 'no_plan';               // No plan exists for this day

// Calendar day metadata
export interface CalendarDay {
  date: string;              // YYYY-MM-DD
  status: DayStatus;
  flameIntensity: number;    // 0.0 to 1.0
}

// Default profile for new users
export const DEFAULT_USER_PROFILE: UserProfile = {
  xp: 0,
  level: 1,
  muscleMass: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalWorkouts: 0,
  lastWorkoutDate: null,
};
