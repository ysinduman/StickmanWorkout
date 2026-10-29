import { WorkoutPlan } from '../types';

export interface CalisthenicsPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  daysPerWeek: number;
  focus: string[];
  plan: WorkoutPlan;
}

export const CALISTHENICS_PRESETS: CalisthenicsPreset[] = [
  {
    id: 'full_body_3day',
    name: 'Tüm Vücut Calisthenics',
    description: 'Pazartesi, Çarşamba ve Cuma günleri tüm vücut dengeli gelişim (Şınav, Squat, Mekik, Plank).',
    badge: '3 Gün / Hafta',
    daysPerWeek: 3,
    focus: ['Gövde', 'Bacak', 'Karın'],
    plan: {
      type: 'split',
      schedule: {
        monday: 'fb_day',
        tuesday: null,
        wednesday: 'fb_day',
        thursday: null,
        friday: 'fb_day',
        saturday: null,
        sunday: null,
      },
      workoutDays: [
        {
          id: 'fb_day',
          name: 'Tüm Vücut Calisthenics',
          muscleGroups: ['chest', 'legs', 'core'],
          exercises: [
            {
              exerciseId: 'push_up',
              sets: [
                { setNumber: 1, targetReps: 12, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 12, targetWeightKg: 0 },
                { setNumber: 3, targetReps: 12, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'squat',
              sets: [
                { setNumber: 1, targetReps: 15, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 15, targetWeightKg: 0 },
                { setNumber: 3, targetReps: 15, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'crunches',
              sets: [
                { setNumber: 1, targetReps: 20, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 20, targetWeightKg: 0 },
                { setNumber: 3, targetReps: 20, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'plank',
              sets: [
                { setNumber: 1, targetTimeSeconds: 30 },
                { setNumber: 2, targetTimeSeconds: 30 },
                { setNumber: 3, targetTimeSeconds: 30 },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'power_split_4day',
    name: 'Calisthenics Güç Split',
    description: 'Üst vücut & göğüs ve alt vücut & bacak ayrımı ile yoğun kas gelişimi.',
    badge: '4 Gün / Hafta',
    daysPerWeek: 4,
    focus: ['Gövde', 'Bacak', 'Karın'],
    plan: {
      type: 'split',
      schedule: {
        monday: 'upper_core',
        tuesday: 'lower_core',
        wednesday: null,
        thursday: 'upper_core',
        friday: 'lower_core',
        saturday: null,
        sunday: null,
      },
      workoutDays: [
        {
          id: 'upper_core',
          name: 'Üst Vücut & Karın',
          muscleGroups: ['chest', 'core'],
          exercises: [
            {
              exerciseId: 'push_up',
              sets: [
                { setNumber: 1, targetReps: 15, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 15, targetWeightKg: 0 },
                { setNumber: 3, targetReps: 15, targetWeightKg: 0 },
                { setNumber: 4, targetReps: 15, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'crunches',
              sets: [
                { setNumber: 1, targetReps: 20, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 20, targetWeightKg: 0 },
                { setNumber: 3, targetReps: 20, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'plank',
              sets: [
                { setNumber: 1, targetTimeSeconds: 45 },
                { setNumber: 2, targetTimeSeconds: 45 },
                { setNumber: 3, targetTimeSeconds: 45 },
              ],
            },
          ],
        },
        {
          id: 'lower_core',
          name: 'Bacak & Karın',
          muscleGroups: ['legs', 'core'],
          exercises: [
            {
              exerciseId: 'squat',
              sets: [
                { setNumber: 1, targetReps: 20, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 20, targetWeightKg: 0 },
                { setNumber: 3, targetReps: 20, targetWeightKg: 0 },
                { setNumber: 4, targetReps: 20, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'crunches',
              sets: [
                { setNumber: 1, targetReps: 20, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 20, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'plank',
              sets: [
                { setNumber: 1, targetTimeSeconds: 45 },
                { setNumber: 2, targetTimeSeconds: 45 },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'xp_boost_core_push',
    name: 'XP Canavarı: Karın & Şınav',
    description: 'Hızlı XP kasmak, seriyi korumak ve avatarı güçlendirmek için yüksek tekrarlı Calisthenics.',
    badge: '5 Gün / XP Boost',
    daysPerWeek: 5,
    focus: ['Gövde', 'Karın'],
    plan: {
      type: 'split',
      schedule: {
        monday: 'core_push_day',
        tuesday: 'core_push_day',
        wednesday: 'core_push_day',
        thursday: 'core_push_day',
        friday: 'core_push_day',
        saturday: null,
        sunday: null,
      },
      workoutDays: [
        {
          id: 'core_push_day',
          name: 'Karın & Şınav Patlaması',
          muscleGroups: ['chest', 'core'],
          exercises: [
            {
              exerciseId: 'push_up',
              sets: [
                { setNumber: 1, targetReps: 15, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 15, targetWeightKg: 0 },
                { setNumber: 3, targetReps: 15, targetWeightKg: 0 },
                { setNumber: 4, targetReps: 15, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'crunches',
              sets: [
                { setNumber: 1, targetReps: 25, targetWeightKg: 0 },
                { setNumber: 2, targetReps: 25, targetWeightKg: 0 },
                { setNumber: 3, targetReps: 25, targetWeightKg: 0 },
                { setNumber: 4, targetReps: 25, targetWeightKg: 0 },
              ],
            },
            {
              exerciseId: 'plank',
              sets: [
                { setNumber: 1, targetTimeSeconds: 60 },
                { setNumber: 2, targetTimeSeconds: 60 },
                { setNumber: 3, targetTimeSeconds: 60 },
              ],
            },
          ],
        },
      ],
    },
  },
];
