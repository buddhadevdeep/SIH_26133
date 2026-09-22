import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { registrationApi } from '@/api/registrationApi';
import { tokenApi, queueApi } from '@/api/queueApi';
import { RegisteredPatient, Appointment, Token } from '@/types/queue';
import { OpdTokenSlipModal } from './components/OpdTokenSlipModal';
import {
  User,
  Phone,
  ShieldCheck,
  MapPin,
  Calendar,
  Ticket,
  Clock,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';

export const PatientSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<RegisteredPatient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);

  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [issuingWalkIn, setIssuingWalkIn] = useState(false);
  const [activeSlipToken, setActiveSlipToken] = useState<Token | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadPatientData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [patientRes, aptsRes, queueRes] = await Promise.all([
        registrationApi.getPatientById(id),
        registrationApi.getAppointments({ patientId: id }),
        queueApi.getLiveQueue('fac_civil_01'),
      ]);

      if (patientRes.data) setPatient(patientRes.data);
      if (aptsRes.data) setAppointments(aptsRes.data);

      // Check if patient has a token in live queue
      if (queueRes.data?.tokens) {
        const found = queueRes.data.tokens.find(
          (t) => t.patientId === id || (patientRes.data && t.patientPhone === patientRes.data.phone)
        );
        setActiveToken(found || null);
      }
    } catch (err) {
      console.error('Failed to load patient summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const handleCheckIn = async (aptId: string) => {
    try {
      setCheckingInId(aptId);
      const res = await registrationApi.checkInAppointment(aptId);
      if (res.data) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? res.data!.appointment : a))
        );
        setActiveToken(res.data.token);
        setActiveSlipToken(res.data.token);
        setSlipModalOpen(true);
        setActionNotice(`Patient checked in. Token ${res.data.token.tokenNumber} issued.`);
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Check-in failed:', err);
      alert('Failed to check in patient.');
    } finally {
      setCheckingInId(null);
    }
  };

  const handleDirectTokenIssue = async () => {
    if (!patient) return;
    try {
      setIssuingWalkIn(true);
      const res = await tokenApi.generateToken({
        patientName: patient.name,
        patientPhone: patient.phone,
        facilityId: 'fac_civil_01',
        departmentId: 'dep_med',
        priority: patient.age >= 60 ? 'URGENT' : 'ROUTINE',
      });

      if (res.data) {
        const t = res.data;
        t.patientAge = patient.age;
        t.patientGender = patient.gender;
        setActiveToken(t);
        setActiveSlipToken(t);
        setSlipModalOpen(true);
        setActionNotice(`Walk-in Token ${t.tokenNumber} issued for General Medicine.`);
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Direct token issue failed:', err);
      alert('Failed to generate walk-in token.');
    } finally {
      setIssuingWalkIn(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Loading patient front-desk summary...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <User className="h-12 w-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Patient Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested patient record could not be found in the directory.</p>
        <Link to="/registration-clerk">
          <Button variant="outline" className="text-xs font-semibold">
            Back to Front Desk
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-xs font-semibold text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-teal-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/registration-clerk"
          className="text-xs font-semibold text-slate-500 hover:text-teal-700 flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Front Desk
        </Link>
        <span className="text-[11px] font-mono text-slate-400">
          MRN: {patient.id}
        </span>
      </div>

      {/* Patient Header Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-black text-2xl shrink-0">
            {patient.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900">{patient.name}</h1>
              {patient.abhaVerified ? (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> ABHA Verified
                </span>
              ) : (
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Standard OPD
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {patient.age} Years � {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'} � Registered on {new Date(patient.registeredAt).toLocaleDateString()}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              <span className="font-mono text-slate-800 font-bold flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" /> +91 {patient.phone}
              </span>
              {patient.abhaId && (
                <span className="font-mono text-teal-800 font-bold">
                  ABHA: {patient.abhaId}
                </span>
              )}
              <span className="text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" /> {patient.address || 'Gandhinagar'}, {patient.district}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
          <Button
            onClick={handleDirectTokenIssue}
            disabled={issuingWalkIn}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 min-h-[40px] px-4 cursor-pointer shadow-xs"
          >
            <Ticket className="h-4 w-4" />
            {issuingWalkIn ? 'Generating...' : 'Issue Walk-in OPD Token'}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="text-xs font-semibold gap-2 min-h-[40px] px-4"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            Print Patient Summary
          </Button>
        </div>
      </div>

      {/* Active Token Card (If already in queue today) */}
      {activeToken && (
        <Card className="border-teal-300 bg-teal-50/50 shadow-xs">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-teal-700 text-white flex items-center justify-center font-mono font-black text-lg shrink-0">
                {activeToken.tokenNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                    Active Queue Token Today
                  </span>
                  <StatusBadge status={activeToken.status} />
                </div>
                <p className="text-xs text-teal-900 font-semibold mt-0.5">
                  {activeToken.departmentName} � {activeToken.roomNumber || 'Room 4'}
                </p>
                <span className="text-[11px] text-teal-700">
                  Position #{activeToken.positionInQueue || 1} � ~{activeToken.estimatedWaitMinutes || 15}m est. wait
                </span>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setActiveSlipToken(activeToken);
                setSlipModalOpen(true);
              }}
              className="bg-white text-teal-900 hover:bg-teal-100 border border-teal-300 text-xs font-semibold gap-1.5 shrink-0"
            >
              <Printer className="h-3.5 w-3.5 text-teal-700" /> View / Reprint OPD Slip
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Demographics & Today's Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Attendant & Identity (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-slate-500" />
                Emergency Attendant & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3 text-xs">
              {patient.emergencyContact ? (
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Attendant Name:</span>
                    <span className="font-bold text-slate-800">{patient.emergencyContact.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Relationship:</span>
                    <span className="font-semibold text-slate-800">{patient.emergencyContact.relationship}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Contact Number:</span>
                    <span className="font-mono font-bold text-slate-800">+91 {patient.emergencyContact.phone}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 py-3 text-center">No attendant contact recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              Front-Desk Data Privacy Protection
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Clinical diagnoses, EHR notes, and prescriptions are restricted to doctors and pharmacists in compliance with ABDM privacy protocols. Front desk clerks only manage demographics, appointments, and token dispatch.
            </p>
          </div>
        </div>

        {/* Right Column: Scheduled Appointments (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-700" />
                  Scheduled Appointments
                </span>
                <span className="text-xs text-slate-500 font-normal">
                  {appointments.length} Total
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {appointments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No appointments scheduled for this citizen.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="py-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded">
                            {apt.timeSlot}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{apt.doctorName}</span>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>{apt.specialty} � {apt.facilityName}</span>
                        <span className="text-[11px]">Date: {apt.date}</span>
                      </div>

                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                        Reason: <span className="font-medium text-slate-800">{apt.reasonForVisit}</span>
                      </p>

                      {/* Action for confirmed appointment */}
                      {apt.status === 'CONFIRMED' && (
                        <div className="flex justify-end pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(apt.id)}
                            disabled={checkingInId === apt.id}
                            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-1.5 h-8 px-4 cursor-pointer shadow-xs"
                          >
                            <Ticket className="h-3.5 w-3.5" />
                            {checkingInId === apt.id ? 'Checking In...' : 'Check In & Issue Token'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* OPD Slip Modal */}
      <OpdTokenSlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        token={activeSlipToken}
      />
    </div>
  );
};
