import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '../ui';
import { FlameEffect } from './FlameEffect';
import theme from '../../constants/theme';
import { WorkoutPlan, CompletedWorkout, CalendarDay } from '../../types';
import { getDaysInMonth, formatDateString, getTodayDateString } from '../../utils/dateUtils';
import { calculateCalendarDays } from '../../utils/streakCalculator';

interface CalendarProps {
  plan: WorkoutPlan | null;
  history: CompletedWorkout[];
}

export const Calendar: React.FC<CalendarProps> = ({ plan, history }) => {
  const { t } = useTranslation();

  // Get current month and year
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed

  // Month name resolution
  const monthName = today.toLocaleString(t('settings.language') === 'tr' ? 'tr-TR' : 'en-US', {
    month: 'long',
  });

  // Calculate days in the current month
  const calendarDaysList = useMemo(() => {
    const dates = getDaysInMonth(currentYear, currentMonth);
    return calculateCalendarDays(dates, plan, history);
  }, [currentYear, currentMonth, plan, history]);

  // Week day headers
  const weekdayHeaders = [
    t('days.mon'),
    t('days.tue'),
    t('days.wed'),
    t('days.thu'),
    t('days.fri'),
    t('days.sat'),
    t('days.sun'),
  ];

  // Helper to align first day of the month with the correct column
  const paddingDays = useMemo(() => {
    if (calendarDaysList.length === 0) return 0;
    const firstDate = new Date(calendarDaysList[0].date);
    // getDay() is 0 (Sunday) to 6 (Saturday). We want Monday (0) to Sunday (6).
    const day = firstDate.getDay();
    return day === 0 ? 6 : day - 1;
  }, [calendarDaysList]);

  return (
    <View style={styles.container}>
      <Typography variant="body" bold align="center" style={styles.monthTitle}>
        {monthName} {currentYear}
      </Typography>

      {/* Weekday headers row */}
      <View style={styles.gridRow}>
        {weekdayHeaders.map((day) => (
          <Typography key={day} variant="caption" align="center" style={styles.headerCell}>
            {day}
          </Typography>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.grid}>
        {/* Render empty spaces for padding */}
        {Array.from({ length: paddingDays }).map((_, i) => (
          <View key={`pad-${i}`} style={styles.cellContainer} />
        ))}

        {/* Render actual days */}
        {calendarDaysList.map((day) => {
          const dateObj = new Date(day.date);
          const isToday = day.date === getTodayDateString();

          return (
            <View
              key={day.date}
              style={[
                styles.cellContainer,
                isToday && styles.todayCell,
                day.status === 'missed' && styles.missedCell,
              ]}
            >
              <Typography
                variant="caption"
                align="center"
                style={[
                  styles.dayNumber,
                  isToday && styles.todayText,
                  day.status === 'workout_completed' && styles.completedText,
                ]}
              >
                {dateObj.getDate()}
              </Typography>
              <View style={styles.flameContainer}>
                <FlameEffect intensity={day.flameIntensity} size={16} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  monthTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  headerCell: {
    flex: 1,
    color: theme.colors.text.secondary,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellContainer: {
    width: '14.28%', // 7 days in a week
    aspectRatio: 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    position: 'relative',
    borderRadius: theme.borderRadius.sm,
  },
  todayCell: {
    backgroundColor: theme.colors.background.tertiary,
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
  },
  missedCell: {
    backgroundColor: 'rgba(248, 113, 113, 0.05)',
  },
  dayNumber: {
    color: theme.colors.text.primary,
    zIndex: 2,
  },
  todayText: {
    color: theme.colors.accent.primary,
    fontWeight: 'bold',
  },
  completedText: {
    fontWeight: 'bold',
  },
  flameContainer: {
    position: 'absolute',
    bottom: 2,
    zIndex: 1,
  },
});
