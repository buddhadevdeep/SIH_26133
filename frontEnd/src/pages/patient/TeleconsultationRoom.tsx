import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { INITIAL_HEALTH_RECORD } from '@/mock/mockData';
import { appointmentApi } from '@/api/queueApi';

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Wifi,
  FileText,
  Clock,
  CheckCircle2,
  History,
  Stethoscope,
  Hospital,
  User,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Phone,
  RefreshCw,
  Calendar,
  Pill,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Heart,
  Activity,
  Award,
  X,
  Check,
  Paperclip,
  CalendarCheck2,
  MessageSquare,
  LayoutGrid,
  Send,
  Download,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Share2,
  Hand,
} from 'lucide-react';

export interface VisitedDoctor {
  id: string;
  name: string;
  degree: string;
  specialty: string;
  department: string;
  hospital: string;
  roomNumber: string;
  experience: string;
  lastVisitedDate: string;
  lastDiagnosis: string;
  lastPrescription: string;
  previousAdvice: string;
  status: 'ONLINE' | 'IN_OPD' | 'BUSY';
  statusText: string;
  queueLength: number;
  rating: string;
  avatarColor: string;
  initials: string;
}

interface FamilyPatient {
  id: string;
  name: string;
  relation: string;
  age: number;
  gender: string;
  abhaId: string;
  bloodGroup: string;
  visitedDoctorIds: string[];
}

interface ConsultationRequestToken {
  tokenNumber: string;
  doctor: VisitedDoctor;
  patient: FamilyPatient;
  requestType: 'INSTANT' | 'SCHEDULED';
  scheduledDate: string;
  scheduledTimeSlot: string;
  reason: string;
  urgency: 'ROUTINE' | 'PRIORITY' | 'URGENT';
  symptomDetails: string;
  attachedReports: boolean;
  registeredAt: string;
}

const FAMILY_PATIENTS: FamilyPatient[] = [
  {
    id: 'pat_01',
    name: 'Rameshwar Sharma',
    relation: 'Self (Primary)',
    age: 48,
    gender: 'Male',
    abhaId: '14-8921-3409-7721',
    bloodGroup: 'B+',
    visitedDoctorIds: ['doc_patel', 'doc_vaghela', 'doc_sharma', 'doc_mehta'],
  },
  {
    id: 'pat_02',
    name: 'Saraswati Sharma',
    relation: 'Spouse',
    age: 44,
    gender: 'Female',
    abhaId: '14-8921-3409-7722',
    bloodGroup: 'A+',
    visitedDoctorIds: ['doc_vaghela', 'doc_sharma'],
  },
  {
    id: 'pat_03',
    name: 'Aarav Sharma',
    relation: 'Son',
    age: 12,
    gender: 'Male',
    abhaId: '14-8921-3409-7723',
    bloodGroup: 'B+',
    visitedDoctorIds: ['doc_sharma', 'doc_mehta'],
  },
];

export const VISITED_DOCTORS: VisitedDoctor[] = [
  {
    id: 'doc_patel',
    name: 'Dr. Arvind Patel',
    degree: 'MD (Internal Medicine & Cardiology)',
    specialty: 'Cardiologist & Physician',
    department: 'General Medicine & Cardiac OPD',
    hospital: 'Gandhinagar Civil Hospital',
    roomNumber: 'Room 4',
    experience: '18 Years Exp',
    lastVisitedDate: '01 Mar 2026 (11 days ago)',
    lastDiagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension',
    lastPrescription: 'Tab. Metformin 1000mg SR (1-0-1), Tab. Telmisartan 40mg (1-0-0)',
    previousAdvice: 'Follow-up in 2 weeks with daily morning BP & blood sugar chart.',
    status: 'ONLINE',
    statusText: 'Available for Video Call • 0 Ahead in Queue',
    queueLength: 0,
    rating: '4.9 ★ (2,450+ teleconsults)',
    avatarColor: 'from-teal-600 to-teal-800',
    initials: 'AP',
  },
  {
    id: 'doc_vaghela',
    name: 'Dr. Neha Vaghela',
    degree: 'MS (Ophthalmology & Retina)',
    specialty: 'Eye Specialist & Retina Surgeon',
    department: 'Ophthalmology & Diabetic Eye Wing',
    hospital: 'Gandhinagar Civil Hospital',
    roomNumber: 'Room 12',
    experience: '14 Years Exp',
    lastVisitedDate: '20 Jan 2026',
    lastDiagnosis: 'Diabetic Retinopathy Screening & Fundus Check',
    lastPrescription: 'Carboxymethylcellulose 0.5% Eye Drops (1 drop TDS)',
    previousAdvice: 'Annual fundus examination clear. Contact immediately if floaters or blurriness occur.',
    status: 'ONLINE',
    statusText: 'Available for Video Call • Instant Connect',
    queueLength: 0,
    rating: '4.8 ★ (1,820+ teleconsults)',
    avatarColor: 'from-indigo-600 to-indigo-800',
    initials: 'NV',
  },
  {
    id: 'doc_sharma',
    name: 'Dr. Priya Sharma',
    degree: 'MBBS, DNB (Family Medicine)',
    specialty: 'Family & General Physician',
    department: 'Primary Health Care & Community Medicine',
    hospital: 'Pethapur Primary Health Centre (PHC)',
    roomNumber: 'OPD 1',
    experience: '9 Years Exp',
    lastVisitedDate: '15 Dec 2025',
    lastDiagnosis: 'Acute Bacterial Bronchitis & Mild Dehydration',
    lastPrescription: 'Tab. Azithromycin 500mg, Syrup Levosalbutamol',
    previousAdvice: 'Steam inhalation twice daily. Return if wheezing or fever recurs.',
    status: 'IN_OPD',
    statusText: 'In Hospital OPD • Online Tele-Queue: 1 patient ahead',
    queueLength: 1,
    rating: '4.7 ★ (980+ teleconsults)',
    avatarColor: 'from-emerald-600 to-emerald-800',
    initials: 'PS',
  },
  {
    id: 'doc_mehta',
    name: 'Dr. Rajesh Mehta',
    degree: 'MD (Emergency Medicine & Critical Care)',
    specialty: 'Emergency Medicine & Triage Specialist',
    department: '24x7 Government Tele-Emergency Desk',
    hospital: 'Gandhinagar Civil Hospital',
    roomNumber: 'Emergency Desk 1',
    experience: '12 Years Exp',
    lastVisitedDate: '04 Nov 2025 (Inpatient Care)',
    lastDiagnosis: 'Acute Asthmatic Bronchitis with Mild Hypoxia',
    lastPrescription: 'Nebulization & Inhaler maintenance',
    previousAdvice: 'Keep Salbutamol inhaler in hand. Emergency hotline 108.',
    status: 'ONLINE',
    statusText: '24x7 Duty Doctor • Instant Connect (0 Wait)',
    queueLength: 0,
    rating: '4.9 ★ (3,120+ teleconsults)',
    avatarColor: 'from-amber-600 to-amber-800',
    initials: 'RM',
  },
];

const TIME_SLOTS = [
  '10:00 AM - 10:30 AM',
  '11:30 AM - 12:00 PM',
  '02:30 PM - 03:00 PM',
  '04:00 PM - 04:30 PM',
  '05:30 PM - 06:00 PM',
  '07:00 PM - 07:30 PM',
];

const REASON_PRESETS = [
  'Follow-up on Previous Prescription',
  'Review Recent Lab / ECG Reports',
  'Chest Discomfort & Blood Pressure Check',
  'Fever, Cough or Throat Soreness',
  'Medication Refill & Dose Adjustment',
  'Routine Chronic Condition Review',
];

export interface FixedCallRecord {
  id: string;
  tokenNumber: string;
  doctor: VisitedDoctor;
  patient: FamilyPatient;
  requestType: 'INSTANT' | 'SCHEDULED';
  scheduledDate: string;
  scheduledTimeSlot: string;
  reason: string;
  urgency: 'ROUTINE' | 'PRIORITY' | 'URGENT';
  symptomDetails: string;
  attachedReports: boolean;
  registeredAt: string;
  status: 'FIXED' | 'CONFIRMED' | 'IN_QUEUE' | 'COMPLETED' | 'CANCELLED';
}

const DEFAULT_FIXED_CALLS: FixedCallRecord[] = [
  {
    id: 'call_req_9086',
    tokenNumber: 'TC-REQ-2026-9086',
    doctor: VISITED_DOCTORS[0], // Dr. Arvind Patel
    patient: FAMILY_PATIENTS[0], // Rameshwar Sharma
    requestType: 'SCHEDULED',
    scheduledDate: 'Today (12 Sep)',
    scheduledTimeSlot: '05:30 PM - 06:00 PM',
    reason: 'Follow-up on Previous Prescription',
    urgency: 'ROUTINE',
    symptomDetails:
      'Requesting follow-up consultation to review fasting blood sugar (148 mg/dL) and daily resting BP.',
    attachedReports: true,
    registeredAt: '03:15 PM',
    status: 'FIXED',
  },
];

