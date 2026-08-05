'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isRtl?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isRtl = false,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    let last: number | null = null;
    for (const i of range) {
      if (last !== null && i - last > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      last = i;
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <nav
      className={cn(
        'flex items-center gap-1 justify-center',
        className
      )}
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors',
          'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          'text-slate-600 dark:text-slate-400'
        )}
        aria-label="Previous page"
      >
        <PrevIcon size={18} />
      </button>

      {pages.map((page, index) => {
        if (typeof page === 'string') {
          return (
            <span
              key={`dots-${index}`}
              className="h-9 w-9 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400"
            >
              …
            </span>
          );
        }

        const pageNum = page;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              'h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors',
          'hover:bg-indigo-50 dark:hover:bg-indigo-950/30',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          'text-slate-600 dark:text-slate-400'
        )}
        aria-label="Next page"
      >
        <NextIcon size={18} />
      </button>
    </nav>
  );
}