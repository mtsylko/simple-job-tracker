import { Button } from '@/components/ui/button.tsx';

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext
}: PaginationControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <Button variant="outline" disabled={page <= 1} onClick={onPrevious}>
        Previous
      </Button>
      <Button variant="outline" disabled={page >= totalPages} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}
