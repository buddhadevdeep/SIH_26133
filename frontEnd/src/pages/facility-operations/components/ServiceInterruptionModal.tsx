import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { OperationalService, ServiceOperationalStatus } from '@/types/operations';
import { operationsApi } from '@/api/operationsApi';
import { Activity, AlertTriangle, CheckCircle2, PauseCircle, Clock } from 'lucide-react';

interface ServiceInterruptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: OperationalService | null;
  onServiceUpdated: (updated: OperationalService) => void;
}

export const ServiceInterruptionModal: React.FC<ServiceInterruptionModalProps> = ({
  open,
  onOpenChange,
  service,
  onServiceUpdated,
}) => {
  const [status, setStatus] = useState<ServiceOperationalStatus>('OPERATIONAL');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      setStatus(service.status);
      setReason(service.statusReason || '');
      setNotes(service.notes || '');
      setError(null);
    }
  }, [service]);

  if (!service) return null;

  const quickReasons = [
    'Scheduled biomedical equipment maintenance',
    'Specialist physician called for urgent OT surgery',
    'Reagent restock delivery delayed',
    'Network terminal synchronization backlog',
    'Full staff return to normal capacity',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await operationsApi.updateServiceStatus(
        service.id,
        status,
        reason.trim() || undefined,
        notes.trim() || undefined
      );
      if (res.data) {
        onServiceUpdated(res.data);
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to update service status:', err);
      setError(err?.message || 'Failed to update department service condition.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="xl">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Update Service: {service.name}</DialogTitle>
              <span className="text-[11px] font-semibold text-slate-400">Code: {service.code} • Category: {service.category}</span>
            </div>
          </div>
          <DialogDescription>
            Modify live operational capability. Degraded or offline states flag the department in registration clerk queues and citizen token portals.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Status Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Operational State
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div
                onClick={() => setStatus('OPERATIONAL')}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                  status === 'OPERATIONAL'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <span className="text-xs font-bold block">Operational</span>
                <span className="text-[10px] text-slate-500 block">Normal Flow</span>
              </div>

              <div
                onClick={() => setStatus('DEGRADED')}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                  status === 'DEGRADED'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Clock className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <span className="text-xs font-bold block">Degraded</span>
                <span className="text-[10px] text-slate-500 block">Delays / Partial</span>
              </div>

              <div
                onClick={() => setStatus('OFFLINE')}
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                  status === 'OFFLINE'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-600/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <PauseCircle className="h-5 w-5 mx-auto text-rose-600 mb-1" />
                <span className="text-xs font-bold block">Offline</span>
                <span className="text-[10px] text-slate-500 block">Halted</span>
              </div>
            </div>
          </div>

          {/* Status Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Operational Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Single clinician managing overflow, 45 min delay expected"
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-slate-900"
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {quickReasons.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors cursor-pointer"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Operational Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Contingency Notes / Citizen Guidance
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Redirect urgent chest pains directly to Red-Zone Trauma Bay 2."
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-slate-800 placeholder:text-slate-400"
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
            disabled={saving}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-2 min-h-[40px] px-4 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Confirm Update'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};