import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { referralApi } from '@/api/referralApi';
import { Referral } from '@/types/referral';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/formatters';

import {
  GitBranch,
  Building2,
  Stethoscope,
  CalendarDays,
  ChevronRight,
  FileText,
  Clock,
  BedDouble,
  CheckCircle2,
  Activity,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export const ReferralTracking: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPatientReferrals = async () => {
    try {
      setLoading(true);
      const res = await referralApi.getAll();
      if (res.data && res.data.length > 0) {
        // Find referrals for this patient, or show all patient's referrals
        const currentPatientPhone = user?.phone || '9825011122';
        const currentPatientId = user?.id || 'usr_pat_01';
        const myReferrals = res.data.filter(
          (r) =>
            r.patientId === currentPatientId ||
            r.patientPhone === currentPatientPhone ||
            r.patientName.toLowerCase().includes(user?.name?.toLowerCase() || 'govindbhai')
        );
        setReferrals(myReferrals.length > 0 ? myReferrals : res.data);
      }
    } catch (err) {
      console.error('Failed to load patient referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientReferrals();
  }, [user]);

  // First referral = current / active referral
  const activeReferral = referrals[0];

  // Remaining referrals = history
  const referralHistory = referrals.slice(1);

  // Closed-loop timeline stage calculation
  const getTimelineStep = (status: string) => {
    if (['CREATED', 'SENT', 'RECEIVED'].includes(status)) return 1;
    if (['UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'CLARIFICATION_RECEIVED'].includes(status)) return 2;
    if (['ACCEPTED', 'APPOINTMENT_PENDING', 'APPOINTMENT_CONFIRMED'].includes(status)) return 3;
    if (['CHECKED_IN', 'PATIENT_ARRIVED'].includes(status)) return 4;
    if (['IN_CONSULTATION', 'CONSULTED', 'OUTCOME_RECORDED'].includes(status)) return 5;
    if (['COMPLETED', 'CLOSED'].includes(status)) return 6;
    return 1;
  };

  const activeStep = activeReferral ? getTimelineStep(activeReferral.status) : 1;

  return (
    <div className="space-y-4">
      {/* PAGE HEADER */}
      <PageHeader
        title={t('referrals.title')}
        subtitle={t('referrals.subtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), to: '/patient' },
          { label: t('referrals.title') },
        ]}
      />

      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-700" />
          Loading your referrals...
        </div>
      ) : activeReferral ? (
        /* CURRENT REFERRAL */
        <Card className="border-teal-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <GitBranch className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      {t('referrals.currentReferral')}
                    </h2>
                    <PriorityBadge priority={activeReferral.priority} />
                  </div>
                  <p className="text-xs font-mono font-bold text-teal-800 mt-0.5">
                    {activeReferral.referralCode}
                  </p>
                </div>
              </div>

              <StatusBadge status={activeReferral.status} />
            </div>

            {/* 6-Stage Closed-Loop Visual Tracker */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Transfer & Clinical Consultation Progress
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {[
                  { step: 1, label: 'Referral Initiated' },
                  { step: 2, label: 'Hospital Triaged' },
                  { step: 3, label: 'Bed Reserved' },
                  { step: 4, label: 'Patient Arrived' },
                  { step: 5, label: 'Specialist Consult' },
                  { step: 6, label: 'Closed / Outcome' },
                ].map((s) => {
                  const isDone = s.step <= activeStep;
                  const isCurrent = s.step === activeStep;
                  return (
                    <div
                      key={s.step}
                      className={`p-2.5 rounded-xl text-center border transition-all ${
                        isCurrent
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : isDone
                          ? 'bg-teal-50 text-teal-900 border-teal-200'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      <span className={`text-[10px] block font-black ${isCurrent ? 'text-teal-200' : isDone ? 'text-teal-700' : 'text-slate-300'}`}>
                        Step {s.step}
                      </span>
                      <span className="text-xs font-bold block leading-tight mt-0.5">
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Hospital */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-teal-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('referrals.referredTo')}
                  </p>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900 truncate">
                  {activeReferral.toFacilityName}
                </p>
              </div>

              {/* Department */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('referrals.department')}
                  </p>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-900">
                  {activeReferral.toSpecialty}
                </p>
              </div>

              {/* Bed / Appointment */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-3.5 w-3.5 text-teal-700" />
                  <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                    Allocated Ward / Bed
                  </p>
                </div>
                <p className="mt-1 text-xs font-bold text-teal-950 truncate">
                  {activeReferral.appointmentSlot || 'Bed Allocation In Progress'}
                </p>
              </div>
            </div>

            {/* Arrived Token Notification */}
            {activeReferral.status === 'PATIENT_ARRIVED' && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>
                    You have arrived at {activeReferral.toFacilityName}. Please report to Casualty / OPD reception.
                  </span>
                </div>
                <span className="font-mono font-black text-xs bg-emerald-800 text-white px-2.5 py-1 rounded-lg">
                  Token: {activeReferral.tokenNumber || 'A-035'}
                </span>
              </div>
            )}

            {/* Specialist Outcome Summary */}
            {activeReferral.clinicalOutcomeNotes && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-950 space-y-1">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>Specialist Consultation Findings:</span>
                  <span>Consultant: {activeReferral.consultedDoctorName || 'Attending Specialist'}</span>
                </div>
                <p className="text-blue-900">{activeReferral.clinicalOutcomeNotes}</p>
              </div>
            )}

            {/* Reason */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Clinical Referral Reason
              </p>
              <p className="mt-1 text-xs text-slate-700 font-medium">
                {activeReferral.reasonForReferral}
              </p>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                Referred by Dr. {activeReferral.fromDoctorName} ({activeReferral.fromFacilityName})
              </span>
              <Link to={`/patient/referrals/${activeReferral.id}`}>
                <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 text-slate-700">
                  View Full Slip & Instructions
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-8 text-center border-slate-200">
          <GitBranch className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No active referrals recorded</p>
          <p className="text-[11px] text-slate-400 mt-0.5">When a doctor refers you to a higher healthcare facility, it will appear here.</p>
        </Card>
      )}

      {/* REFERRAL HISTORY */}
      {referralHistory.length > 0 && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {t('referrals.history')}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Your previous referrals
                </p>
              </div>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Referral
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Department
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Hospital
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referralHistory.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                      {referral.referralCode}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                      {referral.toSpecialty}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                      {referral.toFacilityName}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(referral.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={referral.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/patient/referrals/${referral.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-[11px]">
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};