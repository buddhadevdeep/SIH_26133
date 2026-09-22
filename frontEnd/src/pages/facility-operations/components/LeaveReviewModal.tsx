import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { DoctorLeave } from '@/types/admin';
import { StaffLeaveOperationalImpact } from '@/types/operations';
import { operationsApi } from '@/api/operationsApi';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Phone,
  ShieldAlert,
  Users,
  FileEdit,
  Loader2,
  Building2,
  X,
  Check,
} from 'lucide-react';

interface LeaveReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leave: DoctorLeave | null;
  onActionComplete: () => void;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  open,
  onOpenChange,
  leave,
  onActionComplete,
}) => {
  const [impact, setImpact] = useState<StaffLeaveOperationalImpact | null>(null);
  const [loadingImpact, setLoadingImpact] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'NONE' | 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'>('NONE');
  const [rejectionReason, setRejectionReason] = useState('');
  const [changesNote, setChangesNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real-time operational impact whenever a leave is opened
  useEffect(() => {
    if (!open || !leave) {
      setImpact(null);
      setActionType('NONE');
      setRejectionReason('');
      setChangesNote('');
      setError(null);
      return;
    }

    let isMounted = true;
    setLoadingImpact(true);
    setError(null);

    operationsApi
      .getLeaveImpact(leave.doctorId, leave.startDate, leave.endDate, leave.facilityId || 'fac_civil_01')
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setImpact(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch leave operational impact', err);
      })
      .finally(() => {
        if (isMounted) setLoadingImpact(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, leave]);

  if (!leave) return null;

  // Formatting helpers
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

  const getDayCount = (start: string, end: string) => {
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const diff = Math.round((e - s) / (1000 * 3600 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  const daysCount = getDayCount(leave.startDate, leave.endDate);

  // Submit Approval
  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await operationsApi.approveLeave(leave.id, 'Facility Operations Coordinator');
      if (res.success) {
        onActionComplete();
        onOpenChange(false);
      } else {
        setError(res.message || 'Failed to approve leave request.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while approving leave.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Rejection
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a mandatory justification for rejecting this leave request.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await operationsApi.rejectLeave(
        leave.id,
        rejectionReason.trim(),
        'Facility Operations Coordinator'
      );
      if (res.success) {
        onActionComplete();
        onOpenChange(false);
      } else {
        setError(res.message || 'Failed to reject leave request.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while rejecting leave.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Request Changes
  const handleRequestChanges = async () => {
    if (!changesNote.trim() || changesNote.trim().length < 8) {
      setError('Please provide specific instructions/clarification for the doctor (at least 8 characters).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await operationsApi.requestChanges(
        leave.id,
        changesNote.trim(),
        'Facility Operations Coordinator'
      );
      if (res.success) {
        onActionComplete();
        onOpenChange(false);
      } else {
        setError(res.message || 'Failed to request changes.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while requesting changes.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="2xl" className="p-0" hideCloseButton={true}>
      {/* Pinned Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-start justify-between gap-4 shrink-0 rounded-t-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {leave.category} Leave
            </span>
            {leave.status === 'PENDING' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                <Clock className="w-3 h-3" />
                Pending Review
              </span>
            )}
            {leave.status === 'CHANGES_REQUIRED' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                <FileEdit className="w-3 h-3" />
                Changes Requested
              </span>
            )}
            {leave.status === 'APPROVED' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                Approved
              </span>
            )}
            {leave.status === 'REJECTED' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                <XCircle className="w-3 h-3" />
                Rejected
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
            {leave.doctorName}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {leave.department || 'Cardiology'} • {leave.facilityName || 'Gandhinagar Civil Hospital'}
          </DialogDescription>
        </div>

        <div className="flex items-start gap-4 shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900">
              {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {daysCount} {daysCount === 1 ? 'day' : 'days'} duration
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-white">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Summary Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Reason & Notes */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="text-xs font-semibold text-slate-500">Reason for Leave</div>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {leave.reason || 'Not specified'}
            </p>
            {leave.notes && (
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                Note: "{leave.notes}"
              </p>
            )}
          </div>

          {/* Handover & Contact */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="text-xs font-semibold text-slate-500">Covering Colleague</div>
            <div className="text-xs font-bold text-emerald-800">
              {leave.handoverDoctorName || 'Dr. Meena Parmar'}
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-200">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>Emergency: {leave.emergencyContact || '9876505678'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Coverage & Service Impact */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Department Service Coverage
            </div>
            {loadingImpact ? (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                Checking coverage...
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-700">Verified</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-2.5 bg-slate-50 rounded-lg text-center">
              <div className="text-[11px] text-slate-500">Total in Dept</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">
                {impact ? impact.totalDoctorsInDepartment : 1}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg text-center">
              <div className="text-[11px] text-slate-500">Remaining on Duty</div>
              <div
                className={`text-lg font-bold mt-0.5 ${
                  (impact?.availableDoctorsDuringPeriod ?? 0) === 0
                    ? 'text-rose-600'
                    : 'text-emerald-700'
                }`}
              >
                {impact ? impact.availableDoctorsDuringPeriod : 0}
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg text-center col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500">Appts to Reschedule</div>
              <div
                className={`text-lg font-bold mt-0.5 ${
                  ((impact?.affectedAppointments?.length ?? 0) > 0 || (leave.affectedAppointmentsCount || 0) > 0)
                    ? 'text-amber-600'
                    : 'text-slate-800'
                }`}
              >
                {impact ? impact.affectedAppointments.length : leave.affectedAppointmentsCount || 0}
              </div>
            </div>
          </div>

          {/* Critical Gap Alert */}
          {impact?.coverageStatus === 'CRITICAL_GAP' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-900">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Coverage Alert:</strong> 0 doctors remaining in {leave.department || 'Cardiology'}. Please verify handover coverage.
              </span>
            </div>
          )}

          {/* Alternate Specialists */}
          {impact && impact.alternateDoctors && impact.alternateDoctors.length > 0 && (
            <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap pt-1">
              <span className="font-semibold text-slate-500">Other Doctors Available:</span>
              {impact.alternateDoctors.map((doc, i) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium">
                  {doc.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Affected Patient Appointments (if any) */}
        {impact && impact.affectedAppointments && impact.affectedAppointments.length > 0 && (
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Impacted Appointments ({impact.affectedAppointments.length})
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Auto-flagged for rescheduling</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
              {impact.affectedAppointments.map((apt: any) => (
                <div key={apt.id} className="py-2 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{apt.patientName}</span>
                    <span className="text-slate-400 ml-2 text-[11px]">
                      {formatDate(apt.date)} • {apt.timeSlot}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Reschedule
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Review Record if any */}
        {(leave.changesRequestedNote || leave.rejectionReason || leave.reviewedBy) && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
            <div className="font-semibold text-slate-700">Audit History:</div>
            {leave.reviewedBy && (
              <div className="text-slate-600">
                Reviewed by <span className="font-medium text-slate-900">{leave.reviewedBy}</span>
                {leave.reviewedAt && <span> on {formatDate(leave.reviewedAt)}</span>}
              </div>
            )}
            {leave.changesRequestedNote && (
              <div className="text-purple-800 bg-purple-50 p-2 rounded border border-purple-200">
                <strong>Changes Requested:</strong> {leave.changesRequestedNote}
              </div>
            )}
            {leave.rejectionReason && (
              <div className="text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
                <strong>Rejection Reason:</strong> {leave.rejectionReason}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pinned Action Decision Footer */}
      <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 shrink-0 rounded-b-3xl">
        {(leave.status === 'PENDING' || leave.status === 'CHANGES_REQUIRED') ? (
          <>
            {actionType === 'NONE' && (
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-xs h-9 px-4 cursor-pointer font-medium text-slate-600 hover:bg-slate-100"
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-9 px-3.5 cursor-pointer font-semibold"
                    onClick={() => setActionType('REJECT')}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs h-9 px-3.5 cursor-pointer font-semibold"
                    onClick={() => setActionType('REQUEST_CHANGES')}
                  >
                    <FileEdit className="w-3.5 h-3.5 mr-1" />
                    Request Changes
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 font-semibold shadow-xs cursor-pointer gap-1.5"
                    onClick={() => setActionType('APPROVE')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Leave
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Approve Confirmation */}
            {actionType === 'APPROVE' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Confirm Approval for {leave.doctorName}?
                  </span>
                  <span className="text-emerald-700 font-medium text-[11px]">
                    {formatDate(leave.startDate)} – {formatDate(leave.endDate)} ({daysCount} days)
                  </span>
                </div>
                {impact && impact.affectedAppointments && impact.affectedAppointments.length > 0 && (
                  <p className="text-[11px] text-emerald-800">
                    ⚠️ {impact.affectedAppointments.length} appointment(s) will be flagged for patient rescheduling.
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActionType('NONE')}
                    disabled={submitting}
                    className="text-xs h-8 px-3"
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 font-semibold gap-1.5"
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Confirm & Approve
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Request Changes Form */}
            {actionType === 'REQUEST_CHANGES' && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                  <FileEdit className="w-4 h-4 text-purple-700" />
                  Request Changes from Doctor
                </div>
                <textarea
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-slate-900"
                  placeholder="Explain required adjustments (e.g. Please arrange coverage with Dr. Sharma before resubmitting)..."
                  value={changesNote}
                  onChange={(e) => setChangesNote(e.target.value)}
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActionType('NONE')}
                    disabled={submitting}
                    className="text-xs h-8 px-3"
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 px-4 font-semibold gap-1.5"
                    onClick={handleRequestChanges}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FileEdit className="w-3.5 h-3.5" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Inline Reject Form */}
            {actionType === 'REJECT' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-700" />
                  Reject Leave Request
                </div>
                <textarea
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-slate-900"
                  placeholder="State reason for rejection (e.g. Critical staff shortage during festive emergency week)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActionType('NONE')}
                    disabled={submitting}
                    className="text-xs h-8 px-3"
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-4 font-semibold gap-1.5"
                    onClick={handleReject}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Confirm Rejection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 px-4 cursor-pointer font-medium text-slate-700 hover:bg-slate-100"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
};
