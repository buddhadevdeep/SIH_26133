import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Video,
  History,
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  Stethoscope,
  Clock,
  User,
  CalendarCheck2,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { VISITED_DOCTORS } from './TeleconsultationRoom';

interface ActiveFixedCall {
  tokenNumber: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorHospital: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  patientName: string;
  reason: string;
  status: string;
}

export const Teleconsultation: React.FC = () => {
  const [activeCall, setActiveCall] = useState<ActiveFixedCall>({
    tokenNumber: 'TC-REQ-2026-9086',
    doctorName: 'Dr. Arvind Patel',
    doctorSpecialty: 'Cardiologist & Physician',
    doctorHospital: 'Gandhinagar Civil Hospital',
    scheduledDate: 'Today (12 Sep)',
    scheduledTimeSlot: '05:30 PM - 06:00 PM',
    patientName: 'Rameshwar Sharma (Self)',
    reason: 'Follow-up on Previous Prescription',
    status: 'FIXED / CONFIRMED',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('healthconnect_fixed_calls');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          setActiveCall({
            tokenNumber: first.tokenNumber || 'TC-REQ-2026-9086',
            doctorName: first.doctor?.name || 'Dr. Arvind Patel',
            doctorSpecialty: first.doctor?.specialty || 'Cardiologist & Physician',
            doctorHospital: first.doctor?.hospital || 'Gandhinagar Civil Hospital',
            scheduledDate: first.scheduledDate || 'Today (12 Sep)',
            scheduledTimeSlot: first.scheduledTimeSlot || '05:30 PM - 06:00 PM',
            patientName: first.patient?.name ? `${first.patient.name} (${first.patient.relation || 'Self'})` : 'Rameshwar Sharma (Self)',
            reason: first.reason || 'Follow-up on Previous Prescription',
            status: 'FIXED / CONFIRMED',
          });
        }
      }
    } catch (err) {
      console.error('Error reading fixed calls', err);
    }
  }, []);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Page Header */}
      <PageHeader
        title="Teleconsultation"
        subtitle="Connect with a doctor online or view your previous consultation history."
        breadcrumbs={[
          { label: 'Dashboard', to: '/patient' },
          { label: 'Teleconsultation' },
        ]}
      />

      {/* RECENT CALL FIXED NOTIFICATION BANNER */}
      {activeCall && (
        <Card className="border-2 border-emerald-400 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white shadow-sm overflow-hidden animate-in fade-in duration-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white shadow-md relative">
                  <Video className="h-6 w-6" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase shadow-2xs">
                      ● RECENT CALL FIXED
                    </span>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-white/80 px-2 py-0.5 rounded border border-teal-200">
                      Token: {activeCall.tokenNumber}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Doctor Confirmed
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900">
                    Appointment Fixed with {activeCall.doctorName}
                  </h3>

                  <p className="text-xs text-teal-800 font-bold">
                    {activeCall.doctorSpecialty} • {activeCall.doctorHospital}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <User className="h-3.5 w-3.5 text-teal-600" />
                      Patient: <strong>{activeCall.patientName}</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>Reason: <strong>{activeCall.reason}</strong></span>
                  </div>
                </div>
              </div>

              {/* Time Badge and Call Action Buttons */}
              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-end lg:items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-emerald-100">
                <div className="rounded-xl border border-emerald-200 bg-white/90 p-2.5 text-left md:text-right shadow-2xs">
                  <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">
                    FIXED CALL WINDOW
                  </span>
                  <strong className="text-sm font-black text-slate-900 block mt-0.5">
                    {activeCall.scheduledTimeSlot}
                  </strong>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 md:justify-end mt-0.5">
                    <Clock className="h-3 w-3 text-emerald-600" />
                    {activeCall.scheduledDate} • Slot Reserved
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Link to="/patient/consultations/room" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full border-emerald-500 text-emerald-800 hover:bg-emerald-100/60 font-bold text-xs gap-1.5 px-3.5 h-10 shadow-2xs cursor-pointer">
                      <User className="h-4 w-4 text-emerald-700" />
                      <span>Select Doctor & Slots</span>
                    </Button>
                  </Link>
                  <Link to="/patient/consultations/room?join=true" className="w-full sm:w-auto">
                    <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs gap-1.5 px-4 h-10 shadow-sm cursor-pointer">
                      <Video className="h-4 w-4" />
                      <span>Join Live Call Now</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Card */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5 sm:p-6">

          {/* Heading */}
          <div className="mb-6">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                <Stethoscope className="h-5 w-5 text-teal-700" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Teleconsultation Services
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Choose what you want to do
                </p>
              </div>

            </div>

          </div>


          {/* Choice Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* =====================================
                CONSULTATION HISTORY
            ====================================== */}

            <Link
              to="/patient/teleconsultation-history"
              className="group"
            >
              <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all hover:border-teal-300 hover:bg-teal-50 hover:shadow-sm">

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200">

                    <History className="h-5 w-5 text-slate-600 group-hover:text-teal-700" />

                  </div>

                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-700" />

                </div>


                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  Consultation History
                </h3>

                <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
                  View your previous online consultations, doctors,
                  consultation notes and visit details.
                </p>


                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-teal-700">

                  <CalendarDays className="h-3.5 w-3.5" />

                  View previous consultations

                </div>

              </div>
            </Link>


            {/* =====================================
                START CONSULTATION & SELECT DOCTOR
            ====================================== */}

            <Link
              to="/patient/consultations/room"
              className="group"
            >
              <div className="h-full rounded-2xl border border-teal-200 bg-teal-50/60 p-5 transition-all hover:border-teal-400 hover:bg-teal-50 hover:shadow-sm">

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">

                    <Video className="h-5 w-5" />

                  </div>

                  <ArrowRight className="h-4 w-4 text-teal-500 group-hover:text-teal-700 transition-transform group-hover:translate-x-1" />

                </div>


                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  Select Doctor & Request Consultation
                </h3>

                <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-600">
                  Choose your treating doctor, select a convenient date and time slot, or request an instant online video consultation.
                </p>


                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-teal-700">

                  <ShieldCheck className="h-3.5 w-3.5" />

                  Doctor selection & appointment booking

                </div>

              </div>
            </Link>

          </div>


          {/* Information */}
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">

            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

            <p className="text-[10px] leading-relaxed text-slate-500">
              Your consultation information and clinical notes are securely
              maintained in your health record.
            </p>

          </div>

        </CardContent>
      </Card>

      {/* Treating Doctors Available for Teleconsultation */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-teal-600 animate-pulse"></span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Doctors Available for Teleconsultation
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a doctor from your previous OPD visits or consult specialists online
              </p>
            </div>
            <Link to="/patient/consultations/room">
              <Button variant="outline" size="sm" className="text-xs font-bold text-teal-700 border-teal-200 hover:bg-teal-50 gap-1.5">
                <span>Open Full Doctor Directory</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VISITED_DOCTORS.map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${doc.avatarColor} text-white font-black text-sm shadow-2xs`}>
                    {doc.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{doc.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        doc.status === 'ONLINE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {doc.status === 'ONLINE' ? '● Available' : '● In OPD'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-teal-700 truncate">{doc.specialty}</p>
                    <p className="text-[11px] text-slate-500 truncate">{doc.hospital}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Last visit: <span className="text-slate-600 font-medium">{doc.lastVisitedDate}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-600 font-bold">{doc.rating}</span>
                  <div className="flex items-center gap-2">
                    <Link to={`/patient/consultations/room?request=true&doctorId=${doc.id}`}>
                      <Button size="sm" className="h-8 text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold gap-1 px-3 cursor-pointer">
                        <CalendarCheck2 className="h-3.5 w-3.5" />
                        <span>Select Doctor & Slots</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Teleconsultation;