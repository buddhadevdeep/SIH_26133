import React from 'react';
import { Token } from '@/types/queue';
import { Button } from '@/components/ui/Button';
import { Printer, CheckCircle2, X, Clock, MapPin, User, Building2, QrCode } from 'lucide-react';

interface OpdTokenSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  hospitalName?: string;
  roomNumber?: string;
}

export const OpdTokenSlipModal: React.FC<OpdTokenSlipModalProps> = ({
  isOpen,
  onClose,
  token,
  hospitalName = 'Gandhinagar Civil Hospital',
  roomNumber = 'Room 4',
}) => {
  if (!isOpen || !token) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl sm:max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-teal-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-teal-200" />
            <h3 className="font-bold text-sm tracking-wide">OPD Registration Slip</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-teal-100 hover:bg-teal-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Slip Body */}
        <div className="p-6 space-y-5 print:p-0">
          {/* Institution Sub-header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full inline-block mb-1">
              Department of Health & Family Welfare
            </span>
            <h4 className="font-extrabold text-slate-900 text-base">{hospitalName}</h4>
            <p className="text-xs text-slate-500">HealthConnect Unified OPD Queue System</p>
          </div>

          {/* Token Hero Display */}
          <div className="rounded-xl bg-teal-50/70 border-2 border-teal-200 p-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Queue Token Number
            </span>
            <div className="text-4xl font-black text-teal-900 tracking-tight my-1 font-mono">
              {token.tokenNumber}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-teal-800 font-medium mt-2">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-teal-600" />
                {token.departmentName}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-teal-600" />
                {token.roomNumber || roomNumber}
              </span>
            </div>
          </div>

          {/* Patient Demographics */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Patient Name:
              </span>
              <span className="font-bold text-slate-900">{token.patientName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Age & Gender:</span>
              <span className="font-medium text-slate-800">
                {token.patientAge ? `${token.patientAge} Years` : '�'} / {token.patientGender === 'M' ? 'Male' : token.patientGender === 'F' ? 'Female' : 'Other'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Contact Number:</span>
              <span className="font-mono font-medium text-slate-800">+91 {token.patientPhone}</span>
            </div>
            {token.doctorName && (
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
                <span className="text-slate-500">Consulting Doctor:</span>
                <span className="font-semibold text-teal-800">{token.doctorName}</span>
              </div>
            )}
          </div>

          {/* Queue Estimate & Wait Info */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Queue Position</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">#{token.positionInQueue || 1}</p>
              <span className="text-[10px] text-slate-400">in waiting line</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                Est. Wait
              </span>
              <p className="text-lg font-bold text-amber-600 mt-0.5">~{token.estimatedWaitMinutes || 15}m</p>
              <span className="text-[10px] text-slate-400">approximate</span>
            </div>
          </div>

          {/* Issue Time & QR Mock */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-dashed border-slate-200 pt-3">
            <div>
              <span>Issued on: {new Date(token.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <p className="text-[10px] text-slate-400">Counter 1 � Front Desk</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono text-[10px]">
              <QrCode className="h-3 w-3 text-slate-500" />
              <span>{token.id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 print:hidden">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-teal-700 hover:bg-teal-800 text-white gap-2 text-xs font-semibold shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print OPD Slip
          </Button>
        </div>
      </div>
    </div>
  );
};
