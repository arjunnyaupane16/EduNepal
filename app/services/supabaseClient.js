import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// Prefer Expo public env vars on web/static builds, fallback to app.json extras
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants?.expoConfig?.extra?.supabaseUrl ||
  '';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants?.expoConfig?.extra?.supabaseAnonKey ||
  '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
} else {
  // Helpful warning to diagnose missing config on web
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Set EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY or add to app.json extra.');
}

export const getSupabase = () => supabase;
