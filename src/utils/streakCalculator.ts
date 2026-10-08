import { WorkoutPlan, CompletedWorkout, DayStatus, CalendarDay, DayOfWeek } from '../types';
import { getDayNameOfWeek, formatDateString, getTodayDateString, wholeDaysBetween } from './dateUtils';

/**
 * Calculates the status and flame intensity for a given list of dates
 * based on the active workout plan and workout history.
 */
export function calculateCalendarDays(
  dates: Date[],
  plan: WorkoutPlan | null,
  history: CompletedWorkout[]
): CalendarDay[] {
  const todayStr = getTodayDateString();
  const completedDates = new Set(history.map((w) => w.date));

  // Sort history by date descending to easily find last completed workout
  const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

  return dates.map((date) => {
    const dateStr = formatDateString(date);
    const isFuture = dateStr > todayStr;

    // 1. If workout is completed on this day
    if (completedDates.has(dateStr)) {
      return {
        date: dateStr,
        status: 'workout_completed',
        flameIntensity: 1.0,
      };
    }

    if (isFuture) {
      return {
        date: dateStr,
        status: 'future',
        flameIntensity: 0.0,
      };
    }

    if (!plan) {
      return {
        date: dateStr,
        status: 'no_plan',
        flameIntensity: 0.0,
      };
    }

    // 2. Identify if it was a scheduled workout day or rest day
    let isScheduledWorkoutDay = false;
    let daysSinceLastWorkout = -1;

    // Find days since the last completed workout prior to this date
    const lastWorkoutPrior = sortedHistory.find((w) => w.date < dateStr);
    if (lastWorkoutPrior) {
      daysSinceLastWorkout = wholeDaysBetween(lastWorkoutPrior.date, date);
    }

    if (plan.type === 'split') {
      const dayName = getDayNameOfWeek(dateStr) as DayOfWeek;
      isScheduledWorkoutDay = Boolean(plan.schedule[dayName]);
    } else {
      // Full Body plan
      // If there was a workout prior, check if this day is a workout day or rest day based on restDaysBetween
      if (lastWorkoutPrior && daysSinceLastWorkout > 0) {
        const cycle = plan.restDaysBetween + 1;
        isScheduledWorkoutDay = daysSinceLastWorkout % cycle === 0;
      } else {
        // If there's no prior workout, let's assume they haven't started yet or first day is a workout day
        isScheduledWorkoutDay = history.length === 0; 
      }
    }

    // 3. Determine status and flame intensity
    if (isScheduledWorkoutDay) {
      // It was scheduled but not completed (since we checked completedDates above)
      if (dateStr === todayStr) {
        // Today, user can still complete it
        return {
          date: dateStr,
          status: 'future', // Or pending
          flameIntensity: 0.0,
        };
      } else {
        // In the past, so it was missed
        return {
          date: dateStr,
          status: 'missed',
          flameIntensity: 0.0,
        };
      }
    } else {
      // It's a rest day
      if (daysSinceLastWorkout === 1) {
        return {
          date: dateStr,
          status: 'rest_day_1',
          flameIntensity: 0.5,
        };
      } else if (daysSinceLastWorkout === 2) {
        return {
          date: dateStr,
          status: 'rest_day_2',
          flameIntensity: 0.3,
        };
      } else {
        return {
          date: dateStr,
          status: 'rest_day_beyond',
          flameIntensity: daysSinceLastWorkout > 0 ? 0.1 : 0.0,
        };
      }
    }
  });
}

/**
 * Calculates the current active streak based on history and plan.
 * The streak is maintained by workouts or consecutive scheduled rest days.
 * If a scheduled workout is missed in the past, the streak breaks.
 */
export function calculateCurrentStreak(
  plan: WorkoutPlan | null,
  history: CompletedWorkout[]
): number {
  if (history.length === 0 || !plan) return 0;

  // Sort history ascending to step through it
  const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const todayStr = getTodayDateString();
  const lastWorkoutDate = sortedHistory[sortedHistory.length - 1].date;

  // If last workout was completed today or yesterday, streak is active.
  // We need to trace backwards from today/yesterday to count consecutive valid days.
  let checkDate = new Date();
  // If no workout today, we start checking from yesterday.
  const hasWorkoutToday = history.some((w) => w.date === todayStr);
  if (!hasWorkoutToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let streak = 0;
  let missedScheduledDayFound = false;

  // Track backwards up to 365 days
  for (let i = 0; i < 365; i++) {
    const checkDateStr = formatDateString(checkDate);
    const hasWorkout = history.some((w) => w.date === checkDateStr);

    if (hasWorkout) {
      streak++;
    } else {
      // Check if this was a rest day or scheduled workout day
      let isRestDay = true;
      if (plan.type === 'split') {
        const dayName = getDayNameOfWeek(checkDateStr) as DayOfWeek;
        isRestDay = !plan.schedule[dayName];
      } else {
        // Full Body: find the most recent workout before this checkDate
        const lastWorkoutBefore = sortedHistory.filter((w) => w.date < checkDateStr).pop();
        if (lastWorkoutBefore) {
          const daysSince = wholeDaysBetween(lastWorkoutBefore.date, checkDate);
          const cycle = plan.restDaysBetween + 1;
          isRestDay = daysSince % cycle !== 0;
        } else {
          isRestDay = true; // No prior workouts, so not a missed day yet
        }
      }

      if (isRestDay) {
        // Rest days count as continuing the streak if they follow a completed workout
        const lastWorkoutBefore = sortedHistory.filter((w) => w.date < checkDateStr).pop();
        if (lastWorkoutBefore) {
          streak++; // Keep the streak alive
        } else {
          break; // No prior workouts
        }
      } else {
        // It was a scheduled workout but not completed -> Streak broken!
        break;
      }
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
