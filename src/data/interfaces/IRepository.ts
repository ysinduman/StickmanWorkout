import { WorkoutPlan, StoredPlan } from '../../types/plan';
import { CompletedWorkout } from '../../types/workout';
import { UserProfile } from '../../types/user';

/**
 * Abstract repository interface.
 *
 * All data access goes through this interface. Today it's backed by
 * AsyncStorage; tomorrow it can be swapped for Firebase/Supabase
 * without touching any UI code.
 */
export interface IRepository {
  // ──── Plan ────
  savePlan(plan: WorkoutPlan): Promise<void>;
  getPlan(): Promise<StoredPlan | null>;
  deletePlan(): Promise<void>;

  // ──── Workouts ────
  saveWorkout(workout: CompletedWorkout): Promise<void>;
  getWorkouts(): Promise<CompletedWorkout[]>;
  getWorkoutsByDateRange(from: string, to: string): Promise<CompletedWorkout[]>;
  deleteWorkout(id: string): Promise<void>;

  // ──── User Profile ────
  saveUserProfile(profile: UserProfile): Promise<void>;
  getUserProfile(): Promise<UserProfile | null>;

  // ──── Settings ────
  saveSetting(key: string, value: string): Promise<void>;
  getSetting(key: string): Promise<string | null>;

  // ──── Utility ────
  clearAll(): Promise<void>;
}
