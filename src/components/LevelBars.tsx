import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from './ui';
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
        const width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
        const priority = highlightIds.some(h =>
          item.matchIds.some(m => m.toLowerCase() === h.toLowerCase()) ||
          h.toLowerCase() === item.id
        );

        return (
          <View key={item.id} style={[styles.box, priority && styles.priorityBox]}>
            <View style={styles.labelRow}>
              <Typography variant="body" bold>
                {t(item.nameKey)}
              </Typography>
              <Typography variant="caption" color={theme.colors.accent.primary}>
                {t('profile.levelShort', { level: item.level })}
              </Typography>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width }]} />
            </View>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              {item.xp_into_level} / {item.xp_for_next} XP
            </Typography>
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
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 6,
  },
  priorityBox: {
    borderColor: theme.colors.accent.primary,
    borderWidth: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 14,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.background.input,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.accent.primary,
  },
});
