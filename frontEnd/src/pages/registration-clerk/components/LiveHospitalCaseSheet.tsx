import React from 'react';
import { PriorityLevel } from '@/types/queue';
import {
  Printer,
  FileText,
} from 'lucide-react';

export interface LiveHospitalCaseSheetProps {
  hospitalName: string;
  district: string;
  clerkName?: string;
  name: string;
  phone: string;
  gender: 'M' | 'F' | 'Other';
  age: string;
  dob?: string;
  abhaId?: string;
  abhaVerified?: boolean;
  address?: string;
  pincode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  departmentId: string;
  priority: PriorityLevel;
  currentStep: number;
  doctorName?: string;
  roomNumber?: string;
}

const DEPARTMENTS: Record<string, { name: string; room: string; doctor: string; code: string }> = {
  dep_med: { name: 'General Medicine OPD', room: 'Room 4', doctor: 'Dr. Arvind Patel', code: 'MED' },
  dep_cardio: { name: 'Cardiology Clinic', room: 'Room 6', doctor: 'Dr. Arvind Patel', code: 'CARD' },
  dep_ortho: { name: 'Orthopedics Clinic', room: 'Room 8', doctor: 'Dr. Rajesh Mehta', code: 'ORTH' },
  dep_peds: { name: 'Pediatrics & Immunization', room: 'Room 2', doctor: 'Dr. Sneha Desai', code: 'PEDS' },
  dep_gyn: { name: 'Gynecology & ANC', room: 'Room 5', doctor: 'Dr. Bhavna Joshi', code: 'GYN' },
};

