import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { saveOfflineScreening } from '@/lib/db';
import { useConnection } from '@/contexts/ConnectionContext';
import { ScreeningCategory, ScreeningSession } from '@/types/asha';
import { INITIAL_ASHA_PATIENTS } from '@/mock/mockData';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  User,
  MapPin,
  HelpCircle,
  Baby,
  HeartPulse,
  Stethoscope,
  Activity,
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

const CATEGORIES: { key: ScreeningCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'NCD', label: 'NCD / Chronic', icon: HeartPulse },
  { key: 'MATERNAL', label: 'Maternal ANC', icon: Stethoscope },
  { key: 'CHILD', label: 'Child UIP / IMNCI', icon: Baby },
  { key: 'GENERAL', label: 'Communicable / General', icon: Activity },
];

export const ScreeningWizard: React.FC = () => {
  const { refreshPendingCount } = useConnection();

  const [category, setCategory] = useState<ScreeningCategory>('NCD');
  const [selectedPatientId, setSelectedPatientId] = useState(INITIAL_ASHA_PATIENTS[0].id);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedPatient = useMemo(
    () => INITIAL_ASHA_PATIENTS.find((p) => p.id === selectedPatientId) || INITIAL_ASHA_PATIENTS[0],
    [selectedPatientId]
  );

  const questions = SCREENING_QUESTIONS[category];
  const totalQuestions = questions.length;
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleToggleAnswer = (questionId: string, val: boolean) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const calculateRiskSummary = () => {
    const flags: string[] = [];
    questions.forEach((q) => {
      const userAns = answers[q.id];
      if (userAns !== undefined && userAns === q.riskIfYes) {
        flags.push(q.text);
      }
    });

    const score = flags.length >= 2 ? 'HIGH' : flags.length === 1 ? 'MODERATE' : 'LOW';
    const action =
      score === 'HIGH'
        ? 'Priority Medical Officer Referral to PHC/CHC within 24–48 hours for diagnostic evaluation and clinical care plan.'
        : score === 'MODERATE'
        ? 'Schedule repeat field follow-up visit in 7 days, provide focused lifestyle counselling, and monitor vitals.'
        : 'Routine community monitoring. No immediate referral indicated. Continue regular scheduled surveillance.';

    return { flags, score, action };
  };

  const handleFinishScreening = async () => {
    setIsLoading(true);
    try {
      const { flags, score, action } = calculateRiskSummary();
      const session: ScreeningSession = {
        id: `scr_${Date.now()}`,
        patientId: selectedPatientId,
        patientName: selectedPatient.name,
        category,
        conductedBy: 'Sunita Devi (Frontline Worker)',
        conductedAt: new Date().toISOString(),
        answers: Object.entries(answers).map(([qId, ans]) => ({
          questionId: qId,
          questionText: questions.find((q) => q.id === qId)?.text || qId,
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
      setIsCompleted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = calculateRiskSummary();

  return (
    <div className="space-y-6 pb-12 w-full">
      <PageHeader
        title="Community Health Screening"
        subtitle="Standardized RCH & CBAC questionnaires for early maternal danger signs, infant nutrition, and chronic NCD surveillance."
        breadcrumbs={[{ label: 'Frontline Dashboard', to: '/asha' }, { label: 'Screening' }]}
      />

      {isCompleted ? (
        <Card className="border-teal-200 bg-white p-8 text-center space-y-5 shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Screening Assessment Complete</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Evaluation for <strong className="text-slate-900">{selectedPatient.name}</strong> has been logged to your offline records.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Evaluated Risk Tier</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                  summary.score === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : summary.score === 'MODERATE'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-teal-100 text-teal-800 border border-teal-200'
                }`}
              >
                {summary.score} RISK
              </span>
            </div>

            {summary.flags.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-rose-900 uppercase">Identified Risk Signs:</span>
                <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1">
                  {summary.flags.map((flag, idx) => (
                    <li key={idx} className="font-semibold text-rose-800">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-teal-800 font-medium bg-teal-50/80 p-2.5 rounded-lg border border-teal-200">
                ✓ No danger signs or adverse risk flags identified in this protocol.
              </p>
            )}

            <div className="pt-2">
              <span className="text-xs font-bold text-slate-800 block mb-1">Recommended Care Protocol:</span>
              <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                {summary.action}
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Field questionnaire protocols are designed for community triage. Final diagnosis requires clinician evaluation by the Medical Officer.
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => {
                setAnswers({});
                setIsCompleted(false);
              }}
              variant="outline"
              className="w-full sm:w-auto min-h-[44px]"
            >
              Start Another Screening
            </Button>
            {summary.score !== 'LOW' && (
              <Link to="/asha/referrals" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full bg-rose-700 hover:bg-rose-800 min-h-[44px]">
                  Create MO Referral Now
                </Button>
              </Link>
            )}
            <Link to="/asha/visits" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full bg-teal-700 hover:bg-teal-800 min-h-[44px]">
                Return to Daily Visits
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Patient Selection Card */}
          <Card className="p-4 sm:p-5 border-slate-200/90 bg-white shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Citizen to Screen
                </label>
                <span className="text-[11px] text-teal-700 font-semibold">
                  {INITIAL_ASHA_PATIENTS.length} citizens in roster
                </span>
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="flex min-h-[48px] w-full rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2.5 text-sm text-slate-900 font-bold cursor-pointer focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              >
                {INITIAL_ASHA_PATIENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.age}Y, {p.village}) • {p.category?.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              {/* Patient mini summary strip */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <strong>{selectedPatient.gender === 'F' ? 'Female' : 'Male'}</strong>, {selectedPatient.age} yrs
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {selectedPatient.village}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {selectedPatient.isHighRisk ? '⚠️ High-Risk Priority' : 'Standard Routine'}
                </span>
              </div>
            </div>
          </Card>

          {/* Category Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = category === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setCategory(cat.key);
                    setAnswers({});
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all min-h-[64px] ${
                    isActive
                      ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-white' : 'text-teal-600'}`} />
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Progress Strip */}
          <div className="rounded-xl bg-white border border-slate-200/90 p-3 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Questions Answered: <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong>
              </span>
              <span className="font-bold text-teal-800">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Questionnaire Cards */}
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const currentAns = answers[q.id];
              const isFlagged = currentAns !== undefined && currentAns === q.riskIfYes;

              return (
                <Card
                  key={q.id}
                  className={`p-4 sm:p-5 border transition-all ${
                    isFlagged
                      ? 'border-rose-300 bg-rose-50/20'
                      : currentAns !== undefined
                      ? 'border-teal-200 bg-teal-50/10'
                      : 'border-slate-200/90 bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 leading-snug">{q.text}</p>
                        {q.hint && (
                          <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
                            <HelpCircle className="h-3 w-3 text-slate-400 shrink-0" />
                            {q.hint}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tactile Response Controls (Min 48px hit targets) */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAnswer(q.id, true)}
                        className={`py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm min-h-[48px] transition-all flex items-center justify-center gap-1.5 active:scale-98 ${
                          currentAns === true
                            ? q.riskIfYes
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>YES / REPORTED</span>
                        {q.riskIfYes && <span className="text-[10px] opacity-80">(Flag)</span>}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleAnswer(q.id, false)}
                        className={`py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm min-h-[48px] transition-all flex items-center justify-center gap-1.5 active:scale-98 ${
                          currentAns === false
                            ? !q.riskIfYes
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>NO / ABSENT</span>
                        {!q.riskIfYes && <span className="text-[10px] opacity-80">(Flag)</span>}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Complete Assessment CTA */}
          <Button
            onClick={handleFinishScreening}
            disabled={answeredCount === 0}
            variant="primary"
            size="lg"
            className="w-full bg-teal-700 hover:bg-teal-800 font-bold min-h-[48px] shadow-sm text-sm"
            isLoading={isLoading}
          >
            {answeredCount < totalQuestions
              ? `Complete Screening (${answeredCount}/${totalQuestions} Answered)`
              : 'Generate Screening Clinical Assessment'}
          </Button>
        </div>
      )}
    </div>
  );
};
