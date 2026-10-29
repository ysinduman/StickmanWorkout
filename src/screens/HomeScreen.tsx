import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View, ScrollView, TouchableOpacity, Vibration } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const { level, xp, muscleMass } = useUserStore();
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
    try {
      Vibration.vibrate(25);
    } catch (_) {}
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Bar: Brand Logo & Language Switch */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.colors.accent.primary} />
          <Typography variant="title2" bold color={theme.colors.text.primary} style={styles.logoTitle}>
            STICKMAN
          </Typography>
          <View style={styles.tycoonBadge}>
            <Typography variant="label" bold color={theme.colors.text.inverse} style={{ fontSize: 9 }}>
              TYCOON
            </Typography>
          </View>
        </View>

        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage} activeOpacity={0.8}>
          <MaterialCommunityIcons name="translate" size={14} color={theme.colors.accent.primary} />
          <Typography variant="label" bold color={theme.colors.accent.primary} style={{ marginLeft: 4 }}>
            {language === 'en' ? 'TR' : 'EN'}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Gamification Bar / Tycoon Stats Card */}
      <Card style={styles.userStatsCard}>
        <View style={styles.statRow}>
          <View>
            <Typography variant="title2" bold color={theme.colors.text.primary}>
              {progression
                ? t('auth.totalXp', { xp: progression.total_xp })
                : t('home.level', { level })}
            </Typography>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              {progression
                ? t('auth.dailyXp', { xp: progression.daily_xp, cap: progression.daily_cap })
                : `${xp} / ${nextLevelXp} XP`}
            </Typography>
          </View>

          <View style={styles.streakColumn}>
            <View style={styles.badgesRow}>
              {/* Ember Token Pill */}
              <View style={styles.emberPill}>
                <MaterialCommunityIcons name="fire" size={14} color="#FF9F1C" />
                <Typography variant="label" bold color="#FF9F1C" style={{ marginLeft: 3 }}>
                  {embers}
                </Typography>
              </View>

              {/* Streak Badge */}
              <View style={[styles.streakBadge, highestStamp != null && streak >= 3 && styles.stampBadge]}>
                <MaterialCommunityIcons name="fire" size={14} color={theme.colors.text.inverse} />
                <Typography variant="label" bold color={theme.colors.text.inverse} style={{ marginLeft: 2 }}>
                  {t('home.streakDays', { count: progression?.current_streak ?? streak })}
                </Typography>
              </View>
            </View>

            {progression ? null : (
              <View style={styles.miniStatsRow}>
                <Typography variant="caption" style={styles.keptWeek}>
                  {t('home.keptWeek', { count: keptDays })}
                </Typography>
                <Typography variant="caption" style={styles.keptWeek}>
                  • {t('home.doubleStepsKept', { count: doubleStepsKept })}
                </Typography>
              </View>
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

      {/* Stickman Character Showcase on Podium */}
      <View style={styles.stickmanSection}>
        {pinnedZone && (
          <View style={styles.priorityFloatTag}>
            <MaterialCommunityIcons name="target" size={13} color="#FFF" />
            <Typography variant="label" bold color="#FFF" style={{ fontSize: 11, marginLeft: 4 }}>
              {t(`zones.${pinnedZone}`).toUpperCase()} ODAKLI
            </Typography>
          </View>
        )}

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

        {/* Podium Base */}
        <View style={styles.podiumBase}>
          <View style={styles.podiumRing} />
        </View>
      </View>

      {/* Speech Bubble / Trainer Dialogue */}
      <View style={styles.speechCard}>
        <MaterialCommunityIcons name="comment-text-outline" size={18} color={theme.colors.accent.primary} />
        <Typography variant="caption" color={theme.colors.text.primary} style={styles.speechText}>
          {speech}
        </Typography>
      </View>

      {/* Tycoon Zone Stat Upgrades Card */}
      {progression && username ? (
        <Card style={styles.serverCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Typography variant="title2" bold color={theme.colors.text.primary}>
                KAS GELİŞİMİ
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                @{username} • 4 Temel Bölge Durumu
              </Typography>
            </View>
            <View style={styles.tycoonIconBadge}>
              <MaterialCommunityIcons name="arm-flex" size={20} color={theme.colors.accent.primary} />
            </View>
          </View>
          <LevelBars
            parts={progression.body_parts}
            highlightIds={pinnedZone ? bodyPartsForZone(pinnedZone) : []}
          />
        </Card>
      ) : null}

      {/* Active Priority Mission Card */}
      {pinnedZone && (
        <Card style={styles.priorityCard}>
          <View style={styles.priorityCardHeader}>
            <View style={styles.priorityCardTitleRow}>
              <MaterialCommunityIcons name="target-variant" size={20} color={theme.colors.accent.primary} />
              <Typography variant="body" bold color={theme.colors.text.primary} style={{ marginLeft: 6 }}>
                Aktif Gelişim Hedefi: {t(`zones.${pinnedZone}`)}
              </Typography>
            </View>
            <Typography variant="label" bold color={theme.colors.accent.primary}>
              %{zoneBars[pinnedZone]?.xp ?? 0}
            </Typography>
          </View>

          <View style={styles.zoneBarBg}>
            <View style={[styles.zoneBarFill, { width: `${zoneBars[pinnedZone]?.xp ?? 0}%` }]} />
          </View>

          <View style={styles.priorityMetaRow}>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              {t('home.zoneStep', { level: zoneBars[pinnedZone]?.level ?? 0 })}
            </Typography>
            {lastHotStart?.zone === pinnedZone && (
              <Typography variant="caption" color={theme.colors.status.warning}>
                {t('home.hotStart', { bonus: lastHotStart.bonus })}
              </Typography>
            )}
          </View>
        </Card>
      )}

      {/* Zone Selector Chips */}
      <View style={styles.pinSection}>
        <View style={styles.pinHeaderRow}>
          <Typography variant="label" bold color={theme.colors.text.secondary}>
            {pinnedZone ? t('home.pinnedZone', { zone: t(`zones.${pinnedZone}`) }) : 'Öncelikli Bölge Seç (2X Hız):'}
          </Typography>
          {pinnedZone && (
            <TouchableOpacity onPress={clearPin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Typography variant="label" color={theme.colors.text.tertiary}>
                Temizle
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.pinRow}>
          {MUSCLE_ZONES.map((zone) => {
            const selected = zone === pinnedZone;
            const zoneIcon =
              zone === 'torso'
                ? 'shield-account'
                : zone === 'arms'
                ? 'arm-flex'
                : zone === 'abs'
                ? 'lightning-bolt'
                : 'run-fast';

            return (
              <TouchableOpacity
                key={zone}
                style={[styles.pinChip, selected && styles.pinChipSelected]}
                onPress={() => selectZone(zone)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={zoneIcon}
                  size={14}
                  color={selected ? theme.colors.text.inverse : theme.colors.text.primary}
                />
                <Typography
                  variant="caption"
                  bold={selected}
                  color={selected ? theme.colors.text.inverse : theme.colors.text.primary}
                  style={{ marginLeft: 4 }}
                >
                  {t(`zones.${zone}`)}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* EMBER SHOP / PERK SHELF */}
      <Card style={styles.shelfSection}>
        <View style={styles.shelfHeader}>
          <View>
            <Typography variant="body" bold color={theme.colors.text.primary}>
              🔥 {t('home.emberShelf')}
            </Typography>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              {t('home.emberBalance', { count: embers })}
            </Typography>
          </View>
          <View style={styles.emberBalancePill}>
            <MaterialCommunityIcons name="fire" size={16} color="#FF9F1C" />
            <Typography variant="label" bold color="#FF9F1C" style={{ marginLeft: 4 }}>
              {embers} Kor
            </Typography>
          </View>
        </View>

        <View style={styles.shelfList}>
          {EMBER_SHELF.map((item) => {
            const owned = ownedShelf.includes(item.id);
            const canBuy = !owned && embers >= item.price;
            const itemIcon =
              item.id === 'goldBelt' ? 'shield-star' : item.id === 'headband' ? 'crown' : 'arm-flex';

            return (
              <View key={item.id} style={styles.shelfItemCard}>
                <View style={styles.shelfItemLeft}>
                  <View style={[styles.shelfIconBox, owned && styles.shelfIconBoxOwned]}>
                    <MaterialCommunityIcons
                      name={itemIcon}
                      size={20}
                      color={owned ? theme.colors.status.success : theme.colors.accent.primary}
                    />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Typography variant="body" bold color={theme.colors.text.primary}>
                      {t(`shelf.${item.id}`)}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.text.secondary}>
                      {t('home.emberPrice', { price: item.price })}
                    </Typography>
                  </View>
                </View>

                <TouchableOpacity
                  disabled={owned}
                  accessibilityRole="button"
                  style={[
                    styles.shelfButton,
                    owned && styles.shelfButtonOwned,
                    !owned && !canBuy && styles.shelfButtonDisabled,
                  ]}
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
                    try {
                      Vibration.vibrate([0, 60, 40, 100]);
                    } catch (_) {}
                  }}
                >
                  <Typography
                    variant="caption"
                    bold
                    color={owned ? theme.colors.status.success : theme.colors.text.inverse}
                  >
                    {owned ? '✓ SAHİPSİN' : t('home.emberBuy')}
                  </Typography>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </Card>

      {/* HERO WORKOUT CTA */}
      <View style={styles.actionSection}>
        {!plan ? (
          <Button
            title={t('onboarding.goToPlanner')}
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Planner')}
          />
        ) : (
          <TouchableOpacity
            style={styles.heroStartBtn}
            onPress={handleStartWorkout}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="rocket-launch" size={24} color={theme.colors.text.inverse} />
            <Typography variant="body" bold color={theme.colors.text.inverse} style={styles.heroBtnText}>
              {activeWorkout ? t('home.resumeWorkout') : 'ANTRENMANA BAŞLA (+150 XP)'}
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      {/* AI CALISTHENICS VISION TRACKER */}
      <Card variant="elevated" style={styles.aiVisionCard}>
        <View style={styles.aiVisionContent}>
          <View style={styles.aiVisionIconBox}>
            <MaterialCommunityIcons name="camera-iris" size={28} color={theme.colors.accent.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            <View style={styles.aiBadgeRow}>
              <Typography variant="body" bold color={theme.colors.text.primary}>
                {t('pushUpTracker.homeActionTitle')}
              </Typography>
              <View style={styles.aiPill}>
                <Typography variant="label" bold color="#FFF" style={{ fontSize: 9 }}>
                  AI VISION
                </Typography>
              </View>
            </View>
            <Typography variant="caption" color={theme.colors.text.secondary} style={{ marginTop: 2 }}>
              {t('pushUpTracker.homeActionSubtitle')}
            </Typography>
          </View>
        </View>

        {/* Calisthenics Exercise Selectors */}
        <View style={styles.calisthenicsQuickRow}>
          {[
            { id: 'push_up', name: t('exercises.pushUp'), icon: 'fire' },
            { id: 'squat', name: t('exercises.squat'), icon: 'human-male-height' },
            { id: 'crunches', name: t('exercises.crunches'), icon: 'yoga' },
            { id: 'plank', name: t('exercises.plank'), icon: 'timer-outline' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.calisthenicsQuickChip}
              onPress={() => navigation.navigate('PushUpTracker', { exerciseId: item.id })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={item.icon} size={16} color={theme.colors.accent.primary} />
              <Typography variant="caption" bold color={theme.colors.text.primary} style={styles.chipText}>
                {item.name}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTitle: {
    letterSpacing: 1.5,
    fontSize: 18,
    marginLeft: 2,
  },
  tycoonBadge: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.background.secondary,
  },
  userStatsCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  streakColumn: {
    alignItems: 'flex-end',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
  },
  stampBadge: {
    borderWidth: 1.5,
    borderColor: theme.colors.gradient.flameEnd,
  },
  miniStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  keptWeek: {
    color: theme.colors.text.secondary,
    fontSize: 11,
  },
  flameRiskBanner: {
    backgroundColor: theme.colors.flame.ember,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  unfinishedBar: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.flame.warm,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#1E1E2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
  },
  stickmanSection: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 240,
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  priorityFloatTag: {
    position: 'absolute',
    top: 6,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  homeFlame: {
    position: 'absolute',
    top: 10,
  },
  podiumBase: {
    position: 'absolute',
    bottom: -6,
    width: 170,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRing: {
    width: 160,
    height: 22,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.45)',
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  speechCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  speechText: {
    flex: 1,
  },
  serverCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tycoonIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: '#16131F',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.accent.primary,
    padding: theme.spacing.md,
  },
  priorityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneBarBg: {
    height: 8,
    marginVertical: 10,
    backgroundColor: '#201C2B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  zoneBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
  },
  priorityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinSection: {
    marginBottom: theme.spacing.md,
  },
  pinHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  pinRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  pinChip: {
    flex: 1,
    minWidth: '22%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  pinChipSelected: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  shelfSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  shelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emberBalancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 159, 28, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 28, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  shelfList: {
    gap: 10,
  },
  shelfItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
  },
  shelfItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shelfIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shelfIconBoxOwned: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  shelfButton: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  shelfButtonOwned: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  shelfButtonDisabled: {
    backgroundColor: '#252538',
  },
  actionSection: {
    marginVertical: theme.spacing.md,
  },
  actionBtn: {
    width: '100%',
  },
  heroStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: 16,
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  heroBtnText: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  aiVisionCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  aiVisionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiPill: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  aiVisionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  calisthenicsQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: theme.spacing.md,
  },
  calisthenicsQuickChip: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
  },
  chipText: {
    marginLeft: 6,
  },
  calendarSection: {
    marginTop: theme.spacing.sm,
  },
});
