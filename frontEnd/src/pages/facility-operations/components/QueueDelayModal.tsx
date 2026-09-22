import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { operationsApi } from '@/api/operationsApi';
import { Clock, AlertTriangle, Users } from 'lucide-react';

interface QueueDelayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
  departmentName: string;
  onDelayBroadcasted: (delayMinutes: number) => void;
}

export const QueueDelayModal: React.FC<QueueDelayModalProps> = ({
  open,
  onOpenChange,
  departmentId,
  departmentName,
  onDelayBroadcasted,
}) => {
  const [delayMinutes, setDelayMinutes] = useState<number>(15);
  const [reason, setReason] = useState('Senior physician handling complex clinical emergency');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delayPresets = [
    { label: '+15 Mins', value: 15 },
    { label: '+30 Mins', value: 30 },
    { label: '+45 Mins', value: 45 },
    { label: '+60 Mins', value: 60 },
    { label: 'Reset (0 min)', value: 0 },
  ];

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await operationsApi.broadcastQueueDelay(departmentId, delayMinutes);
      onDelayBroadcasted(delayMinutes);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to broadcast delay:', err);
      setError(err?.message || 'Failed to broadcast queue delay update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="lg">
      <form onSubmit={handleBroadcast}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <DialogTitle>Broadcast Queue Delay</DialogTitle>
          </div>
          <DialogDescription>
            Notify patients in <strong>{departmentName}</strong> waiting room and digital token boards of expected wait extension.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Delay Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Additional Delay Increment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {delayPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDelayMinutes(preset.value)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    delayMinutes === preset.value
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Explanation Reason */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Operational Justification
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for delay displayed on token boards"
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 text-slate-900"
            />
          </div>

          {/* Preview Banner */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Users className="h-3.5 w-3.5 text-teal-700" />
              <span>Patient Display Notice Preview</span>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              "Attention patients: {departmentName} consultations are delayed by approximately {delayMinutes} minutes due to {reason.toLowerCase()}. Thank you for your patience."
            </p>
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
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-2 min-h-[40px] px-4 cursor-pointer"
          >
            {saving ? 'Transmitting...' : 'Broadcast Delay'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};