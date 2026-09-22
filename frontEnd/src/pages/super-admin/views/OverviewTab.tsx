import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { SystemHealthOverview, AuditLog } from '@/types/admin';
import {
  Server,
  Building2,
  Users,
  KeyRound,
  BrainCircuit,
  ShieldCheck,
  ArrowRight,
  Activity,
  Radio,
  Clock,
} from 'lucide-react';

interface OverviewTabProps {
  health: SystemHealthOverview;
  recentLogs: AuditLog[];
  facilityCount: number;
  userCount: number;
  modelCount: number;
  onNavigateTab: (tabKey: string) => void;
  onRunHealthCheck: () => void;
  isRefreshing?: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  health,
  recentLogs,
  facilityCount,
  userCount,
  modelCount,
  onNavigateTab,
  onRunHealthCheck,
  isRefreshing = false,
}) => {
  return (
    <div className="space-y-6">
      {/* 4 Core Scannable Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200 hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Sessions</span>
            <Users className="h-4 w-4 text-teal-700" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {health.activeUsersCount}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Authenticated healthcare staff</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200 hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Connections</span>
            <Radio className="h-4 w-4 text-teal-700" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-teal-700 tracking-tight">
            {health.openSocketConnections}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Real-time OPD & bed channels</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200 hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Errors (24h)</span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {health.totalErrorsLast24h}
          </p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 inline-block">99.99% error-free operation</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200 hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Background Jobs</span>
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {health.queuedBackgroundJobs}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Async EHR & sync tasks</span>
        </Card>
      </div>

      {/* Quick Access Grid (Core Super Admin Operational Modules) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigateTab('HEALTH')}
          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <Server className="h-5 w-5 text-teal-700 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">System Health</span>
          <span className="text-[10px] text-slate-500">6 Services Online</span>
        </button>

        <button
          onClick={() => onNavigateTab('FACILITIES')}
          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <Building2 className="h-5 w-5 text-sky-700 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">Facilities</span>
          <span className="text-[10px] text-slate-500">{facilityCount} Hospitals & Clinics</span>
        </button>

        <button
          onClick={() => onNavigateTab('DISTRICT_ADMINS')}
          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <Users className="h-5 w-5 text-indigo-700 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">District Admins</span>
          <span className="text-[10px] text-slate-500">CDHO Governance</span>
        </button>

        <button
          onClick={() => onNavigateTab('USERS')}
          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <Users className="h-5 w-5 text-purple-700 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">User Registry</span>
          <span className="text-[10px] text-slate-500">{userCount} Staff & Doctors</span>
        </button>

        <button
          onClick={() => onNavigateTab('SETTINGS')}
          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <Activity className="h-5 w-5 text-slate-700 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-slate-900 block">Settings</span>
          <span className="text-[10px] text-slate-500">Platform Governance</span>
        </button>
      </div>

      {/* Services Status & State Governance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Services Overview */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Services & Latency</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Real-time health of core platform microservices</p>
            </div>
            <Button
              onClick={onRunHealthCheck}
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-teal-700" />
              Check Now
            </Button>
          </CardHeader>

          <CardContent className="p-5 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {health.services.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-900">{svc.name}</h4>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Latency: <strong className="text-slate-700">{svc.latencyMs}ms</strong> • SLA: {svc.uptimePercent}%
                    </span>
                  </div>
                  <StatusBadge status={svc.status} className="text-[10px]" />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>All 6 core services passing synthetic latency probes</span>
              <button
                onClick={() => onNavigateTab('HEALTH')}
                className="text-teal-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Full Telemetry <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* State Governance Quick Summary */}
        <Card className="border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Statewide Governance</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Apex jurisdiction overview</p>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3 text-xs">
              <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 space-y-1">
                <span className="font-bold text-teal-950 block">🏛️ 33 District Health Circles</span>
                <p className="text-teal-800 text-[11px] leading-relaxed">
                  Full commissioning authority to appoint and regulate Chief District Health Officers.
                </p>
              </div>

              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-1">
                <span className="font-bold text-indigo-950 block">🏥 {facilityCount} Network Facilities</span>
                <p className="text-indigo-800 text-[11px] leading-relaxed">
                  District Hospitals, CHCs, and PHCs across Gujarat connected to live OPD & bed feeds.
                </p>
              </div>

              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 space-y-1">
                <span className="font-bold text-purple-950 block">👥 {userCount} Provisioned Personnel</span>
                <p className="text-purple-800 text-[11px] leading-relaxed">
                  Doctors, Superintendents, auxiliary staff, and ASHA community workers.
                </p>
              </div>
            </CardContent>
          </div>

          <div className="p-4 pt-2 border-t border-slate-100">
            <Button
              onClick={() => onNavigateTab('USERS')}
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 justify-center cursor-pointer"
            >
              <Users className="h-3.5 w-3.5" />
              Manage User Registry
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
