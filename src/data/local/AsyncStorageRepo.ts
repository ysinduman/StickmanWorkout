import AsyncStorage from '@react-native-async-storage/async-storage';
import { IRepository } from '../interfaces/IRepository';
import { WorkoutPlan, StoredPlan } from '../../types/plan';
import { CompletedWorkout } from '../../types/workout';
import { UserProfile } from '../../types/user';

// Storage keys
const KEYS = {
  PLAN: '@stickman/plan',
  WORKOUTS: '@stickman/workouts',
  USER_PROFILE: '@stickman/user_profile',
  SETTING_PREFIX: '@stickman/setting/',
} as const;

/**
 * AsyncStorage implementation of the repository interface.
 * All data is stored as JSON strings in AsyncStorage.
 */
export class AsyncStorageRepository implements IRepository {
  // ──── Plan ────

  async savePlan(plan: WorkoutPlan): Promise<void> {
    const stored: StoredPlan = {
      plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if plan already exists → preserve createdAt
    const existing = await this.getPlan();
    if (existing) {
      stored.createdAt = existing.createdAt;
    }

    await AsyncStorage.setItem(KEYS.PLAN, JSON.stringify(stored));
  }

  async getPlan(): Promise<StoredPlan | null> {
    const raw = await AsyncStorage.getItem(KEYS.PLAN);
    return raw ? JSON.parse(raw) : null;
  }

  async deletePlan(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.PLAN);
  }

  // ──── Workouts ────

  async saveWorkout(workout: CompletedWorkout): Promise<void> {
    const workouts = await this.getWorkouts();
    workouts.push(workout);
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
  }

  async getWorkouts(): Promise<CompletedWorkout[]> {
    const raw = await AsyncStorage.getItem(KEYS.WORKOUTS);
    return raw ? JSON.parse(raw) : [];
  }

  async getWorkoutsByDateRange(from: string, to: string): Promise<CompletedWorkout[]> {
    const workouts = await this.getWorkouts();
    return workouts.filter((w) => w.date >= from && w.date <= to);
  }

  async deleteWorkout(id: string): Promise<void> {
    const workouts = await this.getWorkouts();
    const filtered = workouts.filter((w) => w.id !== id);
    await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(filtered));
  }

  // ──── User Profile ────

  async saveUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  }

  // ──── Settings ────

  async saveSetting(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTING_PREFIX + key, value);
  }

  async getSetting(key: string): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SETTING_PREFIX + key);
  }

  // ──── Utility ────

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  }
}
