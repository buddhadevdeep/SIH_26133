import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmergencyModal } from './EmergencyModal';
import { AdminEmergencyModal } from './AdminEmergencyModal';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const EmergencyButton: React.FC<{ className?: string; compact?: boolean }> = ({
  className,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { role } = useAuth();

  const isAdminRole = role === 'SUPER_ADMIN' || role === 'DISTRICT_ADMIN';

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="emergency"
        size={compact ? 'sm' : 'md'}
        className={cn('gap-2 shadow-xs cursor-pointer', className)}
        aria-label={isAdminRole ? 'Emergency Operations & Readiness' : 'Emergency Medical Assistance'}
      >
        <ShieldAlert className="h-4 w-4" />
        <span>{compact ? 'SOS' : isAdminRole ? 'Emergency Ops' : t('common.emergency')}</span>
      </Button>

      {isAdminRole ? (
        <AdminEmergencyModal open={open} onOpenChange={setOpen} />
      ) : (
        <EmergencyModal open={open} onOpenChange={setOpen} />
      )}
    </>
  );
};
