import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  X,
  Wrench,
  LayoutDashboard,
  Newspaper,
  CheckSquare,
  BellRing,
  Search,
  LogOut,
} from 'lucide-react';
import { SIDEBAR_NAV_ITEMS } from './navigation';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Badge, Button } from '../ui/Primitives';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, isPreviewMode, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sections: Array<{ key: 'main' | 'topics' | 'productivity' | 'system'; title?: string }> = [
    { key: 'main' },
    { key: 'topics', title: 'Tech Beats' },
    { key: 'productivity', title: 'Workspace' },
    { key: 'system', title: 'System' },
  ];

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate(`/news?q=${encodeURIComponent(quickQuery.trim())}`);
      setQuickQuery('');
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 border-r border-zinc-200 dark:border-[#1c1c22] bg-white dark:bg-[#0c0c0f] transition-all duration-200 sticky top-0 h-screen',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-14 px-3.5 border-b border-zinc-200 dark:border-[#1c1c22]">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 min-w-0 text-left"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-500">
              <Activity className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  TechPulse
                </span>
                <span className="block text-[10px] font-mono text-zinc-500 leading-none mt-0.5">
                  INTELLIGENCE OS
                </span>
              </div>
            )}
          </button>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-700 dark:hover:text-zinc-200"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links (All 16 items) */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {sections.map((section) => {
            const items = SIDEBAR_NAV_ITEMS.filter((i) => i.section === section.key);
            return (
              <div key={section.key}>
                {section.title && !collapsed && (
                  <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        end={item.path === '/' || item.path === '/news'}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                            collapsed && 'justify-center px-0',
                            isActive
                              ? 'bg-indigo-600/12 text-indigo-600 dark:text-indigo-400'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16161b] hover:text-zinc-900 dark:hover:text-zinc-100'
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-zinc-200 dark:border-[#1c1c22] p-2.5">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-zinc-100/80 dark:bg-[#131318] px-2.5 py-2">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate text-zinc-900 dark:text-zinc-100">
                  {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  {isPreviewMode ? 'Preview Mode' : user?.email}
                </p>
              </div>
              {!isPreviewMode && (
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={toggleTheme}
              className="w-full flex justify-center p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 dark:border-[#1c1c22] bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between gap-3 safe-top">
          <div className="flex items-center gap-2.5 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/15 border border-indigo-500/30 text-indigo-500">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold tracking-tight">TechPulse</span>
            </button>
          </div>

          <form onSubmit={handleQuickSearch} className="hidden md:flex items-center relative flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="search"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Search headlines, sources, topics..."
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-[#222229] bg-zinc-50 dark:bg-[#111114] pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/60"
            />
          </form>

          <div className="flex items-center gap-2 ml-auto">
            {isPreviewMode && (
              <button
                onClick={() => navigate('/setup')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 transition-colors"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Preview Mode · Setup Supabase</span>
                <span className="sm:hidden">Setup</span>
              </button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Preview Banner when Supabase credentials are not set */}
        {isPreviewMode && location.pathname !== '/setup' && (
          <div className="border-b border-amber-500/20 bg-amber-500/5 px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Interactive Preview Mode:</span>{' '}
              Using local browser sample data. Add Supabase & VAPID credentials to enable live RSS ingestion, cloud sync, Web Push, and Telegram notifications.
            </p>
            <button
              onClick={() => navigate('/setup')}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View setup guide →
            </button>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 lg:px-6 py-5 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-zinc-200 dark:border-[#1e1e24] bg-white/95 dark:bg-[#0c0c0f]/95 backdrop-blur-md safe-bottom">
        <div className="grid grid-cols-5 h-15 px-1 pt-1.5">
          {[
            { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
            { to: '/news', label: 'News', icon: Newspaper, end: false },
            { to: '/tasks', label: 'Tasks', icon: CheckSquare, end: false },
            { to: '/reminders', label: 'Reminders', icon: BellRing, end: false },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  )
                }
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium text-zinc-500 dark:text-zinc-400"
          >
            <Menu className="h-4.5 w-4.5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Over Drawer (All 16 nav items + account/theme) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-[82%] max-w-xs h-full bg-white dark:bg-[#0c0c0f] border-r border-zinc-200 dark:border-[#1c1c22] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-200 dark:border-[#1c1c22]">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                <span className="font-semibold text-sm">TechPulse</span>
                {isPreviewMode && <Badge variant="amber">Preview</Badge>}
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {sections.map((section) => {
                const items = SIDEBAR_NAV_ITEMS.filter((i) => i.section === section.key);
                return (
                  <div key={section.key}>
                    {section.title && (
                      <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        {section.title}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.id}
                            to={item.path}
                            end={item.path === '/' || item.path === '/news'}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                                isActive
                                  ? 'bg-indigo-600/12 text-indigo-600 dark:text-indigo-400'
                                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16161b]'
                              )
                            }
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-zinc-200 dark:border-[#1c1c22] p-3 flex items-center justify-between safe-bottom">
              <span className="text-xs text-zinc-500 truncate">{user?.email}</span>
              {!isPreviewMode && (
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
