import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Constants?.expoConfig?.extra?.supabaseUrl || '';
const SUPABASE_ANON_KEY = Constants?.expoConfig?.extra?.supabaseAnonKey || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
}

export const getSupabase = () => supabase;
