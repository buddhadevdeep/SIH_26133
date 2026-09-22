import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge } from '@/components/ui/Badge';
import { INITIAL_LIVE_QUEUE } from '@/mock/mockData';
import { mockState } from '@/mock/db';
import { queueApi } from '@/api/queueApi';
import { operationsApi } from '@/api/operationsApi';
import { LiveQueueState } from '@/types/queue';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Ticket,
  Users,
  GitBranch,
  Video,
  Clock,
  ArrowRight,
  AlertCircle,
  CalendarDays,
  Activity,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const doctorKey = user?.id || 'usr_doc_01';
  const [queue, setQueue] = useState<LiveQueueState>(INITIAL_LIVE_QUEUE);
  const [isOnLeave, setIsOnLeave] = useState<boolean>(() => {
    const leaveInfo = mockState?.isDoctorOnLeave ? mockState.isDoctorOnLeave(doctorKey) : { onLeave: false };
    return leaveInfo.onLeave;
  });
  const [leaveData, setLeaveData] = useState<any>(null);

  useEffect(() => {
    // Fetch live queue from backend
    queueApi.getLiveQueue('fac_civil_01').then((res) => {
      if (res?.data) {
        setQueue(res.data);
      }
    }).catch((err) => {
      console.warn('Live queue fetch failed, using local queue:', err);
    });

    // Fetch doctor leave status from backend
    operationsApi.getDoctorLeaves(doctorKey).then((res) => {
      if (res?.data && Array.isArray(res.data)) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const activeLeave = res.data.find(
          (l) => l.status === 'APPROVED' && l.startDate <= todayStr && l.endDate >= todayStr
        );
        if (activeLeave) {
          setIsOnLeave(true);
          setLeaveData(activeLeave);
        } else {
          setIsOnLeave(false);
          setLeaveData(null);
        }
      }
    }).catch((err) => {
      console.warn('Doctor leaves fetch failed:', err);
    });
  }, [doctorKey]);

  const waitingTokens = queue.tokens.filter(
    (t) => t.status === 'WAITING'
  );

  return (
    <div className="space-y-5">
      {/* On Leave Alert Banner */}
      {isOnLeave && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950 shadow-sm animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-200 text-rose-900 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-rose-950">You Are Currently Scheduled On Leave</p>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                  {leaveData?.category || 'LEAVE'}
                </span>
              </div>
              <p className="text-rose-800 text-xs mt-0.5 font-medium">
                {leaveData?.reason ? `"${leaveData.reason}"` : 'Active roster leave period.'}
                {leaveData?.endDate ? ` (returning ${leaveData.endDate})` : ''}.
                District directories & registration counters show your status as "ON LEAVE (Not Available)".
              </p>
            </div>
          </div>
          <Link to="/doctor/roster">
            <Button size="sm" className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shrink-0 cursor-pointer">
              Manage Roster & Leaves
            </Button>
          </Link>
        </div>
      )}

      {/* Welcome Section */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 p-4 sm:p-5 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <p className="text-xs font-medium text-teal-300 mb-1">
              Doctor Dashboard
            </p>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Welcome, {user?.name || 'Dr. Arvind Patel'} 👋
            </h1>

            <p className="text-xs text-teal-100/80 mt-1.5">
              General Medicine • Room 4
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/doctor/roster">
              <Button
                size="md"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold gap-2 w-full sm:w-auto cursor-pointer"
              >
                <CalendarDays className="h-4 w-4" />
                Month Planner
              </Button>
            </Link>
            <Link to="/doctor/patients">
              <Button
                size="md"
                className="bg-teal-600 hover:bg-teal-500 text-white font-semibold gap-2 shadow-md w-full sm:w-auto cursor-pointer"
              >
                <Activity className="h-4 w-4" />
                Patients & Treatment
              </Button>
            </Link>
          </div>

        </div>
      </div>


      {/* Today's Summary */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-2.5">
          Today’s Summary
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Waiting */}
          <Card className="border-slate-200">
            <CardContent className="p-3.5">

              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-teal-700" />
                </div>

                <span className="text-[10px] font-medium text-slate-400">
                  Patients
                </span>
              </div>

              <p className="text-2xl font-bold text-slate-900 mt-2.5">
                {queue.totalWaiting}
              </p>

              <p className="text-xs font-medium text-slate-600 mt-0.5">
                Waiting
              </p>

              <p className="text-[10px] text-slate-500 mt-0.5">
                About 8 min. each
              </p>

            </CardContent>
          </Card>


          {/* Current Patient */}
          <Card className="border-slate-200">
            <CardContent className="p-3.5">

              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-sky-700" />
                </div>

                <span className="text-[10px] font-medium text-slate-400">
                  Token
                </span>
              </div>

              <p className="text-2xl font-bold text-sky-700 mt-2.5">
                {queue.currentTokenNumber}
              </p>

              <p className="text-xs font-medium text-slate-600 mt-0.5">
                Now Seeing
              </p>

              <p className="text-[10px] text-slate-500 mt-0.5">
                Room 4
              </p>

            </CardContent>
          </Card>


          {/* Urgent */}
          <Card className="border-rose-200 bg-rose-50/50">
            <CardContent className="p-3.5">

              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-rose-700" />
                </div>

                <span className="text-[10px] font-medium text-rose-500">
                  Attention
                </span>
              </div>

              <p className="text-2xl font-bold text-rose-700 mt-2.5">
                1
              </p>

              <p className="text-xs font-medium text-rose-800 mt-0.5">
                Urgent Patient
              </p>

              <p className="text-[10px] text-rose-600 mt-0.5">
                Needs quick attention
              </p>

            </CardContent>
          </Card>


          {/* Referrals */}
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardContent className="p-3.5">

              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <GitBranch className="h-4 w-4 text-indigo-700" />
                </div>

                <span className="text-[10px] font-medium text-indigo-500">
                  Action
                </span>
              </div>

              <p className="text-2xl font-bold text-indigo-700 mt-2.5">
                2
              </p>

              <p className="text-xs font-medium text-indigo-800 mt-0.5">
                Referrals
              </p>

              <p className="text-[10px] text-indigo-600 mt-0.5">
                Patients to refer
              </p>

            </CardContent>
          </Card>

        </div>
      </div>


      {/* Patients + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Waiting Patients */}
        <Card className="lg:col-span-2 border-slate-200">

          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">

            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Patients Waiting
              </CardTitle>

              <p className="text-xs text-slate-500 mt-0.5">
                Patients ready to see the doctor
              </p>
            </div>

            <Link to="/doctor/patients">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
              >
                View Patients
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>

          </CardHeader>


          <CardContent className="p-4 pt-1.5 space-y-2.5">

            {waitingTokens.length === 0 ? (

              <div className="py-8 text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-teal-700" />
                </div>

                <p className="font-semibold text-sm text-slate-800 mt-2.5">
                  No patients waiting
                </p>

                <p className="text-xs text-slate-500 mt-0.5">
                  The queue is currently clear.
                </p>
              </div>

            ) : (

              waitingTokens.map((t) => (

                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                >

                  {/* Patient Information */}
                  <div className="flex items-center gap-2.5">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 font-bold text-xs">
                      {t.tokenNumber}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {t.patientName}
                      </h3>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t.patientAge} years • {t.patientGender}
                      </p>

                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5 text-slate-400" />

                        <p className="text-[11px] text-slate-500">
                          Waiting {t.estimatedWaitMinutes} min
                        </p>
                      </div>
                    </div>

                  </div>


                  {/* Patient Action */}
                  <div className="flex items-center gap-2">

                    <PriorityBadge priority={t.priority} />

                    <Link to={`/doctor/patients/${t.patientId}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs bg-teal-700 hover:bg-teal-800"
                      >
                        Open Patient
                      </Button>
                    </Link>

                  </div>

                </div>

              ))

            )}

          </CardContent>
        </Card>


        {/* Quick Actions */}
        <Card className="border-slate-200 h-fit">

          <CardHeader className="pb-2 px-4 pt-4">

            <CardTitle className="text-base font-bold text-slate-900">
              Quick Actions
            </CardTitle>

            <p className="text-xs text-slate-500 mt-0.5">
              Common things you can do
            </p>

          </CardHeader>


          <CardContent className="p-4 pt-1.5 space-y-2">

            {/* Refer Patient */}
            <Link to="/doctor/referrals" className="block">

              <Button
                variant="outline"
                size="md"
                className="w-full justify-start gap-2.5 text-xs text-left h-11"
              >
                <div className="h-7 w-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                  <GitBranch className="h-3.5 w-3.5 text-teal-700" />
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    Refer Patient
                  </p>

                  <p className="text-[10px] text-slate-500">
                    Find another hospital
                  </p>
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Button>

            </Link>


            {/* Video Consultation */}
            <Link to="/doctor/teleconsultations" className="block">

              <Button
                variant="outline"
                size="md"
                className="w-full justify-start gap-2.5 text-xs text-left h-11"
              >
                <div className="h-7 w-7 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                  <Video className="h-3.5 w-3.5 text-sky-700" />
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    Video Consultation
                  </p>

                  <p className="text-[10px] text-slate-500">
                    Talk to a specialist
                  </p>
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Button>

            </Link>


            {/* Open Patient */}
            <Link
              to="/doctor/patients/usr_pat_01"
              className="block"
            >

              <Button
                variant="outline"
                size="md"
                className="w-full justify-start gap-2.5 text-xs text-left h-11"
              >
                <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-3.5 w-3.5 text-indigo-700" />
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    Open Patient
                  </p>

                  <p className="text-[10px] text-slate-500">
                    View patient details
                  </p>
                </div>

                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              </Button>

            </Link>

          </CardContent>
        </Card>

      </div>

    </div>
  );
};