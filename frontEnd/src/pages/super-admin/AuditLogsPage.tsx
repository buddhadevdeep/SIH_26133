import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/Dialog';
import { INITIAL_AUDIT_LOGS } from '@/mock/mockData';
import { AuditLog } from '@/types/admin';
import { adminApi } from '@/api/adminApi';
import {
  ShieldCheck,
  Search,
  Download,
  Clock,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Users,
  Eye,
  Laptop,
  Network,
  Calendar,
  FileText,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

const formatActionName = (action: string): string => {
  const map: Record<string, string> = {
    CREATE_CLINICAL_REFERRAL: 'Dispatched Clinical Referral',
    DISPENSE_MEDICATION: 'Dispensed Pharmacy Medication',
    ACKNOWLEDGE_OUTBREAK_ALERT: 'Acknowledged Outbreak Alert',
    DEPLOY_ML_MODEL: 'Deployed Clinical AI Model',
    CREATE_FACILITY: 'Registered Healthcare Facility',
    AUTH_SUSPICIOUS_ACCESS: 'Intercepted Unauthorized Access',
    UPDATE_BED_AVAILABILITY: 'Updated Inpatient Bed Count',
    USER_CREATE: 'Created System User Account',
    USER_DEACTIVATE: 'Deactivated User Account',
    FACILITY_CREATE: 'Created Health Facility',
    MODEL_DEPLOY: 'Deployed Model Version',
    MODEL_ROLLBACK: 'Rolled Back Model Version',
  };
  return map[action] || action.replace(/_/g, ' ');
};

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedResource, setSelectedResource] = useState('ALL');
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);

  const fetchLogs = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs(
        selectedAction !== 'ALL' ? { action: selectedAction } : undefined
      );
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setLogs(res.data);
      }
    } catch (err: any) {
      console.warn('Audit logs fetch error:', err);
      setError(err?.message || 'Could not fetch live audit logs.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  // Distinct action types
  const actionTypes = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action)));
  }, [logs]);

  // Distinct resource types
  const resourceTypes = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.resourceType)));
  }, [logs]);

  // Filter logs
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        l.resourceType.toLowerCase().includes(q) ||
        l.resourceId.toLowerCase().includes(q) ||
        (l.details?.toLowerCase().includes(q) ?? false) ||
        (l.ipAddress?.includes(q) ?? false);

      const matchesAction = selectedAction === 'ALL' || l.action === selectedAction;
      const matchesStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
      const matchesResource = selectedResource === 'ALL' || l.resourceType === selectedResource;

      return matchesSearch && matchesAction && matchesStatus && matchesResource;
    });
  }, [logs, searchQuery, selectedAction, selectedStatus, selectedResource]);

  // Top scannable metrics
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
  const deniedCount = logs.filter((l) => l.status === 'DENIED').length;
  const uniqueActors = new Set(logs.map((l) => l.actorName)).size;

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit-trail-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Patient-Standard Page Header */}
      <PageHeader
        title="Audit Trail & Security Logs"
        subtitle="Tamper-evident activity stream tracking clinical access, administrative changes, and security events."
        breadcrumbs={[
          { label: 'HealthConnect', to: '/' },
          { label: 'Technical Center', to: '/super-admin' },
          { label: 'Audit Logs' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchLogs(true)}
              variant="outline"
              size="sm"
              isLoading={isRefreshing}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-teal-700" />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-teal-700" />
              Export Audit Trail (.JSON)
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchLogs(true)}>Retry</Button>
        </div>
      )}

      {/* Top 4 Operational Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Logged Events</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{logs.length}</div>
          <span className="text-[11px] text-slate-500">Verified by platform sentinel</span>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Successful Operations</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{successCount}</div>
          <span className="text-[11px] text-emerald-600 font-medium">100% normal authorization</span>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Access Denials / Alerts</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{deniedCount}</div>
          <span className="text-[11px] text-rose-600 font-medium">Intercepted & rate-limited</span>
        </Card>

        <Card className="p-4 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Operators</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{uniqueActors}</div>
          <span className="text-[11px] text-slate-500">Distinct staff & system nodes</span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search actor, action, IP, resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 text-xs"
            />
          </div>

          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full flex min-h-[44px] rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              {actionTypes.map((act) => (
                <option key={act} value={act}>
                  {formatActionName(act)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="w-full flex min-h-[44px] rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
            >
              <option value="ALL">All Target Resources</option>
              {resourceTypes.map((res) => (
                <option key={res} value={res}>
                  {res}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full flex min-h-[44px] rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="DENIED">Access Denied Only</option>
              <option value="ERROR">Errors Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table / Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No audit entries found"
          description="No security or operational log records matched your search criteria."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedAction('ALL');
            setSelectedStatus('ALL');
            setSelectedResource('ALL');
          }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const isSuccess = log.status === 'SUCCESS';
            const isDenied = log.status === 'DENIED';

            return (
              <Card
                key={log.id}
                className="p-4 border-slate-200 shadow-sm hover:border-teal-200 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isDenied
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : isDenied ? (
                          <ShieldAlert className="h-3 w-3 text-rose-600" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                        )}
                        {log.status}
                      </span>

                      <span className="font-semibold text-xs text-slate-900">
                        {formatActionName(log.action)}
                      </span>

                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                        {log.resourceType}: {log.resourceId}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {log.details || 'Operational transaction logged by platform core.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-slate-400" />
                        <strong className="text-slate-700">{log.actorName}</strong>
                      </span>
                      <RoleBadge role={log.actorRole} />
                      <span className="flex items-center gap-1 font-mono text-slate-400">
                        <Network className="h-3 w-3" />
                        {log.ipAddress || '10.91.242.1'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />
                        {log.timestamp.replace('T', ' ').slice(0, 19)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Button
                      onClick={() => setInspectingLog(log)}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-teal-700" />
                      Inspect Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inspect Event Modal */}
      {inspectingLog && (
        <Dialog open={Boolean(inspectingLog)} onOpenChange={(open) => !open && setInspectingLog(null)} maxWidth="2xl">
          <DialogContent className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2 text-teal-700 mb-1">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Security Event Inspector</span>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {formatActionName(inspectingLog.action)}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Immutable audit ledger record verified for compliance and accountability.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Record ID</span>
                  <span className="font-mono font-semibold text-slate-900">{inspectingLog.id}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Result Status</span>
                  <span
                    className={`font-semibold ${
                      inspectingLog.status === 'SUCCESS'
                        ? 'text-emerald-700'
                        : inspectingLog.status === 'DENIED'
                        ? 'text-rose-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {inspectingLog.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Timestamp</span>
                  <span className="text-slate-700 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {inspectingLog.timestamp.replace('T', ' ').slice(0, 19)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Network Origin IP</span>
                  <span className="font-mono text-slate-700 flex items-center gap-1 mt-0.5">
                    <Network className="h-3 w-3 text-slate-400" />
                    {inspectingLog.ipAddress}
                  </span>
                </div>
              </div>

              {/* Actor Information */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Operator & Authorization</span>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 block">{inspectingLog.actorName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">ID: {inspectingLog.actorId}</span>
                  </div>
                  <RoleBadge role={inspectingLog.actorRole} />
                </div>
              </div>

              {/* Resource & Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">Target Resource & Impact</span>
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="font-semibold">{inspectingLog.resourceType}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                    {inspectingLog.resourceId}
                  </span>
                </div>
                {inspectingLog.details && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{inspectingLog.details}</span>
                  </div>
                )}
              </div>

              {/* Client & Device */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Laptop className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-mono truncate">{inspectingLog.userAgent}</span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectingLog(null)}
                className="cursor-pointer"
              >
                Close Inspector
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
