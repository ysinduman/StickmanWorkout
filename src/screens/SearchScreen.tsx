import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Card } from '../components/ui';
import { LevelBars } from '../components/LevelBars';
import { Stickman } from '../components/Stickman/Stickman';
import theme from '../constants/theme';
import { supabase } from '../lib/supabase';
import type { BodyPartProgress } from '../stores/useSessionStore';

interface SearchHit {
  username: string;
  bio: string;
}

interface PublicProfile {
  found: boolean;
  username?: string;
  bio?: string;
  progression?: {
    current_streak: number;
    longest_streak: number;
    total_xp: number;
    body_parts: BodyPartProgress[];
  };
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    setBusy(true);
    setMessage(null);
    setProfile(null);
    const { data, error } = await supabase.rpc('search_usernames', { prefix: query.trim() });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    const rows = (data ?? []) as SearchHit[];
    setResults(rows);
    if (rows.length === 0) {
      setMessage(t('search.empty'));
    }
  };

  const openProfile = async (username: string) => {
    setBusy(true);
    setMessage(null);
    const { data, error } = await supabase.rpc('get_public_profile', { lookup: username });
    setBusy(false);
    if (error || !data?.found) {
      setMessage(t('search.notFound'));
      setProfile(null);
      return;
    }
    setProfile(data as PublicProfile);
  };

  if (profile?.found && profile.progression) {
    const partLevels = Object.fromEntries(
      profile.progression.body_parts.map(part => [part.body_part_id, part.level]),
    );
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Button title={t('common.back')} variant="outline" onPress={() => setProfile(null)} />
        <View style={styles.hero}>
          <Stickman muscleMass={8} partLevels={partLevels} width={150} height={180} />
        </View>
        <Typography variant="title1" align="center">@{profile.username}</Typography>
        {profile.bio ? <Typography variant="bodyMuted" align="center">{profile.bio}</Typography> : null}
        <Card style={styles.stats}>
          <View style={styles.stat}>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {profile.progression.current_streak}
            </Typography>
            <Typography variant="caption">{t('history.currentStreak')}</Typography>
          </View>
          <View style={styles.stat}>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {profile.progression.total_xp}
            </Typography>
            <Typography variant="caption">XP</Typography>
          </View>
        </Card>
        <LevelBars parts={profile.progression.body_parts} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Typography variant="title1">{t('search.title')}</Typography>
      <Typography variant="bodyMuted">{t('search.hint')}</Typography>
      <TextInput
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={t('auth.search')}
        placeholderTextColor={theme.colors.text.tertiary}
        style={styles.input}
      />
      <Button title={t('auth.search')} loading={busy} onPress={search} />
      {message ? <Typography variant="caption">{message}</Typography> : null}
      {results.map(person => (
        <TouchableOpacity key={person.username} onPress={() => openProfile(person.username)}>
          <Card style={styles.result}>
            <Typography variant="body" bold>@{person.username}</Typography>
            {person.bio ? (
              <Typography variant="caption" color={theme.colors.text.secondary}>{person.bio}</Typography>
            ) : null}
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
    backgroundColor: theme.colors.background.primary,
    flexGrow: 1,
    gap: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background.input,
    color: theme.colors.text.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  result: {
    gap: 4,
  },
  hero: {
    alignItems: 'center',
    height: 190,
    justifyContent: 'flex-end',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
});
