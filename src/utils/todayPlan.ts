import { muscleGroupForZone, MuscleZone } from '../constants/zones';
import { DayOfWeek, PlanDay, WorkoutPlan } from '../types';
import { formatDateString, getDayNameOfWeek, wholeDaysBetween } from './dateUtils';

function datePrefix(value: string): string {
  return value.slice(0, 10);
}

/**
 * The plan day scheduled on `date`, using the same weekday and rest-cycle
 * rules as the calendar. A split day is a training day only when the schedule
 * points at a real workout. A full-body day follows restDaysBetween.
 */
export function planDayScheduledOn(
  plan: WorkoutPlan,
  date: Date,
  historyDates: string[],
): PlanDay | null {
  if (plan.type === 'split') {
    const weekday = getDayNameOfWeek(formatDateString(date)) as DayOfWeek;
    const dayId = plan.schedule?.[weekday];
    if (!dayId) return null;
    return (
      plan.workoutDays.find((day) => day.id === dayId) ??
      plan.workoutDays.find((day) => day.id.endsWith(`_${weekday}`)) ??
      null
    );
  }

  const todayStr = formatDateString(date);
  const dated = historyDates.map(datePrefix).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));
  const prior = dated.filter((day) => day < todayStr).sort().at(-1);
  if (!prior) {
    return dated.length === 0 ? plan.workoutDay : null;
  }
  const gap = wholeDaysBetween(prior, date);
  if (gap <= 0) return plan.workoutDay;
  const cycle = Math.max(1, plan.restDaysBetween + 1);
  return gap % cycle === 0 ? plan.workoutDay : null;
}

export function planDayForZone(plan: WorkoutPlan, zone: MuscleZone): PlanDay | null {
  const group = muscleGroupForZone(zone);
  if (plan.type === 'split') {
    return plan.workoutDays.find((day) => day.muscleGroups.includes(group)) ?? null;
  }
  return plan.workoutDay.muscleGroups.includes(group) ? plan.workoutDay : null;
}

/** Local today or the UTC date, so a workout saved either way still counts. */
export function trainedOn(
  historyDates: string[],
  serverCompletedOn: string | null | undefined,
  now: Date,
): boolean {
  const keys = new Set([formatDateString(now), now.toISOString().slice(0, 10)]);
  if (historyDates.some((date) => keys.has(datePrefix(date)))) return true;
  if (!serverCompletedOn) return false;
  return keys.has(datePrefix(serverCompletedOn));
}
