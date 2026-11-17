import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Filter, Info, Newspaper, RefreshCw, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { ROUTE_TO_GROUP } from '../components/layout/navigation';
import { ArticleCard } from '../components/news/ArticleCard';
import { ArticleClusterModal } from '../components/news/ArticleClusterModal';
import { Button, EmptyState, ErrorState, Skeleton } from '../components/ui/Primitives';

export function NewsPage({ savedOnly = false }: { savedOnly?: boolean }) {
  const { topic } = useParams<{ topic?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const topicMeta = topic ? ROUTE_TO_GROUP[topic] : null;

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [label, setLabel] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [clusterId, setClusterId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory('all');
    const urlQ = searchParams.get('q');
    if (urlQ !== null) setQ(urlQ);
    const urlSort = searchParams.get('sort');
    if (urlSort) setSort(urlSort);
  }, [topic, savedOnly, searchParams]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const { data: sourcesData } = useQuery({
    queryKey: ['sources'],
    queryFn: () => api.getSources(),
  });

  const visibleCategories = (categoriesData?.categories || []).filter((c) =>
    topicMeta ? c.group_name === topicMeta.groupName : true
  );

  const queryKeyParams = {
    q: q.trim() || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    group: selectedCategory === 'all' && topicMeta ? topicMeta.groupName : undefined,
    source: selectedSource !== 'all' ? selectedSource : undefined,
    dateRange: dateRange !== 'all' ? dateRange : undefined,
    sort,
    label: label !== 'all' ? label : undefined,
    bookmarked: savedOnly ? 'true' : undefined,
    unread: unreadOnly ? 'true' : undefined,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['news', queryKeyParams],
    queryFn: () => api.getNews(queryKeyParams),
  });

  const articleStateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { is_read?: boolean; is_bookmarked?: boolean } }) =>
      api.updateArticleState(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshNewsFeeds(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast({
        title: 'RSS ingestion complete',
        description: `${res.result.articlesInserted} new articles indexed.`,
        variant: 'success',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Could not refresh feeds', description: err.message, variant: 'error' });
    },
  });

  const clearFilters = () => {
    setQ('');
    setSelectedCategory('all');
    setSelectedSource('all');
    setDateRange('all');
    setLabel('all');
    setUnreadOnly(false);
    setSort('latest');
    setSearchParams({});
  };

  const hasActiveFilters =
    Boolean(q) ||
    selectedCategory !== 'all' ||
    selectedSource !== 'all' ||
    dateRange !== 'all' ||
    label !== 'all' ||
    unreadOnly;

  const pageTitle = savedOnly
    ? 'Saved Articles'
    : topicMeta
    ? topicMeta.title
    : 'All Technology News';

  const pageSubtitle = savedOnly
    ? 'Your bookmarked stories — preserved across feed updates.'
    : topicMeta
    ? topicMeta.subtitle
    : 'Aggregated from verified official RSS/Atom feeds with rule-based intelligence scoring.';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{pageTitle}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{pageSubtitle}</p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Fetch Latest RSS
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-zinc-200 dark:border-[#222228] bg-white dark:bg-[#111114] p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search headlines, descriptions, or sources..."
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0b0b0e] pl-8 pr-3 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex flex-wrap gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              aria-label="Filter by source"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0b0b0e] px-2.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Sources</option>
              {(sourcesData?.sources || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Filter by date"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0b0b0e] px-2.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Any Time</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              aria-label="Filter by importance"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0b0b0e] px-2.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Signals</option>
              <option value="Breaking">Breaking</option>
              <option value="Trending">Trending</option>
              <option value="Important">Important</option>
              <option value="General">General</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort order"
              className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0b0b0e] px-2.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="latest">Latest First</option>
              <option value="important">Most Important First</option>
            </select>
          </div>
        </div>

        {/* Category Pills + Unread Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0 mr-0.5" />
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 dark:bg-[#18181f] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              All
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-[#18181f] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded border-zinc-400 text-indigo-600 focus:ring-indigo-500"
              />
              Unread only
            </label>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-rose-500 hover:underline"
              >
                <X className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Excerpt Transparency Note */}
      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
        <Info className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
        <span>
          Article summaries are automated RSS excerpts ranked by free rule-based intelligence (not verified AI analysis). Click any headline to read the original source.
        </span>
      </div>

      {/* Articles Grid */}
      {error ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (data?.articles || []).length === 0 ? (
        <EmptyState
          icon={savedOnly ? <Bookmark className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
          title={savedOnly ? 'No saved articles yet' : 'No matching articles'}
          description={
            savedOnly
              ? 'Click the Save button on any article to bookmark it for later reading.'
              : 'Try broadening your search or filters, or sync the latest RSS feeds.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.articles || []).map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onOpenCluster={(cid) => setClusterId(cid)}
              onToggleBookmark={(a) =>
                articleStateMutation.mutate({
                  id: a.id,
                  patch: { is_bookmarked: !a.is_bookmarked },
                })
              }
              onToggleRead={(a) =>
                articleStateMutation.mutate({ id: a.id, patch: { is_read: !a.is_read } })
              }
            />
          ))}
        </div>
      )}

      <ArticleClusterModal clusterId={clusterId} onClose={() => setClusterId(null)} />
    </div>
  );
}
