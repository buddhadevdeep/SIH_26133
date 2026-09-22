import React from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  colorScheme?: 'teal' | 'blue' | 'amber' | 'emerald' | 'rose';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  changePercent,
  trend,
  colorScheme = 'teal',
  className,
}) => {
  const schemeStyles = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <Card className={cn('p-5 flex flex-col justify-between hover:shadow-md transition-all', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={cn('rounded-xl p-3 border', schemeStyles[colorScheme])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(subtitle || changePercent !== undefined) && (
        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          {changePercent !== undefined && (
            <span
              className={cn(
                'inline-flex items-center font-semibold',
                trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-600'
              )}
            >
              {trend === 'up' && <TrendingUp className="mr-0.5 h-3.5 w-3.5" />}
              {trend === 'down' && <TrendingDown className="mr-0.5 h-3.5 w-3.5" />}
              {changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </Card>
  );
};
