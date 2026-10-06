import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type TabParamList = {
  Home: undefined;
  Planner: undefined;
  History: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  ActiveWorkout: undefined;
  WorkoutSummary: undefined;
};

export type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type WorkoutNavigationProp = NativeStackNavigationProp<RootStackParamList>;
