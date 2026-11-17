import type {
  Article,
  Category,
  DashboardStatsResponse,
  NotificationLog,
  NotificationPreferences,
  Reminder,
  Source,
  Task,
  TaskStats,
  TelegramStatus,
  UserProfile,
} from '../types';

export const PREVIEW_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Artificial Intelligence', slug: 'artificial-intelligence', group_name: 'AI & Machine Learning' },
  { id: 'c2', name: 'Machine Learning', slug: 'machine-learning', group_name: 'AI & Machine Learning' },
  { id: 'c3', name: 'Large Language Models', slug: 'large-language-models', group_name: 'AI & Machine Learning' },
  { id: 'c4', name: 'AI Agents', slug: 'ai-agents', group_name: 'AI & Machine Learning' },
  { id: 'c5', name: 'Web Development', slug: 'web-development', group_name: 'Programming' },
  { id: 'c6', name: 'Programming', slug: 'programming', group_name: 'Programming' },
  { id: 'c7', name: 'JavaScript', slug: 'javascript', group_name: 'Programming' },
  { id: 'c8', name: 'React', slug: 'react', group_name: 'Programming' },
  { id: 'c9', name: 'Node.js', slug: 'nodejs', group_name: 'Programming' },
  { id: 'c10', name: 'Python', slug: 'python', group_name: 'Programming' },
  { id: 'c11', name: 'Startups', slug: 'startups', group_name: 'Startups' },
  { id: 'c12', name: 'Big Tech', slug: 'big-tech', group_name: 'Startups' },
  { id: 'c13', name: 'Cybersecurity', slug: 'cybersecurity', group_name: 'Cybersecurity' },
  { id: 'c14', name: 'Cloud Computing', slug: 'cloud-computing', group_name: 'Cloud & DevOps' },
  { id: 'c15', name: 'DevOps', slug: 'devops', group_name: 'Cloud & DevOps' },
  { id: 'c16', name: 'Open Source', slug: 'open-source', group_name: 'Open Source' },
  { id: 'c17', name: 'GitHub Projects', slug: 'github-projects', group_name: 'Open Source' },
  { id: 'c18', name: 'Hardware', slug: 'hardware', group_name: 'Hardware' },
  { id: 'c19', name: 'Semiconductors', slug: 'semiconductors', group_name: 'Hardware' },
  { id: 'c20', name: 'Robotics', slug: 'robotics', group_name: 'Hardware' },
  { id: 'c21', name: 'Space Technology', slug: 'space-technology', group_name: 'Science & Space' },
  { id: 'c22', name: 'Science', slug: 'science', group_name: 'Science & Space' },
  { id: 'c23', name: 'Gaming', slug: 'gaming', group_name: 'Gaming' },
  { id: 'c24', name: 'Gadgets', slug: 'gadgets', group_name: 'Hardware' },
  { id: 'c25', name: 'Mobile Technology', slug: 'mobile-technology', group_name: 'Hardware' },
  { id: 'c26', name: 'Databases', slug: 'databases', group_name: 'Cloud & DevOps' },
  { id: 'c27', name: 'Developer Tools', slug: 'developer-tools', group_name: 'Programming' },
  { id: 'c28', name: 'Research Papers', slug: 'research-papers', group_name: 'AI & Machine Learning' },
];