const PAST_COMPLETED_CONSULTATIONS = [
  {
    id: 'TC-1001',
    tokenNumber: 'TC-HIST-2026-1001',
    date: '10 Sep 2026',
    time: '10:30 AM',
    doctorName: 'Dr. Arvind Patel',
    specialty: 'Cardiologist & Physician',
    hospital: 'Gandhinagar Civil Hospital',
    duration: '12 mins 45 secs',
    diagnosis: 'Type 2 Diabetes & Essential Hypertension Follow-up',
    rxSummary: 'Tab. Telmisartan 40mg (1-0-0), Tab. Metformin 1000mg',
    notes: 'Advised continuing Telmisartan 40mg. Blood sugar chart in target range.',
  },
  {
    id: 'TC-1002',
    tokenNumber: 'TC-HIST-2026-1002',
    date: '22 Aug 2026',
    time: '11:00 AM',
    doctorName: 'Dr. Rajesh Mehta',
    specialty: 'Emergency Medicine Specialist',
    hospital: 'Gandhinagar Civil Hospital',
    duration: '15 mins 20 secs',
    diagnosis: 'Acute Asthmatic Cough & Wheezing',
    rxSummary: 'Salbutamol Inhaler (2 puffs SOS)',
    notes: 'Patient advised regular BP monitoring and lifestyle modification.',
  },
  {
    id: 'TC-1003',
    tokenNumber: 'TC-HIST-2026-1003',
    date: '05 Aug 2026',
    time: '02:30 PM',
    doctorName: 'Dr. Priya Sharma',
    specialty: 'Family Medicine',
    hospital: 'Pethapur PHC Tele-clinic',
    duration: '09 mins 10 secs',
    diagnosis: 'Seasonal Viral Bronchitis',
    rxSummary: 'Tab. Azithromycin 500mg, Syrup Levosalbutamol',
    notes: 'Routine follow-up consultation. Completed prescribed antibiotic course.',
  },
];

