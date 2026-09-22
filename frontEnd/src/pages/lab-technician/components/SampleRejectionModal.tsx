import React, { useState } from 'react';
import { DiagnosticOrder } from '@/types/clinical';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  TestTube2,
  FileWarning,
} from 'lucide-react';

interface SampleRejectionModalProps {
  order: DiagnosticOrder;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => Promise<void>;
}

const REJECTION_REASONS = [
  { value: 'HEMOLYZED_SAMPLE', label: 'Hemolyzed Specimen (Gross hemolysis invalidates electrolytes/biochemistry)' },
  { value: 'CLOTTED_SPECIMEN', label: 'Clotted Blood in EDTA Tube (Micro-clots invalidate cell counts/CBC)' },
  { value: 'INSUFFICIENT_VOLUME', label: 'Insufficient Specimen Volume (QNS - Quantity Not Sufficient for analyzer)' },
  { value: 'INCORRECT_CONTAINER', label: 'Incorrect Container / Additive (e.g. Plain tube instead of Fluoride/EDTA)' },
  { value: 'LIPEMIC_ICTERIC', label: 'Lipemic / Grossly Icteric Specimen (Interferes with optical absorbance)' },
  { value: 'MISLABELED_UNREADABLE', label: 'Mislabeled Specimen / Barcode Damaged / Patient Mismatch' },
  { value: 'TEMPERATURE_EXCURSION', label: 'Cold Chain / Transport Delay (Sample degraded during ward transit)' },
];

export const SampleRejectionModal: React.FC<SampleRejectionModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0].value);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const reasonObj = REJECTION_REASONS.find((r) => r.value === selectedReason);
      await onConfirm(reasonObj ? reasonObj.label : selectedReason, notes);
      onClose();
    } catch (err) {
      console.error('Failed to reject specimen', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl sm:max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 px-5 py-4 bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pre-Analytical Specimen Rejection</h3>
              <p className="text-xs text-rose-700 font-medium">Quality & Safety Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient / Order Context */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between font-semibold text-slate-800">
              <span>{order.testName}</span>
              <span className="font-mono text-teal-800">{order.sampleId || order.id}</span>
            </div>
            <p className="text-slate-600">
              Patient: <strong>{order.patientName}</strong> ({order.patientAge}Y / {order.patientGender}) • Ordered by {order.orderedBy}
            </p>
          </div>

          {/* Warning Banner */}
          <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Hospital Notification Impact</span>
              Rejecting this specimen flags an urgent re-draw alert in the treating doctor&apos;s clinical workspace and notifies the ward nursing desk.
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Standard Rejection Reason <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2.5 text-xs text-slate-800 cursor-pointer focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
              required
            >
              {REJECTION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Technician Observation Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="E.g., Serum gel tube received with significant red discoloration after centrifugation. Contacted phlebotomy station for immediate recall."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 placeholder:text-slate-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submitting}
              className="bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-2"
            >
              <FileWarning className="h-4 w-4" />
              {submitting ? 'Registering Rejection...' : 'Confirm Sample Rejection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};