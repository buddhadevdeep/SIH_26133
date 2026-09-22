import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  INITIAL_HEALTH_RECORD,
  INITIAL_LIVE_QUEUE,
} from '@/mock/mockData';
import { formatDate } from '@/lib/formatters';
import {
  Stethoscope,
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Heart,
  Droplets,
  Printer,
  Pill,
  Search,
  Users,
  ChevronRight,
  Phone,
  Plus,
  ExternalLink,
  History,
  Building2,
  FlaskConical,
  Sparkles,
} from 'lucide-react';

// Clinical Encounters Categorized by Recent vs Old
interface HistoricalEncounter {
  id: string;
  isRecent: boolean;
  timeAgo: string;
  date: string;
  doctorName: string;
  specialty: string;
  facility: string;
  diagnosis: string;
  complaint: string;
  vitals: string;
  notes: string;
  prescriptions: string[];
}

const CLINICAL_VISITS: HistoricalEncounter[] = [
  {
    id: 'enc_01',
    isRecent: true,
    timeAgo: '10 Days Ago (Recent)',
    date: '2026-03-01T10:30:00Z',
    doctorName: 'Dr. Arvind Patel',
    specialty: 'MD Internal Medicine',
    facility: 'Gandhinagar Civil Hospital • OPD Room 4',
    diagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension',
    complaint: 'Routine follow-up for blood pressure and blood sugar checkup.',
    vitals: 'BP: 128/82 mmHg • Pulse: 74 bpm • Sugar: 148 mg/dL',
    notes: 'Blood pressure is well-controlled on Telmisartan. Blood sugar slightly elevated. Advised morning 30-minute brisk walk and strict low-salt diet.',
    prescriptions: [
      'Tab. Metformin 1000mg SR (1-0-1 After Food)',
      'Tab. Telmisartan 40mg (1-0-0 Morning)',
      'Tab. Atorvastatin 10mg (0-0-1 Night)',
    ],
  },
  {
    id: 'enc_02',
    isRecent: false,
    timeAgo: '2 Months Ago (Old)',
    date: '2026-01-20T14:20:00Z',
    doctorName: 'Dr. Neha Vaghela',
    specialty: 'MS Ophthalmology (Eye Specialist)',
    facility: 'Gandhinagar Civil Hospital • Eye OPD',
    diagnosis: 'Diabetic Retinopathy Screening',
    complaint: 'Annual diabetic eye examination on referral from primary center.',
    vitals: 'Vision: 6/6 bilateral with glasses',
    notes: 'Dilated fundus examination completed. Clear media. No evidence of diabetic microaneurysms or macular edema.',
    prescriptions: ['Carboxymethylcellulose 0.5% Eye Drops (1 drop TDS)'],
  },
  {
    id: 'enc_03',
    isRecent: false,
    timeAgo: '3 Months Ago (Old)',
    date: '2025-12-15T09:45:00Z',
    doctorName: 'Dr. Priya Sharma',
    specialty: 'Medical Officer',
    facility: 'Pethapur Primary Health Centre (PHC)',
    diagnosis: 'Acute Bacterial Bronchitis & Cold',
    complaint: 'Persistent productive cough, fever 101°F, and sore throat for 4 days.',
    vitals: 'BP: 122/80 mmHg • Pulse: 88 bpm • Temp: 100.8°F',
    notes: 'Scattered rhonchi heard in right lower zone. Started on oral antibiotics and bronchodilator. Symptoms resolved in 5 days.',
    prescriptions: [
      'Tab. Azithromycin 500mg (1-0-0 for 3 Days)',
      'Tab. Paracetamol 650mg (1-0-1 for 3 Days)',
      'Syrup Ambroxol + Levosalbutamol (2 tsp TDS)',
    ],
  },
];

// Historical Inpatient Admissions
const HOSPITAL_ADMISSIONS = [
  {
    id: 'adm_01',
    isRecent: false,
    timeAgo: '4 Months Ago (Old)',
    admitDate: '2025-11-04',
    dischargeDate: '2025-11-07',
    facility: 'Gandhinagar Civil Hospital',
    ward: 'Male Medical Ward - Bed 14',
    doctor: 'Dr. Arvind Patel',
    diagnosis: 'Acute Asthmatic Bronchitis with Mild Hypoxia',
    summary: 'Admitted with sudden breathlessness (SpO2 93% on room air). Treated with nebulization, IV hydrocortisone, and supplemental oxygen. Discharged hemodynamically stable after 3 days.',
  },
];

