import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/80', className)} {...props} />;
};

export const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <div className="pt-2 flex gap-2">
      <Skeleton className="h-9 w-24 rounded-lg" />
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="w-full rounded-xl border border-slate-200 bg-white p-4 space-y-3">
    <Skeleton className="h-8 w-full rounded" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full rounded" />
    ))}
  </div>
);