export const TeleconsultationRoom: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Selected Family Member / Patient Profile
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat_01');
  const activePatient =
    FAMILY_PATIENTS.find((p) => p.id === selectedPatientId) || FAMILY_PATIENTS[0];

  // Call Stage State Machine:
  // 'SELECT_DOCTOR' -> 'REQUEST_CONFIRMED' -> 'CONNECTING' -> 'IN_CALL' -> 'COMPLETED'
  const [callStage, setCallStage] = useState<
    'SELECT_DOCTOR' | 'REQUEST_CONFIRMED' | 'CONNECTING' | 'IN_CALL' | 'COMPLETED'
  >('SELECT_DOCTOR');

  // Selected Doctor
  const [selectedDoctor, setSelectedDoctor] = useState<VisitedDoctor>(VISITED_DOCTORS[0]);

  // Request Consultation Popup Form States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDoctor, setRequestDoctor] = useState<VisitedDoctor>(VISITED_DOCTORS[0]);
  const [requestType, setRequestType] = useState<'INSTANT' | 'SCHEDULED'>('SCHEDULED');
  const [selectedDateOption, setSelectedDateOption] = useState<string>('Today (12 Sep)');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(TIME_SLOTS[4]);
  const [selectedReason, setSelectedReason] = useState<string>(REASON_PRESETS[0]);
  const [symptomDetails, setSymptomDetails] = useState<string>(
    'Requesting follow-up consultation to review fasting blood sugar (148 mg/dL) and daily resting BP.'
  );
  const [urgencyLevel, setUrgencyLevel] = useState<'ROUTINE' | 'PRIORITY' | 'URGENT'>('ROUTINE');
  const [attachPastReports, setAttachPastReports] = useState<boolean>(true);

  // Fixed / Scheduled Teleconsultation Calls
  const [fixedCalls, setFixedCalls] = useState<FixedCallRecord[]>(() => {
    try {
      const saved = localStorage.getItem('healthconnect_fixed_calls');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load fixed calls', e);
    }
    return DEFAULT_FIXED_CALLS;
  });

  // Sync to localStorage whenever fixedCalls changes
  useEffect(() => {
    try {
      localStorage.setItem('healthconnect_fixed_calls', JSON.stringify(fixedCalls));
    } catch (e) {
      console.error('Failed to sync fixed calls', e);
    }
  }, [fixedCalls]);

  // Confirmed Token Details
  const [confirmedToken, setConfirmedToken] = useState<ConsultationRequestToken | null>(null);

  // Doctor Filter Tabs in Selection View
  const [doctorFilter, setDoctorFilter] = useState<
    'ALL' | 'RECENT' | 'ONLINE' | 'SPECIALISTS'
  >('ALL');
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');

  // Collapsible Call History Preview State
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState<boolean>(true);

  // Call duration counter
  const [callDuration, setCallDuration] = useState<number>(0);

  // In-Call Media States
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // ==========================================
  // ADVANCED CALL ROOM EXPERIENCE STATES
  // ==========================================
  // Layout Modes: 'SPEAKER' (Doctor focus) | 'GRID' (Side-by-side) | 'SHARE_REPORT' (Live diagnostic review)
  const [callLayout, setCallLayout] = useState<'SPEAKER' | 'GRID' | 'SHARE_REPORT'>('SPEAKER');

  // Active Clinical Panel Tab: 'PRESCRIPTION' | 'CHAT' | 'VITALS'
  const [activeCallTab, setActiveCallTab] = useState<'PRESCRIPTION' | 'CHAT' | 'VITALS'>('PRESCRIPTION');

  // Subtitles / Closed Captions Toggle
  const [showCaptions, setShowCaptions] = useState<boolean>(true);

  // Speaker audio mute
  const [isMutedSpeaker, setIsMutedSpeaker] = useState<boolean>(false);

  // Hand raised state
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);

  // E-Prescription download toast
  const [rxDownloadToast, setRxDownloadToast] = useState<boolean>(false);

  // In-Call Live Chat Messages
  interface CallChatMessage {
    id: string;
    sender: 'DOCTOR' | 'PATIENT' | 'SYSTEM';
    senderName: string;
    text: string;
    time: string;
  }

  const [chatMessages, setChatMessages] = useState<CallChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'SYSTEM',
      senderName: 'ABDM Telehealth Bridge',
      text: 'Session encrypted end-to-end. Telemedicine clinical consent recorded under ABDM / NMC guidelines.',
      time: '05:30 PM',
    },
    {
      id: 'msg-2',
      sender: 'DOCTOR',
      senderName: 'Dr. Arvind Patel',
      text: 'Namaste Rameshwar ji! I have your latest blood reports and BP chart open on my screen. How are you feeling today?',
      time: '05:31 PM',
    },
    {
      id: 'msg-3',
      sender: 'PATIENT',
      senderName: 'Rameshwar Sharma (You)',
      text: 'Namaste Doctor saab. Feeling better. Fasting glucose was 148 mg/dL this morning and resting BP was 134/86.',
      time: '05:32 PM',
    },
    {
      id: 'msg-4',
      sender: 'DOCTOR',
      senderName: 'Dr. Arvind Patel',
      text: 'Good progress. Your HbA1c is 7.4%. We will continue Metformin 1000mg and Telmisartan 40mg. Keep taking morning brisk walks.',
      time: '05:33 PM',
    },
  ]);

  const [newChatMessage, setNewChatMessage] = useState<string>('');

  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChatMessage.trim()) return;

    const userMsg: CallChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'PATIENT',
      senderName: `${activePatient.name} (You)`,
      text: newChatMessage.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setNewChatMessage('');

    setTimeout(() => {
      const docReply: CallChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'DOCTOR',
        senderName: selectedDoctor.name,
        text: 'Noted Rameshwar ji. I have recorded this in your ABHA health record and updated the e-prescription accordingly.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, docReply]);
    }, 1800);
  };

  const handleDownloadPrescription = () => {
    setRxDownloadToast(true);
    setTimeout(() => setRxDownloadToast(false), 3500);
  };

  // Open the Request Popup Form for a specific doctor
  const handleOpenRequestModal = (doc: VisitedDoctor) => {
    setRequestDoctor(doc);
    setSelectedDoctor(doc);
    setSelectedReason(
      doc.id === 'doc_vaghela'
        ? 'Eye Review & Diabetic Retina Follow-up'
        : doc.id === 'doc_sharma'
          ? 'Bronchitis & Cough Follow-up'
          : 'Follow-up on Previous Prescription'
    );
    setShowRequestModal(true);
  };

  // Auto-connect into call room ONLY if explicitly redirected with ?join=true, or open request form if ?request=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('join') === 'true') {
      const docId = params.get('doctorId');
      if (docId) {
        const found = VISITED_DOCTORS.find((d) => d.id === docId);
        if (found) setSelectedDoctor(found);
      } else if (fixedCalls.length > 0) {
        setSelectedDoctor(fixedCalls[0].doctor);
        setSelectedPatientId(fixedCalls[0].patient.id);
        setConfirmedToken({
          tokenNumber: fixedCalls[0].tokenNumber,
          doctor: fixedCalls[0].doctor,
          patient: fixedCalls[0].patient,
          requestType: fixedCalls[0].requestType,
          scheduledDate: fixedCalls[0].scheduledDate,
          scheduledTimeSlot: fixedCalls[0].scheduledTimeSlot,
          reason: fixedCalls[0].reason,
          urgency: fixedCalls[0].urgency,
          symptomDetails: fixedCalls[0].symptomDetails,
          attachedReports: fixedCalls[0].attachedReports,
          registeredAt: fixedCalls[0].registeredAt,
        });
      }
      setCallStage('IN_CALL');
    } else if (params.get('request') === 'true' || params.get('book') === 'true') {
      const docId = params.get('doctorId');
      const targetDoc = docId
        ? VISITED_DOCTORS.find((d) => d.id === docId) || VISITED_DOCTORS[0]
        : VISITED_DOCTORS[0];
      handleOpenRequestModal(targetDoc);
      setCallStage('SELECT_DOCTOR');
    } else {
      setShowRequestModal(false);
      setCallStage('SELECT_DOCTOR');
    }
  }, [location.search]);

  // Live Consultation Notes
  const [notes, setNotes] = useState(
    'Discussed current blood pressure readings and adherence to Telmisartan 40mg. Doctor advised routine monitoring.'
  );

  // Auto-ticking call duration timer
  useEffect(() => {
    let interval: any = null;
    if (callStage === 'IN_CALL') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (callStage === 'SELECT_DOCTOR' || callStage === 'REQUEST_CONFIRMED') {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStage]);

  // Submit Consultation Request & Register Time Slot
  const handleSubmitConsultationRequest = (e: React.FormEvent) => {
    e.preventDefault();

    const tokenNum = `TC-REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest: ConsultationRequestToken = {
      tokenNumber: tokenNum,
      doctor: requestDoctor,
      patient: activePatient,
      requestType,
      scheduledDate: selectedDateOption,
      scheduledTimeSlot: requestType === 'INSTANT' ? 'Immediate Live Queue (~2-5 mins)' : selectedTimeSlot,
      reason: selectedReason,
      urgency: urgencyLevel,
      symptomDetails,
      attachedReports: attachPastReports,
      registeredAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    const newFixedCall: FixedCallRecord = {
      id: `call_${Date.now()}`,
      tokenNumber: tokenNum,
      doctor: requestDoctor,
      patient: activePatient,
      requestType,
      scheduledDate: selectedDateOption,
      scheduledTimeSlot: requestType === 'INSTANT' ? 'Immediate Live Queue (~2-5 mins)' : selectedTimeSlot,
      reason: selectedReason,
      urgency: urgencyLevel,
      symptomDetails,
      attachedReports: attachPastReports,
      registeredAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'FIXED',
    };

    setFixedCalls((prev) => [newFixedCall, ...prev]);

    // Persist to MongoDB backend appointments collection
    appointmentApi.book({
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientPhone: '9876543210',
      patientAge: activePatient.age,
      patientGender: (activePatient.gender === 'Female' ? 'F' : 'M') as 'M' | 'F' | 'Other',
      facilityId: 'fac_civil_01',
      facilityName: requestDoctor.hospital || 'Gandhinagar Civil Hospital',
      specialty: requestDoctor.specialty,
      doctorId: requestDoctor.id,
      doctorName: requestDoctor.name,
      date: new Date().toISOString().split('T')[0],
      timeSlot: requestType === 'INSTANT' ? 'Immediate Live Queue' : selectedTimeSlot,
      type: 'TELECONSULT',
      reasonForVisit: `[Teleconsultation] ${selectedReason}: ${symptomDetails || 'Online consult'}`,
      status: 'SCHEDULED',
    }).catch(console.warn);

    // Save to localStorage for integration with doctor queue
    const existingRequests = JSON.parse(
      localStorage.getItem('teleconsultation_requests') || '[]'
    );
    localStorage.setItem(
      'teleconsultation_requests',
      JSON.stringify([newRequest, ...existingRequests])
    );

    setConfirmedToken(newRequest);
    setSelectedDoctor(requestDoctor);
    setShowRequestModal(false);
    setCallStage('REQUEST_CONFIRMED');
  };

  // Start Call directly from a Fixed Call Record
  const handleStartCallFromRecord = (call: FixedCallRecord) => {
    setSelectedDoctor(call.doctor);
    setSelectedPatientId(call.patient.id);
    setConfirmedToken({
      tokenNumber: call.tokenNumber,
      doctor: call.doctor,
      patient: call.patient,
      requestType: call.requestType,
      scheduledDate: call.scheduledDate,
      scheduledTimeSlot: call.scheduledTimeSlot,
      reason: call.reason,
      urgency: call.urgency,
      symptomDetails: call.symptomDetails,
      attachedReports: call.attachedReports,
      registeredAt: call.registeredAt,
    });
    setNotes(
      `Teleconsultation with ${call.doctor.name} (${call.doctor.specialty}) for ${call.patient.name}. Reason: ${call.reason}.`
    );
    setCallDuration(0);
    setCallStage('IN_CALL');
  };

  // View pass voucher for a fixed call
  const handleViewPassForRecord = (call: FixedCallRecord) => {
    setConfirmedToken({
      tokenNumber: call.tokenNumber,
      doctor: call.doctor,
      patient: call.patient,
      requestType: call.requestType,
      scheduledDate: call.scheduledDate,
      scheduledTimeSlot: call.scheduledTimeSlot,
      reason: call.reason,
      urgency: call.urgency,
      symptomDetails: call.symptomDetails,
      attachedReports: call.attachedReports,
      registeredAt: call.registeredAt,
    });
    setCallStage('REQUEST_CONFIRMED');
  };

  // Cancel a fixed call
  const handleCancelFixedCall = (callId: string) => {
    setFixedCalls((prev) => prev.filter((c) => c.id !== callId));
  };

  // Direct Immediate Call Bypass
  const handleInitiateImmediateCall = (doc: VisitedDoctor) => {
    setSelectedDoctor(doc);
    setNotes(
      `Teleconsultation with ${doc.name} (${doc.specialty}) for ${activePatient.name}. Follow-up regarding ${doc.lastDiagnosis}.`
    );
    setCallDuration(0);
    setCallStage('IN_CALL');
  };

  // Start Call from Confirmed Token Voucher
  const handleStartCallFromToken = () => {
    if (confirmedToken) {
      setSelectedDoctor(confirmedToken.doctor);
    }
    setCallDuration(0);
    setCallStage('IN_CALL');
  };

  // End consultation and save it into communication history
  const handleEndCall = () => {
    const now = new Date();
    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    const durationFormatted = `${mins} mins ${secs} secs`;

    const consultation = {
      id: confirmedToken?.tokenNumber || `CONS-${Date.now()}`,
      patientName: activePatient.name,
      abhaId: activePatient.abhaId,
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      hospitalName: selectedDoctor.hospital,
      date: now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      duration: durationFormatted || '10 mins 15 secs',
      status: 'Completed',
      notes: notes || 'No consultation notes added.',
      advice: `Follow-up instructions given by ${selectedDoctor.name}. Maintain prescribed dosage.`,
      followUp: 'Follow-up scheduled as advised by doctor.',
    };

    const existingHistory = JSON.parse(
      localStorage.getItem('teleconsultation_history') || '[]'
    );

    localStorage.setItem(
      'teleconsultation_history',
      JSON.stringify([consultation, ...existingHistory])
    );

    setCallStage('COMPLETED');
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered Doctors List for Selected Patient
  const patientDoctors = VISITED_DOCTORS.filter((doc) =>
    activePatient.visitedDoctorIds.includes(doc.id)
  );

  const filteredDoctors = patientDoctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
      doc.lastDiagnosis.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchDoctorQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (doctorFilter === 'ONLINE') return doc.status === 'ONLINE';
    if (doctorFilter === 'SPECIALISTS')
      return doc.specialty.includes('Cardiologist') || doc.specialty.includes('Specialist');
    return true;
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ================================
          PAGE HEADER
      ================================= */}
      <PageHeader
        title="Teleconsultation"
        subtitle="Request a consultation and register your preferred time to talk with your doctor."
        breadcrumbs={[
          { label: 'Dashboard', to: '/patient' },
          { label: 'Teleconsultation', to: '/patient/consultations' },
          { label: 'Request Doctor Call' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {callStage === 'IN_CALL' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCallStage('SELECT_DOCTOR')}
                className="gap-1.5 text-xs bg-white text-slate-700"
              >
                <Users className="h-3.5 w-3.5" />
                Switch Doctor
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/patient/teleconsultation-history')}
              className="gap-1.5 text-xs bg-white text-teal-800 border-teal-300 font-bold"
            >
              <History className="h-4 w-4 text-teal-700" />
              <span>Consultation History</span>
            </Button>
          </div>
        }
      />

      {/* ================================================== */}
      {/* STAGE 1: DOCTOR & PATIENT SELECTION LOBBY */}
      {/* ================================================== */}
      {callStage === 'SELECT_DOCTOR' && (
        <div className="space-y-5">
          {/* ================================================== */}
          {/* RECENT CALL FIXED & UPCOMING APPOINTMENTS BANNER */}
          {/* ================================================== */}
          {fixedCalls.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span>Recent Call Fixed • Scheduled Consultations</span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 border border-emerald-300">
                        {fixedCalls.length} Active Slot
                      </span>
                    </h3>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Confirmed appointment with government hospital specialist
                </span>
              </div>

              <div className="space-y-3">
                {fixedCalls.map((call) => (
                  <Card
                    key={call.id}
                    className="border-2 border-emerald-400 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Doctor Avatar & Identity */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${call.doctor.avatarColor} text-white font-black text-lg shadow-sm relative`}
                          >
                            {call.doctor.initials}
                            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 animate-pulse flex items-center justify-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                            </span>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 tracking-wider uppercase shadow-2xs">
                                ● RECENT CALL FIXED & CONFIRMED
                              </span>
                              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md border border-teal-200">
                                Token: {call.tokenNumber}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                Registered at {call.registeredAt}
                              </span>
                            </div>

                            <h4 className="text-base font-black text-slate-900 truncate">
                              {call.doctor.name}
                            </h4>

                            <p className="text-xs font-bold text-teal-800 truncate">
                              {call.doctor.specialty} • {call.doctor.hospital} ({call.doctor.roomNumber})
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                              <span className="flex items-center gap-1 font-semibold text-slate-800">
                                <User className="h-3.5 w-3.5 text-teal-600" />
                                Patient: <strong>{call.patient.name}</strong> ({call.patient.relation})
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600">
                                Reason: <strong>{call.reason}</strong>
                              </span>
                              {call.attachedReports && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                                    <Check className="h-3 w-3" /> ABHA Records Attached
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Scheduled Time & Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-end xl:items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-emerald-100">
                          {/* Time window box */}
                          <div className="rounded-xl border border-emerald-200 bg-white/95 p-2.5 text-left sm:text-right lg:text-left xl:text-right min-w-[200px] shadow-2xs">
                            <span className="text-[10px] uppercase font-black text-emerald-800 tracking-wider block">
                              FIXED APPOINTMENT TIME
                            </span>
                            <strong className="text-sm font-black text-slate-900 block mt-0.5">
                              {call.scheduledTimeSlot}
                            </strong>
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 sm:justify-end lg:justify-start xl:justify-end mt-0.5">
                              <Clock className="h-3 w-3 text-emerald-600" />
                              {call.scheduledDate} • Slot Reserved
                            </span>
                          </div>

                          {/* Quick Action buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleStartCallFromRecord(call)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs gap-1.5 px-4 h-10 shadow-sm flex-1 sm:flex-initial cursor-pointer"
                            >
                              <Video className="h-4 w-4" />
                              <span>Enter Live Room / Join Call</span>
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => handleViewPassForRecord(call)}
                              className="text-xs h-10 px-3 text-slate-700 hover:bg-teal-50 border-slate-300 font-bold cursor-pointer"
                              title="View Pass Voucher"
                            >
                              <FileText className="h-4 w-4 text-teal-700" />
                              <span className="hidden sm:inline ml-1">Pass</span>
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => handleCancelFixedCall(call.id)}
                              className="text-xs h-10 px-2.5 text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
                              title="Cancel Booking"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Top Patient / Family Member Selector Strip */}
          <Card className="border-teal-200 bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-white shadow-xs">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-2xs">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                      Consultation Patient Profile
                    </span>
                    <h2 className="text-base font-black text-slate-900">
                      Who is this consultation for?
                    </h2>
                  </div>
                </div>

                <span className="text-xs text-slate-500 font-medium self-start sm:self-center">
                  Select family member to see their visited care team:
                </span>
              </div>

              {/* Family Member Radio Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {FAMILY_PATIENTS.map((p) => {
                  const isSelected = p.id === selectedPatientId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${isSelected
                        ? 'border-teal-400 bg-white ring-2 ring-teal-600/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-200'
                        }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-black text-slate-900 truncate">
                            {p.name}
                          </strong>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {p.relation} • {p.age}Y / {p.gender}
                        </p>
                        <p className="text-[10px] text-teal-700 font-bold mt-1">
                          ● {p.visitedDoctorIds.length} Visited Doctors on record
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Doctors Who Visited You Heading & Filters */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-teal-700" />
                  <span>Doctors Who Already Visited & Treated {activePatient.name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a suitable doctor to request a call and choose your preferred time.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor, hospital, symptom..."
                  value={searchDoctorQuery}
                  onChange={(e) => setSearchDoctorQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: 'ALL', label: `All Doctors (${patientDoctors.length})` },
                { id: 'ONLINE', label: '🟢 Online Now' },
                { id: 'SPECIALISTS', label: 'Specialists' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDoctorFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${doctorFilter === tab.id
                    ? 'bg-teal-700 text-white shadow-2xs font-black'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Visited Doctors List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) => (
                <Card
                  key={doc.id}
                  className="border-slate-200/90 bg-white hover:border-teal-300 transition-all shadow-2xs hover:shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <CardContent className="p-4 sm:p-5 space-y-3.5">
                    {/* Top Row: Avatar, Status & Doctor Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${doc.avatarColor} text-white font-black text-base shadow-xs relative`}
                        >
                          {doc.initials}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${doc.status === 'ONLINE'
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-amber-500'
                              }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {doc.name}
                          </h4>
                          <p className="text-xs font-bold text-teal-800 truncate">
                            {doc.specialty}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                            <Hospital className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{doc.hospital}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border ${doc.status === 'ONLINE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                      >
                        {doc.status === 'ONLINE' ? '● Online' : '● In OPD'}
                      </span>
                    </div>

                    {/* Visited Details Ribbon */}
                    <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600">Last Visited For:</span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {doc.lastVisitedDate}
                        </span>
                      </div>
                      <p className="font-bold text-teal-950 text-xs">{doc.lastDiagnosis}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        <strong>Advice:</strong> {doc.previousAdvice}
                      </p>
                    </div>

                    {/* Prescriptions Given */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Pill className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                      <span className="truncate">
                        <strong>Rx:</strong> {doc.lastPrescription}
                      </span>
                    </div>

                    {/* ACTION BUTTONS: REQUEST CONSULTATION & CHOOSE TIME + QUICK CALL */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-500 w-full sm:w-auto">
                        <p className="font-semibold text-slate-700">{doc.statusText}</p>
                        <p className="text-[9px] text-slate-400">{doc.rating}</p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Primary: Request Call & Choose Suitable Time */}
                        <Button
                          onClick={() => handleOpenRequestModal(doc)}
                          className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-black gap-1.5 h-9 px-3.5 shadow-xs flex-1 sm:flex-initial cursor-pointer"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Request Call & Choose Time</span>
                        </Button>

                        {/* Secondary: Quick Immediate Call */}
                        <Button
                          variant="outline"
                          onClick={() => handleInitiateImmediateCall(doc)}
                          className="text-xs h-9 px-2.5 text-slate-700 hover:bg-teal-50 hover:text-teal-900 border-slate-300 font-bold cursor-pointer"
                          title="Instant Call (Connect Now)"
                        >
                          <Video className="h-3.5 w-3.5 text-teal-700" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Completed Consultations / Call History Preview (Collapsible) */}
          <Card className="border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div
              onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
              className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors select-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100/70 text-teal-800">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">
                      Recent Consultation Call History
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {PAST_COMPLETED_CONSULTATIONS.length} Consultations
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Completed online teleconsultations and doctor notes on your ABHA record
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/patient/teleconsultation-history')}
                  className="text-xs font-bold text-teal-800 border-teal-300 hover:bg-teal-50 gap-1.5 h-8 cursor-pointer"
                >
                  <span>View All History ({PAST_COMPLETED_CONSULTATIONS.length + 1})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                  className="text-xs font-bold text-slate-700 hover:bg-slate-200/70 gap-1 h-8 px-2.5 cursor-pointer"
                >
                  <span>{isHistoryCollapsed ? 'Show Details' : 'Hide Details'}</span>
                  {isHistoryCollapsed ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            {!isHistoryCollapsed && (
              <CardContent className="p-0 divide-y divide-slate-100 animate-in fade-in duration-200">
                {PAST_COMPLETED_CONSULTATIONS.map((hist) => (
                  <div
                    key={hist.id}
                    className="p-4 sm:p-4.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200">
                        {hist.doctorName.split(' ')[1]?.slice(0, 2) || 'DR'}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-black text-slate-900 truncate">
                            {hist.doctorName}
                          </strong>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ● Completed
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {hist.tokenNumber}
                          </span>
                        </div>

                        <p className="text-[11px] text-teal-800 font-semibold truncate">
                          {hist.specialty} • {hist.hospital}
                        </p>

                        <p className="text-[11px] text-slate-600">
                          <strong>Diagnosis:</strong> {hist.diagnosis}
                        </p>

                        <p className="text-[10px] text-slate-500 truncate">
                          <strong>Rx Summary:</strong> {hist.rxSummary}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 space-y-1">
                      <div className="text-xs font-bold text-slate-800 flex items-center sm:justify-end gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{hist.date}</span>
                        <span className="text-slate-400">•</span>
                        <span>{hist.time}</span>
                      </div>

                      <p className="text-[10px] text-slate-500 font-mono">
                        Duration: {hist.duration}
                      </p>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/patient/records')}
                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 h-6 px-2 -mr-2 cursor-pointer"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        View ABHA Prescription
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* ================================================== */}
      {/* POPUP MODAL FORM: REQUEST CALL & REGISTER TIME SLOT */}
      {/* ================================================== */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4.5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${requestDoctor.avatarColor} text-white font-bold text-sm shadow-xs`}
                >
                  {requestDoctor.initials}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                    Book Doctor Teleconsultation
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Request Call with {requestDoctor.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {requestDoctor.specialty} • {requestDoctor.hospital}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitConsultationRequest} className="space-y-4">
              {/* Patient Identity Strip */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient</span>
                  <strong className="text-slate-900 font-bold">{activePatient.name}</strong>
                  <span className="text-slate-500 ml-1">({activePatient.relation} • {activePatient.age}Y)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">ABHA ID</span>
                  <span className="font-mono text-[11px] font-bold text-teal-800">{activePatient.abhaId}</span>
                </div>
              </div>

              {/* Consultation Timing Type: Instant vs Register Time Slot */}
              <div className="space-y-1.5">
                {/* <label className="text-xs font-bold text-slate-800 block">
                  1. Choose When You Want to Talk with the Doctor:
                </label> */}

                <div className="grid grid-cols-2 gap-2">

                </div>
              </div>

              {/* If Scheduled: Select Date & Available Slots */}
              {requestType === 'SCHEDULED' && (
                <div className="space-y-2.5 bg-teal-50/40 p-3 rounded-xl border border-teal-100">
                  {/* Date Chips */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Select Suitable Date:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Today (12 Sep)', 'Tomorrow (13 Sep)', 'Monday (15 Sep)'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSelectedDateOption(d)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${selectedDateOption === d
                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots Grid */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Select Suitable Time Window:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all text-center cursor-pointer ${selectedTimeSlot === slot
                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-teal-50'
                            }`}
                        >
                          <Clock className="h-3 w-3 inline mr-1 text-teal-600" />
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Consultation Reason & Complaints */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  1. Reason for Consultation:
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {REASON_PRESETS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${selectedReason === reason
                        ? 'bg-teal-700 text-white border-teal-700 shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={symptomDetails}
                  onChange={(e) => setSymptomDetails(e.target.value)}
                  placeholder="Describe any symptoms, doubts or medications to discuss..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                />
              </div>

              {/* Urgency Level */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  2. Triage Urgency Level:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'ROUTINE', label: '🟢 Routine Follow-up', desc: 'Non-urgent review' },
                    { id: 'PRIORITY', label: '🟡 Moderate Concern', desc: 'Needs attention' },
                    { id: 'URGENT', label: '🔴 Urgent Request', desc: 'Severe discomfort' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setUrgencyLevel(lvl.id as any)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${urgencyLevel === lvl.id
                        ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-500/70 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <p className="font-bold text-[11px] text-slate-900">{lvl.label}</p>
                      <p className="text-[9px] text-slate-400">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Attach Past ABHA Reports Checkbox */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="attachReports"
                  checked={attachPastReports}
                  onChange={(e) => setAttachPastReports(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-teal-700 focus:ring-teal-600 border-slate-300 cursor-pointer"
                />
                <label htmlFor="attachReports" className="text-xs cursor-pointer">
                  <span className="font-bold text-slate-800 block">
                    Share Latest ABHA Diagnostic & Prescription Records
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-relaxed">
                    Automatically securely attaches recent HbA1c (7.4%), Fasting Glucose (148 mg/dL), and ECG reports for the doctor to review during the call.
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRequestModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs gap-1.5 px-5 h-9 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register & Submit Consultation Request</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* STAGE: REQUEST CONFIRMED & QUEUE TOKEN VOUCHER */}
      {/* ================================================== */}
      {callStage === 'REQUEST_CONFIRMED' && confirmedToken && (
        <Card className="border-teal-200 bg-white shadow-lg overflow-hidden max-w-2xl mx-auto animate-in fade-in duration-150">
          <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-2xs">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-200 tracking-wider">
                  Request Confirmed & Registered
                </span>
                <h3 className="text-base font-black">
                  Consultation Token: {confirmedToken.tokenNumber}
                </h3>
              </div>
            </div>

            <span className="rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px] px-2.5 py-0.5">
              ● Registered
            </span>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                Your Request has been Sent to {confirmedToken.doctor.name}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The doctor has been notified in their teleconsultation desk. You have registered to talk with the doctor at your selected time.
              </p>
            </div>

            {/* Token Voucher Grid */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Doctor</span>
                  <strong className="text-slate-900 font-black text-sm block">
                    {confirmedToken.doctor.name}
                  </strong>
                  <span className="text-teal-800 text-[11px] font-semibold">
                    {confirmedToken.doctor.specialty}
                  </span>
                  <p className="text-[10px] text-slate-400">{confirmedToken.doctor.hospital}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Time</span>
                  <strong className="text-teal-900 font-black text-sm block">
                    {confirmedToken.scheduledTimeSlot}
                  </strong>
                  <span className="text-slate-600 text-[11px]">{confirmedToken.scheduledDate}</span>
                  <p className="text-[10px] text-emerald-700 font-bold">● Slot Reserved</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Patient Name:</span>
                  <strong className="text-slate-900 font-bold">{confirmedToken.patient.name}</strong>
                  <p className="text-[10px] text-slate-400 font-mono">ABHA: {confirmedToken.patient.abhaId}</p>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 block">Reason for Call:</span>
                  <strong className="text-slate-900 font-bold">{confirmedToken.reason}</strong>
                  <p className="text-[10px] text-teal-700 font-semibold">Urgency: {confirmedToken.urgency}</p>
                </div>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-xs text-teal-950 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">What happens next?</strong>
                <p className="text-[11px] text-teal-900 leading-relaxed mt-0.5">
                  Keep your phone or browser ready. When the doctor accepts your request or rings at the scheduled time, you can enter the waiting room or click below to start immediately.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Button
                onClick={handleStartCallFromToken}
                className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs gap-1.5 px-6 min-h-[42px] shadow-xs cursor-pointer"
              >
                <Video className="h-4 w-4" />
                <span>Enter Live Waiting Room / Start Call Now</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setCallStage('SELECT_DOCTOR')}
                className="w-full sm:w-auto text-xs font-bold text-slate-700 min-h-[42px] hover:bg-slate-50 cursor-pointer"
              >
                <span>View in My Fixed Calls / Back to Lobby</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/patient/teleconsultation-history')}
                className="w-full sm:w-auto text-xs font-bold text-teal-800 border-teal-200 min-h-[42px] hover:bg-teal-50 cursor-pointer"
              >
                <History className="h-4 w-4 text-teal-700 mr-1" />
                <span>Consultation History</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================== */}
      {/* STAGE 2: CONNECTING / CALL RINGING STATE */}
      {/* ================================================== */}
      {callStage === 'CONNECTING' && (
        <Card className="border-teal-200 bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 text-white shadow-xl overflow-hidden py-10">
          <CardContent className="p-6 text-center space-y-6 max-w-md mx-auto">
            {/* Pulsing Avatar */}
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
              <span className="absolute -inset-2 rounded-full bg-teal-500/30 animate-pulse" />
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr ${selectedDoctor.avatarColor} text-3xl font-black text-white border-4 border-teal-400/60 shadow-2xl`}
              >
                {selectedDoctor.initials}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 px-3 py-0.5 text-xs font-bold text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                Connecting via ABDM Telehealth Bridge
              </span>

              <h2 className="text-xl font-black text-white pt-1">
                Calling {selectedDoctor.name}...
              </h2>
              <p className="text-xs text-teal-200">
                {selectedDoctor.specialty} • {selectedDoctor.hospital}
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                Patient: <strong>{activePatient.name}</strong> (ABHA: {activePatient.abhaId})
              </p>
            </div>

            {/* Encryption & Quality Badge */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-bold text-teal-300">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span>End-to-End Encrypted Video Handshake</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Government of Gujarat Teleconsultation Server • HD 720p Ready
              </p>
            </div>

            {/* Cancel or Immediate Bypass Button */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={() => setCallStage('SELECT_DOCTOR')}
                className="rounded-full px-6 font-bold text-xs"
              >
                <PhoneOff className="h-4 w-4 mr-1.5" />
                Cancel Call
              </Button>

              <Button
                variant="outline"
                onClick={() => setCallStage('IN_CALL')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs rounded-full"
              >
                Connect Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================== */}
      {/* STAGE 3: ACTIVE VIDEO CALL ROOM */}
      {/* ================================================== */}
      {callStage === 'IN_CALL' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Top In-Call Telehealth Status Header */}
          <div className="rounded-2xl border border-teal-200 bg-white shadow-xs p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${selectedDoctor.avatarColor} text-white font-black text-sm shadow-xs relative`}
              >
                {selectedDoctor.initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-100 text-red-700 text-[10px] font-black px-2.5 py-0.5 border border-red-200 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    ● LIVE TELECONSULTATION
                  </span>
                  <span className="font-mono text-xs font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Token: {confirmedToken?.tokenNumber || 'TC-REQ-2026-9086'}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 hidden sm:flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    ABDM Verified Session
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-900 truncate mt-0.5">
                  {selectedDoctor.name} • <span className="text-teal-800 font-bold">{selectedDoctor.specialty}</span>
                </h3>
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <Hospital className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>{selectedDoctor.hospital} ({selectedDoctor.roomNumber})</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {/* Timer */}
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-mono font-bold shadow-xs">
                <Clock className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span>{formatTimer(callDuration)}</span>
              </div>

              {/* Layout Switcher Buttons */}
              <div className="hidden sm:flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCallLayout('SPEAKER')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    callLayout === 'SPEAKER'
                      ? 'bg-white text-teal-800 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Speaker Focus View"
                >
                  Speaker
                </button>

                <button
                  type="button"
                  onClick={() => setCallLayout('GRID')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    callLayout === 'GRID'
                      ? 'bg-white text-teal-800 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Split Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5 inline mr-1" />
                  Grid
                </button>

                <button
                  type="button"
                  onClick={() => setCallLayout('SHARE_REPORT')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    callLayout === 'SHARE_REPORT'
                      ? 'bg-white text-teal-800 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Review Lab Reports on Screen"
                >
                  <FileText className="h-3.5 w-3.5 inline mr-1 text-teal-600" />
                  Reports
                </button>
              </div>

              {/* CC Toggle */}
              <Button
                variant={showCaptions ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowCaptions(!showCaptions)}
                className="text-xs h-8 px-2.5 font-bold cursor-pointer"
                title="Toggle Subtitles / Captions"
              >
                CC
              </Button>

              {/* Leave Call Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndCall}
                className="gap-1.5 text-xs font-bold rounded-xl h-8 px-3.5 shadow-xs cursor-pointer"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>Leave Call</span>
              </Button>
            </div>
          </div>

          {/* Main Workspace: Video Window (8 cols) + Clinical Sidebar (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 8 Cols: Video Window Stage */}
            <div className="lg:col-span-8 space-y-3">
              <div className="relative aspect-video w-full rounded-2xl bg-slate-950 overflow-hidden shadow-xl border border-slate-800">
                {/* Top Video Telemetry Overlays */}
                <div className="absolute left-4 top-4 z-20 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-white border border-white/10 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>HD 1080p • ABDM Encrypted</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 rounded-full bg-teal-950/80 px-2.5 py-1 text-[10px] font-bold text-teal-300 border border-teal-500/20">
                    <Wifi className="h-3 w-3 text-emerald-400" />
                    <span>1.4 Mbps (Excellent)</span>
                  </div>
                </div>

                <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold text-slate-300 border border-white/10">
                    {isMutedSpeaker ? (
                      <VolumeX className="h-3 w-3 text-red-400" />
                    ) : (
                      <Volume2 className="h-3 w-3 text-emerald-400" />
                    )}
                    <span>{isMutedSpeaker ? 'Speaker Muted' : 'Audio Active'}</span>
                  </div>
                </div>

                {/* Hand Raised Floating Toast */}
                {isHandRaised && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-amber-500 text-slate-950 px-4 py-1 text-xs font-black shadow-lg animate-bounce">
                    <Hand className="h-3.5 w-3.5" />
                    <span>You raised your hand • Doctor has been alerted</span>
                  </div>
                )}

                {/* E-Prescription Download Toast */}
                {rxDownloadToast && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-emerald-500 text-white px-4 py-1.5 text-xs font-black shadow-xl animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>✓ E-Prescription PDF downloaded & synced to ABHA record!</span>
                  </div>
                )}

                {/* ================================================== */}
                {/* VIDEO STAGE MODES */}
                {/* ================================================== */}

                {/* MODE 1: SPEAKER VIEW (Doctor Focused) */}
                {callLayout === 'SPEAKER' && (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-teal-950 p-6 text-center text-white">
                    {/* Simulated Clinic Background Aura */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]" />

                    <div className="relative z-10">
                      <div
                        className={`flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr ${selectedDoctor.avatarColor} text-3xl font-black text-white border-4 border-teal-400/60 shadow-2xl relative`}
                      >
                        {selectedDoctor.initials}
                        <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-950 text-white shadow-xs">
                          <Stethoscope className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 mt-3 space-y-0.5">
                      <h3 className="text-lg font-black text-white">
                        {selectedDoctor.name}
                      </h3>
                      <p className="text-xs text-teal-300 font-semibold">{selectedDoctor.specialty}</p>
                      <p className="text-[11px] text-slate-400">{selectedDoctor.hospital}</p>
                    </div>

                    {/* Animated Speech Equalizer Waveform */}
                    <div className="relative z-10 mt-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 border border-white/10 shadow-xs">
                      <span className="h-2 w-1 bg-teal-400 rounded-full animate-pulse" />
                      <span className="h-4 w-1 bg-teal-400 rounded-full animate-pulse delay-75" />
                      <span className="h-6 w-1 bg-teal-400 rounded-full animate-pulse delay-150" />
                      <span className="h-3 w-1 bg-teal-400 rounded-full animate-pulse delay-100" />
                      <span className="h-5 w-1 bg-teal-400 rounded-full animate-pulse delay-200" />
                      <span className="h-2 w-1 bg-teal-400 rounded-full animate-pulse" />
                      <span className="text-[10px] text-teal-300 ml-1.5 font-mono font-bold">
                        Dr. Patel Speaking • Live Audio
                      </span>
                    </div>

                    {/* Patient Self-View PiP */}
                    <div className="absolute right-4 bottom-14 h-28 w-40 rounded-2xl border-2 border-white/30 bg-slate-900/90 overflow-hidden text-white shadow-2xl flex items-center justify-center z-20">
                      {cameraOn ? (
                        <div className="text-center p-2 w-full">
                          <div className="h-9 w-9 mx-auto rounded-full bg-teal-700 flex items-center justify-center text-xs font-black shadow-xs">
                            {activePatient.name.split(' ')[0].slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-[10px] font-bold text-white mt-1 truncate">
                            {activePatient.name}
                          </p>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[8px] text-teal-300 font-bold">You (Self View)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-400 p-2">
                          <VideoOff className="h-5 w-5 mx-auto" />
                          <p className="text-[9px] mt-1 font-bold">Camera Off</p>
                          <p className="text-[8px] text-slate-500">{activePatient.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODE 2: SPLIT GRID VIEW */}
                {callLayout === 'GRID' && (
                  <div className="w-full h-full grid grid-cols-2 gap-2 p-3 bg-slate-950">
                    {/* Doctor Card */}
                    <div className="relative rounded-xl bg-gradient-to-tr from-slate-900 to-teal-950 border border-slate-800 flex flex-col items-center justify-center text-center p-4 text-white">
                      <div
                        className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr ${selectedDoctor.avatarColor} text-2xl font-black text-white border-2 border-teal-400/60 shadow-lg`}
                      >
                        {selectedDoctor.initials}
                      </div>
                      <h4 className="mt-2 text-sm font-black text-white">{selectedDoctor.name}</h4>
                      <p className="text-[11px] text-teal-300">{selectedDoctor.specialty}</p>
                      <div className="mt-2 flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Speaking • Doctor
                      </div>
                    </div>

                    {/* Patient Card */}
                    <div className="relative rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center p-4 text-white">
                      {cameraOn ? (
                        <>
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-800 text-2xl font-black text-white border-2 border-teal-500/60 shadow-lg">
                            {activePatient.name.split(' ')[0].slice(0, 2).toUpperCase()}
                          </div>
                          <h4 className="mt-2 text-sm font-black text-white">{activePatient.name}</h4>
                          <p className="text-[11px] text-slate-400">Patient • {activePatient.relation}</p>
                          <div className="mt-2 flex items-center gap-1 text-[9px] text-teal-300 font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                            Camera Live • Audio Active
                          </div>
                        </>
                      ) : (
                        <>
                          <VideoOff className="h-10 w-10 text-slate-600" />
                          <h4 className="mt-2 text-sm font-black text-white">{activePatient.name}</h4>
                          <p className="text-[10px] text-slate-400">Camera is turned off</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* MODE 3: REVIEW LAB REPORT ON SCREEN */}
                {callLayout === 'SHARE_REPORT' && (
                  <div className="w-full h-full flex flex-col sm:flex-row bg-slate-900 p-2 sm:p-3 gap-2">
                    {/* Left: Shared Clinical Document */}
                    <div className="flex-1 rounded-xl bg-white p-3.5 text-slate-900 overflow-y-auto space-y-2.5 text-xs shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div>
                          <span className="text-[9px] uppercase font-black tracking-wider text-teal-800 block">
                            Govt. Civil Hospital • Central Pathology Laboratory
                          </span>
                          <strong className="text-xs font-black text-slate-900">
                            Comprehensive Glycemic & Lipid Investigation
                          </strong>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          ABHA Verified Report
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded-lg">
                        <div>Patient: <strong>{activePatient.name}</strong> (48Y)</div>
                        <div>Date: <strong>10 Sep 2026</strong></div>
                      </div>

                      {/* Values Table */}
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                            <th className="py-1">Test Name</th>
                            <th className="py-1">Result</th>
                            <th className="py-1">Ref Range</th>
                            <th className="py-1">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="bg-amber-50/80 font-bold">
                            <td className="py-1 text-slate-900">Fasting Blood Sugar (FBS)</td>
                            <td className="py-1 text-amber-900 font-black">148 mg/dL</td>
                            <td className="py-1 text-slate-500">70 - 100</td>
                            <td className="py-1 text-amber-700">● Doctor Reviewing</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-slate-900">HbA1c (Glycated Hb)</td>
                            <td className="py-1 font-bold">7.4 %</td>
                            <td className="py-1 text-slate-500">&lt; 5.7 %</td>
                            <td className="py-1 text-slate-600">Fair Control</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-slate-900">Serum Creatinine</td>
                            <td className="py-1 font-bold">0.9 mg/dL</td>
                            <td className="py-1 text-slate-500">0.7 - 1.3</td>
                            <td className="py-1 text-emerald-700">● Normal</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-slate-900">Resting Blood Pressure</td>
                            <td className="py-1 font-bold">134/86 mmHg</td>
                            <td className="py-1 text-slate-500">&lt; 120/80</td>
                            <td className="py-1 text-emerald-700">● Controlled</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="rounded-lg bg-teal-50 border border-teal-200 p-2 text-[10px] text-teal-900 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        <span>Doctor is reviewing FBS 148 mg/dL. Recommending continuing Metformin 1000mg.</span>
                      </div>
                    </div>

                    {/* Right: Doctor & Patient Feeds Stacked */}
                    <div className="w-full sm:w-44 flex flex-row sm:flex-col gap-2 shrink-0">
                      <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-2 text-center text-white flex flex-col items-center justify-center">
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${selectedDoctor.avatarColor} flex items-center justify-center text-xs font-black`}>
                          {selectedDoctor.initials}
                        </div>
                        <p className="text-[10px] font-bold mt-1">{selectedDoctor.name}</p>
                        <p className="text-[8px] text-teal-400">Reviewing Report</p>
                      </div>

                      <div className="flex-1 rounded-xl bg-slate-950 border border-slate-800 p-2 text-center text-white flex flex-col items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-teal-800 flex items-center justify-center text-xs font-black">
                          {activePatient.name.split(' ')[0].slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-[10px] font-bold mt-1">{activePatient.name}</p>
                        <p className="text-[8px] text-slate-400">Patient Feed</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Closed Captions / Subtitles Overlay */}
                {showCaptions && (
                  <div className="absolute bottom-2 left-4 right-4 z-20 rounded-xl bg-slate-950/85 backdrop-blur-xs p-2.5 text-center text-xs text-white border border-white/10 shadow-lg animate-in fade-in">
                    <p className="text-[11px] leading-relaxed">
                      <strong className="text-teal-300 font-bold">{selectedDoctor.name}: </strong>
                      <span>
                        "Rameshwar ji, your morning blood sugar of 148 is better than last month. Adherence to Telmisartan 40mg is good. Continue 30 min morning walk."
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* In-Call Action Controls Dock */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                {/* Media Hardware Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setMicOn(!micOn)}
                    variant={micOn ? 'secondary' : 'destructive'}
                    size="icon"
                    className={`rounded-full h-11 w-11 cursor-pointer transition-all ${
                      micOn ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {micOn ? <Mic className="h-5 w-5 text-teal-800" /> : <MicOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={() => setCameraOn(!cameraOn)}
                    variant={cameraOn ? 'secondary' : 'destructive'}
                    size="icon"
                    className={`rounded-full h-11 w-11 cursor-pointer transition-all ${
                      cameraOn ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                    title={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
                  >
                    {cameraOn ? <Video className="h-5 w-5 text-teal-800" /> : <VideoOff className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={() => setIsMutedSpeaker(!isMutedSpeaker)}
                    variant="secondary"
                    size="icon"
                    className={`rounded-full h-11 w-11 cursor-pointer ${
                      isMutedSpeaker ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                    }`}
                    title={isMutedSpeaker ? 'Unmute Doctor Audio' : 'Mute Doctor Audio'}
                  >
                    {isMutedSpeaker ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>

                  <Button
                    onClick={() => setCallLayout(callLayout === 'SHARE_REPORT' ? 'SPEAKER' : 'SHARE_REPORT')}
                    variant={callLayout === 'SHARE_REPORT' ? 'primary' : 'secondary'}
                    size="icon"
                    className={`rounded-full h-11 w-11 cursor-pointer ${
                      callLayout === 'SHARE_REPORT' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-800'
                    }`}
                    title="Share / Review Lab Reports with Doctor"
                  >
                    <MonitorUp className="h-5 w-5" />
                  </Button>

                  <Button
                    onClick={() => setIsHandRaised(!isHandRaised)}
                    variant={isHandRaised ? 'primary' : 'secondary'}
                    size="icon"
                    className={`rounded-full h-11 w-11 cursor-pointer ${
                      isHandRaised ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400' : 'bg-slate-100 text-slate-800'
                    }`}
                    title="Raise Hand (Ask Question)"
                  >
                    <Hand className="h-5 w-5" />
                  </Button>
                </div>

                {/* Right Side Dock Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setActiveCallTab('PRESCRIPTION')}
                    variant="outline"
                    size="sm"
                    className={`text-xs gap-1.5 h-10 px-3 cursor-pointer ${
                      activeCallTab === 'PRESCRIPTION' ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <Pill className="h-4 w-4 text-teal-700" />
                    <span className="hidden sm:inline">Rx Prescription</span>
                  </Button>

                  <Button
                    onClick={() => setActiveCallTab('CHAT')}
                    variant="outline"
                    size="sm"
                    className={`text-xs gap-1.5 h-10 px-3 cursor-pointer ${
                      activeCallTab === 'CHAT' ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 text-teal-700" />
                    <span className="hidden sm:inline">Live Chat</span>
                  </Button>

                  <Button
                    onClick={() => setCallStage('SELECT_DOCTOR')}
                    variant="outline"
                    size="sm"
                    className="text-xs text-slate-600 gap-1 h-10 cursor-pointer"
                    title="Switch Doctor"
                  >
                    <Users className="h-3.5 w-3.5 text-teal-700" />
                    <span className="hidden md:inline">Lobby</span>
                  </Button>

                  <Button
                    onClick={handleEndCall}
                    variant="destructive"
                    className="rounded-full min-h-[42px] px-5 gap-2 font-bold cursor-pointer shadow-sm"
                  >
                    <PhoneOff className="h-4 w-4" />
                    <span>End Call</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Interactive Clinical Workspace Tabs */}
            <div className="lg:col-span-4 space-y-3">
              <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                {/* Tab Navigation Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-1.5 flex items-center gap-1 text-xs font-bold">
                  {[
                    { id: 'PRESCRIPTION', label: 'Prescription', icon: Pill },
                    { id: 'CHAT', label: 'Live Chat', icon: MessageSquare },
                    { id: 'VITALS', label: 'Vitals & Lab', icon: Activity },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeCallTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveCallTab(tab.id as any)}
                        className={`flex-1 py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isActive
                            ? 'bg-white text-teal-800 shadow-2xs font-black border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <CardContent className="p-4 space-y-3.5 text-xs min-h-[420px]">
                  {/* TAB 1: E-PRESCRIPTION */}
                  {activeCallTab === 'PRESCRIPTION' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-teal-800 block">
                            ABDM Digital E-Prescription
                          </span>
                          <h4 className="text-sm font-black text-slate-900">
                            Medicines Prescribed by {selectedDoctor.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ● Active Rx
                        </span>
                      </div>

                      {/* Medications List */}
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-black text-slate-900">
                              1. Tab. Telmisartan 40mg
                            </strong>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                              30 Days
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">Telmisartan IP 40mg</p>
                          <p className="text-[11px] font-bold text-teal-900">Dosage: 1 - 0 - 0 (After breakfast)</p>
                          <p className="text-[10px] text-slate-600">Take with glass of water. Daily morning BP tracking.</p>
                        </div>

                        <div className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-black text-slate-900">
                              2. Tab. Metformin SR 1000mg
                            </strong>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-900">
                              30 Days
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">Metformin Hydrochloride Prolonged Release</p>
                          <p className="text-[11px] font-bold text-teal-900">Dosage: 1 - 0 - 1 (With major meals)</p>
                          <p className="text-[10px] text-slate-600">Take with lunch and dinner to manage glycemic peaks.</p>
                        </div>

                        <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-black text-slate-900">
                              3. Tab. Atorvastatin 10mg
                            </strong>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900">
                              30 Days
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">Atorvastatin Calcium IP</p>
                          <p className="text-[11px] font-bold text-teal-900">Dosage: 0 - 0 - 1 (Bedtime)</p>
                          <p className="text-[10px] text-slate-600">Take at bedtime for lipid regulation.</p>
                        </div>
                      </div>

                      {/* Doctor Clinical Advice */}
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1 text-[11px]">
                        <span className="font-bold text-slate-800 block">Doctor Clinical Advice:</span>
                        <ul className="list-disc list-inside text-[10px] text-slate-600 space-y-0.5">
                          <li>Maintain low salt and low refined sugar diet.</li>
                          <li>30 minutes daily morning brisk walk recommended.</li>
                          <li>Follow-up consultation in 4 weeks with weekly BP log.</li>
                        </ul>
                      </div>

                      {/* Doctor Digital Stamp & Download */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Signed: <strong>{selectedDoctor.name}</strong></span>
                          <span className="font-mono">Reg: GMC-2008-54210</span>
                        </div>

                        <Button
                          onClick={handleDownloadPrescription}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs gap-1.5 h-9 shadow-xs cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download Signed E-Prescription (PDF)</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LIVE CHAT */}
                  {activeCallTab === 'CHAT' && (
                    <div className="flex flex-col h-[420px] justify-between space-y-3 animate-in fade-in duration-150">
                      {/* Messages Scroll Area */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              msg.sender === 'PATIENT'
                                ? 'items-end'
                                : msg.sender === 'DOCTOR'
                                ? 'items-start'
                                : 'items-center'
                            }`}
                          >
                            {msg.sender === 'SYSTEM' ? (
                              <div className="rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[9px] text-slate-500 text-center max-w-[280px]">
                                {msg.text}
                              </div>
                            ) : (
                              <div
                                className={`max-w-[85%] rounded-2xl p-2.5 text-xs space-y-0.5 shadow-2xs ${
                                  msg.sender === 'PATIENT'
                                    ? 'bg-teal-700 text-white rounded-br-none'
                                    : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none'
                                }`}
                              >
                                <span
                                  className={`text-[9px] font-black block ${
                                    msg.sender === 'PATIENT' ? 'text-teal-200' : 'text-teal-800'
                                  }`}
                                >
                                  {msg.senderName} • {msg.time}
                                </span>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Input Box */}
                      <form onSubmit={handleSendChatMessage} className="pt-2 border-t border-slate-100 space-y-2">
                        {/* Quick Prompts */}
                        <div className="flex flex-wrap gap-1">
                          {[
                            'Can I take Metformin after food?',
                            'Morning walking advised?',
                            'BP is 134/86 today',
                          ].map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setNewChatMessage(chip)}
                              className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 transition-colors cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            placeholder="Type a message or doubt for doctor..."
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                          />
                          <Button
                            type="submit"
                            className="bg-teal-700 hover:bg-teal-800 text-white h-9 px-3 rounded-xl cursor-pointer"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* TAB 3: VITALS & LAB REPORTS */}
                  {activeCallTab === 'VITALS' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-teal-800 block">
                            Patient Health Vitals
                          </span>
                          <h4 className="text-sm font-black text-slate-900">
                            Live Stream for {activePatient.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">ABHA: {activePatient.abhaId}</span>
                      </div>

                      {/* Vitals Cards Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Blood Pressure</span>
                          <strong className="text-sm font-black text-slate-900">134/86 mmHg</strong>
                          <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">● Controlled</span>
                        </div>

                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Fasting Glucose</span>
                          <strong className="text-sm font-black text-amber-900">148 mg/dL</strong>
                          <span className="text-[9px] text-amber-700 font-bold block mt-0.5">● Target Review</span>
                        </div>

                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Pulse Rate</span>
                          <strong className="text-sm font-black text-slate-900">74 bpm</strong>
                          <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">● Normal Sinus</span>
                        </div>

                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Oxygen (SpO2)</span>
                          <strong className="text-sm font-black text-slate-900">98%</strong>
                          <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">● Room Air</span>
                        </div>
                      </div>

                      {/* Attached ABHA Records List */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-800 text-[11px] block">
                          Attached ABHA Diagnostic Records:
                        </span>

                        <div className="p-2 rounded-xl border border-teal-100 bg-teal-50/50 flex items-center justify-between">
                          <div>
                            <strong className="text-[11px] font-bold text-slate-900 block">
                              HbA1c & Fasting Sugar Report
                            </strong>
                            <span className="text-[9px] text-slate-500">Pathology Lab • 10 Sep 2026</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCallLayout('SHARE_REPORT')}
                            className="text-[10px] h-7 px-2 font-bold text-teal-800 border-teal-300 hover:bg-teal-100 cursor-pointer"
                          >
                            View on Screen
                          </Button>
                        </div>

                        <div className="p-2 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                          <div>
                            <strong className="text-[11px] font-bold text-slate-900 block">
                              12-Lead ECG Strip (Normal)
                            </strong>
                            <span className="text-[9px] text-slate-500">Cardiology Dept • 15 Jul 2026</span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-semibold">● Attached</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* STAGE 4: CALL COMPLETED SUMMARY */}
      {/* ================================================== */}
      {callStage === 'COMPLETED' && (
        <Card className="border-emerald-200 bg-white shadow-md">
          <CardContent className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-700" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                Teleconsultation Completed Successfully
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your consultation with <strong>{selectedDoctor.name}</strong> has ended. The
                consultation record and prescription summary have been saved to your ABHA health locker.
              </p>
            </div>

            {/* Encounter Metadata Grid */}
            <div className="mx-auto grid max-w-lg grid-cols-2 sm:grid-cols-3 gap-3 text-left">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Attending Doctor</p>
                <p className="mt-1 text-xs font-black text-slate-900">{selectedDoctor.name}</p>
                <p className="text-[10px] text-teal-700 font-medium">{selectedDoctor.specialty}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Consulted Patient</p>
                <p className="mt-1 text-xs font-black text-slate-900">{activePatient.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">ABHA: {activePatient.abhaId}</p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Duration</p>
                <p className="mt-1 text-xs font-black text-slate-900">
                  {formatTimer(callDuration)}
                </p>
                <p className="text-[10px] text-emerald-700 font-bold">● Recorded</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2.5">
              <Button
                onClick={() => setCallStage('SELECT_DOCTOR')}
                variant="primary"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-1.5 min-h-[40px]"
              >
                <Users className="h-4 w-4" />
                <span>Call Another Doctor / Back to List</span>
              </Button>

              <Button
                onClick={() => navigate('/patient/teleconsultation-history')}
                variant="outline"
                className="text-xs font-bold gap-1.5 min-h-[40px] text-slate-700"
              >
                <History className="h-4 w-4 text-teal-700" />
                <span>View Full Consultation History</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeleconsultationRoom;