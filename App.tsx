import React, { useEffect } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from './src/stores/useSettingsStore';
import i18n from './src/i18n';
import theme from './src/constants/theme';
import TabNavigator from './src/navigation/TabNavigator';
import ActiveWorkoutScreen from './src/screens/ActiveWorkoutScreen';
import WorkoutSummaryScreen from './src/screens/WorkoutSummaryScreen';
import type { RootStackParamList } from './src/navigation/types';
import AuthScreen from './src/screens/AuthScreen';
import { useSessionStore } from './src/stores/useSessionStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background.primary,
    card: theme.colors.background.primary,
    text: theme.colors.text.primary,
    border: theme.colors.border,
    primary: theme.colors.accent.primary,
    notification: theme.colors.accent.primary,
  },
};

function withTopSafeArea<P extends object>(Screen: React.ComponentType<P>) {
  return function SafeScreen(props: P) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background.primary }}
        edges={['top']}
      >
        <Screen {...props} />
      </SafeAreaView>
    );
  };
}

export default function App() {
  const language = useSettingsStore(state => state.language);
  const status = useSessionStore(state => state.status);
  const initSession = useSessionStore(state => state.init);

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  let body: React.ReactNode;
  if (status === 'loading') {
    body = (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background.primary }}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  } else if (status !== 'ready') {
    body = <AuthScreen />;
  } else {
    body = (
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background.primary },
            headerTintColor: theme.colors.text.primary,
            headerTitleStyle: { fontWeight: '700' },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.colors.background.primary },
          }}
        >
          <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="ActiveWorkout"
            component={withTopSafeArea(ActiveWorkoutScreen)}
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="WorkoutSummary"
            component={withTopSafeArea(WorkoutSummaryScreen)}
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        {body}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
