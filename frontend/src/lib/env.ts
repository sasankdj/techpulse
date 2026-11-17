export const frontendEnv = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, ''),
};

export const isSupabaseConfigured = Boolean(
  frontendEnv.supabaseUrl && frontendEnv.supabaseAnonKey
);
