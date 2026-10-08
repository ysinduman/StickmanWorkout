import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography, Button } from '../components/ui';
import { Stickman } from '../components/Stickman/Stickman';
import { FlameEffect } from '../components/Calendar/FlameEffect';
import theme from '../constants/theme';
import { useSessionStore } from '../stores/useSessionStore';
import { useSettingsStore } from '../stores/useSettingsStore';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboard,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboard?: 'email-address' | 'default';
}) {
  return (
    <View style={styles.field}>
      <Typography variant="label">{label}</Typography>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secure}
        keyboardType={keyboard ?? 'default'}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.tertiary}
        style={styles.input}
      />
    </View>
  );
}

export default function AuthScreen() {
  const { t } = useTranslation();
  const status = useSessionStore(state => state.status);
  const signIn = useSessionStore(state => state.signIn);
  const signUp = useSessionStore(state => state.signUp);
  const signInWithGoogle = useSessionStore(state => state.signInWithGoogle);
  const saveProfile = useSessionStore(state => state.saveProfile);
  const signOut = useSessionStore(state => state.signOut);
  const language = useSettingsStore(state => state.language);
  const setLanguage = useSettingsStore(state => state.setLanguage);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const message = await action();
    setBusy(false);
    if (message) {
      if (message.includes('Invalid login credentials')) {
        setError(t('auth.errors.invalid_credentials'));
      } else if (message.includes('duplicate key')) {
        setError(t('auth.errors.username_taken'));
      } else {
        setError(message);
      }
    }
  };

  const body = status === 'needsUsername' ? (
    <>
      <Typography variant="title1" align="center">{t('auth.chooseName')}</Typography>
      <Typography variant="bodyMuted" align="center">{t('auth.usernameHint')}</Typography>
      <Field
        label={t('auth.username')}
        value={username}
        onChangeText={value => setUsername(value.toLowerCase())}
        placeholder="yasinduman"
      />
      <Field
        label={t('auth.bio')}
        value={bio}
        onChangeText={setBio}
        placeholder={t('auth.bioPlaceholder')}
      />
      {error ? <Typography variant="caption" color={theme.colors.status.error}>{error}</Typography> : null}
      <Button
        title={t('auth.createProfile')}
        loading={busy}
        fullWidth
        onPress={() => {
          if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            setError(t('auth.errors.username_format'));
            return;
          }
          run(() => saveProfile(username, bio));
        }}
      />
      <Button title={t('auth.signOut')} variant="text" onPress={signOut} />
    </>
  ) : (
    <>
      <View style={styles.langRow}>
        <Pressable onPress={() => setLanguage('tr')} style={language === 'tr' ? styles.langOn : styles.langOff}>
          <Typography variant="caption" bold color={language === 'tr' ? theme.colors.text.inverse : theme.colors.text.secondary}>TR</Typography>
        </Pressable>
        <Pressable onPress={() => setLanguage('en')} style={language === 'en' ? styles.langOn : styles.langOff}>
          <Typography variant="caption" bold color={language === 'en' ? theme.colors.text.inverse : theme.colors.text.secondary}>EN</Typography>
        </Pressable>
      </View>
      <View style={styles.hero}>
        <View style={styles.flameBehind}>
          <FlameEffect intensity={1} size={150} />
        </View>
        <Stickman muscleMass={18} width={150} height={180} />
      </View>
      <Typography variant="title1" align="center">{t('common.appName')}</Typography>
      <Typography variant="bodyMuted" align="center">{t('auth.subtitle')}</Typography>
      <Field
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboard="email-address"
      />
      <Field
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secure
      />
      {error ? <Typography variant="caption" color={theme.colors.status.error}>{error}</Typography> : null}
      <Button
        title={t('auth.signIn')}
        loading={busy}
        fullWidth
        onPress={() => run(() => signIn(email.trim(), password))}
      />
      <Button
        title={t('auth.signUp')}
        variant="outline"
        fullWidth
        loading={busy}
        onPress={() => run(() => signUp(email.trim(), password))}
      />
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Typography variant="caption">{t('auth.or')}</Typography>
        <View style={styles.divider} />
      </View>
      <Pressable
        style={styles.googleButton}
        disabled={busy}
        onPress={() => run(signInWithGoogle)}
      >
        <MaterialCommunityIcons name="google" size={20} color={theme.colors.text.primary} />
        <Typography variant="body" bold>{t('auth.google')}</Typography>
      </Pressable>
    </>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  langOn: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langOff: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 210,
  },
  flameBehind: {
    position: 'absolute',
    top: 8,
  },
  field: {
    gap: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background.input,
    color: theme.colors.text.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: theme.typography.fontSize.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: 14,
  },
});