export const PREVIEW_SOURCES: Source[] = [
  { id: 's1', name: 'Hacker News', feed_url: 'https://hnrss.org/frontpage', website_url: 'https://news.ycombinator.com', favicon_url: 'https://news.ycombinator.com/favicon.ico', category: 'Programming', reliability_score: 88, enabled: true, last_success_at: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: 's2', name: 'OpenAI News', feed_url: 'https://openai.com/news/rss.xml', website_url: 'https://openai.com/news/', favicon_url: 'https://openai.com/favicon.ico', category: 'Large Language Models', reliability_score: 95, enabled: true, last_success_at: new Date(Date.now() - 18 * 60000).toISOString() },
  { id: 's3', name: 'Google AI Blog', feed_url: 'https://blog.google/technology/ai/rss/', website_url: 'https://blog.google/technology/ai/', favicon_url: 'https://blog.google/favicon.ico', category: 'Artificial Intelligence', reliability_score: 95, enabled: true, last_success_at: new Date(Date.now() - 20 * 60000).toISOString() },
  { id: 's4', name: 'Cloudflare Blog', feed_url: 'https://blog.cloudflare.com/rss/', website_url: 'https://blog.cloudflare.com', favicon_url: 'https://blog.cloudflare.com/favicon.ico', category: 'Cybersecurity', reliability_score: 94, enabled: true, last_success_at: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: 's5', name: 'GitHub Blog', feed_url: 'https://github.blog/feed/', website_url: 'https://github.blog', favicon_url: 'https://github.githubassets.com/favicons/favicon.svg', category: 'Open Source', reliability_score: 92, enabled: true, last_success_at: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: 's6', name: 'Ars Technica', feed_url: 'https://feeds.arstechnica.com/arstechnica/index', website_url: 'https://arstechnica.com', favicon_url: 'https://arstechnica.com/favicon.ico', category: 'Science', reliability_score: 90, enabled: true, last_success_at: new Date(Date.now() - 16 * 60000).toISOString() },
  { id: 's7', name: 'TechCrunch', feed_url: 'https://techcrunch.com/feed/', website_url: 'https://techcrunch.com', favicon_url: 'https://techcrunch.com/favicon.ico', category: 'Startups', reliability_score: 84, enabled: true, last_success_at: new Date(Date.now() - 19 * 60000).toISOString() },
  { id: 's8', name: 'NVIDIA Blog', feed_url: 'https://blogs.nvidia.com/feed/', website_url: 'https://blogs.nvidia.com', favicon_url: 'https://blogs.nvidia.com/favicon.ico', category: 'Hardware', reliability_score: 92, enabled: true, last_success_at: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 's9', name: 'AWS News Blog', feed_url: 'https://aws.amazon.com/blogs/aws/feed/', website_url: 'https://aws.amazon.com/blogs/aws/', favicon_url: 'https://aws.amazon.com/favicon.ico', category: 'Cloud Computing', reliability_score: 93, enabled: true, last_success_at: new Date(Date.now() - 29 * 60000).toISOString() },
  { id: 's10', name: 'Hugging Face Blog', feed_url: 'https://huggingface.co/blog/feed.xml', website_url: 'https://huggingface.co/blog', favicon_url: 'https://huggingface.co/favicon.ico', category: 'Machine Learning', reliability_score: 93, enabled: true, last_success_at: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: 's11', name: 'Space.com', feed_url: 'https://www.space.com/feeds/all', website_url: 'https://www.space.com', favicon_url: 'https://www.space.com/favicon.ico', category: 'Space Technology', reliability_score: 84, enabled: true, last_success_at: new Date(Date.now() - 34 * 60000).toISOString() },
  { id: 's12', name: 'PC Gamer', feed_url: 'https://www.pcgamer.com/rss/', website_url: 'https://www.pcgamer.com', favicon_url: 'https://www.pcgamer.com/favicon.ico', category: 'Gaming', reliability_score: 82, enabled: true, last_success_at: new Date(Date.now() - 40 * 60000).toISOString() },
];

const catBySlug = (slugs: string[]) =>
  PREVIEW_CATEGORIES.filter((c) => slugs.includes(c.slug));

const now = Date.now();

