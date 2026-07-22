export function PostCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full skeleton-shimmer" />
          <div className="flex-1">
            <div className="h-3 w-32 rounded skeleton-shimmer mb-2" />
            <div className="h-2.5 w-16 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="h-3 w-full rounded skeleton-shimmer" />
          <div className="h-3 w-11/12 rounded skeleton-shimmer" />
          <div className="h-3 w-3/4 rounded skeleton-shimmer" />
        </div>
        <div className="h-48 w-full rounded-xl skeleton-shimmer" />
      </div>
      <div className="px-4 pb-3 flex gap-1">
        <div className="h-8 w-16 rounded-full skeleton-shimmer" />
        <div className="h-8 w-16 rounded-full skeleton-shimmer" />
        <div className="h-8 w-16 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => <PostCardSkeleton key={i} />)}
    </div>
  );
}
