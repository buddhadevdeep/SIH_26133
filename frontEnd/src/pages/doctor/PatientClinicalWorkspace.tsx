import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { INITIAL_HEALTH_RECORD, INITIAL_LIVE_QUEUE } from '@/mock/mockData';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { referralApi } from '@/api/referralApi';
import { clinicalApi } from '@/api/clinicalApi';
import { Referral } from '@/types/referral';
import { Token } from '@/types/queue';
import {
  Stethoscope,
  CheckCircle2,
  Plus,
  Trash2,
  Heart,
  Droplets,
  Activity,
  ShieldAlert,
  Printer,
  Pill,
  X,
  QrCode,
  Phone,
  Users,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  Check,
  AlertTriangle,
  History,
  Send,
  Ambulance,
  TestTube,
  Video,
  Clock,
  UserX,
  ChevronRight,
  ChevronLeft,
  Search,
  ExternalLink,
  Share2,
  BellRing,
  PauseCircle,
  FileText,
  ListOrdered,
  Eye,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface MedicineItem {
  id: string;
  name: string;
  frequency: string;
  duration: string;
  timing: string;
}

// Rich Patient Profiles mapped to queue tokens
const PATIENT_PROFILES: Record<string, any> = {
  usr_pat_99: {
    id: 'usr_pat_99',
    tokenNumber: 'A-035',
    name: 'Govindbhai Prajapati',
    age: 52,
    gender: 'Male',
    phone: '9825011122',
    bloodGroup: 'B+',
    abhaId: '14-8921-3409-7721',
    bp: '128/82',
    pulse: 74,
    sugar: 148,
    spo2: 99,
    weight: '68 kg',
    allergies: ['Penicillin (Severe Rash)'],
    chiefComplaint: 'Chest tightness on exertion & post-prandial heaviness',
    defaultDiagnosis: 'Angina Pectoris - Rule out CAD',
    priority: 'ROUTINE',
    meds: [
      { id: 'm1', name: 'Tab. Sorbitrate 5mg (Sublingual)', frequency: 'SOS', duration: '15 Days', timing: 'Under tongue on chest pain' },
      { id: 'm2', name: 'Tab. Aspirin 75mg Gastro-resistant', frequency: '1-0-0', duration: '30 Days', timing: 'Morning after breakfast' },
      { id: 'm3', name: 'Tab. Pantoprazole 40mg', frequency: '1-0-0', duration: '10 Days', timing: 'Before breakfast' },
    ],
    tests: ['12-Lead ECG', 'Lipid Profile Full'],
    advice: 'Avoid heavy lifting. Strict low salt and low oil diet. Drink warm water.',
  },
  usr_pat_98: {
    id: 'usr_pat_98',
    tokenNumber: 'A-036',
    name: 'Meenaben Solanki',
    age: 39,
    gender: 'Female',
    phone: '9825033344',
    bloodGroup: 'O+',
    abhaId: '22-4419-8732-1102',
    bp: '118/76',
    pulse: 92,
    sugar: 104,
    spo2: 98,
    weight: '56 kg',
    allergies: ['None known'],
    chiefComplaint: 'High fever for 3 days with chills, severe throat pain & dry cough',
    defaultDiagnosis: 'Acute Viral Upper Respiratory Infection (URTI) with Pharyngitis',
    priority: 'ROUTINE',
    meds: [
      { id: 'm1', name: 'Tab. Paracetamol 650mg', frequency: '1-0-1', duration: '3 Days', timing: 'After Food (Morning & Night)' },
      { id: 'm2', name: 'Tab. Cetirizine 10mg', frequency: '0-0-1', duration: '5 Days', timing: 'At Bedtime' },
      { id: 'm3', name: 'Tab. Azithromycin 500mg', frequency: '1-0-0', duration: '3 Days', timing: '1 Hr Before Food' },
    ],
    tests: ['Complete Blood Count (CBC)'],
    advice: 'Warm salt water gargles 3 times daily. Drink warm fluids and take bed rest.',
  },
  usr_pat_97: {
    id: 'usr_pat_97',
    tokenNumber: 'A-037',
    name: 'Kishore Parmar',
    age: 61,
    gender: 'Male',
    phone: '9825055566',
    bloodGroup: 'A+',
    abhaId: '91-3382-7491-9988',
    bp: '144/92',
    pulse: 80,
    sugar: 218,
    spo2: 97,
    weight: '74 kg',
    allergies: ['Sulfa Drugs'],
    chiefComplaint: 'Uncontrolled blood sugar review, tingling in feet & polyuria',
    defaultDiagnosis: 'Type 2 Diabetes Mellitus with Peripheral Neuropathy & Stage 1 HTN',
    priority: 'PRIORITY',
    meds: [
      { id: 'm1', name: 'Tab. Metformin 500mg SR', frequency: '1-0-1', duration: '30 Days', timing: 'With Meals' },
      { id: 'm2', name: 'Tab. Amlodipine 5mg', frequency: '1-0-0', duration: '30 Days', timing: 'Morning' },
      { id: 'm3', name: 'Tab. Methylcobalamin 1500mcg', frequency: '0-1-0', duration: '30 Days', timing: 'After Lunch' },
    ],
    tests: ['Blood Sugar (FBS)', 'HbA1c (3-Month Sugar)', 'Lipid Profile Full'],
    advice: 'Strict diabetic diet. Avoid sugar, sweets, and potatoes. Daily 30 min morning walk.',
  },
  usr_pat_96: {
    id: 'usr_pat_96',
    tokenNumber: 'A-038',
    name: 'Rekhaben Patel',
    age: 28,
    gender: 'Female',
    phone: '9825077788',
    bloodGroup: 'AB+',
    abhaId: '44-5512-9901-2345',
    bp: '110/70',
    pulse: 78,
    sugar: 92,
    spo2: 99,
    weight: '62 kg',
    allergies: ['None known'],
    chiefComplaint: 'ANC 2nd Trimester routine checkup & mild pedal edema',
    defaultDiagnosis: 'Antenatal Care - 24 Weeks Gestation (Normotensive)',
    priority: 'ROUTINE',
    meds: [
      { id: 'm1', name: 'Tab. IFA (Iron + Folic Acid)', frequency: '0-1-0', duration: '60 Days', timing: 'After Lunch' },
      { id: 'm2', name: 'Tab. Calcium + Vitamin D3', frequency: '1-0-0', duration: '60 Days', timing: 'After Breakfast' },
    ],
    tests: ['Complete Blood Count (CBC)', 'Obstetric Ultrasound (Level II)'],
    advice: 'Green leafy vegetables, keep feet elevated while resting. Drink plenty of water.',
  },
  usr_pat_95: {
    id: 'usr_pat_95',
    tokenNumber: 'A-039',
    name: 'Dilipbhai Shah',
    age: 67,
    gender: 'Male',
    phone: '9825099900',
    bloodGroup: 'B-',
    abhaId: '88-1290-3344-5566',
    bp: '158/98',
    pulse: 88,
    sugar: 165,
    spo2: 96,
    weight: '80 kg',
    allergies: ['None known'],
    chiefComplaint: 'Severe bilateral knee joint pain, morning stiffness & high BP',
    defaultDiagnosis: 'Bilateral Osteoarthritis Knee (Grade 3) & Stage 2 Hypertension',
    priority: 'SENIOR',
    meds: [
      { id: 'm1', name: 'Tab. Paracetamol 650mg', frequency: '1-0-1', duration: '7 Days', timing: 'After Food (SOS)' },
      { id: 'm2', name: 'Tab. Telmisartan 40mg', frequency: '1-0-0', duration: '30 Days', timing: 'Morning' },
      { id: 'm3', name: 'Tab. Calcium + Vitamin D3', frequency: '0-1-0', duration: '30 Days', timing: 'After Lunch' },
    ],
    tests: ['X-Ray Knee (Standing)', 'Serum Uric Acid'],
    advice: 'Quadriceps isometric exercises. Low salt diet. Avoid sitting on floor or squatting.',
  },
  usr_pat_94: {
    id: 'usr_pat_94',
    tokenNumber: 'A-034',
    name: 'Rameshbhai Dave',
    age: 45,
    gender: 'Male',
    phone: '9825000011',
    bloodGroup: 'O+',
    abhaId: '11-8842-1920-3321',
    bp: '122/80',
    pulse: 72,
    sugar: 110,
    spo2: 99,
    weight: '70 kg',
    allergies: ['None known'],
    chiefComplaint: 'Post-op wound dressing review & pain relief',
    defaultDiagnosis: 'Post-operative Routine Follow-up - Wound Healing Satisfactory',
    priority: 'ROUTINE',
    meds: [
      { id: 'm1', name: 'Tab. Paracetamol 650mg', frequency: '1-0-1', duration: '3 Days', timing: 'After Food' },
    ],
    tests: [],
    advice: 'Keep dressing clean and dry. Normal diet.',
  },
};

// 1-Click Fast OPD Protocols
const QUICK_CLINICAL_PRESETS = [
  {
    id: 'fever',
    label: '🤒 Viral Fever / Cold',
    diagnosis: 'Acute Viral Upper Respiratory Infection (URTI)',
    meds: [
      { name: 'Tab. Paracetamol 650mg', frequency: '1-0-1', duration: '3 Days', timing: 'After Food (Morning & Night)' },
      { name: 'Tab. Cetirizine 10mg', frequency: '0-0-1', duration: '5 Days', timing: 'At Bedtime' },
    ],
    tests: ['Complete Blood Count (CBC)'],
    advice: 'Drink warm boiled water. Take adequate rest. Return if high fever persists after 3 days.',
  },
  {
    id: 'acidity',
    label: '🔥 Acidity / Gas (GERD)',
    diagnosis: 'Acute Acid Peptic Disease (GERD / Gastritis)',
    meds: [
      { name: 'Tab. Pantoprazole 40mg', frequency: '1-0-0', duration: '7 Days', timing: 'Before Breakfast' },
    ],
    tests: [],
    advice: 'Avoid spicy, oily, and outside deep-fried foods. Do not lie down immediately after dinner.',
  },
  {
    id: 'bp',
    label: '🫀 High BP Check',
    diagnosis: 'Essential Stage 1 Hypertension',
    meds: [
      { name: 'Tab. Amlodipine 5mg', frequency: '1-0-0', duration: '30 Days', timing: 'Morning After Food' },
    ],
    tests: ['12-Lead ECG', 'Lipid Profile Full'],
    advice: 'Strict low salt diet (< 5g/day). 30 mins morning walking daily. Avoid pickles and salty snacks.',
  },
  {
    id: 'diabetes',
    label: '🩸 Sugar / Diabetes',
    diagnosis: 'Type 2 Diabetes Mellitus - Routine Review',
    meds: [
      { name: 'Tab. Metformin 500mg SR', frequency: '1-0-1', duration: '30 Days', timing: 'With Meals' },
    ],
    tests: ['Blood Sugar (FBS)', 'HbA1c (3-Month Sugar)'],
    advice: 'Strict diabetic diet. Avoid sugar, sweets, potatoes, white bread. Small frequent meals.',
  },
  {
    id: 'joint',
    label: '🦴 Knee / Joint Pain',
    diagnosis: 'Bilateral Knee Joint Pain / Osteoarthritis',
    meds: [
      { name: 'Tab. Paracetamol 650mg', frequency: '1-0-1', duration: '5 Days', timing: 'After Food (SOS on pain)' },
      { name: 'Tab. Calcium + Vitamin D3', frequency: '0-1-0', duration: '30 Days', timing: 'After Lunch' },
    ],
    tests: ['X-Ray Knee (Standing)'],
    advice: 'Avoid sitting on the floor or squatting. Gentle quadriceps knee exercises daily.',
  },
  {
    id: 'vomit',
    label: '🤢 Gastroenteritis / ORS',
    diagnosis: 'Acute Gastroenteritis with Mild Dehydration',
    meds: [
      { name: 'Electrolyte ORS Sachet', frequency: 'SOS', duration: '2 Days', timing: 'Mix in 1L clean water' },
      { name: 'Tab. Pantoprazole 40mg', frequency: '1-0-0', duration: '5 Days', timing: 'Before Breakfast' },
    ],
    tests: [],
    advice: 'Drink ORS fluid frequently. Eat light khichdi/curd rice. Avoid outside food.',
  },
];

// 1-Tap Quick Medicine Chips
const QUICK_MEDS_LIST = [
  { name: 'Tab. Paracetamol 650mg', frequency: '1-0-1', duration: '3 Days', timing: 'After Food' },
  { name: 'Tab. Pantoprazole 40mg', frequency: '1-0-0', duration: '7 Days', timing: 'Before Breakfast' },
  { name: 'Tab. Cetirizine 10mg', frequency: '0-0-1', duration: '5 Days', timing: 'At Bedtime' },
  { name: 'Tab. Azithromycin 500mg', frequency: '1-0-0', duration: '3 Days', timing: '1 Hr Before Food' },
  { name: 'Tab. Amlodipine 5mg', frequency: '1-0-0', duration: '30 Days', timing: 'Morning' },
  { name: 'Tab. Metformin 500mg SR', frequency: '1-0-1', duration: '30 Days', timing: 'With Meals' },
  { name: 'Electrolyte ORS Sachet', frequency: 'SOS', duration: '2 Days', timing: 'In 1L Water' },
];

// Audio Chime & Speech Synthesis Announcer
const playHospitalChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.3);
    gain2.gain.setValueAtTime(0.25, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.3);
    osc2.stop(now + 1.1);
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
};