const INITIAL_PREVIEW_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Cloudflare Details Record Mitigation of Hyper-Volumetric Zero-Day HTTP/3 Botnet Campaign',
    url: 'https://blog.cloudflare.com/',
    description: 'Security engineering breakdown of a coordinated zero-day botnet wave neutralized automatically across edge PoPs without customer downtime.',
    content_excerpt: 'Automated RSS excerpt: Cloudflare engineering published a technical postmortem on mitigating a record volumetric HTTP/3 DDoS campaign using autonomous eBPF edge rules.',
    summary_source: 'rss_excerpt',
    source: PREVIEW_SOURCES[3],
    source_id: 's4',
    published_at: new Date(now - 55 * 60000).toISOString(),
    importance_score: 91,
    importance_label: 'Breaking',
    cluster_id: 'evt_ddos_2026',
    corroboration_count: 3,
    categories: catBySlug(['cybersecurity', 'cloud-computing']),
    is_read: false,
    is_bookmarked: true,
  },
  {
    id: 'art-1b',
    title: 'Global DNS & Edge Operators Patch Critical HTTP/3 Zero-Day Following Botnet Surge',
    url: 'https://arstechnica.com/',
    description: 'Multiple independent cloud networks corroborate emergency mitigation rules after coordinated botnet wave.',
    content_excerpt: 'Automated RSS excerpt: Independent operators confirmed coordinated traffic spikes targeting HTTP/3 handshakes; patches have rolled out across major edge providers.',
    summary_source: 'rss_excerpt',
    source: PREVIEW_SOURCES[5],
    source_id: 's6',
    published_at: new Date(now - 75 * 60000).toISOString(),
    importance_score: 84,
    importance_label: 'Breaking',
    cluster_id: 'evt_ddos_2026',
    corroboration_count: 3,
    categories: catBySlug(['cybersecurity']),
    is_read: false,
    is_bookmarked: false,
  },
  {
    id: 'art-2',
    title: 'Open-Weight Multimodal Reasoning Models Reach Desktop GPUs with 4-Bit Quantization',
    url: 'https://huggingface.co/blog',
    description: 'Benchmarks show local quantization preserves 98% of coding and math accuracy while cutting VRAM consumption by more than half.',
    content_excerpt: 'Automated RSS excerpt: New open-weight checkpoints and quantization kernels enable high-throughput local inference on consumer GPUs without cloud API dependencies.',
    summary_source: 'extractive',
    source: PREVIEW_SOURCES[9],
    source_id: 's10',
    published_at: new Date(now - 3 * 3600000).toISOString(),
    importance_score: 79,
    importance_label: 'Trending',
    cluster_id: 'evt_local_llm',
    corroboration_count: 2,
    categories: catBySlug(['artificial-intelligence', 'machine-learning', 'large-language-models', 'open-source']),
    is_read: false,
    is_bookmarked: false,
  },
  {
    id: 'art-3',
    title: 'GitHub Introduces Deterministic Sandboxed Runners for Open-Source CI/CD Pipelines',
    url: 'https://github.blog/',
    description: 'Reproducible builds and strict egress filtering arrive in GitHub Actions to defend software supply chains against compromised dependencies.',
    content_excerpt: 'Automated RSS excerpt: GitHub rolled out deterministic CI runners with kernel-level network policies and cryptographic provenance attestations for maintainers.',
    summary_source: 'rss_excerpt',
    source: PREVIEW_SOURCES[4],
    source_id: 's5',
    published_at: new Date(now - 5 * 3600000).toISOString(),
    importance_score: 74,
    importance_label: 'Important',
    cluster_id: null,
    corroboration_count: 1,
    categories: catBySlug(['open-source', 'github-projects', 'devops', 'developer-tools']),
    is_read: false,
    is_bookmarked: true,
  },
  {
    id: 'art-4',
    title: 'React 19 Compiler & Vite 6 Performance Deep Dive: Cutting Hydration Overhead in Half',
    url: 'https://news.ycombinator.com/',
    description: 'Production case study detailing automatic memoization, smaller client bundles, and faster Time to Interactive across complex dashboards.',
    content_excerpt: 'Automated RSS excerpt: Engineering teams migrating to Vite 6 and React automatic compilation report 40-55% fewer unnecessary component re-renders.',
    summary_source: 'extractive',
    source: PREVIEW_SOURCES[0],
    source_id: 's1',
    published_at: new Date(now - 7 * 3600000).toISOString(),
    importance_score: 68,
    importance_label: 'Important',
    cluster_id: null,
    corroboration_count: 1,
    categories: catBySlug(['web-development', 'programming', 'javascript', 'react']),
    is_read: true,
    is_bookmarked: false,
  },
  {
    id: 'art-5',
    title: 'Google AI Publishes Research on Reliable Multi-Step Tool Execution for Autonomous Agents',
    url: 'https://blog.google/technology/ai/',
    description: 'New verification loops reduce hallucinated tool parameters and improve long-horizon task recovery in agentic benchmarks.',
    content_excerpt: 'Automated RSS excerpt: Researchers demonstrate structured state verification that raises multi-step agent completion rates across real-world API workflows.',
    summary_source: 'rss_excerpt',
    source: PREVIEW_SOURCES[2],
    source_id: 's3',
    published_at: new Date(now - 9 * 3600000).toISOString(),
    importance_score: 76,
    importance_label: 'Important',
    cluster_id: null,
    corroboration_count: 1,
    categories: catBySlug(['artificial-intelligence', 'ai-agents', 'research-papers']),
    is_read: false,
    is_bookmarked: false,
  },
  {
    id: 'art-6',
    title: 'European Semiconductor Startup Raises $140M Series B for Low-Power RISC-V Edge Accelerators',
    url: 'https://techcrunch.com/',
    description: 'Funding will accelerate 3nm tape-out targeting robotics and industrial edge inference workloads.',
    content_excerpt: 'Automated RSS excerpt: The Series B round brings total capital to $195M as demand grows for open-ISA accelerators outside hyperscale data centers.',
    summary_source: 'rss_excerpt',
    source: PREVIEW_SOURCES[6],
    source_id: 's7',
    published_at: new Date(now - 11 * 3600000).toISOString(),
    importance_score: 64,
    importance_label: 'Important',
    cluster_id: null,
    corroboration_count: 1,
    categories: catBySlug(['startups', 'semiconductors', 'hardware', 'robotics']),
    is_read: false,
    is_bookmarked: false,
  },
  {
    id: 'art-7',
    title: 'AWS Unveils Serverless PostgreSQL Storage Tier with Sub-Millisecond Read Replicas',
    url: 'https://aws.amazon.com/blogs/aws/',
    description: 'Auto-scaling read replicas and native pgvector indexing streamline high-throughput cloud database workloads.',
    content_excerpt: 'Automated RSS excerpt: AWS announced instant-scaling PostgreSQL storage nodes with zero-downtime failovers and lower idle compute costs.',
    summary_source: 'rss_excerpt',
    source: PREVIEW_SOURCES[8],
    source_id: 's9',
    published_at: new Date(now - 14 * 3600000).toISOString(),
    importance_score: 66,
    importance_label: 'Important',
    cluster_id: null,
    corroboration_count: 1,
    categories: catBySlug(['cloud-computing', 'databases', 'devops']),
    is_read: false,
    is_bookmarked: false,
  },
  {
    id: 'art-8',
    title: 'ISRO & Partner Agencies Complete High-Precision Lunar South Pole Relay Satellite Calibration',
    url: 'https://www.space.com/',
    description: 'Optical laser telemetry tests achieve record downlink bandwidth for upcoming surface rover missions.',
    content_excerpt: 'Automated RSS excerpt: Deep-space optical communications achieved stable multi-gigabit links during lunar orbit calibration passes.',
    summary_source: 'rss_excerpt',
    source: PREVIEW_SOURCES[10],
    source_id: 's11',
    published_at: new Date(now - 18 * 3600000).toISOString(),
    importance_score: 58,
    importance_label: 'General',
    cluster_id: null,
    corroboration_count: 1,
    categories: catBySlug(['space-technology', 'science']),
    is_read: false,
    is_bookmarked: false,
  },
  {
    id: 'art-9',
    title: 'Next-Gen Handheld Linux Gaming Consoles Push Frame Pacing & Vulkan Shader Caching Forward',
    url: 'https://www.pcgamer.com/',
    description: 'Driver updates deliver quieter thermals and 20% smoother frame times on modern AAA titles running via Proton.',
    content_excerpt: 'Automated RSS excerpt: Open-source Mesa Vulkan updates significantly reduce shader compilation stutter on portable Linux gaming hardware.',
    summary_source: 'rss_excerpt',
    source: PREVIEW_SOURCES[11],
    source_id: 's12',
    published_at: new Date(now - 21 * 3600000).toISOString(),
    importance_score: 52,
    importance_label: 'General',
    cluster_id: null,
    corroboration_count: 1,
    categories: catBySlug(['gaming', 'hardware', 'open-source']),
    is_read: false,
    is_bookmarked: false,
  },
];

