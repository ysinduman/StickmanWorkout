import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from './ui';
import theme from '../constants/theme';
import type { BodyPartProgress } from '../stores/useSessionStore';

export function LevelBars({ parts }: { parts: BodyPartProgress[] }) {
  const { t } = useTranslation();

  return (
    <View style={styles.list}>
      {parts.map(part => {
        const ratio = part.xp_for_next > 0 ? part.xp_into_level / part.xp_for_next : 0;
        const width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
        return (
          <View key={part.body_part_id} style={styles.box}>
            <View style={styles.labelRow}>
              <Typography variant="body" bold>
                {t(`body.${part.body_part_id}`)}
              </Typography>
              <Typography variant="caption" color={theme.colors.accent.primary}>
                {t('profile.levelShort', { level: part.level })}
              </Typography>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width }]} />
            </View>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              {part.xp_into_level} / {part.xp_for_next} XP
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
