import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { usePlanStore } from '../stores/usePlanStore';
import { useWorkoutStore } from '../stores/useWorkoutStore';
import { useUserStore } from '../stores/useUserStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { usePriorityStore } from '../stores/usePriorityStore';
import { useEmberStore } from '../stores/useEmberStore';
import { useStampStore } from '../stores/useStampStore';
import { useZoneStore } from '../stores/useZoneStore';
import { Typography, Card, Button } from '../components/ui';
import { Stickman } from '../components/Stickman/Stickman';
import { Calendar } from '../components/Calendar/Calendar';
import theme from '../constants/theme';
import { calculateCalendarDays, calculateCurrentStreak } from '../utils/streakCalculator';
import { bodyPartsForZone, MUSCLE_ZONES, MuscleZone } from '../constants/zones';
import { EMBER_SHELF } from '../constants/emberShelf';
import { xpForLevel } from '../constants/gamification';
import { countDatesWithinLastDays, formatCountdown, formatDateString, getTodayDateString, msUntilLocalMidnight } from '../utils/dateUtils';
import { planDayForZone, trainedOn } from '../utils/todayPlan';
import type { HomeNavigationProp } from '../navigation/types';
import { useSessionStore } from '../stores/useSessionStore';
import { FlameEffect } from '../components/Calendar/FlameEffect';
import { LevelBars } from '../components/LevelBars';

