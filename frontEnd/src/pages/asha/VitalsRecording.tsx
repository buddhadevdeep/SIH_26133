import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { saveOfflineVitals, saveOfflineScreening } from '@/lib/db';
import { useConnection } from '@/contexts/ConnectionContext';
import { INITIAL_ASHA_PATIENTS } from '@/mock/mockData';
import { Vitals, RiskLevel } from '@/types/clinical';
import { ScreeningCategory, ScreeningSession } from '@/types/asha';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Heart,
  Thermometer,
  Droplet,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Plus,
  Minus,
  User,
  MapPin,
  Calendar,
  Share2,
  ClipboardList,
  Baby,
  HeartPulse,
  Stethoscope,
  HelpCircle,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  riskIfYes: boolean;
  hint?: string;
}

const SCREENING_QUESTIONS: Record<ScreeningCategory, Question[]> = {
  MATERNAL: [
    {
      id: 'm1',
      text: 'Is the pregnant mother experiencing severe swelling in feet, hands or face (edema)?',
      riskIfYes: true,
      hint: 'Early indicator of pre-eclampsia / gestational hypertension.',
    },
    {
      id: 'm2',
      text: 'Does she complain of persistent severe headache, dizziness, or blurred vision?',
      riskIfYes: true,
      hint: 'Neurological warning sign of imminent eclampsia.',
    },
    {
      id: 'm3',
      text: 'Has there been any vaginal bleeding, spotting, or premature fluid leakage?',
      riskIfYes: true,
      hint: 'Requires immediate emergency referral to CHC / DH.',
    },
    {
      id: 'm4',
      text: 'Are daily fetal kicks and movements regular (at least 10 kicks per 12 hours)?',
      riskIfYes: false,
      hint: 'Reduced fetal movement suggests fetal distress.',
    },
  ],
  CHILD: [
    {
      id: 'c1',
      text: 'Has the child missed any scheduled UIP immunization vaccines (e.g., Pentavalent, MR, DPT)?',
      riskIfYes: true,
      hint: 'Review child MCP card / immunization register.',
    },
    {
      id: 'c2',
      text: 'Is the child showing signs of chest indrawing, stridor, or abnormally fast breathing?',
      riskIfYes: true,
      hint: 'Potential severe acute respiratory infection (ARI) / Pneumonia.',
    },
    {
      id: 'c3',
      text: 'Does the MUAC (Mid-Upper Arm Circumference) tape indicate Yellow or Red zone (<12.5 cm)?',
      riskIfYes: true,
      hint: 'Severe Acute Malnutrition (SAM) or Moderate Malnutrition (MAM).',
    },
    {
      id: 'c4',
      text: 'Is the infant/child feeding and drinking breastmilk or fluids actively without vomiting?',
      riskIfYes: false,
      hint: 'Inability to feed is an IMNCI danger sign.',
    },
  ],
  NCD: [
    {
      id: 'n1',
      text: 'Does the citizen experience chronic chest discomfort, tightness, or breathlessness on mild exertion?',
      riskIfYes: true,
      hint: 'Screening for ischemic heart disease or chronic obstructive airway disease.',
    },
    {
      id: 'n2',
      text: 'Is there excessive thirst, frequent nighttime urination, or unexplained weight loss?',
      riskIfYes: true,
      hint: 'Classic cardinal signs of Type 2 Diabetes Mellitus.',
    },
    {
      id: 'n3',
      text: 'Does the citizen have any non-healing foot ulcers, numbness, or loss of sensation in toes?',
      riskIfYes: true,
      hint: 'Diabetic peripheral neuropathy / peripheral vascular risk.',
    },
    {
      id: 'n4',
      text: 'Does the citizen have a family history of stroke, cardiovascular events before age 55, or kidney disease?',
      riskIfYes: true,
      hint: 'Non-modifiable familial cardiovascular risk factor.',
    },
  ],
  GENERAL: [
    {
      id: 'g1',
      text: 'Has there been persistent productive cough for more than 2 weeks with evening fever or hemoptysis?',
      riskIfYes: true,
      hint: 'Presumptive pulmonary tuberculosis (TB) suspect criteria.',
    },
    {
      id: 'g2',
      text: 'Is there sudden onset high fever with severe chills, retro-orbital headache, or joint arthralgia?',
      riskIfYes: true,
      hint: 'Screen for Vector-Borne Diseases (Malaria / Dengue / Chikungunya).',
    },
    {
      id: 'g3',
      text: 'Are there any hypopigmented skin patches with loss of sensation or thickened peripheral nerves?',
      riskIfYes: true,
      hint: 'National Leprosy Eradication Programme (NLEP) screening sign.',
    },
  ],
};

