import React from 'react';
import { useConnection } from '@/contexts/ConnectionContext';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const StatusIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { networkState, pendingSyncCount, toggleSimulatedOffline, isSimulatedOffline } = useConnection();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleSimulatedOffline}
      title={isSimulatedOffline ? 'Click to restore online connection' : 'Click to simulate offline field mode'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wider transition-all cursor-pointer border shadow-xs select-none',
        networkState === 'ONLINE' && 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
        networkState === 'OFFLINE' && 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 animate-pulse',
        networkState === 'SYNCING' && 'bg-sky-50 text-sky-800 border-sky-200',
        className
      )}
    >
      {networkState === 'ONLINE' && (
        <>
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping opacity-75" />
          <Wifi className="h-3.5 w-3.5" />
          <span>{t('status.online')}</span>
        </>
      )}

      {networkState === 'OFFLINE' && (
        <>
          <WifiOff className="h-3.5 w-3.5 text-amber-700" />
          <span>{t('status.offline')}</span>
          {pendingSyncCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-600 px-1.5 py-0.2 text-[10px] text-white">
              {pendingSyncCount}
            </span>
          )}
        </>
      )}

      {networkState === 'SYNCING' && (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-600" />
          <span>{t('status.syncing')}</span>
        </>
      )}
    </button>
  );
};
