import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { referralApi } from '@/api/referralApi';
import { Referral } from '@/types/referral';
import { formatDate } from '@/lib/formatters';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Stethoscope,
  BedDouble,
  Clock,
  Printer,
  FileText,
  ShieldCheck,
  User,
  Activity,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

export const ReferralDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await referralApi.getById(id);
        if (res.data) {
          setReferral(res.data);
        } else {
          // Fallback to searching all
          const allRes = await referralApi.getAll();
          const match = allRes.data?.find((r) => r.id === id);
          if (match) setReferral(match);
        }
      } catch (err) {
        console.error('Failed to load referral detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-700" />
        Loading referral dossier...
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              Referral Record Not Found
            </h2>
            <p className="text-xs text-slate-500 mt-1">The requested referral ID could not be retrieved from the healthcare database.</p>
            <Button
              onClick={() => navigate('/patient/referrals')}
              className="mt-4 bg-teal-700 hover:bg-teal-800 text-white"
            >
              Back to Referrals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmergency = referral.priority === 'EMERGENCY';
  const isUrgent = referral.priority === 'URGENT';
  const isAccepted = ['ACCEPTED', 'APPOINTMENT_CONFIRMED', 'PATIENT_ARRIVED'].includes(referral.status);
  const isArrived = referral.status === 'PATIENT_ARRIVED';
  const isConsulted = ['CONSULTED', 'OUTCOME_RECORDED', 'COMPLETED'].includes(referral.status);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/patient/referrals')}
            className="h-9 px-3 text-xs font-semibold text-slate-700"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </Button>

          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Inter-Facility Referral Slip
            </h1>
            <p className="text-xs text-slate-500">
              Official HealthConnect Hospital Network Transfer Record
            </p>
          </div>
        </div>

        <Button
          onClick={() => window.print()}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Printer className="h-3.5 w-3.5 text-slate-500" />
          Print Slip
        </Button>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Referral Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Official Referral Code
              </p>
              <h2 className="mt-0.5 text-lg font-mono font-black text-teal-800">
                {referral.referralCode}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Issued on {formatDate(referral.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isEmergency
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : isUrgent
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}
              >
                {referral.priority} Priority
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200">
                {referral.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Bed / Appointment Highlight Strip */}
          {referral.appointmentSlot && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-teal-950">
              <div className="flex items-center gap-2.5">
                <BedDouble className="h-5 w-5 text-teal-700 shrink-0" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block">
                    Receiving Hospital Bed Reservation
                  </span>
                  <span className="text-sm font-black text-teal-950">
                    {referral.appointmentSlot}
                  </span>
                </div>
              </div>

              {isArrived && (
                <div className="flex items-center gap-1.5 bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  Live Token: {referral.tokenNumber || 'A-035'}
                </div>
              )}
            </div>
          )}

          {/* Specialist Consultation Findings */}
          {isConsulted && referral.clinicalOutcomeNotes && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-blue-700" /> Specialist Consultation Outcome
                </span>
                <span className="text-xs font-semibold text-blue-800">
                  Consulted by: {referral.consultedDoctorName || 'Specialist Consultant'}
                </span>
              </div>
              <p className="text-xs text-blue-900 font-medium leading-relaxed">
                {referral.clinicalOutcomeNotes}
              </p>
            </div>
          )}

          {/* Transfer Origin and Destination Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Originating Facility */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Referring Health Facility (Origin)
              </span>
              <p className="text-sm font-bold text-slate-900">{referral.fromFacilityName}</p>
              <p className="text-xs text-slate-600">
                Referring Clinician: <strong>Dr. {referral.fromDoctorName}</strong>
              </p>
            </div>

            {/* Destination Facility */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Receiving Health Facility (Destination)
              </span>
              <p className="text-sm font-bold text-teal-900">{referral.toFacilityName}</p>
              <p className="text-xs text-slate-600">
                Target Specialty: <strong>{referral.toSpecialty}</strong>
              </p>
            </div>
          </div>

          {/* Clinical Reason and Diagnostics */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Clinical Reason for Referral
            </span>
            <p className="text-xs text-slate-900 font-semibold bg-slate-50 p-3 rounded-lg border border-slate-200">
              {referral.reasonForReferral}
            </p>

            {referral.clinicalSummary && (
              <>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-3">
                  Referring Doctor's Clinical Findings & Diagnostic Workup
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {referral.clinicalSummary}
                </p>
              </>
            )}

            {referral.requiredIcu && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  <BedDouble className="h-3.5 w-3.5 text-rose-600" />
                  ICU / Critical Care Bed Specified by Referring Doctor
                </span>
              </div>
            )}
          </div>

          {/* Patient Instructions */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">
              Patient Instructions for Arrival:
            </span>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Carry your digital or physical ABHA card along with this referral slip number ({referral.referralCode}).</li>
              <li>Report directly to the Casualty / Emergency desk upon entering {referral.toFacilityName}.</li>
              <li>Present this screen to the registration clerk to instantly retrieve your reserved bed and doctor queue slot.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};