// Past Diagnostic Lab Reports
const LAB_REPORTS = [
  {
    id: 'lab_01',
    isRecent: true,
    date: '2026-02-14',
    testName: 'HbA1c (Glycated Hemoglobin)',
    value: '7.4 %',
    status: 'ELEVATED',
    facility: 'Civil Hospital Central Lab',
    summary: 'Sub-optimally controlled glycemic control over past 90 days. Diet compliance advised.',
  },
  {
    id: 'lab_02',
    isRecent: true,
    date: '2026-02-14',
    testName: 'Fasting Blood Sugar (FBS)',
    value: '148 mg/dL',
    status: 'ELEVATED',
    facility: 'Civil Hospital Central Lab',
    summary: 'Elevated fasting blood glucose. Advised dietary control.',
  },
  {
    id: 'lab_03',
    isRecent: true,
    date: '2026-02-14',
    testName: 'Lipid Profile - Total Cholesterol',
    value: '198 mg/dL',
    status: 'BORDERLINE',
    facility: 'Civil Hospital Central Lab',
    summary: 'Borderline elevation. Triglycerides: 165 mg/dL, LDL: 124 mg/dL.',
  },
  {
    id: 'lab_04',
    isRecent: false,
    date: '2026-01-10',
    testName: '12-Lead ECG (Electrocardiogram)',
    value: 'Normal Sinus Rhythm',
    status: 'NORMAL',
    facility: 'Civil Cardiology Wing',
    summary: 'Rate 72 bpm, normal axis, no pathological Q waves, no acute ischemia at rest.',
  },
  {
    id: 'lab_05',
    isRecent: false,
    date: '2025-12-18',
    testName: 'Chest X-Ray (PA View)',
    value: 'Clear Lung Fields',
    status: 'NORMAL',
    facility: 'Pethapur CHC Radiology',
    summary: 'Bilateral lung fields clear. Costophrenic angles sharp. Heart size normal.',
  },
];

