import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Card } from '../components/ui';
import { Stickman } from '../components/Stickman/Stickman';
import { FlameEffect } from '../components/Calendar/FlameEffect';
import { LevelBars } from '../components/LevelBars';
import theme from '../constants/theme';
import { useSessionStore } from '../stores/useSessionStore';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const username = useSessionStore(state => state.username);
  const bio = useSessionStore(state => state.bio);
  const progression = useSessionStore(state => state.progression);
  const signOut = useSessionStore(state => state.signOut);
  const partLevels = progression
    ? Object.fromEntries(progression.body_parts.map(part => [part.body_part_id, part.level]))
    : undefined;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        {progression && progression.current_streak > 0 ? (
          <View style={styles.flame}>
            <FlameEffect intensity={1} size={160} />
          </View>
        ) : null}
        <Stickman muscleMass={8} partLevels={partLevels} width={170} height={200} />
      </View>
      <Typography variant="title1" align="center">@{username}</Typography>
      {bio ? (
        <Typography variant="bodyMuted" align="center">{bio}</Typography>
      ) : null}
      {progression ? (
        <Card style={styles.stats}>
          <View style={styles.stat}>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {progression.current_streak}
            </Typography>
            <Typography variant="caption">{t('history.currentStreak')}</Typography>
          </View>
          <View style={styles.stat}>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {progression.longest_streak}
            </Typography>
            <Typography variant="caption">{t('history.longestStreak')}</Typography>
          </View>
          <View style={styles.stat}>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {progression.total_xp}
            </Typography>
            <Typography variant="caption">XP</Typography>
          </View>
        </Card>
      ) : null}
      <Typography variant="title2" style={styles.section}>
        {t('profile.levels')}
      </Typography>
      {progression ? <LevelBars parts={progression.body_parts} /> : (
        <Typography variant="bodyMuted">{t('profile.empty')}</Typography>
      )}
      <Button title={t('auth.signOut')} variant="outline" onPress={signOut} style={styles.signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
    backgroundColor: theme.colors.background.primary,
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 220,
  },
  flame: {
    position: 'absolute',
    top: 0,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  section: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  signOut: {
    marginTop: theme.spacing.xl,
  },
});
