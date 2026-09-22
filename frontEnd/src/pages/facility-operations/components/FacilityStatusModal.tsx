import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { FacilityOperationalStatus } from '@/types/operations';
import { operationsApi } from '@/api/operationsApi';
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle, Clock } from 'lucide-react';

interface FacilityStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: FacilityOperationalStatus;
  onStatusUpdated: (newStatus: FacilityOperationalStatus, reason?: string) => void;
}

export const FacilityStatusModal: React.FC<FacilityStatusModalProps> = ({
  open,
  onOpenChange,
  currentStatus,
  onStatusUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<FacilityOperationalStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [updatedBy, setUpdatedBy] = useState('Senior Operations Manager');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions: {
    value: FacilityOperationalStatus;
    label: string;
    badgeText: string;
    description: string;
    color: string;
    border: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'OPEN',
      label: 'Fully Operational (Open)',
      badgeText: 'Active',
      description: 'All departments, OPD queues, diagnostics, pharmacy, and admissions active.',
      color: 'bg-emerald-50 text-emerald-800',
      border: 'border-emerald-200 hover:border-emerald-400',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    },
    {
      value: 'LIMITED_SERVICES',
      label: 'Limited Services',
      badgeText: 'Constrained',
      description: 'Specific OPDs or diagnostic units impaired; core acute care functional.',
      color: 'bg-amber-50 text-amber-800',
      border: 'border-amber-200 hover:border-amber-400',
      icon: <Clock className="h-5 w-5 text-amber-600 shrink-0" />,
    },
    {
      value: 'EMERGENCY_ONLY',
      label: 'Emergency Only',
      badgeText: 'Critical Surge',
      description: 'Routine OPD closed; only critical trauma, casualty, and ICU intake accepted.',
      color: 'bg-rose-50 text-rose-800',
      border: 'border-rose-200 hover:border-rose-400',
      icon: <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />,
    },
    {
      value: 'TEMPORARILY_UNAVAILABLE',
      label: 'Temporarily Unavailable',
      badgeText: 'System Outage',
      description: 'Severe infrastructure disruption (power/water/grid). Incoming diversions active.',
      color: 'bg-orange-50 text-orange-800',
      border: 'border-orange-200 hover:border-orange-400',
      icon: <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />,
    },
    {
      value: 'CLOSED',
      label: 'Facility Closed',
      badgeText: 'Closed',
      description: 'Scheduled closure or emergency evacuation. No new intakes permitted.',
      color: 'bg-slate-100 text-slate-800',
      border: 'border-slate-200 hover:border-slate-400',
      icon: <XCircle className="h-5 w-5 text-slate-600 shrink-0" />,
    },
  ];

  const quickReasons = [
    'Normal shift operational handover',
    'High patient surge in Emergency Dept',
    'Scheduled maintenance of secondary medical gas line',
    'Heavy rain waterlogging in OPD waiting hall',
    'Special emergency trauma drill underway',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide an operational justification/reason for this status change.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await operationsApi.updateStatus(selectedStatus, reason.trim(), updatedBy);
      onStatusUpdated(selectedStatus, reason.trim());
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(err?.message || 'Failed to update facility operational status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="2xl">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            <DialogTitle>Update Facility Operational Status</DialogTitle>
          </div>
          <DialogDescription>
            Change the global operational condition of Gandhinagar Civil Hospital. This status broadcasts to all district ambulances, 108 dispatch, and citizen portals.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Options Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Operational Status
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      setSelectedStatus(opt.value);
                      setError(null);
                    }}
                    className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-teal-600 ring-2 ring-teal-600/20 bg-teal-50/40'
                        : `${opt.border} bg-white hover:bg-slate-50/50`
                    }`}
                  >
                    <div className="mt-0.5">{opt.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.color}`}>
                          {opt.badgeText}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warning banner for non-open states */}
          {selectedStatus !== 'OPEN' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Downstream Advisory Notice</p>
                <p className="text-amber-800 mt-0.5">
                  Selecting <strong>{selectedStatus}</strong> flags this hospital on the state centralized ambulance dashboard. Non-critical patient transfers may be rerouted to alternate taluka sub-district hospitals.
                </p>
              </div>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Operational Reason / Log Details <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Required for district audit</span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail reasons for this status change, active contingencies, or estimated recovery window..."
              className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 placeholder:text-slate-400 bg-white"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickReasons.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(chip)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-medium cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Author / Designation */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Authorized Coordinator
            </label>
            <input
              type="text"
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white font-medium text-slate-800"
            />
          </div>
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-xs font-semibold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !reason.trim()}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-2 min-h-[40px] px-4 cursor-pointer"
          >
            {saving ? 'Updating...' : 'Publish Status Change'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};