const INITIAL_PREVIEW_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Configure Supabase project & run SQL migrations',
    description: 'Create Supabase project, run the 3 migration files, and add credentials to backend/.env and frontend/.env.',
    priority: 'urgent',
    status: 'in_progress',
    category: 'DevOps',
    subtasks: [
      { id: 'st-1', title: 'Create Supabase project & copy API keys', completed: true },
      { id: 'st-2', title: 'Run initial schema, RLS & seed migrations', completed: false },
      { id: 'st-3', title: 'Generate VAPID keys for Web Push', completed: false },
    ],
    recurrence_rule: null,
    due_at: new Date(now + 3 * 3600000).toISOString(),
    created_at: new Date(now - 5 * 3600000).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Practice 3 dynamic programming problems (DSA)',
    description: 'Focus on state compression and memoization patterns.',
    priority: 'high',
    status: 'todo',
    category: 'Learning',
    subtasks: [
      { id: 'st-4', title: 'Solve Coin Change II', completed: false },
      { id: 'st-5', title: 'Solve Longest Increasing Subsequence', completed: false },
    ],
    recurrence_rule: 'daily',
    due_at: new Date(now + 6 * 3600000).toISOString(),
    created_at: new Date(now - 8 * 3600000).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Review weekly open-source PRs & security advisories',
    description: 'Check Dependabot alerts and Cloudflare security blog notes.',
    priority: 'medium',
    status: 'todo',
    category: 'Engineering',
    subtasks: [],
    recurrence_rule: 'weekly',
    due_at: new Date(now + 48 * 3600000).toISOString(),
    created_at: new Date(now - 24 * 3600000).toISOString(),
  },
  {
    id: 'task-4',
    title: 'Read React 19 Compiler migration guide',
    description: 'Bookmark notes for upcoming portfolio refactor.',
    priority: 'low',
    status: 'completed',
    category: 'Learning',
    subtasks: [],
    recurrence_rule: null,
    due_at: new Date(now - 12 * 3600000).toISOString(),
    completed_at: new Date(now - 2 * 3600000).toISOString(),
    created_at: new Date(now - 36 * 3600000).toISOString(),
  },
];