const speakAnnouncement = (tokenNumber: string, patientName: string, room: string = 'Room 4') => {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const text = `Token number ${tokenNumber}, ${patientName}, please proceed to Doctor ${room}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
};

export const PatientClinicalWorkspace: React.FC = () => {
  const { id: routePatientId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const referralIdFromUrl = searchParams.get('referralId');

  // VIEW MODE: 'DESK' (Active Consultation Desk) vs 'QUEUE' (Full Live Queue Table)
  const [viewMode, setViewMode] = useState<'DESK' | 'QUEUE'>('DESK');

  // Queue Tokens state
  const [queueTokens, setQueueTokens] = useState<Token[]>(() => {
    const defaultTokens = [
      {
        id: 'tok_034',
        tokenNumber: 'A-034',
        patientId: 'usr_pat_94',
        patientName: 'Rameshbhai Dave',
        patientAge: 45,
        patientGender: 'M',
        patientPhone: '9825000011',
        facilityId: 'fac_civil_01',
        facilityName: 'Gandhinagar Civil Hospital',
        departmentId: 'dep_med',
        departmentName: 'General Medicine OPD',
        status: 'COMPLETED',
        priority: 'ROUTINE',
        positionInQueue: 0,
        estimatedWaitMinutes: 0,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      ...INITIAL_LIVE_QUEUE.tokens,
    ];
    return defaultTokens as Token[];
  });

  const [queueFilter, setQueueFilter] = useState<'ALL' | 'WAITING' | 'CALLED' | 'HOLD' | 'COMPLETED'>('ALL');
  const [queueSearch, setQueueSearch] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState<string | null>(null);

  // Active Token selection
  const activeToken =
    queueTokens.find((t) => t.patientId === routePatientId || t.id === routePatientId) ||
    queueTokens.find((t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION') ||
    queueTokens[1] ||
    queueTokens[0];

  // Lookup profile or build fallback
  const profile = useMemo(() => {
    if (PATIENT_PROFILES[activeToken.patientId]) {
      return PATIENT_PROFILES[activeToken.patientId];
    }
    const cleanId = (activeToken.patientId || '1001').replace(/\D/g, '') || '1001';
    return {
      id: activeToken.patientId,
      tokenNumber: activeToken.tokenNumber,
      name: activeToken.patientName,
      age: activeToken.patientAge,
      gender: activeToken.patientGender === 'M' ? 'Male' : 'Female',
      phone: activeToken.patientPhone,
      bloodGroup: 'B+',
      abhaId: `14-${cleanId.padStart(4, '0')}-4412-1001`,
      bp: '120/80',
      pulse: 72,
      sugar: 120,
      spo2: 98,
      weight: '65 kg',
      allergies: ['None reported'],
      chiefComplaint: 'General OPD Consultation & Health Checkup',
      defaultDiagnosis: 'General Medical Review',
      priority: activeToken.priority || 'ROUTINE',
      meds: [
        { id: 'm1', name: 'Tab. Paracetamol 650mg', frequency: '1-0-1', duration: '3 Days', timing: 'After Food' },
        { id: 'm2', name: 'Tab. Pantoprazole 40mg', frequency: '1-0-0', duration: '5 Days', timing: 'Before Breakfast' },
      ],
      tests: ['Complete Blood Count (CBC)'],
      advice: 'Take medicines as directed. Drink plenty of water and rest well.',
    };
  }, [
    activeToken.patientId,
    activeToken.patientName,
    activeToken.patientAge,
    activeToken.patientGender,
    activeToken.patientPhone,
    activeToken.tokenNumber,
    activeToken.priority,
  ]);

  const patient = {
    ...INITIAL_HEALTH_RECORD,
    ...profile,
    patientId: activeToken.patientId,
    name: activeToken.patientName,
    age: activeToken.patientAge,
    gender: activeToken.patientGender === 'M' ? 'Male' : 'Female',
    phone: activeToken.patientPhone,
    tokenNumber: activeToken.tokenNumber,
  };

  // Referral info
  const [activeReferral, setActiveReferral] = useState<Referral | null>(null);
  useEffect(() => {
    referralApi.getAll().then((res) => {
      if (res.data) {
        const found = referralIdFromUrl
          ? res.data.find((r) => r.id === referralIdFromUrl)
          : res.data.find(
              (r) =>
                (r.patientId === patient.patientId ||
                  r.patientName.toLowerCase() === patient.name.toLowerCase()) &&
                ['ACCEPTED', 'APPOINTMENT_CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'].includes(r.status)
            );
        if (found) setActiveReferral(found);
      }
    }).catch(() => {});
  }, [patient.patientId, patient.name, referralIdFromUrl]);

  // Consultation Clinical States
  const [diagnosis, setDiagnosis] = useState(profile.defaultDiagnosis);
  const [meds, setMeds] = useState<MedicineItem[]>(profile.meds || []);
  const [selectedTests, setSelectedTests] = useState<string[]>(profile.tests || ['12-Lead ECG']);
  const [adviceText, setAdviceText] = useState(profile.advice || 'Take prescribed medications regularly.');
  const [followUpDays, setFollowUpDays] = useState<number>(7);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [rxNumber, setRxNumber] = useState(() => `RX-2026-0311-${Math.floor(1000 + Math.random() * 9000)}`);
  const [quickMedInput, setQuickMedInput] = useState('');

  // Modals for doctor actions
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Sync state on patient switch
  useEffect(() => {
    setDiagnosis(profile.defaultDiagnosis);
    setMeds(profile.meds || []);
    setSelectedTests(profile.tests || []);
    setAdviceText(profile.advice || 'Take prescribed medications regularly.');
    setIsCompleted(activeToken.status === 'COMPLETED');
    setRxNumber(`RX-2026-0311-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [activeToken.patientId, profile]);

  // Voice speech recognition
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('Listening... Speak diagnosis or medicines (e.g. "Paracetamol 650 for 3 days")');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setVoiceFeedback(`Heard: "${transcript}"`);
          parseSpokenVoice(transcript);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Voice recognition error:', e);
        setIsListening(false);
        setVoiceFeedback('Mic stopped. Tap mic to speak again.');
        setTimeout(() => setVoiceFeedback(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setVoiceFeedback(null), 5000);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is supported in Google Chrome, Microsoft Edge, and modern browsers.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech recognition start failed:', err);
      }
    }
  };

  const parseSpokenVoice = (spokenText: string) => {
    const lower = spokenText.toLowerCase();
    const newlyAddedMeds: MedicineItem[] = [];

    if (lower.includes('paracetamol') || lower.includes('dolo') || lower.includes('crocin') || lower.includes('fever') || lower.includes('bukhar') || lower.includes('tav')) {
      if (!meds.some(m => m.name.toLowerCase().includes('paracetamol'))) {
        newlyAddedMeds.push({
          id: `med_${Date.now()}_pcm`,
          name: 'Tab. Paracetamol 650mg',
          frequency: '1-0-1',
          duration: '3 Days',
          timing: 'After Food (Morning & Night)',
        });
      }
      if (!diagnosis) setDiagnosis('Acute Viral Fever & Cold');
    }

    if (lower.includes('pantoprazole') || lower.includes('pantocid') || lower.includes('acidity') || lower.includes('gas') || lower.includes('pan 40')) {
      if (!meds.some(m => m.name.toLowerCase().includes('pantoprazole'))) {
        newlyAddedMeds.push({
          id: `med_${Date.now()}_panto`,
          name: 'Tab. Pantoprazole 40mg',
          frequency: '1-0-0',
          duration: '7 Days',
          timing: 'Before Breakfast',
        });
      }
    }

    if (lower.includes('cetirizine') || lower.includes('cold') || lower.includes('cough') || lower.includes('sardi') || lower.includes('khansi')) {
      if (!meds.some(m => m.name.toLowerCase().includes('cetirizine'))) {
        newlyAddedMeds.push({
          id: `med_${Date.now()}_cet`,
          name: 'Tab. Cetirizine 10mg',
          frequency: '0-0-1',
          duration: '5 Days',
          timing: 'At Bedtime',
        });
      }
    }

    if (lower.includes('azithromycin') || lower.includes('azithro') || lower.includes('antibiotic')) {
      if (!meds.some(m => m.name.toLowerCase().includes('azithromycin'))) {
        newlyAddedMeds.push({
          id: `med_${Date.now()}_az`,
          name: 'Tab. Azithromycin 500mg',
          frequency: '1-0-0',
          duration: '3 Days',
          timing: '1 Hr Before Food',
        });
      }
    }

    if (lower.includes('amlodipine') || lower.includes('bp') || lower.includes('pressure') || lower.includes('hypertension')) {
      if (!meds.some(m => m.name.toLowerCase().includes('amlodipine'))) {
        newlyAddedMeds.push({
          id: `med_${Date.now()}_amlo`,
          name: 'Tab. Amlodipine 5mg',
          frequency: '1-0-0',
          duration: '30 Days',
          timing: 'Morning After Food',
        });
      }
      setDiagnosis('Essential Stage 1 Hypertension');
    }

    if (lower.includes('metformin') || lower.includes('sugar') || lower.includes('diabetes')) {
      if (!meds.some(m => m.name.toLowerCase().includes('metformin'))) {
        newlyAddedMeds.push({
          id: `med_${Date.now()}_met`,
          name: 'Tab. Metformin 500mg SR',
          frequency: '1-0-1',
          duration: '30 Days',
          timing: 'With Meals',
        });
      }
      setDiagnosis('Type 2 Diabetes Mellitus');
    }

    if (lower.includes('ecg') || lower.includes('heart')) {
      if (!selectedTests.includes('12-Lead ECG')) setSelectedTests(prev => [...prev, '12-Lead ECG']);
    }
    if (lower.includes('blood test') || lower.includes('cbc') || lower.includes('blood')) {
      if (!selectedTests.includes('Complete Blood Count (CBC)')) setSelectedTests(prev => [...prev, 'Complete Blood Count (CBC)']);
    }
    if (lower.includes('x-ray') || lower.includes('xray')) {
      if (!selectedTests.includes('Chest X-Ray (PA View)')) setSelectedTests(prev => [...prev, 'Chest X-Ray (PA View)']);
    }

    if (newlyAddedMeds.length > 0) {
      setMeds(prev => [...prev, ...newlyAddedMeds]);
      setVoiceFeedback(`✓ Voice added: ${newlyAddedMeds.map(m => m.name).join(', ')}`);
    }
  };

  const handleApplyPreset = (preset: typeof QUICK_CLINICAL_PRESETS[0]) => {
    setDiagnosis(preset.diagnosis);
    const newItems: MedicineItem[] = preset.meds.map((m, idx) => ({
      id: `med_${preset.id}_${idx}_${Date.now()}`,
      ...m,
    }));
    setMeds(newItems);
    setSelectedTests(preset.tests);
    setAdviceText(preset.advice);
    setVoiceFeedback(`✓ Loaded Protocol: ${preset.label}`);
    setTimeout(() => setVoiceFeedback(null), 3500);
  };

  const handleAddSingleMed = (med: typeof QUICK_MEDS_LIST[0]) => {
    if (meds.some(m => m.name.toLowerCase() === med.name.toLowerCase())) return;
    setMeds([
      ...meds,
      {
        id: `med_${Date.now()}`,
        ...med,
      },
    ]);
  };

  const handleAddCustomMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMedInput.trim()) return;
    setMeds([
      ...meds,
      {
        id: `med_${Date.now()}`,
        name: quickMedInput.trim(),
        frequency: '1-0-1',
        duration: '5 Days',
        timing: 'After Food',
      },
    ]);
    setQuickMedInput('');
  };

  const handleRemoveMed = (id: string) => {
    setMeds(meds.filter(m => m.id !== id));
  };

  const toggleTest = (test: string) => {
    setSelectedTests(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    );
  };

  // Allergy Check
  const hasPenicillinAllergy = patient.allergies?.some((a: string) => a.toLowerCase().includes('penicillin'));
  const allergyConflictMeds = meds.filter(m => {
    const l = m.name.toLowerCase();
    return hasPenicillinAllergy && (l.includes('penicillin') || l.includes('amoxicillin') || l.includes('ampicillin'));
  });

  // Doctor Queue Actions
  const handleCallPatient = (targetToken: Token) => {
    playHospitalChime();
    speakAnnouncement(targetToken.tokenNumber, targetToken.patientName, 'Room 4');
    setAnnouncementMsg(`📢 Calling Token #${targetToken.tokenNumber} (${targetToken.patientName}) to Room 4`);
    setTimeout(() => setAnnouncementMsg(null), 5000);

    setQueueTokens((prev) =>
      prev.map((t) => {
        if (t.id === targetToken.id) {
          return { ...t, status: 'CALLED', calledAt: new Date().toISOString() };
        }
        if (t.status === 'CALLED' && t.id !== targetToken.id) {
          return { ...t, status: 'WAITING' };
        }
        return t;
      })
    );

    if (targetToken.patientId !== activeToken.patientId) {
      navigate(`/doctor/patients/${targetToken.patientId}`);
    }
  };

  const handleStartConsultation = (targetToken: Token) => {
    handleCallPatient(targetToken);
    setViewMode('DESK');
  };

  const handlePutOnHold = (tokenId: string) => {
    setQueueTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, status: 'HOLD' } : t))
    );
    showToast(`Token #${activeToken.tokenNumber} put on Hold (Awaiting Lab / Diagnostics).`);
  };

  const handleSkipOrNoShow = (tokenId: string, reason: 'SKIPPED' | 'NO_SHOW') => {
    setQueueTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, status: reason } : t))
    );
    showToast(`Token #${activeToken.tokenNumber} marked as ${reason === 'SKIPPED' ? 'Skipped' : 'Absent / No-Show'}.`);
    const nextWaiting = queueTokens.find((t) => t.id !== tokenId && t.status === 'WAITING');
    if (nextWaiting) {
      handleCallPatient(nextWaiting);
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  // Next Token in Queue
  const currentIndex = queueTokens.findIndex(t => t.id === activeToken.id || t.patientId === activeToken.patientId);
  const nextWaitingToken = queueTokens.find((t, idx) => idx > currentIndex && (t.status === 'WAITING' || t.status === 'HOLD')) ||
    queueTokens.find((t) => t.id !== activeToken.id && t.status === 'WAITING');

  const handleNext = () => {
    setIsCompleted(false);
    setShowRxModal(false);
    if (nextWaitingToken) {
      handleCallPatient(nextWaitingToken);
    } else {
      showToast('All queued patients completed!');
    }
  };

  // Complete Consultation & Issue Prescription
  const handleComplete = async () => {
    try {
      const rxItems = meds.map((m, idx) => ({
        id: `rx_item_${Date.now()}_${idx}`,
        medicineName: m.name,
        genericName: m.name,
        dosage: '1 Tablet',
        frequency: m.frequency,
        duration: m.duration,
        route: 'Oral',
        instructions: m.timing,
        dispensedStatus: 'PENDING' as const,
        dispensedQuantity: 0,
        totalQuantity: 10,
      }));

      setQueueTokens((prev) =>
        prev.map((t) => (t.id === activeToken.id ? { ...t, status: 'COMPLETED' } : t))
      );

      await clinicalApi.createPrescription({
        id: rxNumber,
        encounterId: `enc_${Date.now()}`,
        patientId: patient.patientId,
        patientName: patient.name,
        doctorId: user?.id || 'usr_doc_01',
        doctorName: user?.name || 'Dr. Arvind Patel',
        facilityId: user?.facilityId || 'fac_civil_01',
        facilityName: user?.facilityName || 'Gandhinagar Civil Hospital',
        issuedAt: new Date().toISOString(),
        diagnosisSummary: diagnosis,
        items: rxItems as any,
        status: 'PENDING',
      });

      await clinicalApi.createEncounter({
        id: `enc_${Date.now()}`,
        patientId: patient.patientId,
        patientName: patient.name,
        doctorId: user?.id || 'usr_doc_01',
        doctorName: user?.name || 'Dr. Arvind Patel',
        facilityId: user?.facilityId || 'fac_civil_01',
        facilityName: user?.facilityName || 'Gandhinagar Civil Hospital',
        chiefComplaint: diagnosis,
        clinicalNotes: adviceText,
        type: 'OPD',
        status: 'COMPLETED',
        prescriptions: rxItems as any,
      });
    } catch (err) {
      console.warn('Backend encounter/prescription creation warning:', err);
    }

    if (activeReferral) {
      referralApi.recordOutcome(
        activeReferral.id,
        `Diagnosis: ${diagnosis}. Rx: ${meds.map(m => m.name).join(', ')}`,
        user?.name || 'Dr. Arvind Patel',
        user?.specialty || 'MD Internal Medicine'
      ).catch(() => {});
    }

    setIsCompleted(true);
    setShowRxModal(true);
    showToast(`Prescription #${rxNumber} generated & synced to Hospital Pharmacy!`);
  };

  const getFollowUpDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + followUpDays);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Filtered tokens for table view
  const filteredTokens = queueTokens.filter((t) => {
    if (queueFilter === 'WAITING') return t.status === 'WAITING';
    if (queueFilter === 'CALLED') return t.status === 'CALLED' || t.status === 'IN_CONSULTATION';
    if (queueFilter === 'HOLD') return t.status === 'HOLD';
    if (queueFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  }).filter((t) => {
    if (!queueSearch) return true;
    const q = queueSearch.toLowerCase();
    const prof = PATIENT_PROFILES[t.patientId];
    return (
      t.tokenNumber.toLowerCase().includes(q) ||
      t.patientName.toLowerCase().includes(q) ||
      t.patientPhone.includes(q) ||
      (prof?.chiefComplaint && prof.chiefComplaint.toLowerCase().includes(q)) ||
      (prof?.defaultDiagnosis && prof.defaultDiagnosis.toLowerCase().includes(q))
    );
  });

  const waitingCount = queueTokens.filter((t) => t.status === 'WAITING').length;
  const inRoomCount = queueTokens.filter((t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION').length;
  const holdCount = queueTokens.filter((t) => t.status === 'HOLD').length;
  const completedCount = queueTokens.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20 font-sans">
      {/* ================================================== */}
      {/* 1. TOP HOSPITAL-GRADE OPD CHAMBER HEADER & VIEW TABS */}
      {/* ================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900">OPD Chamber 4 • Dr. Arvind Patel</h1>
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Queue Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Cardiology & General OPD • Gandhinagar Civil Hospital
              </p>
            </div>
          </div>

          {/* Action Tools & Walk-in */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleCallPatient(activeToken)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Play hospital bell chime and voice announce token"
            >
              <BellRing className="h-4 w-4 animate-bounce" />
              <span>Announce #{activeToken.tokenNumber}</span>
            </button>

            {nextWaitingToken && (
              <button
                type="button"
                onClick={() => handleCallPatient(nextWaitingToken)}
                className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <span>Call Next ({nextWaitingToken.tokenNumber})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Emergency Walk-In</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE VIEW MODE SWITCHER TABS */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('QUEUE')}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'QUEUE'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
              }`}
            >
              <ListOrdered className="h-4 w-4" />
              <span>📋 OPD Patient Queue Table ({queueTokens.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('DESK')}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'DESK'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/70'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              <span>🩺 Treatment Desk ({patient.tokenNumber} • {patient.name.split(' ')[0]})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              <strong className="text-teal-700">{waitingCount}</strong> Waiting
            </span>
            <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              <strong className="text-blue-700">{inRoomCount}</strong> In Room
            </span>
            <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              <strong className="text-amber-700">{holdCount}</strong> On Hold
            </span>
            <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
              <strong className="text-emerald-700">{completedCount}</strong> Done
            </span>
          </div>
        </div>
      </div>

      {/* Audio Announcement Alert Banner */}
      {announcementMsg && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between gap-2 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 animate-bounce shrink-0" />
            <span>{announcementMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setAnnouncementMsg(null)}
            className="text-slate-900 hover:text-black p-0.5 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success Toast */}
      {actionSuccessToast && (
        <div className="bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black flex items-center justify-between gap-2 shadow-md animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-200 shrink-0" />
            <span>{actionSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessToast(null)}
            className="text-emerald-100 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. TAB A: FULL OPD LIVE QUEUE TABLE VIEW */}
      {/* ================================================== */}
      {viewMode === 'QUEUE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
          {/* Controls Bar: Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
              {(['ALL', 'WAITING', 'CALLED', 'HOLD', 'COMPLETED'] as const).map((filter) => {
                const count =
                  filter === 'ALL'
                    ? queueTokens.length
                    : filter === 'WAITING'
                    ? waitingCount
                    : filter === 'CALLED'
                    ? inRoomCount
                    : filter === 'HOLD'
                    ? holdCount
                    : completedCount;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setQueueFilter(filter)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      queueFilter === filter
                        ? 'bg-white text-teal-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by token #, patient name, phone, symptoms..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>
          </div>

          {/* OPD QUEUE DATA TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-black uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Token #</th>
                  <th className="py-3 px-3.5">Patient Details</th>
                  <th className="py-3 px-3.5">Chief Symptoms / Reason</th>
                  <th className="py-3 px-3.5">Key Vitals</th>
                  <th className="py-3 px-3.5">Priority</th>
                  <th className="py-3 px-3.5">Queue Status</th>
                  <th className="py-3 px-3.5">Wait Time</th>
                  <th className="py-3 px-3.5 text-right">Doctor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 italic text-xs">
                      No patients match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((t) => {
                    const prof = PATIENT_PROFILES[t.patientId];
                    const isCurrent = t.id === activeToken.id || t.patientId === activeToken.patientId;
                    const isDone = t.status === 'COMPLETED';
                    const isHold = t.status === 'HOLD';
                    const isInside = t.status === 'CALLED' || t.status === 'IN_CONSULTATION';

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-teal-50/70 font-semibold'
                            : isDone
                            ? 'bg-slate-50/50 text-slate-500'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Token # */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg inline-block ${
                              isCurrent
                                ? 'bg-teal-700 text-white shadow-2xs'
                                : isInside
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : isHold
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : isDone
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {t.tokenNumber}
                          </span>
                        </td>

                        {/* Patient Name & Details */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 text-xs">
                            {t.patientName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <span>{t.patientAge}Y / {t.patientGender}</span>
                            <span>• Phone: +91 {t.patientPhone}</span>
                          </div>
                          {prof?.abhaId && (
                            <span className="text-[10px] text-emerald-700 font-mono font-medium block">
                              ABHA: {prof.abhaId}
                            </span>
                          )}
                        </td>

                        {/* Symptoms */}
                        <td className="py-3 px-3.5 max-w-[200px]">
                          <p className="text-slate-800 font-medium text-xs line-clamp-2">
                            {prof?.chiefComplaint || 'Routine Medical Checkup & Follow-up'}
                          </p>
                        </td>

                        {/* Vitals */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="text-[11px] text-slate-700 space-y-0.5">
                            <div>BP: <strong>{prof?.bp || '120/80'}</strong></div>
                            <div>Pulse: <strong>{prof?.pulse || '72'} bpm</strong></div>
                            <div>Sugar: <strong>{prof?.sugar || '110'} mg/dL</strong></div>
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          {t.priority === 'EMERGENCY' ? (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-black">
                              🚨 Emergency
                            </span>
                          ) : (t.priority as string) === 'PRIORITY' || t.priority === 'URGENT' ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Priority
                            </span>
                          ) : prof?.priority === 'SENIOR' ? (
                            <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              Senior (60+)
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                              Routine
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              isInside
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : isHold
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isDone
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>

                        {/* Wait Time */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 font-semibold">
                          {isInside ? 'In Chamber' : isDone ? 'Consulted' : `${t.estimatedWaitMinutes ?? 5} mins`}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Start / Open Desk */}
                            <button
                              type="button"
                              onClick={() => handleStartConsultation(t)}
                              className="flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
                              title="Open clinical treatment desk for this patient"
                            >
                              <Stethoscope className="h-3.5 w-3.5" />
                              <span>{isDone ? 'View Rx' : 'Examine'}</span>
                            </button>

                            {/* Audio Announce */}
                            <button
                              type="button"
                              onClick={() => handleCallPatient(t)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl cursor-pointer transition-colors"
                              title="Announce token on hospital bell speaker"
                            >
                              <BellRing className="h-3.5 w-3.5" />
                            </button>

                            {/* Put on Hold */}
                            {t.status === 'WAITING' && (
                              <button
                                type="button"
                                onClick={() => handlePutOnHold(t.id)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
                                title="Put patient on Hold (Awaiting Lab/ECG)"
                              >
                                <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                              </button>
                            )}

                            {/* Skip / No-Show */}
                            {t.status === 'WAITING' && (
                              <button
                                type="button"
                                onClick={() => handleSkipOrNoShow(t.id, 'SKIPPED')}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl cursor-pointer transition-colors"
                                title="Mark Absent / Skip"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 3. TAB B: ACTIVE PATIENT TREATMENT & CONSULTATION DESK */}
      {/* ================================================== */}
      {viewMode === 'DESK' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Active Patient Identity Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Patient Identity */}
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="flex flex-col items-center justify-center min-w-[4.2rem] h-14 bg-teal-700 text-white rounded-2xl shadow-xs shrink-0 border border-teal-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-200 leading-none">Token</span>
                  <span className="font-mono font-black text-lg leading-tight">{patient.tokenNumber}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-slate-900">{patient.name}</h2>
                    <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                      {patient.age} Yrs • {patient.gender}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      ABHA: {patient.abhaId}
                    </span>
                    {patient.priority === 'PRIORITY' && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                        Priority Case
                      </span>
                    )}
                    {patient.priority === 'SENIOR' && (
                      <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-300">
                        Senior Citizen (60+)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-mono text-slate-600 font-medium">
                      <Phone className="h-3 w-3 text-slate-400" />
                      +91 {patient.phone}
                    </span>
                    <span>• Blood Group: <strong className="text-slate-700">{patient.bloodGroup}</strong></span>
                    {patient.chiefComplaint && (
                      <span className="text-slate-700 font-medium bg-amber-50/80 text-amber-900 border border-amber-200/60 px-2 py-0.5 rounded-md">
                        Complaint: {patient.chiefComplaint}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vitals Summary Strip */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <Heart className="h-4 w-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">BP</span>
                    <span className="font-black text-slate-800">{patient.bp || '128/82'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-2xs">
                  <Activity className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">Pulse</span>
                    <span className="font-black text-slate-800">{patient.pulse || '74'} <span className="text-[10px] font-normal text-slate-500">bpm</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-amber-50/60 px-3 py-2 rounded-xl border border-amber-200 text-xs shadow-2xs">
                  <Droplets className="h-4 w-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="text-[10px] text-amber-600 uppercase font-bold block leading-none">Sugar</span>
                    <span className="font-black text-amber-900">{patient.sugar || '148'} <span className="text-[10px] font-normal text-amber-700">mg/dL</span></span>
                  </div>
                </div>

                {hasPenicillinAllergy && (
                  <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-2 rounded-xl border border-rose-300 text-xs font-bold text-rose-800 shadow-2xs">
                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-rose-600 uppercase font-bold block leading-none">Allergy</span>
                      <span>Penicillin!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Clinical Actions Command Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <History className="h-3.5 w-3.5 text-purple-700" />
                  <span>Full Medical History & Records</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLabOrderModal(true)}
                  className="flex items-center gap-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <TestTube className="h-3.5 w-3.5 text-cyan-700" />
                  <span>Order Diagnostics / Lab ({selectedTests.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReferralModal(true)}
                  className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Ambulance className="h-3.5 w-3.5 text-indigo-700" />
                  <span>Refer Patient to Specialist</span>
                </button>

                <Link
                  to={`/doctor/teleconsultations`}
                  className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Video className="h-3.5 w-3.5 text-sky-700" />
                  <span>Tele-Consult Specialist</span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePutOnHold(activeToken.id)}
                  className="flex items-center gap-1 text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Hold token while patient goes to lab"
                >
                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Put on Hold</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSkipOrNoShow(activeToken.id, 'SKIPPED')}
                  className="flex items-center gap-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Mark absent or skip"
                >
                  <UserX className="h-3.5 w-3.5 text-rose-500" />
                  <span>Skip / Absent</span>
                </button>
              </div>
            </div>
          </div>

          {/* Voice Dictation & Quick Protocols */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <h3 className="text-sm sm:text-base font-black">
                    Fast Doctor Voice & 1-Tap Protocol Desk
                  </h3>
                </div>
                <p className="text-xs text-teal-100">
                  Speak diagnosis & medicines or tap any protocol below to populate complete Rx in 5 seconds.
                </p>
              </div>

              <button
                type="button"
                onClick={toggleVoice}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-300'
                    : 'bg-white text-teal-900 hover:bg-teal-50 hover:scale-102 active:scale-98'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-5 w-5 animate-spin" />
                    <span>Listening... (Click to Stop)</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 text-teal-700" />
                    <span>🎙️ Speak Prescription</span>
                  </>
                )}
              </button>
            </div>

            {voiceFeedback && (
              <div className="bg-black/30 backdrop-blur-xs px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in fade-in duration-200">
                <Volume2 className="h-4 w-4 text-amber-300 shrink-0" />
                <span className="text-white">{voiceFeedback}</span>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-teal-100 block">
                1-Click Popular Clinical Protocols:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {QUICK_CLINICAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="bg-white/10 hover:bg-white/25 active:scale-95 border border-white/20 rounded-xl p-2 text-left transition-all cursor-pointer backdrop-blur-xs text-white"
                  >
                    <p className="text-xs font-black truncate">{preset.label}</p>
                    <span className="text-[10px] text-teal-100 opacity-90 block mt-0.5 truncate">
                      {preset.meds.length} Meds + Advice
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Allergy Conflict Warning */}
          {allergyConflictMeds.length > 0 && (
            <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-3.5 flex items-center justify-between gap-3 text-rose-900 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-xs font-bold">
                  Allergy Warning: <strong>{allergyConflictMeds.map(m => m.name).join(', ')}</strong> conflicts with patient's Penicillin allergy!
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => allergyConflictMeds.forEach(m => handleRemoveMed(m.id))}
                className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shrink-0 cursor-pointer h-7 px-3 rounded-xl"
              >
                Remove Drug
              </Button>
            </div>
          )}

          {/* Prescription & Clinical Input */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                <span>Diagnosis & Clinical Impression:</span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Type diagnosis (e.g. Viral URTI, Hypertension Stage 1, Type 2 DM...)"
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-bold text-slate-900 bg-slate-50/60"
              />
            </div>

            {/* Medicines List */}
            <div className="space-y-2.5 border-t border-slate-100 pt-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-teal-700" />
                  <span>Medicines Prescribed ({meds.length}):</span>
                </label>
                <span className="text-[11px] text-slate-400">1-Tap to add extra meds:</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {QUICK_MEDS_LIST.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSingleMed(m)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50/80 hover:bg-teal-100 text-teal-900 border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="h-3 w-3 text-teal-600" />
                    <span>{m.name.split(' ')[1]}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-1">
                {meds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No medicines added yet. Speak with mic or select any protocol above.
                  </p>
                ) : (
                  meds.map((m, idx) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-800 text-xs font-mono font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 truncate">{m.name}</span>
                        <span className="text-xs bg-teal-100 text-teal-900 font-mono font-black px-2.5 py-0.5 rounded-md shrink-0">
                          {m.frequency}
                        </span>
                        <span className="text-xs text-slate-600 font-medium hidden sm:inline shrink-0">
                          • {m.duration} ({m.timing})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMed(m.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddCustomMedicine} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Or type medicine name & press Add..."
                  value={quickMedInput}
                  onChange={(e) => setQuickMedInput(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                >
                  + Add
                </Button>
              </form>
            </div>

            {/* Tests & Advice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3.5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 block">
                    Diagnostic Tests Ordered ({selectedTests.length}):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLabOrderModal(true)}
                    className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    + More Tests
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '12-Lead ECG',
                    'Blood Sugar (FBS)',
                    'Complete Blood Count (CBC)',
                    'Lipid Profile Full',
                    'Chest X-Ray (PA View)',
                  ].map((test) => {
                    const isSel = selectedTests.includes(test);
                    return (
                      <button
                        key={test}
                        type="button"
                        onClick={() => toggleTest(test)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                          isSel
                            ? 'bg-teal-700 text-white border-teal-700 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSel ? '✓ ' : '+ '}
                        {test}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    Care Advice & Diet:
                  </label>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                    <span>Follow-Up:</span>
                    <select
                      value={followUpDays}
                      onChange={(e) => setFollowUpDays(Number(e.target.value))}
                      className="bg-slate-100 p-1 rounded-lg border border-slate-200 font-bold"
                    >
                      <option value={3}>3 Days</option>
                      <option value={7}>1 Week</option>
                      <option value={14}>2 Weeks</option>
                      <option value={30}>1 Month</option>
                    </select>
                  </div>
                </div>
                <input
                  type="text"
                  value={adviceText}
                  onChange={(e) => setAdviceText(e.target.value)}
                  placeholder="e.g. Low salt diet, drink warm water, avoid heavy lifting..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Actions CTA */}
            <div className="border-t border-slate-100 pt-3.5">
              {isCompleted ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50 border border-emerald-300 p-4 rounded-2xl">
                  <div className="flex items-center gap-2.5 text-emerald-900">
                    <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0" />
                    <div>
                      <span className="text-sm font-black block">Prescription #{rxNumber} Generated & Issued!</span>
                      <span className="text-xs text-emerald-700 font-medium">Dispatched to Jan Aushadhi Pharmacy & Patient Health Locker</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowRxModal(true)}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-white text-emerald-900 border-emerald-300 font-bold gap-1 cursor-pointer h-9 px-3 rounded-xl"
                    >
                      <Printer className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Print Slip</span>
                    </Button>
                    {nextWaitingToken ? (
                      <Button
                        onClick={handleNext}
                        variant="primary"
                        size="sm"
                        className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-black gap-1 cursor-pointer shadow-md h-9 px-4 rounded-xl"
                      >
                        <span>Next: {nextWaitingToken.tokenNumber} ({nextWaitingToken.patientName}) ➔</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setViewMode('QUEUE')}
                        variant="primary"
                        size="sm"
                        className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold gap-1 cursor-pointer h-9 px-3 rounded-xl"
                      >
                        <span>Back to Queue Table</span>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Button
                    onClick={handleComplete}
                    variant="primary"
                    size="lg"
                    className="flex-1 bg-teal-700 hover:bg-teal-800 text-white text-sm font-black h-12 rounded-xl shadow-md gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Save & Issue Prescription Slip (1-Click)</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowReferralModal(true)}
                    variant="outline"
                    size="lg"
                    className="h-12 px-4 rounded-xl border-indigo-300 text-indigo-900 bg-indigo-50 hover:bg-indigo-100 font-bold text-xs gap-1.5 cursor-pointer shrink-0"
                  >
                    <Ambulance className="h-4 w-4 text-indigo-700" />
                    <span>Refer Patient</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 4. MODAL: SPECIALIST REFERRAL */}
      {/* ================================================== */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Ambulance className="h-5 w-5 text-indigo-700" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Refer Patient to Tertiary / Specialist Care</h3>
                  <p className="text-[11px] text-slate-500">Gujarat E-Referral Network</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReferralModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 space-y-1">
                <p className="font-bold text-indigo-950">Patient: <strong>{patient.name}</strong> ({patient.age}Y/{patient.gender})</p>
                <p className="text-indigo-900">ABHA: {patient.abhaId} • Vitals: BP {patient.bp || '128/82'}, Pulse {patient.pulse || '74'}</p>
                <p className="text-indigo-900 font-medium">Diagnosis: {diagnosis}</p>
              </div>

              <div>
                <label className="font-black text-slate-800 block mb-1">Target Specialist Facility:</label>
                <select className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold">
                  <option>U.N. Mehta Institute of Cardiology & Research Centre, Ahmedabad</option>
                  <option>Civil Hospital Ahmedabad (Apex Tertiary Care)</option>
                  <option>Institute of Kidney Diseases and Research Centre (IKDRC)</option>
                  <option>Gujarat Cancer & Research Institute (GCRI)</option>
                  <option>PDU Medical College & Hospital, Rajkot</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-black text-slate-800 block mb-1">Specialty Department:</label>
                  <select className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold">
                    <option>Cardiology / Cath Lab</option>
                    <option>Cardiothoracic Surgery (CTVS)</option>
                    <option>Nephrology & Dialysis</option>
                    <option>Neurology / Stroke Unit</option>
                    <option>General Surgery</option>
                  </select>
                </div>
                <div>
                  <label className="font-black text-slate-800 block mb-1">Priority Level:</label>
                  <select className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold">
                    <option>Priority (Within 24-48 Hours)</option>
                    <option>Routine OPD Appointment</option>
                    <option>CRITICAL / Immediate 108 Ambulance Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-black text-slate-800 block mb-1">Clinical Findings & Reason:</label>
                <textarea
                  rows={3}
                  defaultValue={`Suspected ${diagnosis}. Vitals: BP ${patient.bp || '128/82'}, Pulse ${patient.pulse || '74'}. Patient has chest tightness on exertion. Please evaluate for coronary angiography / expert cardiology workup.`}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReferralModal(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowReferralModal(false);
                  showToast(`Referral token dispatched to U.N. Mehta Cardiology with 108 priority sync!`);
                }}
                className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold gap-1 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Referral</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 5. MODAL: DIAGNOSTIC LAB & RADIOLOGY ORDERING */}
      {/* ================================================== */}
      {showLabOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-cyan-700" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Hospital Central Pathology & Radiology Requisition</h3>
                  <p className="text-[11px] text-slate-500">Direct electronic dispatch to Civil Hospital Central Lab</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLabOrderModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-700">Select tests to order for <strong>{patient.name}</strong>:</p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  '12-Lead ECG',
                  'Lipid Profile Full',
                  'Complete Blood Count (CBC)',
                  'Blood Sugar (FBS)',
                  'Blood Sugar (PP2BS)',
                  'HbA1c (3-Month Sugar)',
                  'Liver Function Test (LFT)',
                  'Kidney Function Test (KFT / Creatinine)',
                  'Serum Electrolytes (Na+, K+)',
                  'Chest X-Ray (PA View)',
                  'Ultrasound (Abdomen & Pelvis)',
                  'Cardiac Troponin-I (High Sensitivity)',
                ].map((test) => {
                  const isSel = selectedTests.includes(test);
                  return (
                    <button
                      key={test}
                      type="button"
                      onClick={() => toggleTest(test)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold flex items-center justify-between ${
                        isSel
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-bold ring-1 ring-cyan-400'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{test}</span>
                      <span className={`text-xs ${isSel ? 'text-cyan-700 font-black' : 'text-slate-300'}`}>
                        {isSel ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Priority:</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="labPriority" defaultChecked className="accent-teal-700" />
                    <span>Routine (Collect today)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-700 font-bold">
                    <input type="radio" name="labPriority" className="accent-rose-700" />
                    <span>STAT / Urgent (Within 30 mins)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabOrderModal(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowLabOrderModal(false);
                  showToast(`${selectedTests.length} Diagnostic tests dispatched to Central Pathology!`);
                }}
                className="bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold gap-1 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Confirm Order ({selectedTests.length} Tests)</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 6. MODAL: FULL MEDICAL HISTORY DRAWER */}
      {/* ================================================== */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-700" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Comprehensive Health Records • {patient.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ABHA: {patient.abhaId} • Age: {patient.age}Y • Gender: {patient.gender}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-900 font-bold">
                <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                <span>Known Allergies: {patient.allergies?.join(', ') || 'No known allergies'}</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-purple-700" />
                  <span>Past Consultations & Encounters:</span>
                </h4>

                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Gandhinagar Civil Hospital • OPD Review</span>
                      <span className="text-[10px] text-slate-500 font-bold">14 Feb 2026</span>
                    </div>
                    <p className="text-slate-600">Diagnosis: Essential Hypertension, Mild Dyslipidemia. BP recorded: 134/86 mmHg.</p>
                    <p className="text-slate-500 font-mono">Prescribed: Tab. Amlodipine 5mg (1-0-0), Tab. Atorvastatin 10mg (0-0-1).</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">ASHA Village Screening Checkup (Kudasan Sub-centre)</span>
                      <span className="text-[10px] text-slate-500 font-bold">02 Jan 2026</span>
                    </div>
                    <p className="text-slate-600">NCD Community Screening. Random Blood Sugar: 154 mg/dL. BP: 130/84 mmHg.</p>
                    <p className="text-slate-500">Advised routine physician consultation for blood pressure titration.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-2.5">
                <h4 className="font-black text-slate-900 flex items-center gap-1.5">
                  <TestTube className="h-3.5 w-3.5 text-cyan-700" />
                  <span>Recent Diagnostic Lab Results:</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-cyan-50/50 rounded-xl border border-cyan-200">
                    <p className="font-bold text-slate-900">Lipid Profile (14 Feb 2026)</p>
                    <p className="text-slate-600 mt-0.5">Total Cholesterol: 218 mg/dL (High)</p>
                    <p className="text-slate-600">Triglycerides: 172 mg/dL</p>
                  </div>
                  <div className="p-2.5 bg-cyan-50/50 rounded-xl border border-cyan-200">
                    <p className="font-bold text-slate-900">CBC & Hemoglobin (14 Feb 2026)</p>
                    <p className="text-slate-600 mt-0.5">Hb: 13.8 g/dL (Normal)</p>
                    <p className="text-slate-600">Platelets: 240,000 /uL</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/doctor/patients/${patient.patientId || 'usr_pat_01'}/history`)}
                className="text-xs text-purple-900 border-purple-200 font-bold cursor-pointer"
              >
                <span>Open Full Page Records</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowHistoryModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Records
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 7. MODAL: ADD EMERGENCY WALK-IN TOKEN */}
      {/* ================================================== */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-rose-600" />
                <h3 className="text-sm font-black text-slate-900">Add Emergency Walk-In Patient</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const name = form.patientName.value || 'Walk-In Patient';
                const age = Number(form.patientAge.value) || 40;
                const gender = form.patientGender.value || 'M';
                const phone = form.patientPhone.value || '9800000000';
                const newTokenNum = `EM-${Math.floor(100 + Math.random() * 900)}`;

                const newTok: Token = {
                  id: `tok_${Date.now()}`,
                  tokenNumber: newTokenNum,
                  patientId: `usr_pat_${Date.now()}`,
                  patientName: name,
                  patientAge: age,
                  patientGender: gender,
                  patientPhone: phone,
                  facilityId: 'fac_civil_01',
                  facilityName: 'Gandhinagar Civil Hospital',
                  departmentId: 'dep_med',
                  departmentName: 'General Medicine OPD',
                  status: 'WAITING',
                  priority: 'EMERGENCY' as any,
                  positionInQueue: 1,
                  estimatedWaitMinutes: 0,
                  createdAt: new Date().toISOString(),
                };

                setQueueTokens((prev) => [prev[0], newTok, ...prev.slice(1)]);
                setShowWalkInModal(false);
                showToast(`Emergency token #${newTokenNum} registered to queue front!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Patient Full Name:</label>
                <input
                  type="text"
                  name="patientName"
                  required
                  placeholder="e.g. Bharatbhai Patel"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Age:</label>
                  <input
                    type="number"
                    name="patientAge"
                    required
                    placeholder="45"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Gender:</label>
                  <select name="patientGender" className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Mobile Phone:</label>
                <input
                  type="tel"
                  name="patientPhone"
                  placeholder="98250XXXXX"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWalkInModal(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  Add Emergency Token
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 8. OFFICIAL PRINTABLE PRESCRIPTION SLIP MODAL */}
      {/* ================================================== */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-teal-700" />
                <h3 className="text-xs font-black text-slate-900">
                  Official Digital Prescription Slip • {rxNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRxModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-300 p-4 space-y-3.5 bg-white text-slate-900">
              <div className="text-center border-b border-slate-200 pb-2.5 space-y-0.5">
                <p className="text-[10px] font-black uppercase text-teal-800 tracking-wider">
                  Government of Gujarat • Health & Family Welfare Department
                </p>
                <h2 className="text-sm font-black text-slate-900">
                  GANDHINAGAR CIVIL HOSPITAL • GENERAL OPD
                </h2>
                <p className="text-[10px] text-slate-500">e-Prescription & Pharmacy Dispensation Order</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-200 pb-2.5">
                <div>
                  <p className="font-black text-slate-900">Dr. Arvind Patel</p>
                  <p className="text-[11px] text-slate-500">MD Internal Medicine / Cardiology • Chamber 4</p>
                  <p className="text-[10px] text-slate-400 font-mono">Reg: G-48291</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-teal-800 font-mono">Token #{patient.tokenNumber}</p>
                  <p className="font-bold text-slate-900">{patient.name} ({patient.age}Y/{patient.gender})</p>
                  <p className="text-[11px] text-slate-500">ABHA: {patient.abhaId}</p>
                  <p className="text-[10px] text-slate-400">Phone: +91 {patient.phone}</p>
                </div>
              </div>

              <div className="bg-teal-50 p-2.5 rounded-lg border border-teal-200 text-xs">
                <span className="font-bold text-teal-950">Diagnosis: </span>
                <span className="font-black text-teal-900">{diagnosis}</span>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-900 block">Rx Prescriptions:</span>
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-1.5 border border-slate-200">#</th>
                      <th className="p-1.5 border border-slate-200">Medicine</th>
                      <th className="p-1.5 border border-slate-200">Timing</th>
                      <th className="p-1.5 border border-slate-200">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meds.map((m, idx) => (
                      <tr key={m.id}>
                        <td className="p-1.5 border border-slate-200 font-mono">{idx + 1}</td>
                        <td className="p-1.5 border border-slate-200 font-bold">{m.name}</td>
                        <td className="p-1.5 border border-slate-200 font-mono font-bold">{m.frequency}</td>
                        <td className="p-1.5 border border-slate-200">{m.duration} ({m.timing})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedTests.length > 0 && (
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-slate-800">Diagnostic Tests Ordered:</span>
                  <p className="text-slate-600 font-semibold">{selectedTests.join(' • ')}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-2">
                <div>
                  <span className="font-bold block">Advice:</span>
                  <p className="text-[11px] text-slate-600">{adviceText}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold block">Next Visit:</span>
                  <p className="text-[11px] font-black text-teal-900">{getFollowUpDateString()} (Chamber 4)</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                <div className="flex items-center gap-2">
                  <QrCode className="h-8 w-8 text-slate-800" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block">Jan Aushadhi QR Code</span>
                    <span className="text-[9px] text-slate-500">Scan at any govt pharmacy</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-6 w-24 border-b border-dashed border-slate-400 ml-auto mb-0.5"></div>
                  <span className="font-bold text-[11px]">Dr. Arvind Patel</span>
                  <p className="text-[9px] text-emerald-700 font-bold">Digitally Signed ✓</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => showToast(`Prescription SMS link sent to +91 ${patient.phone}!`)}
                className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-teal-800 font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5 text-teal-600" />
                <span>Send WhatsApp/SMS</span>
              </button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowRxModal(false)}
                  variant="outline"
                  size="sm"
                  className="text-xs cursor-pointer h-9 px-3 rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="primary"
                  size="sm"
                  className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-bold gap-1 cursor-pointer h-9 px-3 rounded-xl"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </Button>
                {nextWaitingToken && (
                  <Button
                    onClick={handleNext}
                    variant="primary"
                    size="sm"
                    className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1 cursor-pointer shadow-sm h-9 px-3 rounded-xl"
                  >
                    <span>Next Patient ({nextWaitingToken.tokenNumber}) ➔</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientClinicalWorkspace;