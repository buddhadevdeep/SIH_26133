import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MonitorUp,
  Clock,
  Clock3,
  User,
  PhoneIncoming,
  ShieldCheck,
  CircleCheck,
  X,
  Stethoscope,
  Heart,
  Activity,
  AlertCircle,
  Pill,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  PhoneCall,
  Wifi,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Sliders,
  Maximize2,
  Send,
  AlertTriangle,
  Hospital,
  Droplet,
  Flame,
} from 'lucide-react';

/* =========================================================
   TYPES & MOCK DATA
========================================================== */

export interface TeleconsultationPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  abhaId: string;
  reason: string;
  symptoms: string[];
  priority: 'URGENT' | 'HIGH' | 'ROUTINE';
  status: 'CALLING' | 'WAITING' | 'COMPLETED';
  waitTimeMinutes: number;
  facilityOrigin: string;
  bloodGroup: string;
  allergies?: string[];
  vitals: {
    bp: string;
    pulse: string;
    spo2: string;
    temp: string;
    bloodSugar?: string;
  };
}

export interface PrescribedMedicine {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  duration: string;
  instructions: string;
}

const INITIAL_REQUESTING_PATIENTS: TeleconsultationPatient[] = [
  {
    id: 'req-01',
    name: 'Rameshwar Sharma',
    age: 48,
    gender: 'Male',
    abhaId: '14-8921-3409-7721',
    reason: 'Acute chest tightness & shortness of breath',
    symptoms: ['Chest Discomfort', 'Radiating Left Arm Pain', 'Sweating x 45 min'],
    priority: 'URGENT',
    status: 'CALLING',
    waitTimeMinutes: 2,
    facilityOrigin: 'Pethapur PHC Tele-Kiosk',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    vitals: {
      bp: '144/92 mmHg',
      pulse: '92 bpm',
      spo2: '96%',
      temp: '98.6°F',
      bloodSugar: '148 mg/dL',
    },
  },
  {
    id: 'req-02',
    name: 'Priya Patel',
    age: 35,
    gender: 'Female',
    abhaId: '22-4109-8831-1022',
    reason: 'Seasonal allergic bronchitis & nocturnal cough',
    symptoms: ['Dry Irritating Cough', 'Evening Wheezing', 'Chest Tightness'],
    priority: 'HIGH',
    status: 'WAITING',
    waitTimeMinutes: 7,
    facilityOrigin: 'Patient Home Mobile App',
    bloodGroup: 'O+',
    allergies: ['Dust / Pollen'],
    vitals: {
      bp: '118/76 mmHg',
      pulse: '78 bpm',
      spo2: '99%',
      temp: '99.1°F',
    },
  },
  {
    id: 'req-03',
    name: 'Amit Shah',
    age: 52,
    gender: 'Male',
    abhaId: '18-9903-1254-4410',
    reason: 'Type 2 Diabetes follow-up & glycemic adjustment',
    symptoms: ['Fasting Sugar 174', 'Occasional Dizziness', 'Routine Review'],
    priority: 'ROUTINE',
    status: 'WAITING',
    waitTimeMinutes: 12,
    facilityOrigin: 'Kalol CHC Tele-Room',
    bloodGroup: 'A+',
    allergies: ['None'],
    vitals: {
      bp: '130/82 mmHg',
      pulse: '74 bpm',
      spo2: '98%',
      temp: '98.4°F',
      bloodSugar: '174 mg/dL',
    },
  },
  {
    id: 'req-04',
    name: 'Meena Devi',
    age: 28,
    gender: 'Female',
    abhaId: '31-5501-7721-9031',
    reason: 'Ante-Natal 3rd Trimester pedal edema screening',
    symptoms: ['Bilateral Ankle Swelling', 'Mild Evening Headache', 'Gestational Wk 32'],
    priority: 'HIGH',
    status: 'WAITING',
    waitTimeMinutes: 16,
    facilityOrigin: 'Sector 4 PHC (ASHA Assisted)',
    bloodGroup: 'AB+',
    allergies: ['Sulfa drugs'],
    vitals: {
      bp: '136/88 mmHg',
      pulse: '84 bpm',
      spo2: '99%',
      temp: '98.6°F',
    },
  },
  {
    id: 'req-05',
    name: 'Aarav Sharma',
    age: 6,
    gender: 'Male',
    abhaId: '14-8921-3409-7724',
    reason: 'High grade viral fever & acute right earache',
    symptoms: ['Temp 101.4°F', 'Ear Pulling / Pain', 'Loss of Appetite x 2 days'],
    priority: 'URGENT',
    status: 'WAITING',
    waitTimeMinutes: 19,
    facilityOrigin: 'Patient Home Mobile App',
    bloodGroup: 'B+',
    allergies: ['None'],
    vitals: {
      bp: '96/64 mmHg',
      pulse: '106 bpm',
      spo2: '98%',
      temp: '101.4°F',
    },
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================== */

export const TeleconsultationRoom: React.FC = () => {
  // Patients Queue State
  const [patients, setPatients] = useState<TeleconsultationPatient[]>(INITIAL_REQUESTING_PATIENTS);
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'CALLING' | 'URGENT' | 'WAITING'>('ALL');
  const [selectedPatientForPreview, setSelectedPatientForPreview] = useState<TeleconsultationPatient | null>(null);

  // Active Call State
  const [activePatient, setActivePatient] = useState<TeleconsultationPatient | null>(null);
  const [callState, setCallState] = useState<'QUEUE' | 'CONNECTING' | 'ACTIVE' | 'SUMMARY'>('QUEUE');

  // Media Controls State
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [patientAudioActive, setPatientAudioActive] = useState(true);

  // Call Duration Timer
  const [callSeconds, setCallSeconds] = useState(0);

  // Clinical Workspace State for Active Call
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescribedMedicine[]>([]);
  const [followUpDays, setFollowUpDays] = useState('7');
  const [isRxSaved, setIsRxSaved] = useState(false);

  // New Prescription Input Form State
  const [newDrug, setNewDrug] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newTiming, setNewTiming] = useState('1-0-1 (After Meals)');
  const [newDuration, setNewDuration] = useState('5 Days');
  const [newInstructions, setNewInstructions] = useState('');
  const [showAddMedForm, setShowAddMedForm] = useState(false);

  // Floating Waiting Drawer in Active Call
  const [showQueueInCall, setShowQueueInCall] = useState(false);

  // Call Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (callState === 'ACTIVE') {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  // Audio waveform pulse simulator when patient speaks
  useEffect(() => {
    if (callState === 'ACTIVE') {
      const audioTimer = setInterval(() => {
        setPatientAudioActive((prev) => !prev);
      }, 2400);
      return () => clearInterval(audioTimer);
    }
  }, [callState]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  /* =========================================================
     DOCTOR DECISION HANDLERS
  ========================================================== */

  // Doctor accepts a specific patient's call
  const handleAcceptCall = (patient: TeleconsultationPatient) => {
    setActivePatient(patient);
    setCallState('CONNECTING');
    setSelectedPatientForPreview(null);

    // Pre-populate initial clinical context based on patient's reason
    if (patient.id === 'req-01') {
      setDiagnosis('Suspected Angina / Acute Coronary Syndrome workup needed');
      setClinicalNotes('Patient presented with acute substernal heaviness and radiating pain. Advised immediate 12-lead ECG, sublingual Sorbitrate, and ambulance standby.');
      setPrescriptions([
        {
          id: 'rx-1',
          name: 'Tab Sorbitrate (Isosorbide Dinitrate)',
          dosage: '5 mg',
          timing: 'SOS (Sublingually under tongue)',
          duration: '1 Day',
          instructions: 'Dissolve under tongue if pain recurs',
        },
        {
          id: 'rx-2',
          name: 'Tab Aspirin (Dispersible)',
          dosage: '325 mg',
          timing: 'Stat (Now)',
          duration: 'Single Dose',
          instructions: 'Chew and swallow with little water',
        },
      ]);
    } else if (patient.id === 'req-02') {
      setDiagnosis('Seasonal Allergic Bronchitis with Mild Bronchospasm');
      setClinicalNotes('Clear auscultation, prolonged expiration. Advised warm steam inhalation, hydration, and 5-day course.');
      setPrescriptions([
        {
          id: 'rx-3',
          name: 'Tab Levocetirizine + Montelukast',
          dosage: '5mg / 10mg',
          timing: '0-0-1 (Night)',
          duration: '7 Days',
          instructions: 'Take 1 tablet before bedtime',
        },
        {
          id: 'rx-4',
          name: 'Syp Ambroxol HCl + Levosalbutamol',
          dosage: '10 ml',
          timing: '1-0-1 (TDS)',
          duration: '5 Days',
          instructions: 'After meals with warm water',
        },
      ]);
    } else {
      setDiagnosis(`Consultation review for: ${patient.reason}`);
      setClinicalNotes(`Detailed clinical teleconsultation encounter conducted with ${patient.name}.`);
      setPrescriptions([
        {
          id: 'rx-def',
          name: 'Tab Paracetamol',
          dosage: '650 mg',
          timing: 'SOS (As needed)',
          duration: '3 Days',
          instructions: 'Take after meals for fever/pain relief',
        },
      ]);
    }

    // Simulate WebRTC connection establishment
    setTimeout(() => {
      setCallState('ACTIVE');
    }, 1200);
  };

  // Doctor declines / defers a call
  const handleDeclineCall = (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, status: 'WAITING', waitTimeMinutes: p.waitTimeMinutes + 5 } : p
      )
    );
    if (selectedPatientForPreview?.id === patientId) {
      setSelectedPatientForPreview(null);
    }
  };

  // Add custom prescribed medicine
  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrug.trim()) return;

    const newEntry: PrescribedMedicine = {
      id: `rx-${Date.now()}`,
      name: newDrug.trim(),
      dosage: newDosage.trim() || '1 tab',
      timing: newTiming,
      duration: newDuration,
      instructions: newInstructions.trim() || 'Take as advised',
    };

    setPrescriptions((prev) => [...prev, newEntry]);
    setNewDrug('');
    setNewDosage('');
    setNewInstructions('');
    setShowAddMedForm(false);
  };

  const handleRemoveMedicine = (id: string) => {
    setPrescriptions((prev) => prev.filter((item) => item.id !== id));
  };

  // Doctor ends the call
  const handleEndConsultation = () => {
    if (!activePatient) return;

    // Save record to local storage for patient and doctor continuity
    const consultationRecord = {
      id: `CONS-${Date.now()}`,
      patientName: activePatient.name,
      abhaId: activePatient.abhaId,
      doctorName: 'Dr. Arvind Patel',
      hospitalName: 'Gandhinagar Civil Hospital',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      duration: formatTimer(callSeconds),
      diagnosis: diagnosis || 'General Health Consultation',
      notes: clinicalNotes,
      prescriptions,
      followUp: `Follow up in ${followUpDays} days.`,
      status: 'Completed',
    };

    try {
      const history = JSON.parse(localStorage.getItem('teleconsultation_history') || '[]');
      localStorage.setItem('teleconsultation_history', JSON.stringify([consultationRecord, ...history]));
    } catch (e) {
      console.warn('Could not persist to local storage', e);
    }

    // Mark current patient as completed in queue
    setPatients((prev) =>
      prev.map((p) => (p.id === activePatient.id ? { ...p, status: 'COMPLETED' } : p))
    );

    setCallState('SUMMARY');
  };

  // Return to queue to take next patient
  const handleBackToQueue = () => {
    setActivePatient(null);
    setCallState('QUEUE');
    setIsRxSaved(false);
  };

  // Filtered patients list
  const filteredPatients = patients.filter((p) => {
    if (filterPriority === 'CALLING') return p.status === 'CALLING';
    if (filterPriority === 'URGENT') return p.priority === 'URGENT';
    if (filterPriority === 'WAITING') return p.status === 'WAITING';
    return true;
  });

  const callingCount = patients.filter((p) => p.status === 'CALLING').length;
  const waitingCount = patients.filter((p) => p.status === 'WAITING').length;

  /* =========================================================
     VIEW 1: PATIENTS REQUEST QUEUE & DOCTOR CHOICE
  ========================================================== */
  if (callState === 'QUEUE') {
    return (
      <div className="space-y-6 max-w-6xl mx-auto font-sans pb-12">
        {/* Header */}
        <PageHeader
          title="Teleconsultation Request Queue"
          subtitle="Review incoming patient consultation calls, inspect triage urgency & symptoms, and choose who to connect with."
          breadcrumbs={[
            { label: 'Doctor Dashboard', to: '/doctor' },
            { label: 'Teleconsultations' },
          ]}
        />

        {/* Live Incoming Status Banner */}
        {callingCount > 0 && (
          <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 p-4 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-white">
                <PhoneIncoming className="h-5 w-5 text-emerald-300 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white sm:text-base">
                    {callingCount} Patient(s) Currently Ringing Live
                  </h3>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-200 uppercase">
                    Direct Video Request
                  </span>
                </div>
                <p className="text-xs text-teal-200/90 mt-0.5">
                  Patients are waiting on video bridge. You can pick and accept any patient below based on priority triage.
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                const callingPatient = patients.find((p) => p.status === 'CALLING') || patients[0];
                handleAcceptCall(callingPatient);
              }}
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs h-10 px-4 rounded-xl shadow-xs gap-2 shrink-0 cursor-pointer"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Accept Top Incoming Call</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterPriority('ALL')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                filterPriority === 'ALL'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Requests ({patients.length})
            </button>
            <button
              onClick={() => setFilterPriority('CALLING')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                filterPriority === 'CALLING'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Ringing ({callingCount})
            </button>
            <button
              onClick={() => setFilterPriority('URGENT')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                filterPriority === 'URGENT'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Urgent Triage ({patients.filter((p) => p.priority === 'URGENT').length})
            </button>
            <button
              onClick={() => setFilterPriority('WAITING')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                filterPriority === 'WAITING'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Waiting Queue ({waitingCount})
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>ABHA Verified Online Consultations</span>
          </div>
        </div>

        {/* Patients Request Cards Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredPatients.map((patient) => {
            const isRinging = patient.status === 'CALLING';
            const isUrgent = patient.priority === 'URGENT';

            return (
              <Card
                key={patient.id}
                className={`overflow-hidden transition-all duration-200 ${
                  isRinging
                    ? 'border-emerald-300 ring-2 ring-emerald-100 bg-white shadow-sm'
                    : isUrgent
                    ? 'border-rose-200 bg-white shadow-2xs hover:shadow-sm'
                    : 'border-slate-200 bg-white shadow-2xs hover:shadow-sm'
                }`}
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Patient Profile & Symptoms */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-sm shadow-xs ${
                        isRinging
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                          : isUrgent
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-teal-50 text-teal-800 border border-teal-200/60'
                      }`}
                    >
                      {patient.name.split(' ').map((n) => n[0]).join('')}
                      {isRinging && (
                        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                          {patient.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          ({patient.age}Y • {patient.gender} • Blood Group: <strong>{patient.bloodGroup}</strong>)
                        </span>

                        {isRinging ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            <PhoneIncoming className="h-3 w-3 animate-pulse text-emerald-600" /> Ringing Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            <Clock className="h-3 w-3 text-slate-400" /> Waiting ~{patient.waitTimeMinutes}m
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : patient.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {patient.priority}
                        </span>
                      </div>

                      {/* Reason & Symptoms */}
                      <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        <span>{patient.reason}</span>
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {patient.symptoms.map((sym, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200/60"
                          >
                            {sym}
                          </span>
                        ))}
                      </div>

                      <p className="text-[10px] text-slate-400 pt-0.5">
                        ABHA: <span className="font-mono text-slate-600 font-semibold">{patient.abhaId}</span> • Origin: <span className="text-slate-600 font-medium">{patient.facilityOrigin}</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Quick Vitals Pill Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center shrink-0">
                    <div className="px-2">
                      <span className="text-[9px] font-bold uppercase text-slate-400">BP</span>
                      <p className="text-xs font-bold text-slate-900">{patient.vitals.bp}</p>
                    </div>
                    <div className="px-2 border-l border-slate-200">
                      <span className="text-[9px] font-bold uppercase text-slate-400">Pulse</span>
                      <p className="text-xs font-bold text-slate-900">{patient.vitals.pulse}</p>
                    </div>
                    <div className="px-2 border-l border-slate-200">
                      <span className="text-[9px] font-bold uppercase text-slate-400">SpO2</span>
                      <p className="text-xs font-bold text-teal-700">{patient.vitals.spo2}</p>
                    </div>
                    <div className="px-2 border-l border-slate-200 hidden sm:block">
                      <span className="text-[9px] font-bold uppercase text-slate-400">Temp</span>
                      <p className="text-xs font-bold text-slate-900">{patient.vitals.temp}</p>
                    </div>
                  </div>

                  {/* Right Column: Doctor Decision Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <Button
                      onClick={() => setSelectedPatientForPreview(patient)}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 h-9 px-3 rounded-xl cursor-pointer"
                    >
                      Inspect Details
                    </Button>

                    <Button
                      onClick={() => handleAcceptCall(patient)}
                      variant="primary"
                      size="sm"
                      className={`gap-1.5 text-xs font-extrabold h-9 px-4 rounded-xl cursor-pointer shadow-xs ${
                        isRinging
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      <span>Accept Call</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Patient Detailed Preview Modal */}
        {selectedPatientForPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedPatientForPreview.name}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      ABHA: {selectedPatientForPreview.abhaId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatientForPreview(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Reason for Video Consultation</span>
                  <p className="font-semibold text-slate-900">{selectedPatientForPreview.reason}</p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {selectedPatientForPreview.symptoms.map((s, i) => (
                      <span key={i} className="rounded bg-white px-2 py-0.5 text-[10px] font-medium border border-slate-200 text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400">Triage Urgency</span>
                    <p className="font-bold text-slate-900">{selectedPatientForPreview.priority}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400">Facility Origin</span>
                    <p className="font-bold text-slate-900">{selectedPatientForPreview.facilityOrigin}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400">Known Allergies</span>
                    <p className="font-bold text-rose-700">{selectedPatientForPreview.allergies?.join(', ') || 'None'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400">Blood Group</span>
                    <p className="font-bold text-slate-900">{selectedPatientForPreview.bloodGroup}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  onClick={() => handleDeclineCall(selectedPatientForPreview.id)}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold text-slate-600 rounded-xl"
                >
                  Defer Request
                </Button>
                <Button
                  onClick={() => handleAcceptCall(selectedPatientForPreview)}
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Accept This Call</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     VIEW 2: CONNECTING ANIMATION
  ========================================================== */
  if (callState === 'CONNECTING' && activePatient) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-teal-50">
          <PhoneCall className="h-10 w-10 text-teal-700 animate-pulse" />
          <span className="absolute inset-0 rounded-full border-2 border-teal-500 animate-ping opacity-30"></span>
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Establishing Secure Telehealth Bridge...
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connecting to <strong>{activePatient.name}</strong> ({activePatient.facilityOrigin}) via ABDM Peer-to-Peer Gateway
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     VIEW 3: POST-CONSULTATION WRAP-UP SUMMARY
  ========================================================== */
  if (callState === 'SUMMARY' && activePatient) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8 font-sans">
        <Card className="border-emerald-200 bg-white shadow-md rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-800 to-emerald-800 p-6 text-white text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white mb-3 shadow-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-300" />
            </div>
            <h2 className="text-xl font-black tracking-tight">
              Consultation Successfully Completed
            </h2>
            <p className="text-xs text-teal-100/90 mt-1">
              Encrypted encounter with <strong>{activePatient.name}</strong> has been logged to their ABHA Health Record.
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Duration</span>
                <p className="font-black text-slate-900">{formatTimer(callSeconds)}</p>
              </div>
              <div className="border-l border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">ABHA ID</span>
                <p className="font-mono text-slate-800 font-bold">{activePatient.abhaId}</p>
              </div>
              <div className="border-l border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Follow-Up</span>
                <p className="font-bold text-teal-700">{followUpDays} Days</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Clinical Diagnosis</span>
              <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {diagnosis || 'General Clinical Review'}
              </p>
            </div>

            {prescriptions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Digital Prescription (Rx)</span>
                <div className="space-y-1.5">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                      <div>
                        <strong className="text-slate-900">{rx.name}</strong> ({rx.dosage})
                        <p className="text-[10px] text-slate-500">{rx.timing} • {rx.duration} • {rx.instructions}</p>
                      </div>
                      <span className="rounded bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                        EHR Linked
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Signed with Doctor Digital Token (GMC-61209)
              </span>

              <Button
                onClick={handleBackToQueue}
                variant="primary"
                size="md"
                className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs h-10 px-5 rounded-xl gap-2 cursor-pointer shadow-xs"
              >
                <span>Take Next Patient in Queue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* =========================================================
     VIEW 4: ACTIVE CALL & CLINICAL WORKSPACE
  ========================================================== */
  if (!activePatient) return null;

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans pb-12">
      {/* Top Teleconsultation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black text-slate-900">
              Active Video Consultation
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Connected ({formatTimer(callSeconds)})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient: <strong className="text-slate-800">{activePatient.name}</strong> • ABHA: <span className="font-mono">{activePatient.abhaId}</span> • Origin: {activePatient.facilityOrigin}
          </p>
        </div>

        {/* Waiting queue sneak peek button */}
        <div className="flex items-center gap-2">
          {waitingCount > 0 && (
            <button
              onClick={() => setShowQueueInCall(!showQueueInCall)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Clock3 className="h-3.5 w-3.5 text-amber-600" />
              <span>{waitingCount} More Patients Waiting</span>
            </button>
          )}

          <Button
            onClick={handleEndConsultation}
            variant="destructive"
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs h-9 px-3.5 rounded-xl gap-1.5 cursor-pointer shadow-xs"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span>End Call</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Video Stream (Left) + Clinical Details & Rx Pad (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* LEFT: Video Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden border-slate-900 bg-slate-950 shadow-lg rounded-3xl">
            {/* Live Video Window */}
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* Patient Simulated Video Feed */}
              {cameraOn ? (
                <div className="text-center text-white space-y-3 z-10">
                  <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-slate-800/90 border border-white/10 shadow-xl">
                    <User className="h-14 w-14 text-slate-300" />
                    {patientAudioActive && (
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
                        <Mic className="h-3 w-3 animate-pulse" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {activePatient.name}
                    </h3>
                    <p className="text-xs text-teal-300 font-mono mt-0.5">
                      {activePatient.facilityOrigin}
                    </p>
                  </div>
                  {/* Audio Wave Visualizer Simulation */}
                  <div className="flex items-center justify-center gap-1 h-4 pt-1">
                    <span className={`w-1 bg-emerald-400 rounded-full transition-all duration-300 ${patientAudioActive ? 'h-4' : 'h-1'}`}></span>
                    <span className={`w-1 bg-emerald-400 rounded-full transition-all duration-300 ${patientAudioActive ? 'h-6' : 'h-1.5'}`}></span>
                    <span className={`w-1 bg-emerald-400 rounded-full transition-all duration-300 ${patientAudioActive ? 'h-3' : 'h-1'}`}></span>
                    <span className={`w-1 bg-emerald-400 rounded-full transition-all duration-300 ${patientAudioActive ? 'h-5' : 'h-2'}`}></span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <VideoOff className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                  <p className="text-xs">Patient Video Stream Inactive</p>
                </div>
              )}

              {/* Doctor Self-View PiP (Picture in Picture) */}
              <div className="absolute right-4 top-4 w-32 sm:w-36 aspect-video overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-900/95 p-2 shadow-2xl z-20">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-800 text-white flex-col">
                  <Stethoscope className="h-4 w-4 text-teal-400" />
                  <span className="text-[9px] font-bold text-slate-300 mt-0.5">You (Doctor)</span>
                </div>
                {!micOn && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-rose-600 p-1 text-white shadow-xs">
                    <MicOff className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>

              {/* Call Details Overlay (Top-Left) */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10">
                  <Clock3 className="h-3 w-3 text-emerald-400" />
                  <span>{formatTimer(callSeconds)}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-900/80 px-2.5 py-1 text-[10px] font-semibold text-slate-300 backdrop-blur-md border border-white/10">
                  <Wifi className="h-3 w-3 text-emerald-400" />
                  <span>HD 720p • 24ms</span>
                </div>
              </div>

              {/* ABDM Security Watermark (Bottom-Left) */}
              <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>ABDM Telehealth Encrypted</span>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-slate-900 px-4 py-3.5">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={() => setMicOn(!micOn)}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all cursor-pointer ${
                  micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                }`}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={() => setCameraOn(!cameraOn)}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all cursor-pointer ${
                  cameraOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                }`}
                title={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>

              {/* Screen Sharing */}
              <button
                type="button"
                onClick={() => setScreenSharing(!screenSharing)}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all cursor-pointer ${
                  screenSharing ? 'bg-teal-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
                title="Share Screen / Report"
              >
                <MonitorUp className="h-5 w-5" />
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleEndConsultation}
                className="flex h-11 px-5 items-center justify-center rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs gap-2 transition-all cursor-pointer shadow-md ml-2"
                title="End Consultation"
              >
                <PhoneOff className="h-4 w-4" />
                <span>End Call</span>
              </button>
            </div>
          </Card>

          {/* Quick Patient Vitals Cards */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
                <Heart className="h-3 w-3 text-rose-500" /> Blood Pressure
              </span>
              <p className="mt-1 text-sm font-black text-slate-900">{activePatient.vitals.bp}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
                <Activity className="h-3 w-3 text-amber-500" /> Pulse Rate
              </span>
              <p className="mt-1 text-sm font-black text-slate-900">{activePatient.vitals.pulse}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
                <Droplet className="h-3 w-3 text-teal-500" /> Oxygen SpO2
              </span>
              <p className="mt-1 text-sm font-black text-teal-700">{activePatient.vitals.spo2}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" /> Temperature
              </span>
              <p className="mt-1 text-sm font-black text-slate-900">{activePatient.vitals.temp}</p>
            </div>
          </div>
        </div>

        {/* RIGHT: Clinical Workspace & Digital Rx Pad (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">

          {/* Patient Chief Complaint Box */}
          <Card className="border-slate-200 bg-white shadow-2xs rounded-2xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Patient Health Overview</span>
                <span className="text-teal-700 font-bold">ABHA Verified</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2">
              <div className="flex items-start justify-between text-xs pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900">{activePatient.name}</h4>
                  <p className="text-[10px] text-slate-500">
                    {activePatient.age}Y • {activePatient.gender} • Blood Group: <strong>{activePatient.bloodGroup}</strong>
                  </p>
                </div>
                {activePatient.allergies && activePatient.allergies.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    <AlertTriangle className="h-3 w-3 text-rose-600" /> Allergy: {activePatient.allergies.join(', ')}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Chief Symptoms</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{activePatient.reason}</p>
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {activePatient.symptoms.map((s, i) => (
                    <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Digital Prescription & Advice Pad */}
          <Card className="border-teal-200 bg-white shadow-xs rounded-2xl overflow-hidden">
            <div className="bg-teal-700 px-4 py-2.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                <span className="text-xs font-bold">Digital Prescription Pad (Rx)</span>
              </div>
              <span className="text-[10px] font-mono text-teal-200">GMC-61209</span>
            </div>

            <CardContent className="p-4 space-y-3.5">
              {/* Diagnosis Input */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Doctor Clinical Diagnosis
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Allergic Bronchitis, Hypertension Stage 1"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-100"
                />
              </div>

              {/* Prescribed Drugs List */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Prescribed Medicines ({prescriptions.length})</span>
                  <button
                    type="button"
                    onClick={() => setShowAddMedForm(!showAddMedForm)}
                    className="flex items-center gap-1 text-[10px] font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Drug</span>
                  </button>
                </div>

                {/* New Medicine Form */}
                {showAddMedForm && (
                  <form onSubmit={handleAddMedicine} className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 space-y-2 mb-2 text-xs">
                    <div>
                      <input
                        type="text"
                        value={newDrug}
                        onChange={(e) => setNewDrug(e.target.value)}
                        placeholder="Drug / Brand Name (e.g. Tab Azithromycin 500mg)"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newDosage}
                        onChange={(e) => setNewDosage(e.target.value)}
                        placeholder="Dosage (e.g. 500 mg)"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                      />
                      <select
                        value={newTiming}
                        onChange={(e) => setNewTiming(e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium shadow-2xs"
                      >
                        <option value="1-0-1 (After Meals)">1-0-1 (Morning & Night)</option>
                        <option value="1-1-1 (TDS)">1-1-1 (Thrice Daily)</option>
                        <option value="0-0-1 (Bedtime)">0-0-1 (Before Bed)</option>
                        <option value="SOS (As needed)">SOS (When needed)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newDuration}
                        onChange={(e) => setNewDuration(e.target.value)}
                        placeholder="Duration (e.g. 5 Days)"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={newInstructions}
                        onChange={(e) => setNewInstructions(e.target.value)}
                        placeholder="Instructions (e.g. with water)"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        type="button"
                        onClick={() => setShowAddMedForm(false)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] px-2.5"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        className="h-7 text-[10px] px-3 bg-teal-700 text-white"
                      >
                        Save Medicine
                      </Button>
                    </div>
                  </form>
                )}

                {/* Prescriptions List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {prescriptions.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{item.name} ({item.dosage})</p>
                        <p className="text-[10px] text-slate-500">{item.timing} • {item.duration} • {item.instructions}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation Notes & Advice */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Clinical Advice & Consultation Notes
                </label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Notes, observations, dietary advice, warnings..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-100 min-h-[70px] resize-none"
                  rows={3}
                />
              </div>

              {/* Follow up & Action button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Follow-Up:</span>
                  <select
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold shadow-2xs"
                  >
                    <option value="3">In 3 Days</option>
                    <option value="7">In 7 Days</option>
                    <option value="14">In 2 Weeks</option>
                    <option value="30">In 1 Month</option>
                  </select>
                </div>

                <Button
                  onClick={() => {
                    setIsRxSaved(true);
                    setTimeout(() => setIsRxSaved(false), 3000);
                  }}
                  variant="primary"
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs h-8 px-3 rounded-lg gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="h-3 w-3" />
                  <span>{isRxSaved ? 'Synced to ABHA!' : 'Sign & Sync Rx'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Floating Waiting Queue Drawer in Call */}
      {showQueueInCall && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-900">Next Patients in Queue</span>
            <button onClick={() => setShowQueueInCall(false)} className="text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
            {patients
              .filter((p) => p.id !== activePatient.id && p.status !== 'COMPLETED')
              .map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">{p.name}</strong>
                    <span className="text-[10px] text-slate-500">{p.reason}</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {p.priority}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeleconsultationRoom;