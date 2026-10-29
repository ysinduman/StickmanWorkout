import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from './ui';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import theme from '../constants/theme';
import type { BodyPartProgress } from '../stores/useSessionStore';

export interface UnifiedZoneBar {
  id: 'torso' | 'arms' | 'abs' | 'legs';
  nameKey: string;
  level: number;
  xp_into_level: number;
  xp_for_next: number;
  matchIds: string[];
}

export function aggregateToCoreZones(parts: BodyPartProgress[]): UnifiedZoneBar[] {
  const groups: Record<'torso' | 'arms' | 'abs' | 'legs', BodyPartProgress[]> = {
    torso: [],
    arms: [],
    abs: [],
    legs: [],
  };

  for (const part of parts) {
    const id = (part.body_part_id || '').toLowerCase();
    if (['torso', 'chest', 'back', 'shoulders'].includes(id)) {
      groups.torso.push(part);
    } else if (['arms', 'biceps', 'triceps', 'forearms', 'leftarm', 'rightarm'].includes(id)) {
      groups.arms.push(part);
    } else if (['abs', 'core'].includes(id)) {
      groups.abs.push(part);
    } else if (['legs', 'quadriceps', 'hamstrings', 'calves', 'glutes'].includes(id)) {
      groups.legs.push(part);
    }
  }

  const base: UnifiedZoneBar[] = [
    {
      id: 'torso',
      nameKey: 'body.torso',
      level: 1,
      xp_into_level: 0,
      xp_for_next: 100,
      matchIds: ['torso', 'chest', 'back', 'shoulders'],
    },
    {
      id: 'arms',
      nameKey: 'body.arms',
      level: 1,
      xp_into_level: 0,
      xp_for_next: 100,
      matchIds: ['arms', 'biceps', 'triceps', 'forearms', 'leftArm', 'rightArm'],
    },
    {
      id: 'abs',
      nameKey: 'body.abs',
      level: 1,
      xp_into_level: 0,
      xp_for_next: 100,
      matchIds: ['abs', 'core'],
    },
    {
      id: 'legs',
      nameKey: 'body.legs',
      level: 1,
      xp_into_level: 0,
      xp_for_next: 100,
      matchIds: ['legs', 'quadriceps', 'hamstrings', 'calves', 'glutes'],
    },
  ];

  for (const item of base) {
    const list = groups[item.id];
    if (list && list.length > 0) {
      item.level = Math.max(...list.map(p => p.level || 1));
      const totalInto = list.reduce((sum, p) => sum + (p.xp_into_level || 0), 0);
      const totalNext = list.reduce((sum, p) => sum + (p.xp_for_next || 100), 0);
      item.xp_into_level = Math.round(totalInto / list.length);
      item.xp_for_next = Math.round(totalNext / list.length);
    }
  }

  return base;
}

const ZONE_METADATA: Record<'torso' | 'arms' | 'abs' | 'legs', { icon: string; color: string; badge: string }> = {
  torso: { icon: 'shield-account', color: '#60A5FA', badge: 'Gövde Gücü' },
  arms: { icon: 'arm-flex', color: '#FF6B35', badge: 'Kol Kuvveti' },
  abs: { icon: 'lightning-bolt', color: '#FBBF24', badge: 'Karın Çekirdeği' },
  legs: { icon: 'run-fast', color: '#4ADE80', badge: 'Bacak Hızı' },
};

function getTierBadge(level: number): { label: string; color: string } {
  if (level >= 10) return { label: 'EFSANE', color: '#FF007F' };
  if (level >= 7) return { label: 'TİTAN', color: '#00E5FF' };
  if (level >= 5) return { label: 'ALTIN', color: '#FFD700' };
  if (level >= 3) return { label: 'GÜMÜŞ', color: '#C0C0C0' };
  return { label: 'BRONZ', color: '#CD7F32' };
}

export function LevelBars({
  parts,
  highlightIds = [],
}: {
  parts: BodyPartProgress[];
  highlightIds?: string[];
}) {
  const { t } = useTranslation();
  const unifiedBars = aggregateToCoreZones(parts || []);

  return (
    <View style={styles.list}>
      {unifiedBars.map(item => {
        const ratio = item.xp_for_next > 0 ? item.xp_into_level / item.xp_for_next : 0;
        const clampedPercent = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
        const width = `${clampedPercent}%`;
        const priority = highlightIds.some(h =>
          item.matchIds.some(m => m.toLowerCase() === h.toLowerCase()) ||
          h.toLowerCase() === item.id
        );
        const meta = ZONE_METADATA[item.id];
        const tier = getTierBadge(item.level);

        return (
          <View
            key={item.id}
            style={[
              styles.box,
              priority && styles.priorityBox,
            ]}
          >
            {/* Top row: Icon + Name + Priority/Tier Badges */}
            <View style={styles.labelRow}>
              <View style={styles.nameContainer}>
                <View style={[styles.iconPill, { backgroundColor: `${meta.color}20` }]}>
                  <MaterialCommunityIcons name={meta.icon} size={18} color={meta.color} />
                </View>
                <View>
                  <View style={styles.titleWithBadge}>
                    <Typography variant="body" bold color={theme.colors.text.primary}>
                      {t(item.nameKey)}
                    </Typography>
                    <View style={[styles.tierTag, { borderColor: tier.color }]}>
                      <Typography variant="label" bold color={tier.color} style={{ fontSize: 9 }}>
                        {tier.label}
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="label" color={theme.colors.text.secondary} style={{ fontSize: 11 }}>
                    {meta.badge}
                  </Typography>
                </View>
              </View>

              <View style={styles.levelBadgeContainer}>
                {priority && (
                  <View style={styles.focusPill}>
                    <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFF" />
                    <Typography variant="label" bold color="#FFF" style={{ fontSize: 10 }}>
                      2X ODAK
                    </Typography>
                  </View>
                )}
                <View style={styles.levelTag}>
                  <Typography variant="label" bold color={theme.colors.accent.primary} style={{ fontSize: 13 }}>
                    {t('profile.levelShort', { level: item.level })}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Progress track with animated neon fill */}
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width,
                    backgroundColor: priority ? theme.colors.accent.primary : meta.color,
                  },
                ]}
              />
            </View>

            {/* Bottom Row: XP values and percentage */}
            <View style={styles.xpRow}>
              <Typography variant="label" color={theme.colors.text.secondary} style={{ fontSize: 12 }}>
                {item.xp_into_level} / {item.xp_for_next} XP
              </Typography>
              <Typography
                variant="label"
                bold
                color={priority ? theme.colors.accent.primary : meta.color}
                style={{ fontSize: 12 }}
              >
                %{clampedPercent}
              </Typography>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.sm,
  },
  box: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 8,
  },
  priorityBox: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 1.5,
    backgroundColor: '#16131F',
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierTag: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  levelBadgeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  focusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  levelTag: {
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  track: {
    height: 10,
    borderRadius: theme.borderRadius.round,
    backgroundColor: '#1A1A28',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.borderRadius.round,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
