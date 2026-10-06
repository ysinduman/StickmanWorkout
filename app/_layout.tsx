import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import i18n from '../src/i18n';
import theme from '../src/constants/theme';
import 'react-native-reanimated';

// Prevent splash screen auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const language = useSettingsStore((state) => state.language);

  // Initialize language on startup
  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  
  // Removed ThemeProvider override because expo-router SDK 56 removed react-navigation compatibility

  return (
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background.primary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/active" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="workout/summary" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      </Stack>
  );
}
