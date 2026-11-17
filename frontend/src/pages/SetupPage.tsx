import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Database, Key, Radio, RefreshCw, Terminal, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { isSupabaseConfigured, frontendEnv } from '../lib/env';
import { Badge, Button, Card } from '../components/ui/Primitives';

export function SetupPage() {
  const { data: health, refetch, isFetching } = useQuery({
    queryKey: ['backend-health'],
    queryFn: () => api.getHealth(),
  });

  const checks = [
    {
      label: 'Frontend Supabase Config (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY)',
      ok: isSupabaseConfigured,
      detail: isSupabaseConfigured ? 'Configured in frontend/.env' : 'Not set — running in Preview Mode',
    },
    {
      label: `Backend REST API (${frontendEnv.apiBaseUrl})`,
      ok: Boolean(health?.status === 'ok'),
      detail: health ? `Online (TZ: ${health.timezone})` : 'Not reachable — run `npm run dev:backend`',
    },
    {
      label: 'Backend Supabase Service Role Connection',
      ok: Boolean(health?.capabilities?.supabaseConfigured && health?.database?.status === 'connected'),
      detail: health?.database?.error || health?.database?.status || 'Waiting for backend/.env',
    },
    {
      label: 'Web Push VAPID Keys',
      ok: Boolean(health?.capabilities?.webPushConfigured),
      detail: health?.capabilities?.webPushConfigured
        ? 'Configured'
        : 'Run `npm --prefix backend run generate:vapid`',
    },
    {
      label: 'Telegram Token Encryption Key (CREDENTIALS_ENCRYPTION_KEY)',
      ok: Boolean(health?.capabilities?.encryptionConfigured),
      detail: health?.capabilities?.encryptionConfigured
        ? 'Configured (AES-256-GCM ready)'
        : 'Set a 32-byte hex secret in backend/.env',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Environment & Setup Diagnostics</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Connect Supabase, run migrations, and configure Web Push + Telegram when ready.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Re-check Status
        </Button>
      </div>

      {/* Live Checks */}
      <Card className="p-5 space-y-3">
        <h2 className="text-sm font-semibold">Live System Readiness</h2>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {checks.map((check) => (
            <div key={check.label} className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {check.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-medium">{check.label}</p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{check.detail}</p>
                </div>
              </div>
              <Badge variant={check.ok ? 'emerald' : 'amber'}>{check.ok ? 'Ready' : 'Action Needed'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Setup Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-indigo-500" />
            1. Supabase & SQL Migrations
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Create a free Supabase project, then run the 3 SQL files inside{' '}
            <code className="font-mono text-indigo-500">supabase/migrations/</code> in order via the Supabase SQL Editor or CLI:
          </p>
          <pre className="rounded-lg bg-zinc-950 text-zinc-200 p-3 text-[11px] font-mono overflow-x-auto">
{`1. 20261117000001_initial_schema.sql
2. 20261117000002_rls_policies.sql
3. 20261117000003_seed_categories_and_sources.sql`}
          </pre>
        </Card>

        <Card className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Key className="h-4 w-4 text-indigo-500" />
            2. Environment Files
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env</code> in both{' '}
            <code className="font-mono">frontend/</code> and <code className="font-mono">backend/</code>. Never put{' '}
            <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in the frontend.
          </p>
          <pre className="rounded-lg bg-zinc-950 text-zinc-200 p-3 text-[11px] font-mono overflow-x-auto">
{`# Generate VAPID keys for Browser Push
npm --prefix backend run generate:vapid

# Generate 32-byte encryption key for Telegram
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`}
          </pre>
        </Card>

        <Card className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Terminal className="h-4 w-4 text-indigo-500" />
            3. Run First Live RSS Ingestion
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Once Supabase is connected, trigger an immediate RSS fetch or let the hourly scheduler run automatically:
          </p>
          <pre className="rounded-lg bg-zinc-950 text-zinc-200 p-3 text-[11px] font-mono overflow-x-auto">
{`npm --prefix backend run ingest`}
          </pre>
        </Card>

        <Card className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Radio className="h-4 w-4 text-indigo-500" />
            4. Connect Browser Push & Telegram
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Create a bot with <code className="font-mono">@BotFather</code> on Telegram, send it{' '}
            <code className="font-mono">/start</code>, get your Chat ID, and connect it in the Notifications page.
          </p>
        </Card>
      </div>
    </div>
  );
}
