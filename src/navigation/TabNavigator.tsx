import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import theme from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import PlannerScreen from '../screens/PlannerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent.primary,
        tabBarInactiveTintColor: theme.colors.tab.inactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tab.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: theme.colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          color: theme.colors.text.primary,
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Planner"
        component={PlannerScreen}
        options={{
          title: t('tabs.planner'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-edit" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size || 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
