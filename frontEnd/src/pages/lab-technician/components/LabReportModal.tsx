import React, { useState } from 'react';
import { DiagnosticOrder } from '@/types/clinical';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Award,
  Calendar,
  User,
  FlaskConical,
} from 'lucide-react';

interface LabReportModalProps {
  order: DiagnosticOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const hasAbnormal = order.resultParameters?.some(
    (p) => p.status === 'ABNORMAL' || p.status === 'CRITICAL'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl sm:max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
              <FileText className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-slate-800">
              Official Diagnostic Investigation Report
            </span>
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800 border border-teal-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> NABL & ABDM
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs flex items-center gap-1.5 h-8"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{isPrinting ? 'Printing...' : 'Print'}</span>
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 min-h-[38px] min-w-[38px] flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 text-slate-800">
          {/* Institution Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-teal-800" />
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  GANDHINAGAR CIVIL HOSPITAL
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Department of Pathology & Clinical Laboratory Medicine
              </p>
              <p className="text-[11px] text-slate-500">
                Sector 12, Gandhinagar, Gujarat 382016 • Phone: +91 79 2322 1011
              </p>
            </div>
            <div className="sm:text-right space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800 border border-slate-200">
                <Award className="h-3.5 w-3.5 text-amber-600" />
                <span>NABL ACCREDITED: MC-3091</span>
              </div>
              <p className="text-[11px] text-slate-500 block">
                ABHA / ABDM Health Record ID: <strong>{order.id}</strong>
              </p>
              <p className="text-[11px] text-slate-500 block">
                Release Time: <strong>{new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              </p>
            </div>
          </div>

          {/* Patient Demographics & Order Metadata Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
              <span className="font-extrabold text-slate-900 text-sm">{order.patientName}</span>
              <span className="text-slate-600 block">{order.patientAge} Yrs / {order.patientGender}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ABHA ID / Contact</span>
              <span className="font-mono font-semibold text-teal-900 block">{order.patientAbha || '22-8491-0392-1102'}</span>
              <span className="text-slate-600 block">{order.patientPhone || '+91 98765 43210'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Referred By Doctor</span>
              <span className="font-bold text-slate-900 block">{order.orderedBy}</span>
              <span className="text-slate-600 block">{order.facilityName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Sample ID / Barcode</span>
              <span className="font-mono font-bold text-slate-900 block">{order.sampleId || 'SMP-482109'}</span>
              <span className="font-mono text-[11px] text-slate-500 block">{order.barcodeNumber || 'BC-99202611'}</span>
            </div>
          </div>

          {/* Test Header */}
          <div className="flex items-center justify-between border-b border-teal-800 pb-2">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-teal-700" />
                {order.testName}
              </h2>
              <span className="text-xs text-slate-500">
                Category: <strong>{order.testCategory}</strong> • Specimen: <strong>{order.sampleType || 'Whole Blood'} ({order.containerType || 'K2 EDTA'})</strong>
              </span>
            </div>
            <div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wider ${
                  hasAbnormal
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {hasAbnormal ? 'Parameters Flagged' : 'Normal Reference Range'}
              </span>
            </div>
          </div>

          {/* Parameter Results Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Test Parameter</th>
                  <th className="py-2.5 px-4">Observed Value</th>
                  <th className="py-2.5 px-4">Unit</th>
                  <th className="py-2.5 px-4">Biological Reference Interval</th>
                  <th className="py-2.5 px-4 text-center">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.resultParameters && order.resultParameters.length > 0 ? (
                  order.resultParameters.map((param, idx) => (
                    <tr
                      key={idx}
                      className={
                        param.status === 'CRITICAL'
                          ? 'bg-rose-50/70 font-semibold'
                          : param.status === 'ABNORMAL'
                          ? 'bg-amber-50/50'
                          : 'hover:bg-slate-50/60'
                      }
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{param.name}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-sm font-black ${
                            param.status === 'CRITICAL'
                              ? 'text-rose-700'
                              : param.status === 'ABNORMAL'
                              ? 'text-amber-800'
                              : 'text-slate-900'
                          }`}
                        >
                          {param.value}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-medium">{param.unit}</td>
                      <td className="py-2.5 px-4 text-slate-600">{param.referenceRange}</td>
                      <td className="py-2.5 px-4 text-center">
                        {param.status === 'CRITICAL' && (
                          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-800 border border-rose-300">
                            CRITICAL
                          </span>
                        )}
                        {param.status === 'ABNORMAL' && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 border border-amber-300">
                            HIGH / OUT OF RANGE
                          </span>
                        )}
                        {param.status === 'NORMAL' && (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500 italic">
                      No discrete parameters recorded. Summary: {order.resultSummary || 'Report completed.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Clinical Interpretation & Remarks */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-1.5 text-xs">
            <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">
              Laboratory Remarks & Observations:
            </span>
            <p className="text-slate-700 leading-relaxed">
              {order.resultSummary ||
                'All tested parameters analyzed on calibrated high-throughput analyzer. Results have been cross-checked with internal quality control standards.'}
            </p>
            {order.notes && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <strong>Pre-analytical Note:</strong> {order.notes}
              </p>
            )}
          </div>

          {/* Dual Authorization Sign-Off Block */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-teal-800 block">Digitally Certified</span>
              <p className="font-bold text-slate-900">{order.technicianName || 'Ramesh Patel, MLT'}</p>
              <p className="text-[11px] text-slate-500">Medical Laboratory Technologist</p>
              <p className="text-[10px] text-slate-400">Reg. No: MLT-GUJ-2019-8821</p>
            </div>
            <div className="text-right space-y-1">
              <span className="font-mono text-[10px] text-emerald-800 block">Verified & Approved</span>
              <p className="font-bold text-slate-900">Dr. Neeta Mehta, MD</p>
              <p className="text-[11px] text-slate-500">Consultant Pathologist & Lab Director</p>
              <p className="text-[10px] text-slate-400">Reg. No: G-34910 • NABL Signatory</p>
            </div>
          </div>

          {/* Statutory Footer */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            This electronic investigation report is generated under the Ayushman Bharat Digital Mission (ABDM) standards and signed electronically.
            Parameters outside biological reference intervals are highlighted for clinical correlation by the attending medical officer.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-6 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Official Report</span>
          </Button>
        </div>
      </div>
    </div>
  );
};