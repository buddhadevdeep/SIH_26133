import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { operationsApi } from '@/api/operationsApi';
import {
  FacilityOperationsSummary,
  FacilityOperationalStatus,
  OperationalService,
  OperationalIssue,
} from '@/types/operations';
import { FacilityStatusModal } from './components/FacilityStatusModal';
import { BroadcastNoticeModal } from './components/BroadcastNoticeModal';
import { ServiceInterruptionModal } from './components/ServiceInterruptionModal';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Megaphone,
  UserCheck,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';

export const FacilityOperationsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<FacilityOperationsSummary | null>(null);
  const [issues, setIssues] = useState<OperationalIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<OperationalService | null>(null);

  const loadData = async () => {
    try {
      const [sumRes, issRes] = await Promise.all([
        operationsApi.getSummary(user?.facilityId || undefined),
        operationsApi.getIssues(),
      ]);
      if (sumRes.data) setSummary(sumRes.data);
      if (issRes.data) setIssues(issRes.data);
    } catch (err) {
      console.error('Failed to load facility operations data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Poll every 30 seconds for live telemetry
    return () => clearInterval(interval);
  }, [user?.facilityId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleResolveIssue = async (issueId: string) => {
    try {
      await operationsApi.resolveIssue(issueId);
      setIssues((prev) =>
        prev.map((iss) => (iss.id === issueId ? { ...iss, resolved: true, resolvedAt: new Date().toISOString() } : iss))
      );
      setActionNotice('Operational alert acknowledged & marked resolved.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error('Failed to resolve issue:', err);
    }
  };

  const activeIssues = issues.filter((i) => !i.resolved);
  const highestIssue = activeIssues.find((i) => i.severity === 'CRITICAL') || activeIssues[0];

  const getStatusBadge = (status: FacilityOperationalStatus) => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'Fully Operational',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'LIMITED_SERVICES':
        return {
          label: 'Limited Services',
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'EMERGENCY_ONLY':
        return {
          label: 'Emergency Intake Only',
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500 animate-ping',
        };
      case 'TEMPORARILY_UNAVAILABLE':
        return {
          label: 'Temporarily Unavailable',
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          dot: 'bg-orange-500',
        };
      case 'CLOSED':
        return {
          label: 'Facility Closed',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-500',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 text-teal-700 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Connecting to Facility Operational Telemetry...</p>
      </div>
    );
  }

  const facilityStatus = summary?.operationalStatus || 'OPEN';
  const statusMeta = getStatusBadge(facilityStatus);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-3.5 text-xs font-semibold text-teal-900 flex items-center justify-between animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-teal-700 hover:text-teal-950 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Global Facility Operational Header - Clean Green Theme */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-teal-100 text-teal-900 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-teal-300">
              Operations Control Center
            </span>
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.bg}`}>
              <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
              <span>{statusMeta.label}</span>
            </div>
            <span className="text-xs text-slate-500">
              Updated {new Date(summary?.lastStatusUpdate || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {summary?.updatedBy || 'Operations Desk'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {summary?.facilityName || 'Gandhinagar Civil Hospital'}
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl">
            Live operations matrix: Monitoring capacity freshness, clinical departmental bottlenecks, queue velocity, and emergency referrals.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link to="/facility-operations/staff-leave">
            <Button
              variant="outline"
              className="border-teal-300 text-teal-800 hover:bg-teal-100 font-bold text-xs gap-1.5 min-h-[40px] px-3.5 rounded-xl shadow-xs cursor-pointer relative"
            >
              <Calendar className="h-4 w-4 text-teal-700" />
              <span>Staff Leave & Coverage</span>
              {(summary?.telemetry.pendingStaffLeavesCount || 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                  {summary?.telemetry.pendingStaffLeavesCount}
                </span>
              )}
            </Button>
          </Link>

          <Button
            onClick={() => setStatusModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 min-h-[40px] px-4 rounded-xl shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4 text-teal-200" />
            Update Facility Status
          </Button>

          <Button
            onClick={() => setBroadcastModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs gap-2 min-h-[42px] px-4 cursor-pointer shadow-xs"
          >
            <Megaphone className="h-4 w-4 text-teal-400" />
            Broadcast Notice
          </Button>

          <Button
            onClick={handleRefresh}
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 h-10 w-10 min-h-[40px] cursor-pointer"
            title="Refresh live telemetry"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* "Needs Attention Now" Actionable Triage Banner */}
      {highestIssue && (
        <div className="rounded-2xl bg-amber-50/90 border border-amber-300 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  Needs Attention Now • {highestIssue.category}
                </span>
                <span className="text-xs text-amber-700 font-medium">
                  {new Date(highestIssue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{highestIssue.title}</h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">{highestIssue.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Link to={highestIssue.actionPath}>
              <Button className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs gap-1.5 min-h-[38px] px-3.5 cursor-pointer shadow-xs">
                {highestIssue.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => handleResolveIssue(highestIssue.id)}
              className="border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs min-h-[38px] cursor-pointer"
            >
              Mark Handled
            </Button>
          </div>
        </div>
      )}

      {/* Real-time Telemetry Pulse Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Waiting Queue */}
        <Link to="/facility-operations/queues" className="group">
          <Card className="p-4 border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Queue Load</span>
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {summary?.telemetry.totalWaitingQueue || 0}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-semibold text-teal-700">
                  ~{summary?.telemetry.avgQueueWaitMinutes || 0}m avg wait
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 group-hover:text-teal-700 font-medium flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <span>View all queues</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </Card>
        </Link>

        {/* Ambulances Ready */}
        <Link to="/facility-operations/referrals" className="group">
          <Card className="p-4 border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ambulances</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <Truck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {summary?.telemetry.ambulancesReady || 0} <span className="text-sm font-semibold text-slate-400">/ {summary?.telemetry.ambulancesTotal || 0}</span>
              </p>
              <span className="text-xs font-semibold text-blue-700 mt-1 block">
                {(summary?.telemetry.ambulancesTotal || 0) - (summary?.telemetry.ambulancesReady || 0)} On Active Run
              </span>
            </div>
            <div className="text-[11px] text-slate-400 group-hover:text-teal-700 font-medium flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <span>Fleet telemetry</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </Card>
        </Link>

        {/* Pending Referrals */}
        <Link to="/facility-operations/referrals" className="group">
          <Card className="p-4 border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inbound Transfers</span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {summary?.telemetry.pendingIncomingReferrals || 0}
              </p>
              <span className="text-xs font-semibold text-indigo-700 mt-1 block">
                Awaiting Bed Allocation
              </span>
            </div>
            <div className="text-[11px] text-slate-400 group-hover:text-teal-700 font-medium flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <span>Coordinate transfers</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </Card>
        </Link>

        {/* Staff Duty & Leave Roster */}
        <Link to="/facility-operations/staff-leave" className="group col-span-2 lg:col-span-1">
          <Card className="p-4 border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Staff On Duty</span>
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {summary?.telemetry.staffOnDutyCount || 0}
              </p>
              {(summary?.telemetry.pendingStaffLeavesCount || 0) > 0 ? (
                <span className="text-xs font-bold text-amber-700 mt-1 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  {summary?.telemetry.pendingStaffLeavesCount} Leave Pending
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Roster Optimal
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 group-hover:text-teal-700 font-medium flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <span>Manage staff & leave</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Split: Department Matrix & Operations Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Status Matrix (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Department Operational Matrix</h2>
              <p className="text-xs text-slate-500">Live service health, queue wait times, and active clinician counts.</p>
            </div>
            <Link
              to="/facility-operations/services"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              Full Service Matrix <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {summary?.services.slice(0, 6).map((service) => {
              const isOp = service.status === 'OPERATIONAL';
              const isDeg = service.status === 'DEGRADED';
              const isOff = service.status === 'OFFLINE';

              return (
                <div
                  key={service.id}
                  className={`p-4 rounded-xl border transition-all bg-white hover:shadow-xs flex flex-col justify-between ${
                    isOff
                      ? 'border-rose-300 bg-rose-50/20'
                      : isDeg
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">{service.category}</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isOp
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isDeg
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {service.status}
                      </span>
                    </div>

                    {service.statusReason && (
                      <p className="text-xs text-amber-800 font-medium mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                        {service.statusReason}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Wait</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-teal-600" />
                          {service.currentWaitMinutes} mins
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Clinicians</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-emerald-600" />
                          {service.activeStaffCount} On Duty
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => setSelectedService(service)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                    >
                      Change Status →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Issues & Bulletins Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Operational Issues</h2>
              <p className="text-xs text-slate-500">{activeIssues.length} open bottlenecks flagged</p>
            </div>
            <Link
              to="/facility-operations/alerts"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              Alerts Center <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {activeIssues.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white border border-slate-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-800">All Operations Flowing Smoothly</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">No critical delays or capacity bottlenecks detected.</p>
              </div>
            ) : (
              activeIssues.slice(0, 4).map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-xl border bg-white shadow-xs transition-all ${
                    issue.severity === 'CRITICAL'
                      ? 'border-rose-300 ring-1 ring-rose-300/40'
                      : issue.severity === 'ATTENTION'
                      ? 'border-amber-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : issue.severity === 'ATTENTION'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {issue.category} • {issue.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(issue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1.5">{issue.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{issue.description}</p>
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                    <Link
                      to={issue.actionPath}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                    >
                      {issue.actionLabel} →
                    </Link>
                    <button
                      onClick={() => handleResolveIssue(issue.id)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Announcements */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5 text-teal-700" /> Active Bulletins
            </h3>
            <div className="space-y-2">
              {summary?.announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{ann.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{ann.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">Author: {ann.author}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FacilityStatusModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        currentStatus={facilityStatus}
        onStatusUpdated={(newStatus, reason) => {
          if (summary) {
            setSummary({
              ...summary,
              operationalStatus: newStatus,
              statusReason: reason,
              lastStatusUpdate: new Date().toISOString(),
            });
          }
          setActionNotice(`Facility status updated to ${newStatus}`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      <BroadcastNoticeModal
        open={broadcastModalOpen}
        onOpenChange={setBroadcastModalOpen}
        onNoticeCreated={(notice) => {
          if (summary) {
            setSummary({
              ...summary,
              announcements: [notice, ...summary.announcements],
            });
          }
          setActionNotice(`Operational bulletin "${notice.title}" transmitted.`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />

      <ServiceInterruptionModal
        open={!!selectedService}
        onOpenChange={(open) => !open && setSelectedService(null)}
        service={selectedService}
        onServiceUpdated={(updated) => {
          if (summary) {
            setSummary({
              ...summary,
              services: summary.services.map((s) => (s.id === updated.id ? updated : s)),
            });
          }
          setActionNotice(`Department "${updated.name}" updated to ${updated.status}.`);
          setTimeout(() => setActionNotice(null), 4000);
        }}
      />
    </div>
  );
};