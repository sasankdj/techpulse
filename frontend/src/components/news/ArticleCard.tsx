
import { useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Circle,
  ExternalLink,
  Flame,
  Layers,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Clock3,
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
  const [expanded, setExpanded] = useState(false);

  const excerpt = article.content_excerpt || article.description || '';

  const handleExpand = () => {
    setExpanded((current) => !current);
  };

  const handleOpenArticle = () => {
    if (!article.is_read && onToggleRead) {
      onToggleRead(article);
    }
  };

  return (
    <article
      onClick={handleExpand}
      className={cn(
        'group cursor-pointer rounded-xl border border-zinc-200/90 dark:border-[#222228] bg-white dark:bg-[#111114] hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-200 flex flex-col',
        compact ? 'p-3.5' : 'p-4',
        article.is_read && 'opacity-80'
      )}
    >
      <div>
        {/* Source and metadata */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {article.source?.favicon_url ? (
              <img
                src={article.source.favicon_url}
                alt=""
                className="h-4 w-4 rounded-sm shrink-0"
                loading="lazy"
              />
            ) : (
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
            )}

            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
              {article.source?.name || 'Tech Source'}
            </span>

            <span className="text-zinc-400">·</span>

            <time className="text-[11px] text-zinc-500 shrink-0">
              {formatRelativeTime(article.published_at)}
            </time>
          </div>

          {getImportanceBadge(article.importance_label, article.importance_score)}
        </div>

        {/* Headline */}
        <h3 className="font-semibold text-[15px] leading-snug text-zinc-900 dark:text-zinc-100">
          {article.title}
        </h3>

        {/* Short preview when collapsed */}
        {!compact && excerpt && !expanded && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* Expanded content */}
        {expanded && (
          <div
            className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                Article Brief
              </h4>

              <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300 whitespace-pre-line break-words">
                {excerpt || 'No article summary is available yet.'}
              </p>
            </div>

            {article.image_url && (
              <img
                src={article.image_url}
                alt=""
                loading="lazy"
                className="w-full max-h-64 object-cover rounded-lg"
              />
            )}

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenArticle}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-medium text-white transition-colors"
            >
              Read Original Article
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-[#1c1c22] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(article.categories || []).slice(0, compact ? 2 : 3).map((cat) => (
            <span
              key={cat.id || cat.slug}
              className="rounded-md bg-zinc-100 dark:bg-[#19191f] px-2 py-1 text-[11px] text-zinc-600 dark:text-zinc-400"
            >
              {cat.name}
            </span>
          ))}

          {article.cluster_id && article.corroboration_count > 1 && onOpenCluster && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCluster(article.cluster_id!);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-600 dark:text-indigo-400"
            >
              <Layers className="h-3 w-3" />
              {article.corroboration_count} sources
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!compact && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExpand();
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {expanded ? 'Show less' : 'Read brief'}
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {onToggleRead && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleRead(article);
              }}
              title={article.is_read ? 'Mark as unread' : 'Mark as read'}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {article.is_read ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </button>
          )}

          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(article);
              }}
              title={article.is_bookmarked ? 'Remove bookmark' : 'Save article'}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Bookmark
                className={cn(
                  'h-4 w-4',
                  article.is_bookmarked && 'fill-current text-indigo-500'
                )}
              />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
