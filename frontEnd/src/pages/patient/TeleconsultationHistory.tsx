import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { clinicalApi } from "@/api/clinicalApi";
import { appointmentApi } from "@/api/queueApi";
import {
  Video,
  CalendarDays,
  Clock,
  User,
  CheckCircle2,
  Eye,
  Stethoscope,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

interface TeleHistoryItem {
  id: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
  facility: string;
  duration: string;
  status: string;
  notes: string;
}

const DEMO_CONSULTATION_HISTORY: TeleHistoryItem[] = [
  {
    id: "TC-1001",
    date: "10 Sep 2026",
    time: "10:30 AM",
    doctor: "Dr. Arvind Patel",
    department: "General Medicine",
    facility: "Gandhinagar Civil Hospital",
    duration: "12 mins 45 secs",
    status: "Completed",
    notes: "Advised continuing Telmisartan 40mg. Follow-up ECG in 2 weeks.",
  },
  {
    id: "TC-1002",
    date: "22 Aug 2026",
    time: "11:00 AM",
    doctor: "Dr. Mehta",
    department: "Cardiology",
    facility: "Gandhinagar Civil Hospital",
    duration: "15 mins 20 secs",
    status: "Completed",
    notes: "Patient advised regular BP monitoring and lifestyle modification.",
  },
  {
    id: "TC-1003",
    date: "05 Aug 2026",
    time: "02:30 PM",
    doctor: "Dr. Shah",
    department: "General Medicine",
    facility: "Pethapur PHC Tele-clinic",
    duration: "09 mins 10 secs",
    status: "Completed",
    notes: "Routine follow-up consultation. Continue prescribed medicines.",
  },
  {
    id: "TC-1004",
    date: "18 Jul 2026",
    time: "10:00 AM",
    doctor: "Dr. Patel",
    department: "General Medicine",
    facility: "Mansa Community Health Centre",
    duration: "11 mins 35 secs",
    status: "Completed",
    notes: "Blood sugar and blood pressure reviewed during consultation.",
  },
];

export const TeleconsultationHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<TeleHistoryItem[]>(DEMO_CONSULTATION_HISTORY);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    clinicalApi
      .getEncounters()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const teleMapped: TeleHistoryItem[] = res.data.map((enc: any) => ({
            id: enc.id,
            date: enc.startedAt ? enc.startedAt.split('T')[0] : '10 Sep 2026',
            time: enc.startedAt ? enc.startedAt.split('T')[1]?.slice(0, 5) || '10:30 AM' : '10:30 AM',
            doctor: enc.doctorName || 'Dr. Arvind Patel',
            department: enc.chiefComplaint || 'General Medicine',
            facility: enc.facilityName || 'Gandhinagar Civil Hospital',
            duration: '12 mins 30 secs',
            status: enc.status === 'COMPLETED' ? 'Completed' : 'Active',
            notes: enc.clinicalNotes || enc.historyOfPresentIllness || 'Teleconsultation conducted successfully.',
          }));
          setHistory(teleMapped);
        }
      })
      .catch(console.warn)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Teleconsultation History"
        subtitle="View your previous online consultations and consultation notes."
        breadcrumbs={[
          { label: "Dashboard", to: "/patient" },
          { label: "Teleconsultation History" },
        ]}
      actions={
  <Button
    variant="outline"
    size="sm"
    className="gap-2"
    onClick={() => navigate("/patient/consultations")}
  >
    <ArrowLeft className="h-4 w-4" />
    Back
  </Button>
}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Total Consultations
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {history.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Completed
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {
                history.filter(
                  (item) => item.status === "Completed",
                ).length
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Latest Consultation
            </p>

            <p className="mt-1 text-sm font-bold text-slate-900">
              {history[0]?.date || 'Recent'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
              <Video className="h-4 w-4 text-teal-700" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Previous Consultations
              </h2>

              <p className="text-[10px] text-slate-500">
                Your complete online consultation history
              </p>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Date & Time
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Doctor
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Department
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Facility
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Duration
                  </th>

                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((consultation) => (
                  <tr
                    key={consultation.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                  >
                    {/* Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-teal-600" />

                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {consultation.date}
                          </p>

                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="h-3 w-3" />
                            {consultation.time}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />

                        <span className="text-xs font-semibold text-slate-800">
                          {consultation.doctor}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-slate-400" />

                        <span className="text-xs text-slate-600">
                          {consultation.department}
                        </span>
                      </div>
                    </td>

                    {/* Facility */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">
                        {consultation.facility}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">
                        {consultation.duration}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {consultation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-slate-100">
            {history.map((consultation) => (
              <div key={consultation.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {consultation.doctor}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {consultation.department}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                    Completed
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-[10px] text-slate-500">
                      <CalendarDays className="h-3 w-3" />
                      {consultation.date}
                    </p>

                    <p className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      {consultation.time}
                    </p>
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

export default TeleconsultationHistory;
