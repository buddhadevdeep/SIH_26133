import React, { useState } from 'react';
import { DiagnosticOrder } from '@/types/clinical';
import { Button } from '@/components/ui/Button';
import {
  QrCode,
  Printer,
  X,
  CheckCircle2,
  Copy,
  Barcode,
  TestTube2,
  AlertCircle,
} from 'lucide-react';

interface SampleBarcodeLabelModalProps {
  order: DiagnosticOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const SampleBarcodeLabelModal: React.FC<SampleBarcodeLabelModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const barcode = order.barcodeNumber || `BC-${order.id.replace('lab_ord_', '992026')}`;
  const sampleId = order.sampleId || `SMP-${order.id.replace('lab_ord_', '4821')}`;
  const tubeType = order.containerType || 'K2 EDTA Lavender Top';

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg sm:max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
              <Barcode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Specimen Tube Barcode Label</h3>
              <p className="text-xs text-slate-500">Standard 40×25mm Thermal Phlebotomy Sticker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Printable Thermal Label Preview Frame */}
          <div className="mx-auto w-full max-w-sm rounded-xl border-2 border-dashed border-slate-300 bg-amber-50/40 p-4 shadow-inner">
            <div className="rounded-lg border-2 border-slate-800 bg-white p-3 shadow-md space-y-2">
              <div className="flex items-start justify-between border-b border-slate-200 pb-1.5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 block">
                    GANDHINAGAR CIVIL HOSPITAL
                  </span>
                  <span className="text-[11px] font-extrabold text-teal-900 line-clamp-1">
                    {order.patientName} ({order.patientAge}Y / {order.patientGender})
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ABHA: {order.patientAbha || '22-8491-0392-1102'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-slate-900 px-1 py-0.5 text-[9px] font-bold text-white uppercase">
                    {order.priority || 'ROUTINE'}
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Barcode Visual Representation */}
              <div className="py-2 text-center bg-slate-50 rounded border border-slate-100">
                <div className="flex items-center justify-center gap-0.5 h-10 px-4">
                  {/* Stylized pseudo-barcode bars */}
                  {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2, 6, 3, 1, 5, 2, 4, 1, 3, 6, 2, 5, 1, 4, 3, 2, 6].map(
                    (height, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 w-1 rounded-[0.5px]"
                        style={{ height: `${20 + height * 3}px` }}
                      />
                    )
                  )}
                </div>
                <p className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1">
                  *{barcode}*
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-600 border-t border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block">{order.testName}</span>
                  <span className="text-[9px] text-slate-500">Tube: {tubeType}</span>
                </div>
                <div className="text-right font-mono font-bold text-teal-800">
                  {sampleId}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-2 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Specimen Type:</span>
              <span className="font-semibold text-slate-900">{order.sampleType || 'Whole Blood'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Container Required:</span>
              <span className="font-semibold text-slate-900">{tubeType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Barcode Identifier:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                <span>{barcode}</span>
                <button
                  onClick={handleCopyBarcode}
                  className="rounded p-1 hover:bg-slate-200 text-slate-500"
                  title="Copy barcode"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? 'Printing Label...' : 'Print Thermal Label'}
          </Button>
        </div>
      </div>
    </div>
  );
};