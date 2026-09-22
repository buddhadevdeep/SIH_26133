import React from 'react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/auth';
import { PriorityLevel } from '@/types/queue';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    success: 'bg-[#E1EFFA] text-[#1D6394] border-[#C6E0F2]',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    destructive: 'bg-rose-50 text-rose-800 border-rose-200 font-semibold',
    info: 'bg-[#F0F6FA] text-[#2B6CB0] border-[#C6E0F2]',
    outline: 'border-slate-300 text-slate-700 bg-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel | string; className?: string }> = ({ priority, className }) => {
  const p = priority?.toUpperCase();
  if (p === 'EMERGENCY') {
    return (
      <Badge variant="destructive" className={cn('bg-red-600 text-white border-transparent animate-pulse', className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />
        EMERGENCY
      </Badge>
    );
  }
  if (p === 'URGENT') {
    return (
      <Badge variant="warning" className={className}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
        URGENT
      </Badge>
    );
  }
  return (
    <Badge variant="default" className={className}>
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 inline-block" />
      ROUTINE
    </Badge>
  );
};

export const RoleBadge: React.FC<{ role: UserRole | string; subType?: string; className?: string }> = ({ role, subType, className }) => {
  const roleLabels: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    PATIENT: { label: 'Patient', variant: 'info' },
    ASHA: { label: 'ASHA Worker', variant: 'success' },
    DOCTOR: { label: 'Doctor / Specialist', variant: 'default' },
    FACILITY_STAFF: { label: subType ? `Staff: ${subType.replace(/_/g, ' ')}` : 'Facility Staff', variant: 'warning' },
    DISTRICT_ADMIN: { label: 'District Admin', variant: 'default' },
    SUPER_ADMIN: { label: 'Super Admin (Tech)', variant: 'destructive' },
    SYSTEM: { label: 'Automated System', variant: 'outline' },
  };

  const item = roleLabels[role] || { label: role, variant: 'default' };

  return (
    <Badge variant={item.variant} className={className}>
      {item.label}
    </Badge>
  );
};

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  const s = status?.toUpperCase();
  let variant: BadgeProps['variant'] = 'default';

  if (['OPEN', 'ONLINE', 'HEALTHY', 'COMPLETED', 'DISPENSED', 'OPTIMAL', 'ACCEPTED'].includes(s)) {
    variant = 'success';
  } else if (['WAITING', 'PENDING', 'LOW', 'MODERATE', 'WATCH', 'WARNING', 'MAINTENANCE'].includes(s)) {
    variant = 'warning';
  } else if (['CRITICAL', 'DOWN', 'EMERGENCY', 'HIGH_RISK', 'REJECTED', 'CANCELLED', 'OUT_OF_STOCK'].includes(s)) {
    variant = 'destructive';
  } else if (['IN_CONSULTATION', 'PROCESSING', 'SYNCING', 'CALLED', 'ACTIVE'].includes(s)) {
    variant = 'info';
  }

  return (
    <Badge variant={variant} className={className}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};
