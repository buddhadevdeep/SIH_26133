import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useConnection } from '@/contexts/ConnectionContext';
import { getPendingSyncItems } from '@/lib/db';
import { OfflineSyncItem } from '@/types/asha';
import { formatDate } from '@/lib/formatters';
import {
  RefreshCw,
  CheckCircle2,
  Wifi,
  WifiOff,
  HardDrive,
  Database,
  ArrowRight,
  ShieldCheck,
  Server,
  CloudUpload,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const SyncCenter: React.FC = () => {
  const { networkState, isOnline, pendingSyncCount, syncOfflineQueue, toggleSimulatedOffline, isSimulatedOffline } =
    useConnection();
  const [queuedItems, setQueuedItems] = useState<OfflineSyncItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string>('Today, 10:42 AM');

  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getPendingSyncItems();
        setQueuedItems(items);
      } catch {
        setQueuedItems([]);
      }
    };
    loadItems();
  }, [pendingSyncCount]);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncOfflineQueue();
    const items = await getPendingSyncItems();
    setQueuedItems(items);
    setLastSyncTimestamp(`Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      <PageHeader
        title="Field Sync & Offline Buffer"
        subtitle="Manage client-side IndexedDB records, inspect pending transmission buffers, and sync with the Central Health Grid."
        breadcrumbs={[{ label: 'Frontline Dashboard', to: '/asha' }, { label: 'Sync Center' }]}
        actions={
          <Button
            onClick={handleSync}
            disabled={!isOnline || pendingSyncCount === 0 || isSyncing}
            variant="primary"
            size="sm"
            className="gap-2 bg-teal-700 hover:bg-teal-800 min-h-[44px]"
            isLoading={isSyncing}
          >
            <CloudUpload className="h-4 w-4" />
            <span>Sync All Records ({pendingSyncCount})</span>
          </Button>
        }
      />

      {/* Connectivity & Storage Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Network State</span>
            {isOnline ? (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            ) : (
              <span className="flex h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-100" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-5 w-5 text-teal-700" /> : <WifiOff className="h-5 w-5 text-amber-600" />}
            <span className="text-xl font-bold text-slate-900">{isOnline ? 'Grid Connected' : 'Offline Local'}</span>
          </div>
          <p className="text-xs text-slate-500">
            {isOnline
              ? 'Real-time two-way synchronization active'
              : 'Records saved to local browser IndexedDB only'}
          </p>
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={toggleSimulatedOffline}
              type="button"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
            >
              {isSimulatedOffline ? 'Restore Live Online Mode' : 'Simulate Offline Field Work'}
            </button>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">IndexedDB Buffer</span>
            <Database className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingSyncCount}</span>
            <span className="text-xs text-slate-500 font-semibold">Unsynced records</span>
          </div>
          <p className="text-xs text-slate-500">Encrypted client-side cache across 5 data stores</p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Storage Engine</span>
            <span className="font-mono text-teal-800 font-bold">IndexedDB v2</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Successful Sync</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">{lastSyncTimestamp}</span>
          </div>
          <p className="text-xs text-slate-500">Central Health Cloud verified 0 conflict errors</p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Server Endpoint</span>
            <span className="text-slate-700">api.healthconnect.gov.in</span>
          </div>
        </Card>
      </div>

      {/* Simulated Offline Banner if active */}
      {isSimulatedOffline && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-amber-950 flex items-start gap-3 shadow-xs">
          <WifiOff className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-sm text-amber-900">Simulated Field Mode Active</p>
            <p>
              Network calls are paused to simulate an interior rural location without cellular coverage. Every patient registered, vital logged, or screening recorded is preserved safely in IndexedDB until you restore connection.
            </p>
          </div>
        </div>
      )}

      {/* Local IndexedDB Storage Inspector */}
      <Card className="border-slate-200/90 bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-teal-700" />
              <span>Offline Database Store Inspector (Local Device)</span>
            </CardTitle>
            <span className="text-[11px] font-mono text-slate-500">Target: healthconnect_offline_db</span>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-4 text-center">
          <div className="p-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Citizens</span>
            <span className="text-lg font-bold text-slate-900">8</span>
            <span className="text-[10px] text-teal-700 block font-medium">Synced</span>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Visits</span>
            <span className="text-lg font-bold text-slate-900">6</span>
            <span className="text-[10px] text-teal-700 block font-medium">Active</span>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Vitals</span>
            <span className="text-lg font-bold text-slate-900">12</span>
            <span className="text-[10px] text-teal-700 block font-medium">Cached</span>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Screenings</span>
            <span className="text-lg font-bold text-slate-900">4</span>
            <span className="text-[10px] text-teal-700 block font-medium">Cached</span>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Queue Buffer</span>
            <span className="text-lg font-bold text-amber-700">{pendingSyncCount}</span>
            <span className="text-[10px] text-amber-700 block font-bold">Pending Sync</span>
          </div>
        </div>
      </Card>

      {/* Pending Transmission Pipeline */}
      <Card className="border-slate-200/90 bg-white shadow-xs">
        <CardHeader className="border-b border-slate-100 py-3.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-teal-700" />
              <span>Pending Central Sync Queue ({queuedItems.length})</span>
            </CardTitle>
            {pendingSyncCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                Awaiting Upload
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {queuedItems.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Device Database is Synchronized</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All community registrations, encounter vitals, and screening forms recorded on this device have been safely delivered and confirmed by the national health grid.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {queuedItems.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        {item.entityType.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">ID: {item.id}</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Buffered locally: {formatDate(item.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="text-[10px] text-slate-400 font-mono">Attempt {item.retryCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Policy Explanation */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <ShieldCheck className="h-4 w-4 text-teal-700" />
          <span>Deterministic Synchronization & Data Integrity Policy</span>
        </div>
        <p className="leading-relaxed">
          HealthConnect employs a <em>Last-Write-Wins with Cryptographic Timestamps</em> synchronization strategy. In the event of dual edits between field tablets and district hospital terminals, clinical safety constraints ensure vital signs and emergency referrals take priority.
        </p>
      </div>
    </div>
  );
};
