import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  INITIAL_SYSTEM_HEALTH,
  INITIAL_FACILITIES,
  INITIAL_AUDIT_LOGS,
  DEMO_USERS,
  INITIAL_AI_MODELS,
} from '@/mock/mockData';
import { Facility } from '@/types/facility';
import { User } from '@/types/auth';
import { AiModelRegistryItem, AuditLog, SystemHealthOverview } from '@/types/admin';
import { adminApi } from '@/api/adminApi';
import { facilityApi } from '@/api/facilityApi';
import {
  Server,
  Building2,
  Users,
  KeyRound,
  BrainCircuit,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
  Radio,
  Clock,
  RefreshCw,
  Sliders,
  Bell,
  ShieldAlert,
  UserCheck,
  Crown,
  MapPin,
} from 'lucide-react';

export const TechnicalCenterPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthOverview>(INITIAL_SYSTEM_HEALTH);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [users, setUsers] = useState<User[]>(Object.values(DEMO_USERS));
  const [models, setModels] = useState<AiModelRegistryItem[]>(INITIAL_AI_MODELS);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    setError(null);
    try {
      const [healthRes, facRes, userRes, modelRes, auditRes] = await Promise.allSettled([
        adminApi.getSystemHealth(),
        facilityApi.getAll(),
        adminApi.getUsers(),
        adminApi.getAiModels(),
        adminApi.getAuditLogs(),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value?.data) {
        setHealth(healthRes.value.data);
      }
      if (facRes.status === 'fulfilled' && facRes.value?.data && Array.isArray(facRes.value.data)) {
        setFacilities(facRes.value.data);
      }
      if (userRes.status === 'fulfilled' && userRes.value?.data && Array.isArray(userRes.value.data)) {
        setUsers(userRes.value.data);
      }
      if (modelRes.status === 'fulfilled' && modelRes.value?.data && Array.isArray(modelRes.value.data)) {
        setModels(modelRes.value.data);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value?.data && Array.isArray(auditRes.value.data)) {
        setRecentLogs(auditRes.value.data);
      }
    } catch (err: any) {
      console.warn('TechnicalCenter fetch error:', err);
      setError(err?.message || 'Could not refresh some technical center metrics.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleRefresh = async () => {
    await fetchOverviewData(true);
  };

  const offlineOrDegradedServices = health.services.filter(
    (s) => s.status === 'DEGRADED' || s.status === 'DOWN'
  );

  return (
    <div className="space-y-6">
      {/* Page Header matching Patient UI standard */}
      <PageHeader
        title="State Apex Command & Website Owner Console"
        subtitle="Supreme statutory authority across all 33 Gujarat districts • Public health infrastructure, AI systems, and CDHO jurisdictional commissioning."
        breadcrumbs={[
          { label: 'HealthConnect', to: '/' },
          { label: 'State Apex Command' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/super-admin/district-admins">
              <Button size="sm" className="text-xs gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold cursor-pointer">
                <UserCheck className="h-3.5 w-3.5" />
                District Admins
              </Button>
            </Link>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-teal-700" />
              Refresh Status
            </Button>
            <Link to="/super-admin/settings">
              <Button variant="secondary" size="sm" className="text-xs gap-1.5 cursor-pointer">
                <Sliders className="h-3.5 w-3.5 text-slate-600" />
                Settings
              </Button>
            </Link>
          </div>
        }
      />

      {/* Website Owner Apex Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-indigo-950 text-white p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-teal-600/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-0.5 text-xs font-bold text-amber-300 border border-amber-400/40">
              <Crown className="h-3.5 w-3.5 text-amber-300" />
              <span>Website Owner Console</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-0.5 text-xs font-semibold text-teal-200 border border-teal-400/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Gujarat State Health Grid</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">All Statewide Systems & Facilities Active</h2>
          <p className="text-xs text-teal-100/80 max-w-xl">
            6 core microservices active • 33 district health networks synchronized • Real-time socket queues connected across state civil hospitals.
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5 text-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-teal-200 block tracking-wider">State Platform Uptime</span>
          <span className="text-emerald-300 font-bold text-sm flex items-center justify-center gap-1.5 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            99.98% Operational
          </span>
        </div>
      </div>

      {/* 4 Core Scannable Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Staff</span>
            <Users className="h-4 w-4 text-teal-700" />
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {health.activeUsersCount}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Online healthcare workers</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Channels</span>
            <Radio className="h-4 w-4 text-teal-700" />
          </div>
          <p className="text-3xl font-black text-teal-700 tracking-tight">
            {health.openSocketConnections}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Live queue & bed channels</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Connected Units</span>
            <Building2 className="h-4 w-4 text-sky-700" />
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {facilities.length}
          </p>
          <span className="text-xs text-slate-500 mt-1 inline-block">Hospitals & health centres</span>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Error Rate (24h)</span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {health.totalErrorsLast24h}
          </p>
          <span className="text-xs text-emerald-700 font-semibold mt-1 inline-block">99.99% error-free</span>
        </Card>
      </div>

      {/* Attention Needed Section */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-700" />
              <CardTitle className="text-base font-bold text-slate-900">Attention Needed</CardTitle>
            </div>
            <span className="text-xs text-slate-500">
              {offlineOrDegradedServices.length === 0 ? '0 active incidents' : `${offlineOrDegradedServices.length} alerts`}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {offlineOrDegradedServices.length > 0 ? (
            offlineOrDegradedServices.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>
                    Service <strong>{svc.name}</strong> is currently {svc.status.toLowerCase()}.
                  </span>
                </div>
                <Link to="/super-admin/system-health">
                  <Button variant="outline" size="sm" className="text-xs">
                    Investigate
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold block">No active service disruptions</span>
                <span className="text-emerald-700 text-[11px]">
                  All database nodes, authentication gateways, and realtime sockets are responding within target SLAs.
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <Clock className="h-4 w-4 text-slate-500 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">Scheduled Maintenance Window</span>
              <span className="text-slate-500 text-[11px]">
                Routine database vacuuming and index optimization scheduled for Sunday at 02:00 IST. No user downtime expected.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access to Operational Workspaces */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">Administrative & Jurisdictional Consoles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/super-admin/district-admins" className="group">
            <Card className="p-5 border-indigo-200 bg-indigo-50/30 hover:border-indigo-500 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800 group-hover:scale-105 transition-transform">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    Exclusive Authority
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">District Health Administrators</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Appoint, commission, or suspend Chief District Health Officers (CDHOs) holding statutory command across all 33 Gujarat districts.
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1 mt-4 group-hover:translate-x-0.5 transition-transform">
                Appoint & Manage CDHOs <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>

          <Link to="/super-admin/system-health" className="group">
            <Card className="p-5 border-slate-200 hover:border-teal-500 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:scale-105 transition-transform">
                    <Server className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Healthy
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">System Health</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Real-time latency metrics, uptime SLAs, and heartbeat probes across 6 core microservices.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 flex items-center gap-1 mt-4 group-hover:translate-x-0.5 transition-transform">
                Open Telemetry <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>

          <Link to="/super-admin/facilities" className="group">
            <Card className="p-5 border-slate-200 hover:border-teal-500 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 group-hover:scale-105 transition-transform">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {facilities.length} Facilities
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Facility Governance</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Public hospital registry, bed availability status, and clinical department capacities.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 flex items-center gap-1 mt-4 group-hover:translate-x-0.5 transition-transform">
                Manage Facilities <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>

          <Link to="/super-admin/users" className="group">
            <Card className="p-5 border-slate-200 hover:border-teal-500 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:scale-105 transition-transform">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {users.length} Accounts
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">User Management</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Healthcare staff credentials, facility assignments, role verification, and access controls.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 flex items-center gap-1 mt-4 group-hover:translate-x-0.5 transition-transform">
                Manage Users <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>

          <Link to="/super-admin/settings" className="group">
            <Card className="p-5 border-slate-200 hover:border-teal-500 hover:shadow-md transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:scale-105 transition-transform">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    Platform
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">Platform Settings</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Security policies, session timeouts, emergency mode overrides, and system telemetry controls.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 flex items-center gap-1 mt-4 group-hover:translate-x-0.5 transition-transform">
                Platform Governance <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};
