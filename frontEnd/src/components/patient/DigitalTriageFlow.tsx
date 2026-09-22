import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Stethoscope,
  MapPin,
  CheckCircle2,
  Building2,
  Bed,
  Navigation,
  Ticket,
  Info,
  ShieldAlert,
  Activity,
  Zap,
  ThumbsUp,
  Home,
} from 'lucide-react';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';

// ────────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────────

type CareLevel = 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';

interface TriageResult {
  careLevel: CareLevel;
  careTitle: string;
  careMessage: string;
  recommendedFacilityId: string | null;
  handoffSummary: string;
  callEmergency: boolean;
}

// ────────────────────────────────────────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────────────────────────────────────────

const BODY_AREAS = [
  { id: 'head',      label: 'Head / Headache',  icon: '\u{1F9E0}', urgent: false },
  { id: 'chest',     label: 'Chest / Heart',     icon: '\u{1FAC4}', urgent: true  },
  { id: 'stomach',   label: 'Stomach / Pain',    icon: '\u{1F7E1}', urgent: false },
  { id: 'bone',      label: 'Bone / Fracture',   icon: '\u{1F9B4}', urgent: true  },
  { id: 'skin',      label: 'Skin / Rash',       icon: '\u{1FA7A}', urgent: false },
  { id: 'eye',       label: 'Eye / Vision',      icon: '\u{1F441}', urgent: false },
  { id: 'fever',     label: 'Fever / Cold',      icon: '\u{1F321}', urgent: false },
  { id: 'child',     label: 'Child is Sick',     icon: '\u{1F476}', urgent: false },
  { id: 'maternity', label: 'Maternity',         icon: '\u{1F930}', urgent: true  },
  { id: 'accident',  label: 'Accident / Injury', icon: '\u{1F915}', urgent: true  },
  { id: 'breathing', label: 'Breathing Problem', icon: '\u{1F4A8}', urgent: true  },
  { id: 'other',     label: 'Other / Not Sure',  icon: '\u{2753}',  urgent: false },
] as const;

type BodyAreaId = typeof BODY_AREAS[number]['id'];

const DURATION_OPTIONS = [
  { id: 'just_now',  label: 'Just started',     sublabel: 'Started in last few hours', urgencyScore: 2 },
  { id: 'today',     label: 'Since today',      sublabel: 'Started this morning',      urgencyScore: 1 },
  { id: 'few_days',  label: 'Few days',         sublabel: '2 to 5 days',               urgencyScore: 1 },
  { id: 'week_plus', label: 'More than a week', sublabel: 'Been going on a long time', urgencyScore: 0 },
] as const;

const SEVERITY_OPTIONS = [
  { id: 'mild',     label: 'Mild',     sublabel: 'Bearable, I can manage',      emoji: '\u{1F610}', score: 0 },
  { id: 'moderate', label: 'Moderate', sublabel: 'Hurts, I need help soon',     emoji: '\u{1F61F}', score: 1 },
  { id: 'severe',   label: 'Severe',   sublabel: 'Very painful, need help now', emoji: '\u{1F630}', score: 3 },
] as const;

// ────────────────────────────────────────────────────────────────────────────────
// TRIAGE LOGIC  (care-routing only, NOT clinical diagnosis)
// ────────────────────────────────────────────────────────────────────────────────

