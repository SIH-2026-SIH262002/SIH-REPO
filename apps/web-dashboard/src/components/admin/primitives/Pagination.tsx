import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number; // 1-indexed
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, totalItems, pageSize, onPageChange }) => {
  if (totalItems === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--adm-border)] text-xs text-[var(--adm-ink-3)]">
      <span>
        Showing <strong className="text-[var(--adm-ink-2)]">{start}–{end}</strong> of{' '}
        <strong className="text-[var(--adm-ink-2)]">{totalItems}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="p-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] disabled:opacity-40 hover:bg-[var(--adm-raised)]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-2">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="p-1.5 rounded-[var(--adm-radius)] border border-[var(--adm-border)] disabled:opacity-40 hover:bg-[var(--adm-raised)]"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