export default function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeNavigationProp>();
  const { storedPlan, getTodayPlanDay } = usePlanStore();
  const { history, startWorkout, activeWorkout } = useWorkoutStore();
  const { level, xp, muscleMass, totalWorkouts } = useUserStore();
  const { language, setLanguage } = useSettingsStore();
  const [now, setNow] = useState(() => new Date());
  const pinnedZone = usePriorityStore((state) => state.pinnedZone);
  const pinZone = usePriorityStore((state) => state.pinZone);
  const clearPin = usePriorityStore((state) => state.clearPin);
  const embers = useEmberStore((state) => state.embers);
  const ownedShelf = useEmberStore((state) => state.owned);
  const buyShelfItem = useEmberStore((state) => state.buy);
  const highestStamp = useStampStore((state) => state.highestStamp);
  const recordStamp = useStampStore((state) => state.recordStamp);
  const clearStamp = useStampStore((state) => state.clearStamp);
  const zoneBars = useZoneStore((state) => state.bars);
  const progression = useSessionStore(state => state.progression);
  const username = useSessionStore(state => state.username);
  const partLevels = progression
    ? Object.fromEntries(progression.body_parts.map(part => [part.body_part_id, part.level]))
    : undefined;
  const doubleStepsKept = useZoneStore((state) => state.doubleStepsKept);
  const lastHotStart = useZoneStore((state) => state.lastHotStart);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const plan = storedPlan?.plan ?? null;
  const todayPlanDay = plan ? getTodayPlanDay(history.map((workout) => workout.date), now) : null;
  const trainedToday = trainedOn(
    history.map((workout) => workout.date),
    progression?.last_completed_on,
    now,
  );
  const streak = calculateCurrentStreak(plan, history);

  const nextLevelXp = xpForLevel(level + 1);
  const currentLevelXp = xpForLevel(level);
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progress = Math.max(0, Math.min(1, xpInCurrentLevel / xpNeededForNext));
  const todayKeys = new Set([formatDateString(now), getTodayDateString()]);
  const workoutSavedToday = history.some((workout) => todayKeys.has(workout.date));
  const showFlameRisk = now.getHours() >= 21 && todayPlanDay != null && !workoutSavedToday;
  const keptDays = countDatesWithinLastDays(
    history.map((workout) => workout.date),
    7,
    now,
  );
  const pinnedPercent = pinnedZone ? (zoneBars[pinnedZone]?.xp ?? 0) : 0;
  const showUnfinishedBar =
    now.getHours() >= 18 &&
    pinnedZone != null &&
    pinnedPercent > 12 &&
    todayPlanDay != null &&
    !workoutSavedToday;
  const pinnedStep = pinnedZone ? (zoneBars[pinnedZone]?.level ?? 0) : 0;
  const showStepOnTheLine =
    now.getHours() >= 20 &&
    pinnedZone != null &&
    pinnedStep >= 1 &&
    todayPlanDay != null &&
    !workoutSavedToday;

  useEffect(() => {
    if (!plan) return;
    const pastDays = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (index + 1));
      return date;
    });
    const missed = calculateCalendarDays(pastDays, plan, history).some(
      (day) => day.status === 'missed',
    );
    if (missed && streak < 3) clearStamp();
  }, [plan, history, streak, clearStamp]);

  useEffect(() => {
    if (streak >= 3) recordStamp(streak);
  }, [streak, recordStamp]);

  // Language switch helper
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'tr' : 'en');
  };

  // Workout Action
  const handleStartWorkout = () => {
    if (activeWorkout) {
      navigation.navigate('ActiveWorkout');
      return;
    }

    if (todayPlanDay) {
      startWorkout(todayPlanDay);
      navigation.navigate('ActiveWorkout');
    } else if (plan) {
      const preferred = pinnedZone ? planDayForZone(plan, pinnedZone) : null;
      const fallbackDay = plan.type === 'split' ? plan.workoutDays[0] : plan.workoutDay;
      startWorkout(preferred ?? fallbackDay);
      navigation.navigate('ActiveWorkout');
    }
  };

  const cyclePin = () => {
    const index = pinnedZone ? MUSCLE_ZONES.indexOf(pinnedZone) : -1;
    pinZone(MUSCLE_ZONES[(index + 1) % MUSCLE_ZONES.length]);
  };

  const selectZone = (zone: MuscleZone) => {
    if (zone === pinnedZone) {
      clearPin();
      return;
    }
    pinZone(zone);
  };

  const speech = !plan
    ? t('onboarding.noPlan')
    : activeWorkout
      ? t('home.workoutInProgress')
      : trainedToday
        ? t('home.workoutDoneToday')
        : todayPlanDay
          ? t('home.workoutToday')
          : t('home.noWorkoutToday');

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
              {progression
                ? t('auth.totalXp', { xp: progression.total_xp })
                : t('home.level', { level })}
            </Typography>
            <Typography variant="caption">
              {progression
                ? t('auth.dailyXp', { xp: progression.daily_xp, cap: progression.daily_cap })
                : `${xp} / ${nextLevelXp} XP`}
            </Typography>
          </View>
          <View style={styles.streakColumn}>
            <View style={[styles.streakBadge, highestStamp != null && streak >= 3 && styles.stampBadge]}>
              <Typography variant="body" bold color={theme.colors.text.inverse}>
                {t('home.streakDays', { count: progression?.current_streak ?? streak })}
              </Typography>
            </View>
            {progression ? null : (
              <>
                <Typography variant="caption" align="center" style={styles.keptWeek}>
                  {t('home.keptWeek', { count: keptDays })}
                </Typography>
                <Typography variant="caption" align="center" style={styles.keptWeek}>
                  {t('home.doubleStepsKept', { count: doubleStepsKept })}
                </Typography>
              </>
            )}
          </View>
        </View>
        {showUnfinishedBar && pinnedZone ? (
          <Typography variant="caption" align="center" style={styles.unfinishedBar}>
            {t('home.unfinishedBar', { zone: t(`zones.${pinnedZone}`), percent: pinnedPercent })}
          </Typography>
        ) : null}
        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
          style={[
            styles.progressBarFill,
            {
              width: `${
                (progression
                  ? Math.min(1, progression.daily_xp / Math.max(1, progression.daily_cap))
                  : progress) * 100
              }%`,
            },
          ]}
        />
        </View>
      </Card>

      {showFlameRisk && (
        <View style={styles.flameRiskBanner}>
          <Typography variant="body" bold align="center" color={theme.colors.text.inverse}>
            {t('home.flameRisk', {
              count: streak,
              time: formatCountdown(msUntilLocalMidnight(now)),
            })}
          </Typography>
        </View>
      )}

      <View style={styles.stickmanSection}>
        {progression && progression.current_streak > 0 ? (
          <View style={styles.homeFlame}>
            <FlameEffect intensity={Math.min(1, 0.45 + (progression.current_streak % 100) / 140)} size={150} />
          </View>
        ) : null}
        <Stickman
          muscleMass={partLevels ? 8 : muscleMass}
          partLevels={partLevels}
          priorityZone={pinnedZone}
        />
      </View>

      {progression && username ? (
        <Card style={styles.serverCard}>
          <Typography variant="title2">@{username}</Typography>
          <LevelBars
            parts={progression.body_parts}
            highlightIds={pinnedZone ? bodyPartsForZone(pinnedZone) : []}
          />
        </Card>
      ) : null}

      <View>
        {pinnedZone ? (
          <>
            <Typography variant="body" bold align="center" style={styles.pinnedLabel}>
              {t('home.zoneBar', {
                zone: t(`zones.${pinnedZone}`),
                percent: zoneBars[pinnedZone]?.xp ?? 0,
              })}
            </Typography>
            <View style={styles.zoneBarBg}>
              <View
                style={[styles.zoneBarFill, { width: `${zoneBars[pinnedZone]?.xp ?? 0}%` }]}
              />
            </View>
            <Typography variant="caption" align="center" style={styles.pinnedLabel}>
              {t('home.zoneStep', { level: zoneBars[pinnedZone]?.level ?? 0 })}
            </Typography>
            {showStepOnTheLine ? (
              <Typography variant="caption" align="center" style={styles.pinnedLabel}>
                {t('home.stepOnTheLine', { level: pinnedStep })}
              </Typography>
            ) : null}
            {lastHotStart?.zone === pinnedZone ? (
              <Typography variant="caption" align="center" style={styles.pinnedLabel}>
                {t('home.hotStart', { bonus: lastHotStart.bonus })}
              </Typography>
            ) : null}
          </>
        ) : (
          MUSCLE_ZONES.filter((zone) => (zoneBars[zone]?.level ?? 0) > 0).map((zone) => (
            <Typography key={zone} variant="caption" align="center" style={styles.pinnedLabel}>
              {t(`zones.${zone}`)} · {t('home.zoneStep', { level: zoneBars[zone]?.level ?? 0 })}
            </Typography>
          ))
        )}
        {/* Speech Bubble */}
        <View style={styles.speechBubble}>
          <Typography variant="body" align="center" style={styles.speechText}>
            {speech}
          </Typography>
        </View>
      </View>

      <View style={styles.pinSection}>
        <TouchableOpacity
          onPress={cyclePin}
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
        >
          <Typography
            variant="caption"
            align="center"
            bold={pinnedZone != null}
            color={pinnedZone ? theme.colors.accent.primary : theme.colors.text.secondary}
          >
            {pinnedZone
              ? t('home.pinnedZone', { zone: t(`zones.${pinnedZone}`) })
              : t('home.pinPrompt')}
          </Typography>
        </TouchableOpacity>
        <View style={styles.pinRow}>
          {MUSCLE_ZONES.map((zone) => {
            const selected = zone === pinnedZone;
            return (
              <TouchableOpacity
                key={zone}
                style={[styles.pinChip, selected && styles.pinChipSelected]}
                onPress={() => selectZone(zone)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Typography
                  variant="caption"
                  bold={selected}
                  color={selected ? theme.colors.text.inverse : theme.colors.text.primary}
                >
                  {t(`zones.${zone}`)}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.shelfSection}>
        <Typography variant="body" bold align="center">
          {t('home.emberShelf')}
        </Typography>
        <Typography variant="caption" align="center">
          {t('home.emberBalance', { count: embers })}
        </Typography>
        {EMBER_SHELF.map((item) => {
          const owned = ownedShelf.includes(item.id);
          const canBuy = !owned && embers >= item.price;
          const cheapestUnsold = EMBER_SHELF.find((entry) => !ownedShelf.includes(entry.id));
          const shortfall = cheapestUnsold ? cheapestUnsold.price - embers : 0;
          const showClosest =
            cheapestUnsold?.id === item.id && shortfall > 0 && shortfall <= 5;
          return (
            <View key={item.id} style={styles.shelfRow}>
              <Typography variant="caption">
                {t(`shelf.${item.id}`)} · {t('home.emberPrice', { price: item.price })}
                {showClosest ? ` · ${t('home.emberClosest')}` : ''}
                {item.id === 'goldBelt' && doubleStepsKept < 3 ? ` · ${t('home.beltTally')}` : ''}
              </Typography>
              <TouchableOpacity
                disabled={owned}
                accessibilityRole="button"
                style={[styles.shelfButton, !canBuy && styles.shelfButtonDisabled]}
                onPress={() => {
                  if (embers < item.price) {
                    Alert.alert(
                      t('home.emberShortTitle'),
                      t('home.emberShortBody', {
                        name: t(`shelf.${item.id}`),
                        price: item.price,
                        count: embers,
                      }),
                      [{ text: t('common.ok') }],
                    );
                    return;
                  }
                  buyShelfItem(item.id);
                }}
              >
                <Typography variant="caption" bold color={theme.colors.text.inverse}>
                  {owned ? t('home.emberOwned') : t('home.emberBuy')}
                </Typography>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* ACTIONS */}
      <View style={styles.actionSection}>
        {!plan ? (
          <Button
            title={t('onboarding.goToPlanner')}
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Planner')}
          />
        ) : (
          <Button
            title={activeWorkout ? t('home.resumeWorkout') : t('home.startWorkout')}
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
    paddingBottom: 140,
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
  flameRiskBanner: {
    backgroundColor: theme.colors.flame.ember,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  unfinishedBar: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.flame.warm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  streakColumn: {
    alignItems: 'flex-end',
    maxWidth: '55%',
  },
  keptWeek: {
    marginTop: theme.spacing.xs,
    color: theme.colors.text.secondary,
  },
  streakBadge: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
  },
  stampBadge: {
    borderWidth: 2,
    borderColor: theme.colors.gradient.flameEnd,
    borderStyle: 'dashed',
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
  serverCard: {
    marginBottom: theme.spacing.md,
    gap: 4,
  },
  searchInput: {
    backgroundColor: theme.colors.background.input,
    color: theme.colors.text.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: theme.spacing.sm,
  },
  stickmanSection: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 230,
    marginBottom: theme.spacing.md,
  },
  homeFlame: {
    position: 'absolute',
    top: 0,
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
  pinnedLabel: {
    marginTop: theme.spacing.sm,
    color: theme.colors.accent.primary,
  },
  zoneBarBg: {
    width: '70%',
    height: 8,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  zoneBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.secondary,
  },
  pinSection: {
    marginBottom: theme.spacing.md,
  },
  pinRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  pinChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    margin: theme.spacing.xs,
  },
  pinChipSelected: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  shelfSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  shelfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  shelfButton: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  shelfButtonDisabled: {
    backgroundColor: theme.colors.background.tertiary,
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