export const PatientHistoryPage: React.FC = () => {
  const { id: routePatientId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Queue Tokens
  const queueTokens = INITIAL_LIVE_QUEUE.tokens;
  const activeToken =
    queueTokens.find((t) => t.patientId === routePatientId) ||
    queueTokens[0] || {
      id: 'tok_035',
      tokenNumber: 'A-035',
      patientId: 'usr_pat_99',
      patientName: 'Govindbhai Prajapati',
      patientAge: 52,
      patientGender: 'M',
      patientPhone: '9825011122',
      status: 'CALLED',
    };

  const patient = {
    ...INITIAL_HEALTH_RECORD,
    patientId: activeToken.patientId,
    name: activeToken.patientName,
    age: activeToken.patientAge,
    gender: activeToken.patientGender === 'M' ? 'Male' : 'Female',
    phone: activeToken.patientPhone,
    tokenNumber: activeToken.tokenNumber,
  };

  // Filter State: ALL | RECENT | OLD | LABS
  const [filterMode, setFilterMode] = useState<'ALL' | 'RECENT' | 'OLD' | 'LABS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.toLowerCase().trim();

  // Filter encounters
  const filteredVisits = CLINICAL_VISITS.filter((v) => {
    if (filterMode === 'RECENT' && !v.isRecent) return false;
    if (filterMode === 'OLD' && v.isRecent) return false;
    if (!q) return true;
    return (
      v.diagnosis.toLowerCase().includes(q) ||
      v.doctorName.toLowerCase().includes(q) ||
      v.prescriptions.some((p) => p.toLowerCase().includes(q)) ||
      v.notes.toLowerCase().includes(q)
    );
  });

  // Filter admissions
  const filteredAdmissions = HOSPITAL_ADMISSIONS.filter((a) => {
    if (filterMode === 'RECENT') return false; // admission is 4 months old
    if (!q) return true;
    return (
      a.diagnosis.toLowerCase().includes(q) ||
      a.facility.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q)
    );
  });

  // Filter labs
  const filteredLabs = LAB_REPORTS.filter((l) => {
    if (filterMode === 'RECENT' && !l.isRecent) return false;
    if (filterMode === 'OLD' && l.isRecent) return false;
    if (!q) return true;
    return (
      l.testName.toLowerCase().includes(q) ||
      l.summary.toLowerCase().includes(q) ||
      l.value.toLowerCase().includes(q)
    );
  });

  const treatmentDeskUrl = `/doctor/patients/${patient.patientId || 'usr_pat_01'}`;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16 font-sans">
      {/* ================================================== */}
      {/* TOP HEADER & RETURN ACTION */}
      {/* ================================================== */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 shadow-xs">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900">
                Patient Records • Old & Recent Visits
              </h1>
              <p className="text-xs text-slate-500">
                Compare previous treatments, past doctor prescriptions, and recent lab tests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs h-8 text-slate-600 gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Print Records</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(treatmentDeskUrl)}
              className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-black h-8 gap-1.5 shadow-xs cursor-pointer"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Resume Today's Prescription Desk</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Button>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* PATIENT PROFILE STRIP */}
      {/* ================================================== */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 via-white to-teal-50/40 shadow-xs">
        <CardContent className="p-3.5 sm:p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-700 text-white font-mono font-black text-sm shadow-xs">
                {patient.tokenNumber}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900">{patient.name}</h2>
                  <span className="text-xs text-slate-600 font-bold">
                    {patient.age}Y • {patient.gender}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                    ABHA: {patient.abhaId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3 w-3 text-slate-400" />
                    +91 {patient.phone}
                  </span>
                  <span>• Blood: <strong>{patient.bloodGroup}</strong></span>
                  <span>• Civil Hospital Gandhinagar</span>
                </p>
              </div>
            </div>

            {/* Quick Alerts */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-xl text-xs font-bold">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                Allergy: Penicillin & Sulfa
              </span>
              <span className="flex items-center gap-1 bg-teal-100 text-teal-800 border border-teal-300 px-2.5 py-1 rounded-xl text-xs font-bold">
                <Activity className="h-3.5 w-3.5 text-teal-700" />
                Chronic: Diabetes & BP
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================== */}
      {/* FILTER BUTTONS: ALL vs RECENT vs OLD vs LABS */}
      {/* ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Simple Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-purple-700 text-white shadow-xs font-black'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            🌟 All Records ({CLINICAL_VISITS.length + HOSPITAL_ADMISSIONS.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('RECENT')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'RECENT'
                ? 'bg-emerald-700 text-white shadow-xs font-black'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>🟢 Recent Visits (Last 30 Days)</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('OLD')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'OLD'
                ? 'bg-blue-700 text-white shadow-xs font-black'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
            <span>📁 Old Past Records</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('LABS')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'LABS'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>🧪 Lab Reports ({LAB_REPORTS.length})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search past disease or med..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* ================================================== */}
      {/* TIMELINE LIST: RECENT & OLD VISITS */}
      {/* ================================================== */}
      <div className="space-y-3">
        {filterMode !== 'LABS' && (
          <>
            {filteredVisits.map((visit) => (
              <div
                key={visit.id}
                className={`rounded-2xl border p-4 sm:p-5 bg-white shadow-2xs space-y-3 transition-all ${
                  visit.isRecent
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Visit Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                        visit.isRecent
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{visit.timeAgo}</span>
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {visit.diagnosis}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right text-xs">
                    <span className="font-bold text-slate-900">{visit.doctorName}</span>
                    <span className="text-slate-500 block text-[11px]">{visit.facility}</span>
                  </div>
                </div>

                {/* Complaint & Notes */}
                <div className="space-y-1 text-xs text-slate-700">
                  <p>
                    <strong className="text-slate-900 font-bold">Patient Complaint:</strong> {visit.complaint}
                  </p>
                  <p>
                    <strong className="text-slate-900 font-bold">Doctor Advice / Clinical Notes:</strong> {visit.notes}
                  </p>
                </div>

                {/* Vitals Recorded */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-slate-700">
                    <strong>Vitals:</strong> {visit.vitals}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Date: {formatDate(visit.date)}
                  </span>
                </div>

                {/* Prescribed Medications */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Medicines Prescribed in this visit:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {visit.prescriptions.map((med, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-1"
                      >
                        <Pill className="h-3 w-3 text-teal-600" />
                        <span>{med}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Inpatient Hospital Admissions */}
            {filteredAdmissions.map((adm) => (
              <div
                key={adm.id}
                className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 sm:p-5 shadow-2xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black px-2.5 py-0.5 rounded-xl">
                      🏥 {adm.timeAgo} • INPATIENT ADMISSION
                    </span>
                    <h3 className="text-sm font-black text-rose-950">{adm.diagnosis}</h3>
                  </div>
                  <span className="text-xs text-rose-700 font-medium">{adm.facility} ({adm.ward})</span>
                </div>
                <p className="text-xs text-rose-900 leading-relaxed">{adm.summary}</p>
                <p className="text-[11px] text-rose-600 font-medium">
                  Stay: {adm.admitDate} to {adm.dischargeDate} • Attending: {adm.doctor}
                </p>
              </div>
            ))}
          </>
        )}

        {/* Lab Reports View */}
        {(filterMode === 'ALL' || filterMode === 'LABS') && (
          <div className="space-y-2.5 pt-2">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-purple-700" />
              <span>Past Diagnostic & Lab Reports ({filteredLabs.length}):</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredLabs.map((lab) => (
                <div
                  key={lab.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{lab.testName}</h4>
                      <p className="text-[10px] text-slate-400">{lab.date} • {lab.facility}</p>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        lab.status === 'NORMAL'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {lab.status}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Value</span>
                    <span className="text-sm font-black text-slate-900">{lab.value}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{lab.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Return to Consultation Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-600 font-medium">
          Done reviewing past history for <strong>{patient.name}</strong>?
        </p>
        <Button
          onClick={() => navigate(treatmentDeskUrl)}
          variant="primary"
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-black gap-2 px-5 py-2.5 rounded-xl cursor-pointer"
        >
          <Stethoscope className="h-4 w-4" />
          <span>Resume Treatment & Prescription Desk</span>
        </Button>
      </div>
    </div>
  );
};

export default PatientHistoryPage;
