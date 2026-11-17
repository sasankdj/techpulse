import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { formatRelativeTime } from '../../lib/utils';
import { Modal, Skeleton, Badge } from '../ui/Primitives';

export function ArticleClusterModal({
  clusterId,
  onClose,
}: {
  clusterId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['article-cluster', clusterId],
    queryFn: () => api.getClusterArticles(clusterId!),
    enabled: Boolean(clusterId),
  });

  return (
    <Modal
      open={Boolean(clusterId)}
      onClose={onClose}
      title="Related Event Coverage"
      description="Independent sources covering the same technology announcement or incident."
      maxWidth="max-w-2xl"
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.articles || []).map((art) => (
            <a
              key={art.id}
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {art.source?.name || 'Source'}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">Score {Math.round(art.importance_score)}</Badge>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {formatRelativeTime(art.published_at)}
                  </span>
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-2">
                <span>{art.title}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              </p>
              {(art.content_excerpt || art.description) && (
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {art.content_excerpt || art.description}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </Modal>
  );
}
