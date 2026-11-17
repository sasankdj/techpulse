import {
  Bookmark,
  CheckCircle2,
  Circle,
  ExternalLink,
  Flame,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { Article, ImportanceLabel } from '../../types';
import { cn, formatRelativeTime } from '../../lib/utils';
import { Badge } from '../ui/Primitives';

function getImportanceBadge(label: ImportanceLabel, score: number) {
  switch (label) {
    case 'Breaking':
      return (
        <Badge variant="rose">
          <Flame className="h-3 w-3" />
          Breaking · {Math.round(score)}
        </Badge>
      );
    case 'Trending':
      return (
        <Badge variant="amber">
          <TrendingUp className="h-3 w-3" />
          Trending · {Math.round(score)}
        </Badge>
      );
    case 'Important':
      return (
        <Badge variant="indigo">
          <Sparkles className="h-3 w-3" />
          Important · {Math.round(score)}
        </Badge>
      );
    default:
      return <Badge variant="neutral">General · {Math.round(score)}</Badge>;
  }
}

export function ArticleCard({
  article,
  onToggleBookmark,
  onToggleRead,
  onOpenCluster,
  compact = false,
}: {
  article: Article;
  onToggleBookmark?: (article: Article) => void;
  onToggleRead?: (article: Article) => void;
  onOpenCluster?: (clusterId: string) => void;
  compact?: boolean;
}) {
  const excerpt = article.content_excerpt || article.description;

  const handleOpenArticle = () => {
    if (!article.is_read && onToggleRead) {
      onToggleRead(article);
    }
  };

  return (
    <article
      className={cn(
        'group rounded-xl border border-zinc-200/90 dark:border-[#222228] bg-white dark:bg-[#111114] hover:border-zinc-300 dark:hover:border-[#32323d] transition-all duration-150 flex flex-col justify-between',
        compact ? 'p-3.5' : 'p-4',
        article.is_read && 'opacity-75'
      )}
    >
      <div>
        {/* Meta Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {article.source?.favicon_url ? (
              <img
                src={article.source.favicon_url}
                alt=""
                className="h-4 w-4 rounded-sm shrink-0 bg-zinc-100 dark:bg-zinc-800"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
            )}
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {article.source?.name || 'Tech Source'}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <time
              dateTime={article.published_at}
              className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0"
            >
              {formatRelativeTime(article.published_at)}
            </time>
          </div>

          <div className="shrink-0">
            {getImportanceBadge(article.importance_label, article.importance_score)}
          </div>
        </div>

        {/* Headline */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenArticle}
          className="block group/link"
        >
          <h3
            className={cn(
              'font-semibold text-zinc-900 dark:text-zinc-100 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors leading-snug',
              compact ? 'text-sm' : 'text-[15px]'
            )}
          >
            {article.title}
            <ExternalLink className="inline-block h-3 w-3 ml-1.5 opacity-0 group-hover/link:opacity-70 transition-opacity -mt-0.5" />
          </h3>
        </a>

        {/* Excerpt */}
        {!compact && excerpt && (
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
            {excerpt}
          </p>
        )}

        {/* Optional thumbnail */}
        {!compact && article.image_url && (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 max-h-40">
            <img
              src={article.image_url}
              alt=""
              loading="lazy"
              className="w-full h-36 object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Footer Row */}
      <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-[#1c1c22] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {(article.categories || []).slice(0, compact ? 2 : 3).map((cat) => (
            <span
              key={cat.id || cat.slug}
              className="rounded-md bg-zinc-100 dark:bg-[#19191f] px-2 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-400"
            >
              {cat.name}
            </span>
          ))}

          {article.cluster_id && article.corroboration_count > 1 && onOpenCluster && (
            <button
              type="button"
              onClick={() => onOpenCluster(article.cluster_id!)}
              className="inline-flex items-center gap-1 rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20"
            >
              <Layers className="h-3 w-3" />
              {article.corroboration_count} sources
            </button>
          )}
        </div>

        {(onToggleRead || onToggleBookmark) && (
          <div className="flex items-center gap-1 shrink-0">
            {onToggleRead && (
              <button
                type="button"
                onClick={() => onToggleRead(article)}
                title={article.is_read ? 'Mark as unread' : 'Mark as read'}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
              >
                {article.is_read ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{article.is_read ? 'Read' : 'Unread'}</span>
              </button>
            )}

            {onToggleBookmark && (
              <button
                type="button"
                onClick={() => onToggleBookmark(article)}
                title={article.is_bookmarked ? 'Remove bookmark' : 'Save article'}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors',
                  article.is_bookmarked
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                )}
              >
                <Bookmark className={cn('h-3.5 w-3.5', article.is_bookmarked && 'fill-current')} />
                <span className="hidden sm:inline">{article.is_bookmarked ? 'Saved' : 'Save'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
