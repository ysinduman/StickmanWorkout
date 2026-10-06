import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { usePlanStore } from '../../src/stores/usePlanStore';
import { useWorkoutStore } from '../../src/stores/useWorkoutStore';
import { useUserStore } from '../../src/stores/useUserStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { Typography, Card, Button } from '../../src/components/ui';
import { Stickman } from '../../src/components/Stickman/Stickman';
import { Calendar } from '../../src/components/Calendar/Calendar';
import theme from '../../src/constants/theme';
import { calculateCurrentStreak } from '../../src/utils/streakCalculator';
import { xpForLevel } from '../../src/constants/gamification';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { storedPlan, getTodayPlanDay } = usePlanStore();
  const { history, startWorkout, activeWorkout } = useWorkoutStore();
  const { level, xp, muscleMass, totalWorkouts } = useUserStore();
  const { language, setLanguage } = useSettingsStore();

  const plan = storedPlan?.plan ?? null;
  const todayPlanDay = getTodayPlanDay();
  const streak = calculateCurrentStreak(plan, history);

  const nextLevelXp = xpForLevel(level + 1);
  const currentLevelXp = xpForLevel(level);
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progress = Math.max(0, Math.min(1, xpInCurrentLevel / xpNeededForNext));

  // Language switch helper
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  // Workout Action
  const handleStartWorkout = () => {
    if (activeWorkout) {
      router.push('/workout/active');
      return;
    }

    if (todayPlanDay) {
      startWorkout(todayPlanDay);
      router.push('/workout/active');
    } else if (plan) {
      // It's a rest day, but let them start a custom/any day from their plan if they want
      // For simplicity, grab first plan day
      const fallbackDay = plan.type === 'split' ? plan.workoutDays[0] : plan.workoutDay;
      startWorkout(fallbackDay);
      router.push('/workout/active');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header bar: Language Switch */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Typography variant="label" bold color={theme.colors.accent.primary}>
            {language === 'en' ? 'TR' : 'EN'}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Gamification Bar */}
      <Card style={styles.userStatsCard}>
        <View style={styles.statRow}>
          <View>
            <Typography variant="title2" bold>
              {t('home.level', { level })}
            </Typography>
            <Typography variant="caption">
              {xp} / {nextLevelXp} XP
            </Typography>
          </View>
          <View style={styles.streakBadge}>
            <Typography variant="body" bold color={theme.colors.text.inverse}>
              {t('home.streakDays', { count: streak })}
            </Typography>
          </View>
        </View>
        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </Card>

      {/* STICKMAN VISUALIZATION */}
      <View style={styles.stickmanSection}>
        <Stickman muscleMass={muscleMass} />
        {/* Speech Bubble */}
        <View style={styles.speechBubble}>
          <Typography variant="body" align="center" style={styles.speechText}>
            {!plan
              ? t('onboarding.noPlan')
              : todayPlanDay
              ? `Let's crush today's ${todayPlanDay.name}! 💪`
              : t('home.noWorkoutToday')}
          </Typography>
        </View>
      </View>

      {/* ACTIONS */}
      <View style={styles.actionSection}>
        {!plan ? (
          <Button
            title={t('onboarding.goToPlanner')}
            style={styles.actionBtn}
            onPress={() => router.push('/planner')}
          />
        ) : (
          <Button
            title={activeWorkout ? 'Resume Workout' : t('home.startWorkout')}
            style={styles.actionBtn}
            onPress={handleStartWorkout}
          />
        )}
      </View>

      {/* CALENDAR */}
      <View style={styles.calendarSection}>
        <Calendar plan={plan} history={history} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    flexGrow: 1,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  langBtn: {
    padding: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.secondary,
  },
  userStatsCard: {
    marginBottom: theme.spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  streakBadge: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
  },
  stickmanSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  speechBubble: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    width: '80%',
    position: 'relative',
  },
  speechText: {
    color: theme.colors.text.primary,
  },
  actionSection: {
    marginVertical: theme.spacing.lg,
  },
  actionBtn: {
    width: '100%',
  },
  calendarSection: {
    marginTop: theme.spacing.lg,
  },
});