function computeTriageResult(areaId: BodyAreaId, durationId: string, severityScore: number): TriageResult {
  const area = BODY_AREAS.find((a) => a.id === areaId)!;
  const durationBonus = DURATION_OPTIONS.find((d) => d.id === durationId)?.urgencyScore ?? 0;
  const totalScore = severityScore + durationBonus + (area.urgent ? 2 : 0);

  if (area.urgent && severityScore >= 3) {
    return {
      careLevel: 'EMERGENCY',
      careTitle: 'Go to Emergency Now',
      careMessage:
        'Based on what you have told us, you may need urgent medical assessment. Please go to the Emergency ward immediately or call 108.',
      recommendedFacilityId: 'fac_civil_01',
      handoffSummary:
        'Symptom area: ' + area.label + ' | Duration: ' + durationId + ' | Severity: Severe | Suggested pathway: Emergency',
      callEmergency: true,
    };
  }
  if (totalScore >= 4) {
    return {
      careLevel: 'URGENT',
      careTitle: 'Visit a Hospital Today',
      careMessage:
        'You should see a doctor today. Please visit the recommended hospital OPD or book a token. Do not delay.',
      recommendedFacilityId: 'fac_civil_01',
      handoffSummary:
        'Symptom area: ' + area.label + ' | Duration: ' + durationId + ' | Severity: Moderate-Severe | Suggested pathway: Urgent OPD',
      callEmergency: false,
    };
  }
  if (totalScore >= 2) {
    return {
      careLevel: 'ROUTINE',
      careTitle: 'Book an OPD Appointment',
      careMessage:
        'A routine OPD visit is recommended. Book an appointment at your nearest health centre at your convenience.',
      recommendedFacilityId: 'fac_civil_01',
      handoffSummary:
        'Symptom area: ' + area.label + ' | Duration: ' + durationId + ' | Severity: Mild-Moderate | Suggested pathway: Routine OPD',
      callEmergency: false,
    };
  }
  return {
    careLevel: 'SELF_CARE',
    careTitle: 'Rest and Monitor at Home',
    careMessage:
      'Your reported symptoms appear mild. Rest, stay hydrated, and monitor. If symptoms worsen or new symptoms appear, visit a doctor.',
    recommendedFacilityId: null,
    handoffSummary:
      'Symptom area: ' + area.label + ' | Duration: ' + durationId + ' | Severity: Mild | Suggested pathway: Self-care, monitor',
    callEmergency: false,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// CARE LEVEL STYLE MAP
// ────────────────────────────────────────────────────────────────────────────────

interface CareLevelMeta {
  bg: string;
  border: string;
  text: string;
  iconType: 'shield' | 'zap' | 'stethoscope' | 'thumbs';
  badge: string;
  badgeBg: string;
}

const CARE_LEVEL_META: Record<CareLevel, CareLevelMeta> = {
  EMERGENCY: {
    bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700',
    iconType: 'shield', badge: 'EMERGENCY', badgeBg: 'bg-red-600 text-white',
  },
  URGENT: {
    bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700',
    iconType: 'zap', badge: 'SEE DOCTOR TODAY', badgeBg: 'bg-amber-500 text-white',
  },
  ROUTINE: {
    bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-700',
    iconType: 'stethoscope', badge: 'ROUTINE OPD', badgeBg: 'bg-teal-600 text-white',
  },
  SELF_CARE: {
    bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700',
    iconType: 'thumbs', badge: 'MONITOR AT HOME', badgeBg: 'bg-emerald-600 text-white',
  },
};

const CareLevelIcon: React.FC<{ type: CareLevelMeta['iconType'] }> = ({ type }) => {
  if (type === 'shield')      return <ShieldAlert className="h-7 w-7 text-red-600" />;
  if (type === 'zap')         return <Zap         className="h-7 w-7 text-amber-500" />;
  if (type === 'stethoscope') return <Stethoscope className="h-7 w-7 text-teal-600" />;
  return                             <ThumbsUp    className="h-7 w-7 text-emerald-600" />;
};

// ────────────────────────────────────────────────────────────────────────────────
// EMERGENCY INTERCEPT SCREEN
// ────────────────────────────────────────────────────────────────────────────────

const EmergencyInterceptScreen: React.FC<{
  onContinue: () => void;
  onReset: () => void;
}> = ({ onContinue, onReset }) => {
  const facility = INITIAL_FACILITIES.find((f) => f.id === 'fac_civil_01');
  return (
    <div className="flex flex-col items-center gap-5 px-2 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 border-2 border-red-300 animate-pulse">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <div>
        <span className="inline-block rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white mb-2">
          Emergency Detected
        </span>
        <h3 className="text-base font-extrabold text-slate-900">This sounds like an emergency</h3>
        <p className="mt-1 text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
          Your symptom may need immediate medical help. Call 108 or go to the Emergency ward right now.
        </p>
      </div>
      <a href="tel:108" className="block w-full max-w-xs">
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-base font-extrabold text-white shadow-md">
          <Phone className="h-5 w-5" />
          Call 108 &mdash; Free Ambulance
        </button>
      </a>
      {facility && (
        <div className="w-full max-w-xs rounded-xl border border-red-200 bg-white p-4 text-left shadow-sm">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nearest Emergency Hospital</p>
          <p className="text-sm font-bold text-slate-900">{facility.name}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-teal-600" />{facility.distanceKm} km
            </span>
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3 text-teal-600" />{facility.availableBeds} beds
            </span>
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <Activity className="h-3 w-3" />{facility.icuBedsAvailable} ICU
            </span>
          </div>
          <a
            href={'https://maps.google.com/?q=' + encodeURIComponent(facility.name)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 py-2 text-xs font-semibold text-teal-700"
          >
            <Navigation className="h-3.5 w-3.5" /> Get Directions
          </a>
        </div>
      )}
      <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
        Not a medical diagnosis. Final decision rests with a licensed doctor. If unsure, call 108.
      </p>
      <button onClick={onContinue} className="text-xs text-slate-400 underline underline-offset-2">
        My situation is not an emergency &mdash; continue triage
      </button>
      <button onClick={onReset} className="text-xs text-slate-400 flex items-center gap-1">
        <RotateCcw className="h-3 w-3" /> Start again
      </button>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// RESULT SCREEN
// ────────────────────────────────────────────────────────────────────────────────

const ResultScreen: React.FC<{
  result: TriageResult;
  onReset: () => void;
  onClose?: () => void;
  facilities?: Facility[];
}> = ({ result, onReset, onClose, facilities = INITIAL_FACILITIES }) => {
  const meta = CARE_LEVEL_META[result.careLevel];
  const facility = result.recommendedFacilityId
    ? facilities.find((f) => f.id === result.recommendedFacilityId) || INITIAL_FACILITIES.find((f) => f.id === result.recommendedFacilityId)
    : null;

  return (
    <div className="flex flex-col gap-4 px-1 py-2">
      {/* Care level result */}
      <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-4`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border ${meta.border} shadow-sm`}>
            <CareLevelIcon type={meta.iconType} />
          </div>
          <div className="min-w-0">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${meta.badgeBg} mb-1`}>
              {meta.badge}
            </span>
            <h3 className={`text-sm font-extrabold ${meta.text}`}>{result.careTitle}</h3>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-700 leading-relaxed">{result.careMessage}</p>
      </div>

      {/* Emergency call */}
      {result.callEmergency && (
        <a href="tel:108">
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-sm font-extrabold text-white shadow-md">
            <Phone className="h-4 w-4" />
            Call 108 &mdash; Free Ambulance
          </button>
        </a>
      )}

      {/* Recommended facility */}
      {facility && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommended Hospital</p>
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-200">
              <Building2 className="h-4 w-4 text-teal-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{facility.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-teal-600" />{facility.distanceKm} km
                </span>
                <span className="flex items-center gap-1">
                  <Bed className="h-3 w-3 text-teal-600" />{facility.availableBeds} beds
                </span>
                <span className={`flex items-center gap-1 font-semibold ${facility.isOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {facility.isOpen ? 'Open Now' : 'Check timings'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/patient/appointments?facilityId=${facility.id}`} onClick={onClose}>
              <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white">
                <Ticket className="h-3.5 w-3.5" />
                Book Token
              </button>
            </Link>
            <a
              href={'https://maps.google.com/?q=' + encodeURIComponent(facility.name)}
              target="_blank"
              rel="noreferrer"
            >
              <button className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 py-2.5 text-xs font-bold text-teal-700">
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </button>
            </a>
          </div>
        </div>
      )}

      {/* Self-care tips */}
      {result.careLevel === 'SELF_CARE' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Home Care Tips</span>
          </div>
          <ul className="space-y-1 text-xs text-emerald-800">
            <li>- Drink plenty of water</li>
            <li>- Rest as much as possible</li>
            <li>- Watch for new or worsening symptoms</li>
            <li>- Visit a doctor if not better in 2 days</li>
          </ul>
        </div>
      )}

      {/* Doctor handoff summary */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Show this to your doctor
          </span>
        </div>
        <p className="text-xs text-slate-700 font-mono leading-relaxed">{result.handoffSummary}</p>
        <p className="mt-2 text-[10px] text-slate-400 italic">
          Self-reported. Not a clinical diagnosis. Assessment is by the attending doctor.
        </p>
      </div>

      {/* Safety disclaimer */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 flex gap-2">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-700 leading-relaxed">
          <strong>Important:</strong> This tool helps you find appropriate care. It does NOT diagnose disease
          or prescribe medicines. All clinical decisions are made by your doctor.
        </p>
      </div>

      <button
        onClick={onReset}
        className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 py-1"
      >
        <RotateCcw className="h-3 w-3" />
        Check a different symptom
      </button>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────────

interface DigitalTriageFlowProps {
  onComplete?: (result: TriageResult) => void;
  onClose?: () => void;
  initialBodyArea?: BodyAreaId;
}

type TriageStep = 'AREA' | 'DURATION' | 'SEVERITY' | 'RESULT' | 'EMERGENCY_INTERCEPT';

export const DigitalTriageFlow: React.FC<DigitalTriageFlowProps> = ({
  onComplete,
  onClose,
  initialBodyArea,
}) => {
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [step, setStep] = useState<TriageStep>(initialBodyArea ? 'DURATION' : 'AREA');
  const [selectedArea, setSelectedArea] = useState<BodyAreaId | null>(initialBodyArea ?? null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [bypassedIntercept, setBypassedIntercept] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setFacilities(res.data);
    }).catch(console.warn);
  }, []);

  const reset = useCallback(() => {
    setStep('AREA');
    setSelectedArea(null);
    setSelectedDuration(null);
    setResult(null);
    setBypassedIntercept(false);
  }, []);

  const handleAreaSelect = (areaId: BodyAreaId) => {
    setSelectedArea(areaId);
    const area = BODY_AREAS.find((a) => a.id === areaId)!;
    if (area.urgent && !bypassedIntercept) {
      setStep('EMERGENCY_INTERCEPT');
    } else {
      setStep('DURATION');
    }
  };

  const handleDurationSelect = (durationId: string) => {
    setSelectedDuration(durationId);
    setStep('SEVERITY');
  };

  const handleSeveritySelect = (score: number) => {
    const r = computeTriageResult(selectedArea!, selectedDuration!, score);
    setResult(r);
    setStep('RESULT');
  };

  const STEP_NUM: Partial<Record<TriageStep, number>> = { AREA: 1, DURATION: 2, SEVERITY: 3 };
  const currentStepNum = STEP_NUM[step] ?? 3;

  return (
    <div className="flex flex-col gap-0 min-h-0">
      {/* Step progress */}
      {step !== 'RESULT' && step !== 'EMERGENCY_INTERCEPT' && (
        <div className="flex items-center justify-between px-1 mb-5">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= currentStepNum ? 'w-8 bg-teal-600' : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Step {currentStepNum} of 3
          </span>
        </div>
      )}

      {/* AREA */}
      {step === 'AREA' && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Where does it hurt?</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tap the area that is troubling you most</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BODY_AREAS.map((area) => (
              <button
                key={area.id}
                onClick={() => handleAreaSelect(area.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-white p-3 shadow-sm transition-all active:scale-95 ${
                  area.urgent
                    ? 'border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50'
                }`}
              >
                <span className="text-xl leading-none">{area.icon}</span>
                <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight mt-0.5">
                  {area.label}
                </span>
                {area.urgent && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                    Urgent
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              This triage helps you find the right care &mdash; it does NOT diagnose illness. Your doctor makes all medical decisions.
            </p>
          </div>
        </div>
      )}

      {/* EMERGENCY INTERCEPT */}
      {step === 'EMERGENCY_INTERCEPT' && (
        <EmergencyInterceptScreen
          onContinue={() => {
            setBypassedIntercept(true);
            setStep('DURATION');
          }}
          onReset={reset}
        />
      )}

      {/* DURATION */}
      {step === 'DURATION' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep('AREA')}
              aria-label="Go back"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                How long has this been going on?
              </h3>
              {selectedArea && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <span>{BODY_AREAS.find((a) => a.id === selectedArea)?.icon}</span>
                  {BODY_AREAS.find((a) => a.id === selectedArea)?.label}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => handleDurationSelect(d.id)}
                className="flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all active:scale-[0.98] hover:border-teal-300 hover:bg-teal-50"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">{d.label}</p>
                  <p className="text-[11px] text-slate-500">{d.sublabel}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SEVERITY */}
      {step === 'SEVERITY' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep('DURATION')}
              aria-label="Go back"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">How bad does it feel?</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tell us how much it is affecting you right now</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {SEVERITY_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSeveritySelect(s.score)}
                className="flex items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 shadow-sm transition-all active:scale-[0.98] hover:border-teal-300 hover:bg-teal-50"
              >
                <span className="text-3xl leading-none">{s.emoji}</span>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-slate-900">{s.label}</p>
                  <p className="text-[11px] text-slate-500">{s.sublabel}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
          {/* Persistent emergency reminder */}
          <a href="tel:108">
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 cursor-pointer hover:bg-red-100">
              <Phone className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700 font-semibold">
                Feeling very unwell right now? Call 108 immediately.
              </p>
            </div>
          </a>
        </div>
      )}

      {/* RESULT */}
      {step === 'RESULT' && result && (
        <ResultScreen result={result} onReset={reset} onClose={onClose} facilities={facilities} />
      )}
    </div>
  );
};
