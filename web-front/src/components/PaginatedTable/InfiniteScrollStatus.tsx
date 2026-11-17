type InfiniteScrollStatusProps = {
  hasMore: boolean;
};

export function InfiniteScrollStatus({ hasMore }: InfiniteScrollStatusProps) {
  return (
    <p className="text-xs text-muted-foreground">
      {hasMore ? 'Scroll to load more' : 'All rows loaded'}
    </p>
  );
}
