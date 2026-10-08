import { Linking } from 'react-native';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const AUTH_REDIRECT = 'stickmanworkout://auth/callback';

export interface BodyPartProgress {
  body_part_id: string;
  total_xp: number;
  level: number;
  xp_into_level: number;
  xp_for_next: number;
}

export interface Progression {
  current_streak: number;
  longest_streak: number;
  last_completed_on: string | null;
  daily_xp: number;
  daily_cap: number;
  total_xp: number;
  body_parts: BodyPartProgress[];
}

export interface WorkoutAward {
  body_part_id: string;
  xp: number;
}

export interface WorkoutResult {
  duplicate: boolean;
  awarded: WorkoutAward[];
  streak_incremented: boolean;
  progression: Progression;
}

type Status = 'loading' | 'signedOut' | 'needsUsername' | 'ready';

interface SessionState {
  status: Status;
  email: string | null;
  userId: string | null;
  username: string | null;
  bio: string | null;
  progression: Progression | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  saveProfile: (username: string, bio: string) => Promise<string | null>;
  completeWorkout: (
    idempotencyKey: string,
    startedAt: string,
    exercises: Array<{ exercise_id: string; reps?: number; duration_seconds?: number }>,
  ) => Promise<{ result: WorkoutResult | null; error: string | null }>;
}

let started = false;

function errorText(error: { message?: string } | null): string {
  return error?.message ?? 'request_failed';
}

async function loadAccount(set: (partial: Partial<SessionState>) => void) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user ?? null;
  if (!user) {
    set({
      status: 'signedOut',
      email: null,
      userId: null,
      username: null,
      bio: null,
      progression: null,
    });
    return;
  }

  const { data: progression, error } = await supabase.rpc('get_my_progression');
  if (error) {
    if (error.message.includes('profile_missing')) {
      set({
        status: 'needsUsername',
        email: user.email ?? null,
        userId: user.id,
        username: null,
        bio: null,
        progression: null,
      });
      return;
    }
    set({
      status: 'signedOut',
      email: null,
      userId: null,
      username: null,
      bio: null,
      progression: null,
    });
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio')
    .eq('id', user.id)
    .single();

  set({
    status: 'ready',
    email: user.email ?? null,
    userId: user.id,
    username: profile?.username ?? null,
    bio: profile?.bio ?? '',
    progression: progression as Progression,
  });
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'loading',
  email: null,
  userId: null,
  username: null,
  bio: null,
  progression: null,

  init: async () => {
    if (started) {
      return;
    }
    started = true;
    const acceptRedirect = (url: string | null | undefined) => {
      if (!url || !url.startsWith(AUTH_REDIRECT)) {
        return;
      }
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      if (!code) {
        return;
      }
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          loadAccount(set).catch(() => set({ status: 'signedOut' }));
        }
      });
    };
    Linking.getInitialURL().then(url => acceptRedirect(url)).catch(() => undefined);
    Linking.addEventListener('url', event => acceptRedirect(event.url));
    supabase.auth.onAuthStateChange(() => {
      loadAccount(set).catch(() => {
        set({ status: 'signedOut' });
      });
    });
    await loadAccount(set);
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return error.message;
    }
    await loadAccount(set);
    return null;
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return error.message;
    }
    await loadAccount(set);
    return null;
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: AUTH_REDIRECT,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      return error.message;
    }
    if (!data.url) {
      return 'request_failed';
    }
    await Linking.openURL(data.url);
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      status: 'signedOut',
      email: null,
      userId: null,
      username: null,
      bio: null,
      progression: null,
    });
  },

  saveProfile: async (username, bio) => {
    const userId = get().userId;
    if (!userId) {
      return 'not_authenticated';
    }
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      timezone: 'Europe/Istanbul',
    });
    if (error) {
      return error.message;
    }
    await loadAccount(set);
    return null;
  },

  completeWorkout: async (idempotencyKey, startedAt, exercises) => {
    const { data, error } = await supabase.rpc('complete_workout', {
      p_idempotency_key: idempotencyKey,
      p_started_at: startedAt,
      p_exercises: exercises,
    });
    if (error) {
      return { result: null, error: errorText(error) };
    }
    const result = data as WorkoutResult;
    set({ progression: result.progression });
    return { result, error: null };
  },
}));
