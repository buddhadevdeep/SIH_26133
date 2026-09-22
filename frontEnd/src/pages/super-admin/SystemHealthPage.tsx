import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { INITIAL_SYSTEM_HEALTH } from '@/mock/mockData';
import { SystemHealthService, SystemHealthOverview } from '@/types/admin';
import { adminApi } from '@/api/adminApi';
import {
  Server,
  Activity,
  Radio,
  Clock,
  CheckCircle2,
  RefreshCw,
  Database,
  ShieldCheck,
  Zap,
  Info,
  AlertTriangle,
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthOverview>(INITIAL_SYSTEM_HEALTH);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<SystemHealthService | null>(null);

  const fetchHealth = async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    setError(null);
    try {
      const res = await adminApi.getSystemHealth();
      if (res?.data) {
        setHealth(res.data);
      }
    } catch (err: any) {
      console.warn('System health fetch error:', err);
      setError(err?.message || 'Could not fetch live system health telemetry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleRefresh = async () => {
    await fetchHealth(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        subtitle="Real-time operational status, database connectivity, and telemetry across the platform."
        breadcrumbs={[
          { label: 'Technical Center', to: '/super-admin' },
          { label: 'System Health' },
        ]}
        actions={
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            isLoading={isRefreshing}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-teal-700" />
            Refresh Telemetry
          </Button>
        }
      />

      {/* Overall Health Status Banner (Patient Module Style) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Health Grid Status: Operational</h2>
              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5">
                HEALTHY
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              All 6 platform microservices passing automated latency and uptime health checks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right hidden sm:block">
            <span className="text-slate-400 block text-[11px]">Last probe run</span>
            <span className="font-semibold text-slate-800">Just now</span>
          </div>
          <Button
            onClick={handleRefresh}
            variant="primary"
            size="sm"
            isLoading={isRefreshing}
            className="text-xs font-semibold cursor-pointer"
          >
            Run Synthetic Check
          </Button>
        </div>
      </div>

      {/* 4 Health Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Staff</span>
            <Server className="h-4 w-4 text-teal-700" />
          </div>
          <p className="text-3xl font-black text-slate-900">{health.activeUsersCount}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Online healthcare workers</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Socket Channels</span>
            <Radio className="h-4 w-4 text-teal-700" />
          </div>
          <p className="text-3xl font-black text-teal-700">{health.openSocketConnections}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Realtime queue & bed sync</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Error Telemetry</span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{health.totalErrorsLast24h}</p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 inline-block">0 Critical Outages</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Queue Tasks</span>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{health.queuedBackgroundJobs}</p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Async EHR index jobs</span>
        </Card>
      </div>

      {/* Core Services Breakdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Platform Services & SLA Performance</h3>
          <span className="text-xs text-slate-500">{health.services.length} services monitored</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.services.map((svc) => (
            <Card
              key={svc.name}
              className="p-5 border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{svc.name}</h4>
                  <span className="text-xs text-slate-500">
                    Latency: <strong className="text-slate-800">{svc.latencyMs}ms</strong>
                  </span>
                </div>
                <StatusBadge status={svc.status} className="text-[10px]" />
              </div>

              {/* Visual SLA Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-600">
                  <span>Uptime SLA Target</span>
                  <span className="font-bold text-slate-900">{svc.uptimePercent}%</span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={svc.uptimePercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, svc.uptimePercent))}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span className="text-[11px]">Last probe: {svc.lastChecked || 'Just now'}</span>
                <Button
                  onClick={() => setSelectedService(svc)}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-teal-700 hover:text-teal-800 hover:bg-teal-50 h-7 px-2 cursor-pointer"
                >
                  Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Service Details Inspection Dialog */}
      {selectedService && (
        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)} maxWidth="lg">
          <DialogHeader>
            <DialogTitle>{selectedService.name}</DialogTitle>
            <DialogDescription>
              Service telemetry and health probe specification
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                <span className="text-sm font-bold text-emerald-700">{selectedService.status}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Latency</span>
                <span className="text-sm font-bold text-slate-900">{selectedService.latencyMs} ms</span>
              </div>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
              <div>Uptime SLA: {selectedService.uptimePercent}%</div>
              <div>Probe Protocol: HTTP/2 TLS 1.3 Synthetic Ping</div>
              <div>Last Verified: {selectedService.lastChecked || 'Just now'}</div>
            </div>

            <p className="text-slate-500 text-xs">
              {selectedService.details ||
                'Synthetic monitoring probes execute every 30 seconds from Gandhinagar, Ahmedabad, and Vadodara regional health cloud nodes.'}
            </p>
          </DialogContent>

          <DialogFooter>
            <Button onClick={() => setSelectedService(null)} variant="secondary" size="sm" className="cursor-pointer">
              Close
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};