const SCREENING_CATEGORIES: { key: ScreeningCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'NCD', label: 'NCD / Chronic', icon: HeartPulse },
  { key: 'MATERNAL', label: 'Maternal ANC', icon: Stethoscope },
  { key: 'CHILD', label: 'Child UIP / IMNCI', icon: Baby },
  { key: 'GENERAL', label: 'Communicable / TB', icon: Activity },
];

interface VitalsRecordingProps {
  initialTab?: 'VITALS' | 'SCREENING';
}

export const VitalsRecording: React.FC<VitalsRecordingProps> = ({ initialTab = 'VITALS' }) => {
  const { refreshPendingCount } = useConnection();
  const [searchParams] = useSearchParams();

  // Mode: Vitals vs Screening
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'VITALS' | 'SCREENING'>(
    urlTab === 'screening' || initialTab === 'SCREENING' ? 'SCREENING' : 'VITALS'
  );

  // Common Citizen Selection
  const urlPatientId = searchParams.get('patientId') || searchParams.get('citizenId');
  const [selectedPatientId, setSelectedPatientId] = useState(() => {
    if (urlPatientId && INITIAL_ASHA_PATIENTS.some((p) => p.id === urlPatientId)) {
      return urlPatientId;
    }
    return INITIAL_ASHA_PATIENTS[0].id;
  });

  // Vitals State
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [pulse, setPulse] = useState(72);
  const [temp, setTemp] = useState(98.4);
  const [sugar, setSugar] = useState(110);
  const [sugarType, setSugarType] = useState<'RANDOM' | 'FASTING' | 'POST_PRANDIAL'>('RANDOM');
  const [spO2, setSpO2] = useState(98);
  const [respiratoryRate, setRespiratoryRate] = useState(18);
  const [weight, setWeight] = useState(62);
  const [isVitalsSaved, setIsVitalsSaved] = useState(false);
  const [isVitalsLoading, setIsVitalsLoading] = useState(false);

  // Screening State
  const [screeningCategory, setScreeningCategory] = useState<ScreeningCategory>('NCD');
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, boolean>>({});
  const [isScreeningSaved, setIsScreeningSaved] = useState(false);
  const [isScreeningLoading, setIsScreeningLoading] = useState(false);

  const selectedPatient = useMemo(
    () => INITIAL_ASHA_PATIENTS.find((p) => p.id === selectedPatientId) || INITIAL_ASHA_PATIENTS[0],
    [selectedPatientId]
  );

  // Instant physiological range indicators
  const bpStatus = useMemo(() => {
    if (systolic >= 160 || diastolic >= 100) return { label: 'High (Stage 2)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (systolic >= 140 || diastolic >= 90) return { label: 'Elevated (Stage 1)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (systolic >= 120 || diastolic >= 80) return { label: 'Pre-hypertensive', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return { label: 'Normal Baseline', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  }, [systolic, diastolic]);

  const pulseStatus = useMemo(() => {
    if (pulse > 100) return { label: 'Tachycardia (>100)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (pulse < 60) return { label: 'Bradycardia (<60)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Normal (60–100)', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  }, [pulse]);

  const spO2Status = useMemo(() => {
    if (spO2 < 92) return { label: 'Critical Hypoxia (<92%)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (spO2 < 95) return { label: 'Mild Desaturation (92-94%)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Optimal (≥95%)', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  }, [spO2]);

  const sugarStatus = useMemo(() => {
    const threshold = sugarType === 'FASTING' ? 126 : 200;
    if (sugar >= threshold + 50) return { label: 'Marked Hyperglycemia', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (sugar >= threshold) return { label: 'Elevated Sugar', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (sugar < 70) return { label: 'Hypoglycemia (<70)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    return { label: 'Target Range', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  }, [sugar, sugarType]);

  const tempStatus = useMemo(() => {
    if (temp >= 101.5) return { label: 'High Fever (>101.5°F)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (temp >= 99.5) return { label: 'Low Grade Fever', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Normal (97–99°F)', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  }, [temp]);

  // Overall clinical risk triage calculation
  const evaluatedRisk = useMemo((): { level: RiskLevel; flags: string[] } => {
    const flags: string[] = [];

    if (systolic >= 160 || diastolic >= 100) flags.push('Stage 2 High Blood Pressure (≥160/100 mmHg)');
    else if (systolic >= 140 || diastolic >= 90) flags.push('Elevated Blood Pressure (Stage 1)');

    if (pulse > 110 || pulse < 50) flags.push('Abnormal Heart Rate detected');
    if (temp >= 101.5) flags.push('High Fever (>101.5°F)');
    if (sugar >= 250) flags.push('Severe Hyperglycemia (>250 mg/dL)');
    if (spO2 < 93) flags.push('Hypoxia / Low Oxygen Saturation (<93%)');

    if (systolic >= 160 || diastolic >= 100 || sugar >= 250 || spO2 < 93) {
      return { level: 'HIGH_RISK', flags };
    }
    if (flags.length > 0) {
      return { level: 'NEEDS_ATTENTION', flags };
    }
    return { level: 'NORMAL', flags: ['All physiological vitals within healthy baseline ranges'] };
  }, [systolic, diastolic, pulse, temp, sugar, spO2]);

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVitalsLoading(true);
    try {
      const vitalEntry: Vitals = {
        patientId: selectedPatientId,
        recordedBy: 'Sunita Devi (Frontline Worker)',
        recordedByRole: 'ASHA',
        recordedAt: new Date().toISOString(),
        systolicBp: systolic,
        diastolicBp: diastolic,
        pulseRate: pulse,
        temperatureF: temp,
        bloodSugarMgDl: sugar,
        sugarType,
        spO2: spO2,
        respiratoryRate: respiratoryRate,
        weightKg: weight,
        riskLevel: evaluatedRisk.level,
        riskFlags: evaluatedRisk.flags,
      };

      await saveOfflineVitals(vitalEntry);
      await refreshPendingCount();
      setIsVitalsSaved(true);
    } finally {
      setIsVitalsLoading(false);
    }
  };

  // Screening Logic
  const screeningQuestions = SCREENING_QUESTIONS[screeningCategory];
  const totalScreeningQuestions = screeningQuestions.length;
  const answeredScreeningCount = screeningQuestions.filter((q) => screeningAnswers[q.id] !== undefined).length;
  const screeningProgress = Math.round((answeredScreeningCount / totalScreeningQuestions) * 100);

  const handleToggleScreeningAnswer = (qId: string, val: boolean) => {
    setScreeningAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const calculateScreeningRisk = () => {
    const flags: string[] = [];
    screeningQuestions.forEach((q) => {
      const userAns = screeningAnswers[q.id];
      if (userAns !== undefined && userAns === q.riskIfYes) {
        flags.push(q.text);
      }
    });

    const score = flags.length >= 2 ? 'HIGH' : flags.length === 1 ? 'MODERATE' : 'LOW';
    const action =
      score === 'HIGH'
        ? 'Priority Medical Officer Referral to PHC within 24–48 hours for clinical evaluation.'
        : score === 'MODERATE'
        ? 'Schedule repeat field follow-up visit in 7 days, provide lifestyle counselling and check vitals.'
        : 'Routine community monitoring. No immediate referral indicated.';

    return { flags, score, action };
  };

  const screeningRiskSummary = calculateScreeningRisk();

  const handleSaveScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScreeningLoading(true);
    try {
      const { flags, score, action } = calculateScreeningRisk();
      const session: ScreeningSession = {
        id: `scr_${Date.now()}`,
        patientId: selectedPatientId,
        patientName: selectedPatient.name,
        category: screeningCategory,
        conductedBy: 'Sunita Devi (Frontline Worker)',
        conductedAt: new Date().toISOString(),
        answers: Object.entries(screeningAnswers).map(([qId, ans]) => ({
          questionId: qId,
          questionText: screeningQuestions.find((q) => q.id === qId)?.text || qId,
          answer: ans,
        })),
        riskFlags: flags,
        riskScore: score as 'LOW' | 'MODERATE' | 'HIGH',
        recommendedNextAction: action,
        clinicianVerificationRequired: true,
        synced: false,
      };

      await saveOfflineScreening(session);
      await refreshPendingCount();
      setIsScreeningSaved(true);
    } finally {
      setIsScreeningLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-12 w-full font-sans">
      <PageHeader
        title="Health Check & Screening"
        subtitle="Field vitals telemetry (BP, Sugar, SpO2, Weight) & CBAC health screening questionnaires with instant risk detection and local offline storage."
        breadcrumbs={[{ label: 'Frontline Dashboard', to: '/asha' }, { label: 'Health Check & Screening' }]}
      />

      {/* Citizen Selector (Shared across Vitals & Screening) */}
      <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Citizen from Village Cohort
            </label>
            <span className="text-[11px] text-teal-700 font-semibold">
              {INITIAL_ASHA_PATIENTS.length} assigned in sector
            </span>
          </div>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setIsVitalsSaved(false);
              setIsScreeningSaved(false);
              setScreeningAnswers({});
            }}
            className="flex min-h-[46px] w-full rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2 text-sm text-slate-900 font-bold cursor-pointer focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          >
            {INITIAL_ASHA_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.age}Y, {p.village}) • {p.category?.replace(/_/g, ' ')} {p.isHighRisk ? '⚠️ Priority Case' : ''}
              </option>
            ))}
          </select>

          {/* Citizen Demographics Strip */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-slate-600 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <User className="h-3.5 w-3.5 text-teal-700" />
                {selectedPatient.name} ({selectedPatient.gender === 'F' ? 'Female' : 'Male'}, {selectedPatient.age} yrs)
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {selectedPatient.village}
              </span>
              {selectedPatient.bloodGroup && (
                <span className="rounded bg-teal-100/80 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                  Blood: {selectedPatient.bloodGroup}
                </span>
              )}
            </div>
            {selectedPatient.isHighRisk && (
              <span className="rounded-full bg-rose-100 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                ⚠️ High-Risk Priority Case
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* DUAL MODE TABS: Vitals vs Screening */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1.5 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('VITALS')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'VITALS'
              ? 'bg-white text-teal-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="h-4 w-4 text-red-600" />
          <span>1. Physical Vitals (BP, Sugar, SpO2)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SCREENING')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            activeTab === 'SCREENING'
              ? 'bg-white text-teal-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="h-4 w-4 text-emerald-600" />
          <span>2. Health Screening & CBAC Checklist</span>
        </button>
      </div>

      {/* =====================================================
          TAB 1: PHYSICAL VITALS FORM
      ====================================================== */}
      {activeTab === 'VITALS' && (
        isVitalsSaved ? (
          <Card className="border-teal-200 bg-white p-8 text-center space-y-5 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">Vitals Successfully Logged!</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Telemetry for <strong className="text-slate-900">{selectedPatient.name}</strong> saved to offline IndexedDB:
              </p>
              <div className="inline-block mt-1">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
                    evaluatedRisk.level === 'HIGH_RISK'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : evaluatedRisk.level === 'NEEDS_ATTENTION'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-teal-100 text-teal-800 border border-teal-200'
                  }`}
                >
                  {evaluatedRisk.level.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => setIsVitalsSaved(false)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Record Another Reading
              </Button>
              <Button
                onClick={() => {
                  setActiveTab('SCREENING');
                  setIsScreeningSaved(false);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                Proceed to Screening Checklist →
              </Button>
              <Link to="/asha/visits">
                <Button variant="outline" size="sm" className="text-xs">
                  Back to Home Visits
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSaveVitals} className="space-y-4">
            {/* Vitals Form Cards */}
            <div className="space-y-4">
              {/* 1. Blood Pressure Card */}
              <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                      <Heart className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Blood Pressure (mmHg)</h3>
                      <p className="text-[11px] text-slate-500">Systolic / Diastolic</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${bpStatus.color}`}>
                    {bpStatus.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Systolic */}
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700">Systolic (High)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSystolic((prev) => Math.max(70, prev - 5))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={systolic}
                        onChange={(e) => setSystolic(parseInt(e.target.value) || 0)}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white text-center text-lg font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setSystolic((prev) => Math.min(240, prev + 5))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Diastolic */}
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700">Diastolic (Low)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDiastolic((prev) => Math.max(40, prev - 5))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={diastolic}
                        onChange={(e) => setDiastolic(parseInt(e.target.value) || 0)}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white text-center text-lg font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setDiastolic((prev) => Math.min(160, prev + 5))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-95 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 2. Pulse Rate & SpO2 */}
              <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Pulse & Oxygen (SpO2)</h3>
                      <p className="text-[11px] text-slate-500">Heart rate and oxygen saturation</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Pulse */}
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Pulse (beats/min)</span>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${pulseStatus.color}`}>
                        {pulseStatus.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPulse((prev) => Math.max(35, prev - 2))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={pulse}
                        onChange={(e) => setPulse(parseInt(e.target.value) || 0)}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white text-center text-lg font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setPulse((prev) => Math.min(200, prev + 2))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">SpO2 (%)</span>
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${spO2Status.color}`}>
                        {spO2Status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSpO2((prev) => Math.max(70, prev - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={spO2}
                        onChange={(e) => setSpO2(parseInt(e.target.value) || 0)}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white text-center text-lg font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setSpO2((prev) => Math.min(100, prev + 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 3. Blood Glucose */}
              <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <Droplet className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Blood Glucose (mg/dL)</h3>
                      <p className="text-[11px] text-slate-500">Capillary blood glucose check</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${sugarStatus.color}`}>
                    {sugarStatus.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700">Reading (mg/dL)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSugar((prev) => Math.max(40, prev - 5))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={sugar}
                        onChange={(e) => setSugar(parseInt(e.target.value) || 0)}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white text-center text-lg font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setSugar((prev) => Math.min(500, prev + 5))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700">Timing of Test</span>
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      {(['RANDOM', 'FASTING', 'POST_PRANDIAL'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSugarType(t)}
                          className={`min-h-[40px] rounded-lg border text-xs font-bold transition-colors ${
                            sugarType === t
                              ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {t === 'RANDOM' ? 'Random' : t === 'FASTING' ? 'Fasting' : 'Post Meal'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 4. Temperature & Weight */}
              <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Thermometer className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Temperature & Weight</h3>
                      <p className="text-[11px] text-slate-500">Body baseline measurements</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${tempStatus.color}`}>
                    {tempStatus.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700">Body Temp (°F)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTemp((prev) => parseFloat(Math.max(94.0, prev - 0.2).toFixed(1)))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        step="0.1"
                        value={temp}
                        onChange={(e) => setTemp(parseFloat(e.target.value) || 98.4)}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white text-center text-lg font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setTemp((prev) => parseFloat(Math.min(106.0, prev + 0.2).toFixed(1)))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-700">Weight (kg)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setWeight((prev) => Math.max(5, prev - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                        className="flex h-10 w-full rounded-lg border border-slate-300 bg-white text-center text-lg font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setWeight((prev) => Math.min(200, prev + 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Evaluated Clinical Risk Bar */}
            <div
              className={`p-4 rounded-2xl border transition-colors ${
                evaluatedRisk.level === 'HIGH_RISK'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : evaluatedRisk.level === 'NEEDS_ATTENTION'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-teal-50 border-teal-300 text-teal-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-current" />
                <div className="space-y-1 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                      Live Telemetry Triage: {evaluatedRisk.level.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/80">
                      Boundary Check
                    </span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {evaluatedRisk.flags.map((flag, idx) => (
                      <li key={idx} className="font-medium">
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Vitals CTA */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-teal-700 hover:bg-teal-800 font-bold min-h-[46px] shadow-sm text-sm"
              isLoading={isVitalsLoading}
            >
              Save Vitals to Offline Record
            </Button>
          </form>
        )
      )}

      {/* =====================================================
          TAB 2: HEALTH SCREENING & CBAC CHECKLIST
      ====================================================== */}
      {activeTab === 'SCREENING' && (
        isScreeningSaved ? (
          <Card className="border-teal-200 bg-white p-8 text-center space-y-5 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900">Health Screening Successfully Logged!</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                CBAC assessment for <strong className="text-slate-900">{selectedPatient.name}</strong> saved to offline IndexedDB.
              </p>
              <div className="inline-block mt-1">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${
                    screeningRiskSummary.score === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : screeningRiskSummary.score === 'MODERATE'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {screeningRiskSummary.score} RISK PRIORITY
                </span>
              </div>
              <p className="text-xs text-slate-700 max-w-md mx-auto pt-1 font-medium">
                {screeningRiskSummary.action}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => {
                  setIsScreeningSaved(false);
                  setScreeningAnswers({});
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Conduct Another Screening
              </Button>
              <Button
                onClick={() => {
                  setActiveTab('VITALS');
                  setIsVitalsSaved(false);
                }}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
              >
                Switch to Vitals Entry →
              </Button>
              {screeningRiskSummary.score === 'HIGH' && (
                <Link to="/asha/high-risk">
                  <Button size="sm" className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold">
                    Create PHC Referral
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSaveScreening} className="space-y-4">
            {/* Category Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {SCREENING_CATEGORIES.map((c) => {
                const Icon = c.icon;
                const isCatActive = screeningCategory === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setScreeningCategory(c.key);
                      setScreeningAnswers({});
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCatActive
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Progress Strip */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600" />
                <span className="font-semibold text-slate-700">
                  Questions Answered: {answeredScreeningCount} of {totalScreeningQuestions}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all duration-200 rounded-full"
                    style={{ width: `${screeningProgress}%` }}
                  />
                </div>
                <span className="font-bold text-teal-900">{screeningProgress}%</span>
              </div>
            </div>

            {/* Screening Questions List */}
            <div className="space-y-3">
              {screeningQuestions.map((q, idx) => {
                const currentAnswer = screeningAnswers[q.id];
                const isRiskFlagged = currentAnswer !== undefined && currentAnswer === q.riskIfYes;

                return (
                  <Card
                    key={q.id}
                    className={`p-4 transition-all ${
                      isRiskFlagged
                        ? 'border-rose-300 bg-rose-50/40 shadow-2xs'
                        : currentAnswer !== undefined
                        ? 'border-emerald-200 bg-white'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-extrabold text-teal-800">
                            {idx + 1}
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-slate-900">
                            {q.text}
                          </p>
                        </div>
                        {q.hint && (
                          <p className="text-[11px] text-slate-500 pl-7 flex items-center gap-1">
                            <HelpCircle className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{q.hint}</span>
                          </p>
                        )}
                      </div>

                      {/* Yes / No Toggle Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
                        <button
                          type="button"
                          onClick={() => handleToggleScreeningAnswer(q.id, true)}
                          className={`min-h-[38px] px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentAnswer === true
                              ? q.riskIfYes
                                ? 'bg-rose-600 text-white shadow-xs font-black'
                                : 'bg-emerald-600 text-white shadow-xs font-black'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          YES
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleScreeningAnswer(q.id, false)}
                          className={`min-h-[38px] px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentAnswer === false
                              ? !q.riskIfYes
                                ? 'bg-rose-600 text-white shadow-xs font-black'
                                : 'bg-emerald-600 text-white shadow-xs font-black'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          NO
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Risk Summary Evaluation Box */}
            <div
              className={`p-4 rounded-2xl border transition-colors ${
                screeningRiskSummary.score === 'HIGH'
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : screeningRiskSummary.score === 'MODERATE'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-current" />
                <div className="space-y-1 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                      Screening Risk Level: {screeningRiskSummary.score} RISK
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/80">
                      {screeningRiskSummary.flags.length} Flags Detected
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium">
                    {screeningRiskSummary.action}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Screening CTA */}
            <Button
              type="submit"
              size="lg"
              className="w-full bg-teal-700 hover:bg-teal-800 font-bold min-h-[46px] shadow-sm text-sm"
              isLoading={isScreeningLoading}
            >
              Save Screening Checklist to Offline Record
            </Button>
          </form>
        )
      )}
    </div>
  );
};