const INITIAL_PREVIEW_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    title: 'Study DSA — Graph Algorithms',
    description: 'Morning focused session before classes/work.',
    remind_at: new Date(now + 12 * 3600000).toISOString(),
    timezone: 'Asia/Kolkata',
    recurrence_rule: 'daily',
    notification_channel: 'both',
    is_active: true,
    is_completed: false,
    created_at: new Date(now - 48 * 3600000).toISOString(),
  },
  {
    id: 'rem-2',
    title: 'Weekly project & GitHub portfolio review',
    description: 'Review milestones, open issues, and deployment health every Sunday.',
    remind_at: new Date(now + 72 * 3600000).toISOString(),
    timezone: 'Asia/Kolkata',
    recurrence_rule: 'custom:weekdays:0',
    notification_channel: 'telegram',
    is_active: true,
    is_completed: false,
    created_at: new Date(now - 72 * 3600000).toISOString(),
  },
  {
    id: 'rem-3',
    title: 'Assignment deadline submission check',
    description: 'Final review and submit before Friday evening cutoff.',
    remind_at: new Date(now + 96 * 3600000).toISOString(),
    timezone: 'Asia/Kolkata',
    recurrence_rule: 'once',
    notification_channel: 'both',
    is_active: true,
    is_completed: false,
    created_at: new Date(now - 12 * 3600000).toISOString(),
  },
];

const STORAGE_KEY = 'techpulse_preview_state_v1';

interface PreviewState {
  articles: Article[];
  tasks: Task[];
  reminders: Reminder[];
  profile: UserProfile;
  prefs: NotificationPreferences;
  logs: NotificationLog[];
}

function loadState(): PreviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PreviewState;
    }
  } catch {
    // ignore corrupted localStorage
  }

  return {
    articles: INITIAL_PREVIEW_ARTICLES,
    tasks: INITIAL_PREVIEW_TASKS,
    reminders: INITIAL_PREVIEW_REMINDERS,
    profile: {
      id: 'preview-user',
      email: 'preview@techpulse.local',
      display_name: 'Developer',
      timezone: 'Asia/Kolkata',
      preferred_categories: ['artificial-intelligence', 'programming', 'cybersecurity', 'open-source'],
      preferred_sources: [],
    },
    prefs: {
      browser_enabled: false,
      telegram_enabled: false,
      hourly_news_enabled: true,
      daily_digest_enabled: true,
      digest_time: '08:00',
      importance_threshold: 60,
      timezone: 'Asia/Kolkata',
    },
    logs: [],
  };
}

