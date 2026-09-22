import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { OperationalAnnouncement } from '@/types/operations';
import { operationsApi } from '@/api/operationsApi';
import { Megaphone, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface BroadcastNoticeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoticeCreated: (notice: OperationalAnnouncement) => void;
}

export const BroadcastNoticeModal: React.FC<BroadcastNoticeModalProps> = ({
  open,
  onOpenChange,
  onNoticeCreated,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'URGENT'>('INFO');
  const [author, setAuthor] = useState('Central Operations Control');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickTemplates = [
    {
      title: 'CT Scanner Calibration Notice',
      message: 'CT Scanner undergoing routine tube calibration from 11:30 to 14:00. Urgent trauma cases please route to Diagnostic Block B.',
      severity: 'WARNING' as const,
    },
    {
      title: 'OPD Counter Extension',
      message: 'General Medicine token counter 3 will remain active until 16:30 today due to outpatient peak volume.',
      severity: 'INFO' as const,
    },
    {
      title: 'Critical Blood Bank Alert: O-ve Needed',
      message: 'Emergency buffer for O-negative PRBC low. Please prioritize donor walk-ins at Blood Centre Ground Floor.',
      severity: 'URGENT' as const,
    },
    {
      title: 'Power Line Testing Notice',
      message: 'Routine diesel backup generator auto-start test scheduled at 15:00 for 10 minutes. UPS systems unaffected.',
      severity: 'INFO' as const,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Please provide both an announcement title and detailed message.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const res = await operationsApi.createAnnouncement(title.trim(), message.trim(), severity, author);
      if (res.data) {
        onNoticeCreated(res.data);
      }
      onOpenChange(false);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      console.error('Failed to broadcast announcement:', err);
      setError(err?.message || 'Failed to broadcast announcement.');
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
              <Megaphone className="h-4 w-4" />
            </div>
            <DialogTitle>Broadcast Facility Notice</DialogTitle>
          </div>
          <DialogDescription>
            Publish an immediate operational bulletin to all department workstations, OPD displays, and staff dashboards.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Templates
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTitle(tpl.title);
                    setMessage(tpl.message);
                    setSeverity(tpl.severity);
                    setError(null);
                  }}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all text-xs cursor-pointer group"
                >
                  <div className="font-semibold text-slate-800 group-hover:text-teal-900 line-clamp-1">
                    {tpl.title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {tpl.message}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Urgency Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('INFO')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  severity === 'INFO'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Info className="h-3.5 w-3.5 text-teal-600" />
                Informational
              </button>
              <button
                type="button"
                onClick={() => setSeverity('WARNING')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  severity === 'WARNING'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Operational Warning
              </button>
              <button
                type="button"
                onClick={() => setSeverity('URGENT')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  severity === 'URGENT'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-600/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                Critical / Urgent
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Notice Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., OPD Token Counter 3 Extended"
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 font-medium text-slate-900"
            />
          </div>

          {/* Message Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Broadcast Message Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Specify clear instructions, affected zones, and expected timeline..."
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 placeholder:text-slate-400 text-slate-800"
            />
          </div>

          {/* Author */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Author / Authority
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-slate-50 text-slate-700"
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
            disabled={saving || !title.trim() || !message.trim()}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-2 min-h-[40px] px-4 cursor-pointer"
          >
            {saving ? 'Transmitting...' : 'Transmit Broadcast'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};