export const LiveHospitalCaseSheet: React.FC<LiveHospitalCaseSheetProps> = ({
  hospitalName,
  district,
  clerkName = 'Counter 02 • Registration Desk',
  name,
  phone,
  gender,
  age,
  dob,
  abhaId,
  abhaVerified,
  address,
  pincode = '382010',
  emergencyName,
  emergencyPhone,
  emergencyRelation = 'Attendant',
  departmentId,
  priority,
  doctorName,
  roomNumber,
}) => {
  const dept = DEPARTMENTS[departmentId] || DEPARTMENTS.dep_med;
  const attendingDoctor = doctorName || dept.doctor;
  const attendingRoom = roomNumber || dept.room;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const crNumber = `CR-${now.getFullYear()}-${phone && phone.length >= 4 ? phone.slice(-4) : '2409'}`;
  const tokenPreview = `OPD-${dept.code}-${phone && phone.length >= 2 ? phone.slice(-2) : '14'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-2.5">
      {/* Top Controls: Print Action */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <FileText className="h-4 w-4 text-teal-800" />
          <span>Hospital OPD Case Paper</span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer"
          title="Print OPD Case Slip"
        >
          <Printer className="h-3.5 w-3.5 text-slate-700" />
          <span>Print Slip</span>
        </button>
      </div>

      {/* AUTHENTIC HOSPITAL CASE SHEET / SLIP */}
      <div className="rounded-xl border-2 border-slate-700 bg-white shadow-md overflow-hidden font-sans text-slate-900">
        {/* 1. Official Government & Hospital Header */}
        <div className="border-b-2 border-slate-800 p-4 text-center bg-white">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wider pb-1.5 border-b border-slate-300">
            <span>GOVERNMENT OF GUJARAT</span>
            <span>HEALTH & FAMILY WELFARE DEPARTMENT</span>
          </div>

          <div className="py-2">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
              {hospitalName || 'GANDHINAGAR CIVIL HOSPITAL & MEDICAL COLLEGE'}
            </h2>
            <p className="text-[11px] font-semibold text-slate-600 uppercase mt-0.5">
              APEX DISTRICT HEALTHCARE FACILITY • {district || 'GANDHINAGAR'}, GUJARAT
            </p>
            <div className="mt-2 inline-block bg-slate-900 text-white font-extrabold text-xs px-3.5 py-1 tracking-wider uppercase rounded-xs">
              CENTRAL OPD REGISTRATION CARD
            </div>
          </div>
        </div>

        {/* 2. Registration Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-300 text-[11px] font-mono bg-slate-50/80 divide-x divide-slate-300">
          <div className="p-2.5">
            <span className="text-[9px] font-sans text-slate-500 block uppercase font-bold">CR Number:</span>
            <span className="font-bold text-slate-900 text-xs">{crNumber}</span>
          </div>
          <div className="p-2.5">
            <span className="text-[9px] font-sans text-slate-500 block uppercase font-bold">Date & Time:</span>
            <span className="text-slate-800 font-bold">{dateStr} {timeStr}</span>
          </div>
          <div className="p-2.5">
            <span className="text-[9px] font-sans text-slate-500 block uppercase font-bold">Category:</span>
            <span className="text-slate-900 font-bold uppercase">
              {priority === 'EMERGENCY' ? 'EMERGENCY RED' : priority === 'URGENT' ? 'URGENT / SENIOR' : 'GENERAL WALK-IN'}
            </span>
          </div>
          <div className="p-2.5">
            <span className="text-[9px] font-sans text-slate-500 block uppercase font-bold">OPD Fee:</span>
            <span className="text-emerald-800 font-bold">₹ 10.00 (PAID)</span>
          </div>
        </div>

        {/* 3. Patient Demographics Particulars (Real Hospital Grid) */}
        <div className="p-3.5 space-y-3">
          <table className="w-full text-xs border border-slate-300 text-left">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="w-1/3 p-2 bg-slate-100/80 font-bold text-slate-700 text-[11px] uppercase">
                  Patient Name:
                </td>
                <td colSpan={3} className="p-2 font-black text-slate-900 text-sm tracking-wide">
                  {name.trim() ? (
                    <span className="uppercase text-slate-950 font-black">{name.trim()}</span>
                  ) : (
                    <span className="text-slate-400 font-normal italic font-mono">
                      ..................................................................
                    </span>
                  )}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 bg-slate-100/80 font-bold text-slate-700 text-[11px] uppercase">
                  Age / Gender:
                </td>
                <td className="p-2 font-bold text-slate-900">
                  {age ? `${age} Yrs` : '__ Yrs'} / {gender === 'M' ? 'Male (M)' : gender === 'F' ? 'Female (F)' : 'Other (T)'}
                </td>
                <td className="p-2 bg-slate-100/80 font-bold text-slate-700 text-[11px] uppercase">
                  Contact Mobile:
                </td>
                <td className="p-2 font-mono font-bold text-slate-900">
                  {phone ? `+91 ${phone}` : '+91 __________'}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 bg-slate-100/80 font-bold text-slate-700 text-[11px] uppercase">
                  ABHA ID:
                </td>
                <td className="p-2 font-mono text-slate-800">
                  {abhaId ? (
                    <span className="font-bold text-teal-900">
                      {abhaId} {abhaVerified && <span className="text-[10px] text-emerald-700 font-sans font-bold">[✓ VERIFIED]</span>}
                    </span>
                  ) : (
                    <span className="text-slate-400">N/A (Walk-in)</span>
                  )}
                </td>
                <td className="p-2 bg-slate-100/80 font-bold text-slate-700 text-[11px] uppercase">
                  Date of Birth:
                </td>
                <td className="p-2 font-mono text-slate-800">
                  {dob || '—'}
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="p-2 bg-slate-100/80 font-bold text-slate-700 text-[11px] uppercase">
                  Residential Address:
                </td>
                <td colSpan={3} className="p-2 text-slate-800 font-medium">
                  {address && address.trim() ? `${address.trim()}, ${district} - ${pincode}` : `${district} - ${pincode}`}
                </td>
              </tr>
              <tr>
                <td className="p-2 bg-slate-100/80 font-bold text-slate-700 text-[11px] uppercase">
                  Attendant / Relative:
                </td>
                <td colSpan={3} className="p-2 text-slate-800 font-medium">
                  {emergencyName ? `${emergencyName} (${emergencyRelation}) • Tel: +91 ${emergencyPhone || '—'}` : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 4. OPD Clinic & Token Box */}
          <div className="border-2 border-slate-700 rounded-lg p-3 bg-slate-50/60 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                DEPARTMENT / CLINIC ALLOCATION:
              </span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase">
                {dept.name}
              </h4>
              <p className="text-xs text-slate-700 font-semibold mt-0.5">
                ROOM: <strong className="font-black text-slate-950">{attendingRoom}</strong> • ATTENDING: <strong className="font-bold">{attendingDoctor.toUpperCase()}</strong>
              </p>
            </div>

            <div className="border-2 border-slate-900 bg-white rounded-md p-2 text-center shrink-0 min-w-[110px] shadow-xs">
              <span className="text-[9px] font-black uppercase text-slate-600 tracking-wider block">
                QUEUE TOKEN
              </span>
              <div className="text-xl font-black font-mono text-slate-950 tracking-tight my-0.5">
                {tokenPreview}
              </div>
              <span className="text-[9px] font-bold uppercase text-slate-700 block">
                {priority}
              </span>
            </div>
          </div>

          {/* 5. Doctor Clinical Notes & Examination (Authentic Ruled Case Paper Section) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-[10px] font-bold text-slate-700 uppercase">
              <span>PHYSICIAN EXAMINATION & VITALS RECORD</span>
              <span className="text-slate-600 font-mono text-[9px]">CONSULTANT: {attendingDoctor.toUpperCase()}</span>
            </div>

            {/* Vitals Box */}
            <div className="grid grid-cols-5 divide-x divide-slate-300 border-b border-slate-300 text-center text-[10px] bg-white">
              <div className="p-1.5">
                <span className="text-slate-500 block text-[9px] font-bold">BP (mmHg)</span>
                <span className="font-mono text-xs text-slate-400 font-bold">____ / ____</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-500 block text-[9px] font-bold">Pulse (bpm)</span>
                <span className="font-mono text-xs text-slate-400 font-bold">____</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-500 block text-[9px] font-bold">Temp (°F)</span>
                <span className="font-mono text-xs text-slate-400 font-bold">____</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-500 block text-[9px] font-bold">SpO2 (%)</span>
                <span className="font-mono text-xs text-slate-400 font-bold">____ %</span>
              </div>
              <div className="p-1.5">
                <span className="text-slate-500 block text-[9px] font-bold">Weight (kg)</span>
                <span className="font-mono text-xs text-slate-400 font-bold">____ kg</span>
              </div>
            </div>

            {/* Doctor Ruled Writing Section */}
            <div className="p-3 space-y-3 bg-white">
              <div>
                <span className="text-[10px] font-extrabold text-slate-700 uppercase block">
                  Chief Complaints & Clinical History:
                </span>
                <div className="border-b border-dotted border-slate-400 h-5 mt-1" />
                <div className="border-b border-dotted border-slate-400 h-5 mt-1" />
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-slate-700 uppercase block">
                  Clinical Diagnosis (Dx):
                </span>
                <div className="border-b border-dotted border-slate-400 h-5 mt-1" />
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-serif font-black text-slate-900 leading-none">℞</span>
                  <span className="text-[10px] font-extrabold text-slate-700 uppercase">
                    Prescription & Treatment (Rx):
                  </span>
                </div>
                <div className="border-b border-dotted border-slate-400 h-5 mt-1" />
                <div className="border-b border-dotted border-slate-400 h-5 mt-1" />
                <div className="border-b border-dotted border-slate-400 h-5 mt-1" />
              </div>
            </div>
          </div>

          {/* 6. Investigations Checkbox Strip */}
          <div className="border border-slate-300 rounded-md p-2 bg-slate-50 text-[10px] text-slate-700">
            <span className="font-bold uppercase text-[9px] text-slate-600 block mb-1">
              INVESTIGATIONS ORDERED:
            </span>
            <div className="flex items-center gap-4 flex-wrap font-mono">
              <span>[ &nbsp; ] CBC</span>
              <span>[ &nbsp; ] RBS / Blood Sugar</span>
              <span>[ &nbsp; ] Urine R/M</span>
              <span>[ &nbsp; ] X-Ray Chest</span>
              <span>[ &nbsp; ] ECG</span>
              <span>[ &nbsp; ] USG Abdomen</span>
            </div>
          </div>

          {/* 7. Barcode & Signature Footer */}
          <div className="pt-2 flex items-end justify-between text-[10px] border-t border-slate-300">
            <div className="space-y-1">
              <div className="flex items-center gap-0.5 h-6">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1].map((w, i) => (
                  <div
                    key={i}
                    className="bg-slate-900 h-full"
                    style={{ width: `${w * 1.5}px` }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-mono text-slate-600 block">
                *{crNumber}*
              </span>
            </div>

            <div className="text-center">
              <span className="text-[9px] text-slate-500 block mb-3 font-mono">
                REG CLERK: {clerkName.toUpperCase()}
              </span>
              <div className="w-36 border-b border-slate-700 mb-0.5" />
              <span className="font-bold text-slate-800 block text-[9px] uppercase tracking-wider">
                {attendingDoctor.toUpperCase()} (SIGN & STAMP)
              </span>
            </div>
          </div>
        </div>

        {/* 8. Hospital Instructions Footer */}
        <div className="bg-slate-100 border-t border-slate-300 px-3 py-1.5 text-[9px] text-slate-600 flex items-center justify-between">
          <span>• Valid for 15 days for follow-up in the same department. Bring this slip on next visit.</span>
          <span className="font-bold text-slate-700">ABDM HEALTH ID COMPLIANT</span>
        </div>
      </div>
    </div>
  );
};
