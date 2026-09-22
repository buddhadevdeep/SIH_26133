import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { clinicalApi } from '@/api/clinicalApi';
import {
  FileText,
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  Building2,
  Eye,
  RefreshCw,
} from 'lucide-react';

type ClinicalNote = {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorName: string;
  facilityName: string;
  department: string;
  date: string;
  time: string;
  notes: string;
};

const DEMO_SAVED_NOTES: ClinicalNote[] = [
  {
    id: 'NOTE-001',
    patientName: 'Rameshwar Sharma',
    patientAge: 48,
    patientGender: 'M',
    doctorName: 'Dr. Arvind Patel',
    facilityName: 'Pethapur PHC',
    department: 'General Medicine',
    date: '11 Sep 2026',
    time: '10:42 AM',
    notes:
      'Advised continuing Telmisartan 40mg. Follow-up ECG in 2 weeks.',
  },
  {
    id: 'NOTE-002',
    patientName: 'Meena Patel',
    patientAge: 42,
    patientGender: 'F',
    doctorName: 'Dr. Arvind Patel',
    facilityName: 'Gandhinagar Civil Hospital',
    department: 'General Medicine',
    date: '09 Sep 2026',
    time: '02:15 PM',
    notes:
      'Patient reported mild headache and weakness. Advised hydration and regular medication.',
  },
  {
    id: 'NOTE-003',
    patientName: 'Kiran Shah',
    patientAge: 35,
    patientGender: 'M',
    doctorName: 'Dr. Arvind Patel',
    facilityName: 'Mansa Community Health Centre',
    department: 'Cardiology',
    date: '05 Sep 2026',
    time: '11:30 AM',
    notes:
      'ECG reviewed. No immediate abnormality observed. Continue prescribed medication.',
  },
];

export const ClinicalNotes: React.FC = () => {
  const [notes, setNotes] = useState<ClinicalNote[]>(DEMO_SAVED_NOTES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    clinicalApi
      .getEncounters()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const mapped: ClinicalNote[] = res.data.map((enc: any) => ({
            id: enc.id,
            patientName: enc.patientName || 'Patient',
            patientAge: 48,
            patientGender: 'M',
            doctorName: enc.doctorName || 'Medical Officer',
            facilityName: enc.facilityName || 'Gandhinagar Civil Hospital',
            department: enc.chiefComplaint || 'General OPD',
            date: enc.startedAt ? enc.startedAt.split('T')[0] : '2026-09-12',
            time: enc.startedAt ? enc.startedAt.split('T')[1]?.slice(0, 5) || '10:00 AM' : '10:00 AM',
            notes: enc.clinicalNotes || enc.historyOfPresentIllness || 'Clinical examination and medication prescribed.',
          }));
          setNotes(mapped);
        }
      })
      .catch(console.warn)
      .finally(() => setIsLoading(false));
  }, []);
  return (
    <div className="space-y-5">

      <PageHeader
        title="Saved Clinical Notes"
        subtitle="View notes saved from previous teleconsultation sessions."
        breadcrumbs={[
          { label: 'Doctor Dashboard', to: '/doctor' },
          { label: 'Clinical Notes' },
        ]}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                <FileText className="h-4 w-4 text-teal-700" />
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Total Notes
                </p>
                <p className="text-xl font-black text-slate-900">
                  {notes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <User className="h-4 w-4 text-blue-700" />
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Patients
                </p>
                <p className="text-xl font-black text-slate-900">
                  {notes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                <Stethoscope className="h-4 w-4 text-emerald-700" />
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Latest Note
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {notes[0]?.date || 'Recent'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Notes List */}
      <Card className="border-slate-200 bg-white shadow-sm">

        <CardContent className="p-0">

          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">
              Consultation Notes
            </h2>

            <p className="text-[10px] text-slate-500 mt-0.5">
              Clinical notes recorded during teleconsultations
            </p>
          </div>

          <div className="divide-y divide-slate-100">

            {notes.map((note) => (

              <div
                key={note.id}
                className="p-4 hover:bg-slate-50 transition"
              >

                {/* Top */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                      <FileText className="h-5 w-5 text-teal-700" />
                    </div>

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <h3 className="text-sm font-bold text-slate-900">
                          {note.patientName}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-600">
                          {note.patientAge}Y / {note.patientGender}
                        </span>

                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {note.department}
                      </p>

                    </div>

                  </div>

                  <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold text-emerald-700">
                    Saved
                  </span>

                </div>

                {/* Details */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">

                    <Building2 className="h-3.5 w-3.5 text-slate-400" />

                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">
                        Facility
                      </p>

                      <p className="text-[10px] font-semibold text-slate-700">
                        {note.facilityName}
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">

                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">
                        Date
                      </p>

                      <p className="text-[10px] font-semibold text-slate-700">
                        {note.date}
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">

                    <Clock className="h-3.5 w-3.5 text-slate-400" />

                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">
                        Time
                      </p>

                      <p className="text-[10px] font-semibold text-slate-700">
                        {note.time}
                      </p>
                    </div>

                  </div>

                </div>

                {/* Note */}
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">

                  <p className="text-[9px] uppercase font-bold tracking-wide text-slate-400 mb-1">
                    Clinical Note
                  </p>

                  <p className="text-xs leading-relaxed text-slate-700">
                    {note.notes}
                  </p>

                </div>

                {/* Bottom */}
                <div className="mt-3 flex items-center justify-between">

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Stethoscope className="h-3 w-3" />
                    {note.doctorName}
                  </div>

                  <Link to={`/doctor/clinical-notes/${note.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-[10px]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </Button>
                  </Link>

                </div>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>

    </div>
  );
};

export default ClinicalNotes;