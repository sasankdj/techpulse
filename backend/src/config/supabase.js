import { createClient } from '@supabase/supabase-js';
import { env, getCapabilities } from './env.js';

let supabaseAdmin = null;

export function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const { supabaseConfigured } = getCapabilities();
  if (!supabaseConfigured) {
    return null;
  }

  supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

export function requireSupabase() {
  const client = getSupabaseAdmin();
  if (!client) {
    const err = new Error(
      'Supabase is not configured on the backend. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.'
    );
    err.statusCode = 503;
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }
  return client;
}

export function setSupabaseClientForTests(mockClient) {
  supabaseAdmin = mockClient;
}
