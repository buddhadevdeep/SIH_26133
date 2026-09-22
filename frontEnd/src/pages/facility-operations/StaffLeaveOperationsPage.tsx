import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { operationsApi } from '@/api/operationsApi';
import { DoctorLeave } from '@/types/admin';
import { LeaveReviewModal } from './components/LeaveReviewModal';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  ShieldAlert,
  Users,
  FileEdit,
  Building2,
  Eye,
  CalendarX,
} from 'lucide-react';

export const StaffLeaveOperationsPage: React.FC = () => {
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [selectedLeave, setSelectedLeave] = useState<DoctorLeave | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeFacility] = useState<{ id: string; name: string }>({
    id: 'fac_civil_01',
    name: 'Civil Hospital Gandhinagar',
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await operationsApi.getLeaves(activeFacility.id);
      if (res.success && res.data) {
        setLeaves(res.data);
      }
    } catch (err) {
      console.error('Failed to load facility leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [activeFacility.id]);

  // Today string for active leave checks
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute operational KPIs
  const kpis = useMemo(() => {
    const pending = leaves.filter((l) => l.status === 'PENDING').length;
    const changes = leaves.filter((l) => l.status === 'CHANGES_REQUIRED').length;
    const activeToday = leaves.filter(
      (l) => l.status === 'APPROVED' && l.startDate <= todayStr && l.endDate >= todayStr
    ).length;
    const criticalGaps = leaves.filter(
      (l) => (l.status === 'PENDING' || l.status === 'APPROVED') && l.serviceCoverageImpact === 'CRITICAL_GAP'
    ).length;
    const totalAffectedAppts = leaves.reduce((acc, curr) => {
      if (curr.status === 'PENDING' || curr.status === 'APPROVED') {
        return acc + (curr.affectedAppointmentsCount || 0);
      }
      return acc;
    }, 0);

    return {
      pending,
      changes,
      activeToday,
      criticalGaps,
      totalAffectedAppts,
    };
  }, [leaves, todayStr]);

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    leaves.forEach((l) => {
      if (l.department) set.add(l.department);
    });
    return Array.from(set);
  }, [leaves]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      // Status tab filter
      if (statusFilter === 'PENDING' && l.status !== 'PENDING') return false;
      if (statusFilter === 'CHANGES_REQUIRED' && l.status !== 'CHANGES_REQUIRED') return false;
      if (statusFilter === 'APPROVED' && l.status !== 'APPROVED') return false;
      if (statusFilter === 'CRITICAL_GAPS' && l.serviceCoverageImpact !== 'CRITICAL_GAP') return false;

      // Department filter
      if (departmentFilter !== 'ALL' && l.department !== departmentFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = l.doctorName.toLowerCase().includes(query);
        const matchesDept = (l.department || '').toLowerCase().includes(query);
        const matchesReason = (l.reason || '').toLowerCase().includes(query);
        const matchesId = l.id.toLowerCase().includes(query);
        return matchesName || matchesDept || matchesReason || matchesId;
      }

      return true;
    });
  }, [leaves, statusFilter, departmentFilter, searchQuery]);

  const handleOpenReview = (leave: DoctorLeave) => {
    setSelectedLeave(leave);
    setReviewModalOpen(true);
  };

  const handleReviewComplete = () => {
    loadLeaves();
    showToast('Facility leave & service coverage roster updated successfully.');
  };

  const formatDate = (dStr: string) => {
    try {
      const dt = new Date(dStr);
      return dt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const getDurationDays = (s: string, e: string) => {
    try {
      const start = new Date(s).getTime();
      const end = new Date(e).getTime();
      const diff = Math.round((end - start) / (1000 * 3600 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              {activeFacility.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Leave & Coverage
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review doctor leave requests, verify handovers, and ensure uninterrupted patient care.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadLeaves}
          disabled={loading}
          className="text-xs h-9 px-3 gap-1.5 border-slate-300 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
          Refresh
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`p-4 cursor-pointer transition-all border rounded-2xl ${
            statusFilter === 'PENDING'
              ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/40'
              : 'border-slate-200 bg-white hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {kpis.pending}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Awaiting decision
          </div>
        </Card>

        <Card
          onClick={() => setStatusFilter(statusFilter === 'APPROVED' ? 'ALL' : 'APPROVED')}
          className={`p-4 cursor-pointer transition-all border rounded-2xl ${
            statusFilter === 'APPROVED'
              ? 'border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/40'
              : 'border-slate-200 bg-white hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>On Leave Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {kpis.activeToday}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Doctors off-duty today
          </div>
        </Card>

        <Card
          onClick={() => setStatusFilter(statusFilter === 'CRITICAL_GAPS' ? 'ALL' : 'CRITICAL_GAPS')}
          className={`p-4 cursor-pointer transition-all border rounded-2xl ${
            statusFilter === 'CRITICAL_GAPS'
              ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/40'
              : 'border-slate-200 bg-white hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Coverage Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {kpis.criticalGaps}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            0 doctors remaining
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 bg-white rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Affected Patients</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {kpis.totalAffectedAppts}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Appointments to reschedule
          </div>
        </Card>
      </div>

      {/* Critical Coverage Gap Warning */}
      {kpis.criticalGaps > 0 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-xs text-rose-900 leading-relaxed">
            <strong className="font-bold">Coverage Alert:</strong> {kpis.criticalGaps} leave request(s) will leave a department with 0 doctors on duty. Ensure specialist handover is arranged before approving.
          </p>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Requests', count: leaves.length },
            { id: 'PENDING', label: 'Pending', count: kpis.pending },
            { id: 'APPROVED', label: 'Approved', count: leaves.filter((l) => l.status === 'APPROVED').length },
            { id: 'CHANGES_REQUIRED', label: 'Changes Needed', count: kpis.changes },
            { id: 'CRITICAL_GAPS', label: 'Coverage Gaps', count: kpis.criticalGaps },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Department Dropdown */}
        <div className="flex items-center gap-2">
          {departments.length > 0 && (
            <div className="w-48">
              <Select
                size="sm"
                value={departmentFilter}
                onValueChange={(val) => setDepartmentFilter(val)}
                options={[
                  { value: 'ALL', label: 'All Departments' },
                  ...departments.map((dept) => ({ value: dept, label: dept })),
                ]}
              />
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 sm:w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Leave Requests Card List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm font-medium text-slate-600">Loading staff leaves...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <CalendarX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <div className="font-semibold text-slate-700">No leave requests found</div>
            <div className="text-xs text-slate-400 mt-1">
              Try adjusting your search or selecting another tab.
            </div>
          </div>
        ) : (
          filteredLeaves.map((leave) => {
            const duration = getDurationDays(leave.startDate, leave.endDate);
            const isCriticalGap = leave.serviceCoverageImpact === 'CRITICAL_GAP';
            const isLimited = leave.serviceCoverageImpact === 'LIMITED';

            return (
              <div
                key={leave.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Doctor Details */}
                <div className="flex items-start gap-3 min-w-[220px]">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                    {leave.doctorName
                      .replace('Dr. ', '')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-sm">{leave.doctorName}</h3>
                      {leave.doctorId === 'usr_doc_01' && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                          HOD
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {leave.department || 'Cardiology'}
                    </p>
                  </div>
                </div>

                {/* Dates & Duration */}
                <div className="min-w-[170px]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {duration} {duration === 1 ? 'day' : 'days'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 capitalize">
                      {leave.category.toLowerCase()} leave
                    </span>
                  </div>
                </div>

                {/* Reason & Handover */}
                <div className="flex-1 max-w-sm">
                  <p className="text-xs text-slate-700 truncate" title={leave.reason}>
                    <span className="text-slate-400 font-medium">Reason:</span> {leave.reason}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <span className="text-slate-400 font-medium">Handover:</span>{' '}
                    <span className="font-semibold text-emerald-800">
                      {leave.handoverDoctorName || 'Dr. Meena Parmar'}
                    </span>
                  </p>
                </div>

                {/* Impact, Status & Action */}
                <div className="flex items-center flex-wrap md:flex-nowrap gap-3 shrink-0">
                  {/* Coverage Impact Badge */}
                  {isCriticalGap ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      0 Remaining
                    </span>
                  ) : isLimited ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      1 Remaining
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Covered
                    </span>
                  )}

                  {/* Status Badge */}
                  {leave.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                  {leave.status === 'CHANGES_REQUIRED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                      <FileEdit className="w-3 h-3" />
                      Changes
                    </span>
                  )}
                  {leave.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Approved
                    </span>
                  )}
                  {leave.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </span>
                  )}

                  {/* Action Button */}
                  <Button
                    size="sm"
                    variant={leave.status === 'PENDING' ? 'primary' : 'outline'}
                    className={`text-xs h-8 px-3.5 gap-1.5 cursor-pointer ${
                      leave.status === 'PENDING'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                    onClick={() => handleOpenReview(leave)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {leave.status === 'PENDING' ? 'Review' : 'View'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Leave Review & Operational Decision Modal */}
      <LeaveReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        leave={selectedLeave}
        onActionComplete={handleReviewComplete}
      />
    </div>
  );
};
