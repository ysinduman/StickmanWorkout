import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Card } from '../components/ui';
import { LevelBars } from '../components/LevelBars';
import { Stickman } from '../components/Stickman/Stickman';
import theme from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useSessionStore, type BodyPartProgress } from '../stores/useSessionStore';

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

interface LeaderRow {
  rank: number;
  username: string;
  total_xp: number;
  current_streak: number;
}

type BoardStatus = 'loading' | 'ready' | 'empty' | 'missing' | 'error';

function formatXp(value: number, language: string): string {
  const safe = Math.max(0, Math.trunc(value));
  const separator = language.toLowerCase().startsWith('tr') ? '.' : ',';
  return String(safe).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function isMissingTop100(error: { code?: string; message?: string; details?: string; hint?: string }): boolean {
  if (error.code === 'PGRST202' || error.code === '42883') return true;
  const message = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
  if (!message.includes('get_top_100')) return false;
  return (
    message.includes('does not exist') ||
    message.includes('could not find') ||
    message.includes('schema cache') ||
    message.includes('not found')
  );
}

function parseLeaderboard(data: unknown): LeaderRow[] {
  if (!Array.isArray(data)) return [];
  const rows: LeaderRow[] = [];
  for (const item of data) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const username = typeof row.username === 'string' ? row.username : '';
    const rank = Number(row.rank);
    const totalXp = Number(row.total_xp);
    const streak = Number(row.current_streak);
    if (!username || !Number.isFinite(rank) || !Number.isFinite(totalXp)) continue;
    rows.push({
      rank,
      username,
      total_xp: totalXp,
      current_streak: Number.isFinite(streak) ? streak : 0,
    });
  }
  return rows;
}

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const myName = useSessionStore(state => state.username);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [opening, setOpening] = useState(false);
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [boardStatus, setBoardStatus] = useState<BoardStatus>('loading');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setBoardStatus(current => (current === 'ready' || current === 'empty' ? current : 'loading'));
      const load = async () => {
        try {
          const { data, error } = await supabase.rpc('get_top_100', { p_limit: 100 });
          if (!active) return;
          if (error) {
            setRows([]);
            setBoardStatus(isMissingTop100(error) ? 'missing' : 'error');
            return;
          }
          const next = parseLeaderboard(data);
          setRows(next);
          setBoardStatus(next.length === 0 ? 'empty' : 'ready');
        } catch {
          if (!active) return;
          setRows([]);
          setBoardStatus('error');
        }
      };
      load();
      return () => {
        active = false;
      };
    }, []),
  );

  const search = async () => {
    setSearching(true);
    setMessage(null);
    setProfile(null);
    const { data, error } = await supabase.rpc('search_usernames', { prefix: query.trim() });
    setSearching(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    const hits = (data ?? []) as SearchHit[];
    setResults(hits);
    if (hits.length === 0) {
      setMessage(t('search.empty'));
    }
  };

  const openProfile = async (username: string) => {
    setOpening(true);
    setMessage(null);
    const { data, error } = await supabase.rpc('get_public_profile', { lookup: username });
    setOpening(false);
    if (error || !data?.found || !data?.progression?.body_parts) {
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
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        <Button
          title={t('common.back')}
          variant="outline"
          onPress={() => {
            setProfile(null);
            setMessage(null);
          }}
        />
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

  const boardCopy = boardStatus === 'missing'
    ? t('search.top100Missing')
    : boardStatus === 'error'
      ? t('search.top100Error')
      : t('search.top100Empty');

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Typography variant="title1">{t('search.top100')}</Typography>
        <Typography variant="bodyMuted">{t('search.top100Hint')}</Typography>
      </View>
      <FlatList
        data={rows}
        keyExtractor={item => item.username}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        extraData={`${myName ?? ''}:${i18n.language}:${opening}`}
        ListEmptyComponent={
          <View style={styles.empty}>
            {boardStatus === 'loading' ? (
              <ActivityIndicator color={theme.colors.accent.primary} />
            ) : (
              <Typography variant="bodyMuted" align="center">{boardCopy}</Typography>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const mine = myName != null && item.username === myName;
          const top = item.rank <= 3;
          return (
            <TouchableOpacity
              onPress={() => openProfile(item.username)}
              disabled={opening || searching}
              accessibilityRole="button"
            >
              <Card style={[styles.row, mine && styles.rowMine]}>
                <View style={[styles.rank, top && styles.rankTop]}>
                  <Typography
                    variant="body"
                    bold
                    color={top ? theme.colors.text.inverse : theme.colors.accent.primary}
                  >
                    {item.rank}
                  </Typography>
                </View>
                <View style={styles.who}>
                  <Typography variant="body" bold numberOfLines={1}>@{item.username}</Typography>
                  {mine || item.current_streak > 0 ? (
                    <View style={styles.meta}>
                      {mine ? (
                        <Typography variant="caption" color={theme.colors.accent.primary}>
                          {t('search.you')}
                        </Typography>
                      ) : null}
                      {item.current_streak > 0 ? (
                        <Typography variant="caption">
                          {t('home.streakDays', { count: item.current_streak })}
                        </Typography>
                      ) : null}
                    </View>
                  ) : null}
                </View>
                <Typography variant="body" bold color={theme.colors.accent.primary}>
                  {t('search.xpValue', { xp: formatXp(item.total_xp, i18n.language) })}
                </Typography>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
      <View style={styles.searchDock}>
        <Typography variant="title2">{t('search.title')}</Typography>
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t('auth.search')}
          placeholderTextColor={theme.colors.text.tertiary}
          style={styles.input}
        />
        <Button title={t('auth.search')} loading={searching} onPress={search} />
        {message ? <Typography variant="caption">{message}</Typography> : null}
        {results.length > 0 ? (
          <ScrollView style={styles.results} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {results.map(person => (
              <TouchableOpacity
                key={person.username}
                onPress={() => openProfile(person.username)}
                disabled={opening || searching}
              >
                <Card style={styles.result}>
                  <Typography variant="body" bold>@{person.username}</Typography>
                  {person.bio ? (
                    <Typography variant="caption" color={theme.colors.text.secondary}>{person.bio}</Typography>
                  ) : null}
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  container: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
    backgroundColor: theme.colors.background.primary,
    flexGrow: 1,
    gap: theme.spacing.md,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },
  empty: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  rowMine: {
    borderColor: theme.colors.accent.primary,
  },
  rank: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rankTop: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  who: {
    flex: 1,
    gap: 2,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  searchDock: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
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
  results: {
    maxHeight: 168,
  },
  result: {
    gap: 4,
    marginBottom: theme.spacing.sm,
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
