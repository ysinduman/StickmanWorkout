import { SUPABASE_URL as ENV_URL, SUPABASE_PUBLISHABLE_KEY as ENV_KEY } from '@env';

export const SUPABASE_URL: string = ENV_URL || '';
export const SUPABASE_PUBLISHABLE_KEY: string = ENV_KEY || '';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    '[StickmanWorkout] Uyarı: .env dosyasında SUPABASE_URL veya SUPABASE_PUBLISHABLE_KEY tanımlı değil. Lütfen .env.example dosyasını .env olarak kopyalayıp anahtarlarınızı girin.',
  );
}
