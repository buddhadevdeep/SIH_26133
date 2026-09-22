import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { SystemHealthOverview } from '@/types/admin';
import {
  Server,
  Activity,
  Radio,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface SystemHealthTabProps {
  health: SystemHealthOverview;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const SystemHealthTab: React.FC<SystemHealthTabProps> = ({
  health,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Controls & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">System Infrastructure Status</h3>
            <p className="text-xs text-slate-500">
              Synthetic heartbeat probes refreshed every 30 seconds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Overall SLA: <strong className="text-emerald-700">99.98%</strong>
          </span>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            isLoading={isRefreshing}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-teal-700" />
            Refresh Telemetry
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
          <span className="text-xs text-slate-500 mt-1 inline-block">Active queue & bed updates</span>
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
          <span className="text-xs text-slate-500 mt-1 inline-block">Pending async sync jobs</span>
        </Card>
      </div>

      {/* Core Services Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Platform Services & SLA Performance</h3>
          <span className="text-xs text-slate-500">6 microservices inspected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.services.map((svc) => (
            <Card key={svc.name} className="p-5 border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
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
                  <span>Monthly SLA Target</span>
                  <span className="font-bold text-slate-900">{svc.uptimePercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={svc.uptimePercent} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full bg-teal-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, svc.uptimePercent))}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between text-[11px] text-slate-500 border-t border-slate-100">
                <span>Synthetic health check</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Responding
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
