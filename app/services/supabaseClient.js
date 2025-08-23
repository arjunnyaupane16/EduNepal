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
  // Optimized configuration for zero egress
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }
    },
    global: {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept-Encoding',
        'X-Client-Info': 'supabase-js-zero-egress/1.0'
      }
    },
    db: {
      schema: 'public',
      // Disable realtime by default
      realtime: {
        params: {
          eventsPerSecond: 0,
        },
      },
    },
    storage: {
      url: SUPABASE_URL.replace('.supabase.co', '.supabase.in'),
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'X-Client-Info': 'supabase-js-zero-egress/1.0'
      }
    },
    // Disable realtime by default
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    }
  };
  
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
} else {
  // Helpful warning to diagnose missing config on web
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Set EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY or add to app.json extra.');
}

export const getSupabase = () => supabase;