function saveState(state: PreviewState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export const previewStore = {
  getNews(params: Record<string, string | undefined>) {
    const state = loadState();
    let list = [...state.articles];

    if (params.category) {
      const slugs = params.category.split(',');
      list = list.filter((a) => a.categories.some((c) => slugs.includes(c.slug)));
    }
    if (params.group) {
      list = list.filter((a) => a.categories.some((c) => c.group_name === params.group));
    }
    if (params.source) {
      const s = params.source.toLowerCase();
      list = list.filter((a) => a.source_id === params.source || (a.source?.name || '').toLowerCase().includes(s));
    }
    if (params.label) {
      list = list.filter((a) => a.importance_label === params.label);
    }
    if (params.bookmarked === 'true') {
      list = list.filter((a) => a.is_bookmarked);
    }
    if (params.unread === 'true') {
      list = list.filter((a) => !a.is_read);
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q) ||
          (a.source?.name || '').toLowerCase().includes(q)
      );
    }
    if (params.dateRange) {
      const ms =
        params.dateRange === '24h' || params.dateRange === 'today'
          ? 24 * 3600000
          : params.dateRange === '7d'
          ? 7 * 24 * 3600000
          : 30 * 24 * 3600000;
      list = list.filter((a) => Date.now() - new Date(a.published_at).getTime() <= ms);
    }
    if (params.sort === 'important') {
      list.sort((a, b) => b.importance_score - a.importance_score);
    } else {
      list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    }

    return {
      articles: list,
      pagination: { page: 1, limit: 24, total: list.length, totalPages: 1 },
    };
  },

  getCluster(clusterId: string) {
    const state = loadState();
    return {
      clusterId,
      articles: state.articles.filter((a) => a.cluster_id === clusterId),
    };
  },

  updateArticleState(articleId: string, patch: { is_read?: boolean; is_bookmarked?: boolean }) {
    const state = loadState();
    state.articles = state.articles.map((a) => (a.id === articleId ? { ...a, ...patch } : a));
    saveState(state);
    return { state: { article_id: articleId, ...patch } };
  },

  getTasks(params: Record<string, string | undefined>): { tasks: Task[]; stats: TaskStats } {
    const state = loadState();
    const nowTime = Date.now();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const normalized = state.tasks.map((t) =>
      t.status !== 'completed' && t.due_at && new Date(t.due_at).getTime() < nowTime
        ? { ...t, status: 'overdue' as const }
        : t
    );

    const total = normalized.length;
    const completed = normalized.filter((t) => t.status === 'completed').length;
    const overdue = normalized.filter((t) => t.status === 'overdue').length;
    const stats: TaskStats = {
      total,
      completed,
      pending: total - completed,
      overdue,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };

    let list = normalized;
    if (params.view === 'today') {
      list = list.filter(
        (t) =>
          t.status !== 'completed' &&
          t.due_at &&
          new Date(t.due_at).getTime() >= startOfToday.getTime() &&
          new Date(t.due_at).getTime() <= endOfToday.getTime()
      );
    } else if (params.view === 'upcoming') {
      list = list.filter((t) => t.status !== 'completed' && t.due_at && new Date(t.due_at).getTime() > endOfToday.getTime());
    } else if (params.view === 'completed') {
      list = list.filter((t) => t.status === 'completed');
    } else if (params.view === 'overdue') {
      list = list.filter((t) => t.status === 'overdue');
    }

    if (params.priority && params.priority !== 'all') {
      list = list.filter((t) => t.priority === params.priority);
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      );
    }

    return { tasks: list, stats };
  },

  createTask(payload: Partial<Task>) {
    const state = loadState();
    const task: Task = {
      id: `task-${Date.now()}`,
      title: payload.title || 'Untitled Task',
      description: payload.description || null,
      priority: payload.priority || 'medium',
      status: payload.status || 'todo',
      category: payload.category || 'General',
      subtasks: payload.subtasks || [],
      recurrence_rule: payload.recurrence_rule || null,
      due_at: payload.due_at || null,
      created_at: new Date().toISOString(),
    };
    state.tasks = [task, ...state.tasks];
    saveState(state);
    return { task };
  },

  updateTask(id: string, patch: Partial<Task>): { task: Task } {
    const state = loadState();
    const existing = state.tasks.find((t) => t.id === id);
    const updatedTask: Task = {
      ...(existing || {
        id,
        title: 'Task',
        priority: 'medium',
        status: 'todo',
        category: 'General',
        subtasks: [],
        created_at: new Date().toISOString(),
      }),
      ...patch,
      completed_at:
        patch.status === 'completed'
          ? new Date().toISOString()
          : patch.status
          ? null
          : existing?.completed_at ?? null,
      updated_at: new Date().toISOString(),
    };
    state.tasks = state.tasks.map((t) => (t.id === id ? updatedTask : t));
    saveState(state);
    return { task: updatedTask };
  },

  deleteTask(id: string) {
    const state = loadState();
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveState(state);
    return { deleted: true, id };
  },

  getReminders() {
    const state = loadState();
    return { reminders: state.reminders };
  },

  createReminder(payload: Partial<Reminder>) {
    const state = loadState();
    const reminder: Reminder = {
      id: `rem-${Date.now()}`,
      title: payload.title || 'Reminder',
      description: payload.description || null,
      remind_at: payload.remind_at || new Date(Date.now() + 3600000).toISOString(),
      timezone: payload.timezone || 'Asia/Kolkata',
      recurrence_rule: payload.recurrence_rule || 'once',
      notification_channel: payload.notification_channel || 'both',
      is_active: payload.is_active ?? true,
      is_completed: false,
      created_at: new Date().toISOString(),
    };
    state.reminders = [reminder, ...state.reminders];
    saveState(state);
    return { reminder };
  },

  updateReminder(id: string, patch: Partial<Reminder>): { reminder: Reminder } {
    const state = loadState();
    const existing = state.reminders.find((r) => r.id === id);
    const updated: Reminder = {
      ...(existing || {
        id,
        title: 'Reminder',
        remind_at: new Date().toISOString(),
        timezone: 'Asia/Kolkata',
        recurrence_rule: 'once',
        notification_channel: 'both',
        is_active: true,
        is_completed: false,
        created_at: new Date().toISOString(),
      }),
      ...patch,
      is_active: patch.is_completed ? false : patch.is_active ?? existing?.is_active ?? true,
    };
    state.reminders = state.reminders.map((r) => (r.id === id ? updated : r));
    saveState(state);
    return { reminder: updated };
  },

  snoozeReminder(id: string, minutes: number): { reminder: Reminder } {
    const snoozed_until = new Date(Date.now() + minutes * 60000).toISOString();
    return this.updateReminder(id, { snoozed_until, is_active: true, is_completed: false });
  },

  deleteReminder(id: string) {
    const state = loadState();
    state.reminders = state.reminders.filter((r) => r.id !== id);
    saveState(state);
    return { deleted: true, id };
  },

  getSettings() {
    const state = loadState();
    return { profile: state.profile, notificationPreferences: state.prefs };
  },

  updateProfile(patch: Partial<UserProfile>) {
    const state = loadState();
    state.profile = { ...state.profile, ...patch };
    saveState(state);
    return { profile: state.profile };
  },

  updateNotificationPrefs(patch: Partial<NotificationPreferences>) {
    const state = loadState();
    state.prefs = { ...state.prefs, ...patch };
    saveState(state);
    return { notificationPreferences: state.prefs };
  },

  getTelegramStatus(): TelegramStatus {
    return {
      connected: false,
      enabled: false,
      chatId: null,
      botUsername: null,
      hasCustomBotToken: false,
      isVerified: false,
      defaultServerBotAvailable: false,
      encryptionConfigured: false,
    };
  },

  getDashboardStats(): DashboardStatsResponse {
    const state = loadState();
    const { stats } = this.getTasks({});
    const todayTasks = state.tasks.filter((t) => t.status !== 'completed').slice(0, 5);
    const upcomingReminders = state.reminders.filter((r) => r.is_active && !r.is_completed).slice(0, 5);
    const breakingNews = [...state.articles]
      .sort((a, b) => b.importance_score - a.importance_score)
      .slice(0, 5);
    const latestNews = [...state.articles]
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 6);

    return {
      news: {
        totalArticles: state.articles.length,
        last24hArticles: state.articles.length,
        breakingOrTrending24h: state.articles.filter(
          (a) => a.importance_label === 'Breaking' || a.importance_label === 'Trending'
        ).length,
        activeSources: PREVIEW_SOURCES.length,
        bookmarkedCount: state.articles.filter((a) => a.is_bookmarked).length,
      },
      breakingNews,
      latestNews,
      tasks: { stats, today: todayTasks },
      reminders: { upcoming: upcomingReminders },
      notifications: {
        browserEnabled: state.prefs.browser_enabled,
        telegramEnabled: state.prefs.telegram_enabled,
        hourlyNewsEnabled: state.prefs.hourly_news_enabled,
        dailyDigestEnabled: state.prefs.daily_digest_enabled,
        digestTime: state.prefs.digest_time,
        timezone: state.prefs.timezone,
      },
    };
  },
};
