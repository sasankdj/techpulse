import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { frontendEnv, isSupabaseConfigured } from './env';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!client) {
    client = createClient(frontendEnv.supabaseUrl, frontendEnv.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
