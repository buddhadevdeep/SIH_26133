import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { AddFamilyMemberModal } from '@/components/patient/AddFamilyMemberModal';
import { AssignPhoneModal } from '@/components/patient/AssignPhoneModal';
import { FamilyMemberSwitcher } from '@/components/patient/FamilyMemberSwitcher';
import { FamilyMember } from '@/types/family';
import { clinicalApi } from '@/api/clinicalApi';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users,
  ShieldCheck,
  Smartphone,
  FileText,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Download,
  Share2,
  Calendar,
  Activity,
  Heart,
  Droplet,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Pill,
  Clock,
  Sparkles,
  ArrowRight,
  Lock,
  Trash2,
  Check,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Building2,
  PhoneCall,
  UserCheck,
  Search,
  Eye,
  Printer,
  X,
  LayoutGrid,
  ListFilter,
  Stethoscope,
  ExternalLink,
  Filter,
} from 'lucide-react';

interface MockMedication {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
  instructions: string;
}

interface MockLabResult {
  test: string;
  result: string;
  unit: string;
  normalRange: string;
  status: 'NORMAL' | 'HIGH' | 'LOW';
}

interface MockFamilyRecord {
  id: string;
  memberId: string;
  memberName: string;
  relation: string;
  type: 'PRESCRIPTION' | 'LAB_REPORT' | 'OPD_VISIT' | 'VACCINATION';
  title: string;
  facility: string;
  department?: string;
  doctor: string;
  doctorReg?: string;
  date: string;
  time?: string;
  summary: string;
  status: 'VERIFIED' | 'COMPLETED' | 'ACTIVE';
  documentUrl?: string;
  tags?: string[];
  medications?: MockMedication[];
  labResults?: MockLabResult[];
  vitals?: {
    bp?: string;
    pulse?: string;
    spo2?: string;
    temp?: string;
    weight?: string;
  };
  careContextId: string;
}

const MOCK_FAMILY_RECORDS: MockFamilyRecord[] = [
  {
    id: 'rec-01',
    memberId: 'mem_03',
    memberName: 'Gopal Sharma',
    relation: 'Father (Elderly)',
    type: 'OPD_VISIT',
    title: 'Cardiology Follow-up & ECG',
    facility: 'Gandhinagar District Hospital',
    department: 'Cardiology OPD (Room 12)',
    doctor: 'Dr. Vikramaditya Mehta (MD Card)',
    doctorReg: 'GMC-48291',
    date: '10 Sep 2026',
    time: '10:30 AM',
    summary: 'Hypertension stable on Telmisartan 40mg. Normal sinus rhythm on ECG. Advised low salt diet, daily brisk walking, and morning BP logs.',
    status: 'COMPLETED',
    vitals: {
      bp: '134/84 mmHg',
      pulse: '68 bpm',
      spo2: '98%',
      weight: '68 kg',
    },
    tags: ['Cardiology', 'ECG Normal', 'Hypertension Review', 'Low Sodium'],
    careContextId: 'CC-GDH-2026-CARD-0912',
  },
  {
    id: 'rec-02',
    memberId: 'mem_03',
    memberName: 'Gopal Sharma',
    relation: 'Father (Elderly)',
    type: 'PRESCRIPTION',
    title: 'Hypertension & Lipid Regimen',
    facility: 'Gandhinagar District Hospital',
    department: 'General Medicine & Cardiology',
    doctor: 'Dr. Vikramaditya Mehta',
    doctorReg: 'GMC-48291',
    date: '10 Sep 2026',
    time: '11:00 AM',
    summary: 'Long-term maintenance prescription for stage-1 hypertension and dyslipidemia. Valid for 90 days across Jan Aushadhi Kendra.',
    status: 'ACTIVE',
    medications: [
      {
        name: 'Tab Telmisartan',
        dosage: '40 mg',
        timing: '1-0-0 (Morning)',
        duration: '90 Days',
        instructions: 'After breakfast with water',
      },
      {
        name: 'Tab Atorvastatin',
        dosage: '10 mg',
        timing: '0-0-1 (Night)',
        duration: '90 Days',
        instructions: 'After dinner before sleep',
      },
      {
        name: 'Tab Amlodipine',
        dosage: '5 mg',
        timing: 'SOS (As Needed)',
        duration: '30 Days',
        instructions: 'Take only if SBP exceeds 145 mmHg',
      },
    ],
    tags: ['Blood Pressure', 'Lipids / Cholesterol', 'Chronic Care 90 Days'],
    careContextId: 'CC-GDH-2026-RX-0842',
  },
  {
    id: 'rec-03',
    memberId: 'mem_02',
    memberName: 'Savitri Sharma',
    relation: 'Spouse',
    type: 'LAB_REPORT',
    title: 'Complete Blood Count & Thyroid Profile',
    facility: 'Pethapur Primary Health Centre (PHC)',
    department: 'NABL Certified Pathology Lab',
    doctor: 'Dr. Priya Desai (MD Path)',
    doctorReg: 'GMC-55102',
    date: '28 Aug 2026',
    time: '09:15 AM',
    summary: 'All hematology and endocrine parameters within physiological limits. Thyroid stimulating hormone is optimal.',
    status: 'VERIFIED',
    labResults: [
      { test: 'Hemoglobin (Hb)', result: '12.4', unit: 'g/dL', normalRange: '12.0 - 15.5', status: 'NORMAL' },
      { test: 'TSH (Thyroid Stimulating)', result: '2.80', unit: 'uIU/mL', normalRange: '0.40 - 4.20', status: 'NORMAL' },
      { test: 'Fasting Blood Glucose', result: '96', unit: 'mg/dL', normalRange: '70 - 100', status: 'NORMAL' },
      { test: 'Total Leukocyte Count (TLC)', result: '6,800', unit: '/mcL', normalRange: '4,500 - 11,000', status: 'NORMAL' },
      { test: 'Platelet Count', result: '2.45', unit: 'Lakh/mcL', normalRange: '1.50 - 4.50', status: 'NORMAL' },
    ],
    tags: ['CBC Normal', 'TSH Optimal', 'Fasting Glucose 96', 'NABL Accredited'],
    careContextId: 'CC-PHC-2026-LAB-0198',
  },
  {
    id: 'rec-04',
    memberId: 'mem_04',
    memberName: 'Pooja Sharma',
    relation: 'Daughter',
    type: 'VACCINATION',
    title: 'National Immunization Td Booster Certificate',
    facility: 'Urban Health Centre - Sector 21',
    department: 'Universal Immunization Programme (UIP)',
    doctor: 'Sister Meena Solanki (ANM)',
    doctorReg: 'NUR-GJ-9021',
    date: '14 Jul 2026',
    time: '11:45 AM',
    summary: 'Administered Tetanus and adult Diphtheria (Td) booster dose. Verified under National Universal Immunization Grid.',
    status: 'VERIFIED',
    tags: ['Td Booster', 'CoWIN / UIP Linked', 'Next Due in 10 Yrs'],
    careContextId: 'CC-UHC-2026-UIP-0044',
  },
  {
    id: 'rec-05',
    memberId: 'mem_01',
    memberName: 'Rameshwar Sharma',
    relation: 'Self',
    type: 'OPD_VISIT',
    title: 'Seasonal Bronchitis & General OPD Encounter',
    facility: 'Pethapur Primary Health Centre (PHC)',
    department: 'General Medicine OPD (Room 2)',
    doctor: 'Dr. Ananya Patel (MO)',
    doctorReg: 'GMC-61209',
    date: '02 Sep 2026',
    time: '10:15 AM',
    summary: 'Patient presented with dry irritating cough and mild evening fever x 3 days. Chest auscultation clear. Advised steam inhalation and hydration.',
    status: 'COMPLETED',
    vitals: {
      bp: '122/80 mmHg',
      pulse: '74 bpm',
      spo2: '99%',
      temp: '98.8°F',
      weight: '72 kg',
    },
    tags: ['Respiratory OPD', 'No Wheezing', 'Symptomatic Relief'],
    careContextId: 'CC-PHC-2026-OPD-7721',
  },
  {
    id: 'rec-06',
    memberId: 'mem_01',
    memberName: 'Rameshwar Sharma',
    relation: 'Self',
    type: 'PRESCRIPTION',
    title: 'Acute Bronchitis & Cough Prescription',
    facility: 'Pethapur Primary Health Centre (PHC)',
    department: 'PHC Pharmacy Dispensary',
    doctor: 'Dr. Ananya Patel',
    doctorReg: 'GMC-61209',
    date: '02 Sep 2026',
    time: '10:40 AM',
    summary: '5-day symptomatic treatment for seasonal allergy and upper respiratory congestion. Free medicines dispensed from PHC counter.',
    status: 'ACTIVE',
    medications: [
      {
        name: 'Tab Levocetirizine',
        dosage: '5 mg',
        timing: '0-0-1 (Night)',
        duration: '5 Days',
        instructions: 'Take 1 tablet before sleeping',
      },
      {
        name: 'Syp Ambroxol HCl',
        dosage: '10 ml',
        timing: '1-1-1 (TDS)',
        duration: '5 Days',
        instructions: 'After meals with lukewarm water',
      },
      {
        name: 'Tab Paracetamol',
        dosage: '650 mg',
        timing: 'SOS (As needed)',
        duration: '3 Days',
        instructions: 'Take only if temperature exceeds 99.5°F',
      },
    ],
    tags: ['Antihistamine', 'Cough Syrup', '5 Days Course', 'PHC Pharmacy'],
    careContextId: 'CC-PHC-2026-RX-7722',
  },
];

export const PatientProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    members,
    activeMember,
    setActiveMemberId,
    removeMember,
  } = useFamily();

  const [activeTab, setActiveTab] = useState<'members' | 'abha' | 'records' | 'settings'>('members');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assigningMember, setAssigningMember] = useState<FamilyMember | null>(null);
  const [selectedAbhaMember, setSelectedAbhaMember] = useState<FamilyMember>(activeMember);
  const [recordFilterMemberId, setRecordFilterMemberId] = useState<string>('ALL');
  const [recordFilterType, setRecordFilterType] = useState<string>('ALL');
  const [recordSearchQuery, setRecordSearchQuery] = useState<string>('');
  const [vaultViewMode, setVaultViewMode] = useState<'grid' | 'timeline'>('grid');
  const [viewingRecord, setViewingRecord] = useState<MockFamilyRecord | null>(null);
  const [showQrFullscreen, setShowQrFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showOtherMembers, setShowOtherMembers] = useState(false);
  const [isSwitchDropdownOpen, setIsSwitchDropdownOpen] = useState(false);
  const switchDropdownRef = useRef<HTMLDivElement>(null);

  const [familyRecords, setFamilyRecords] = useState<MockFamilyRecord[]>(MOCK_FAMILY_RECORDS);

  useEffect(() => {
    const patientId = activeMember?.id || user?.id || 'usr_pat_01';
    clinicalApi.getPrescriptions(patientId).then((res) => {
      if (res.data && res.data.length > 0) {
        const liveRx: MockFamilyRecord[] = res.data.map((rx: any) => ({
          id: rx.id,
          memberId: activeMember?.id || 'mem_01',
          memberName: rx.patientName || activeMember?.name || 'Rameshwar Sharma',
          relation: activeMember?.relation || 'Self',
          type: 'PRESCRIPTION',
          title: `Prescription - ${rx.diagnosisSummary || 'General Consultation'}`,
          facility: rx.facilityName || 'Gandhinagar Civil Hospital',
          department: 'Outpatient Pharmacy',
          doctor: rx.doctorName || 'Dr. Arvind Patel',
          date: rx.issuedAt ? rx.issuedAt.split('T')[0] : '2026-09-12',
          summary: `Prescription issued with ${rx.items?.length || 1} medications. Status: ${rx.status}`,
          status: rx.status === 'DISPENSED' ? 'COMPLETED' : 'ACTIVE',
          medications: rx.items?.map((it: any) => ({
            name: it.medicineName || 'Medicine',
            dosage: it.dosage || '1 Tab',
            timing: it.frequency || 'Once daily',
            duration: `${it.durationDays || 5} Days`,
            instructions: it.instructions || 'After meals',
          })) || [],
          tags: ['E-Prescription', rx.status],
          careContextId: `CC-${rx.id}`,
        }));

        setFamilyRecords((prev) => {
          const ids = new Set(liveRx.map((r) => r.id));
          return [...liveRx, ...prev.filter((p) => !ids.has(p.id))];
        });
      }
    }).catch(console.warn);
  }, [activeMember?.id, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (switchDropdownRef.current && !switchDropdownRef.current.contains(event.target as Node)) {
        setIsSwitchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI category counts
  const totalRecordsCount = familyRecords.length;
  const prescriptionCount = familyRecords.filter((r) => r.type === 'PRESCRIPTION').length;
  const labCount = familyRecords.filter((r) => r.type === 'LAB_REPORT').length;
  const opdCount = familyRecords.filter((r) => r.type === 'OPD_VISIT').length;
  const vaccineCount = familyRecords.filter((r) => r.type === 'VACCINATION').length;

  const filteredRecords = familyRecords.filter((rec) => {
    const matchesMember =
      recordFilterMemberId === 'ALL' || rec.memberId === recordFilterMemberId;
    const matchesType =
      recordFilterType === 'ALL' || rec.type === recordFilterType;
    const q = recordSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rec.title.toLowerCase().includes(q) ||
      rec.summary.toLowerCase().includes(q) ||
      rec.doctor.toLowerCase().includes(q) ||
      rec.facility.toLowerCase().includes(q) ||
      rec.memberName.toLowerCase().includes(q) ||
      (rec.tags && rec.tags.some((t) => t.toLowerCase().includes(q))) ||
      (rec.medications && rec.medications.some((m) => m.name.toLowerCase().includes(q))) ||
      (rec.labResults && rec.labResults.some((l) => l.test.toLowerCase().includes(q)));
    return matchesMember && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ================================================== */}
      {/* HEADER: Sleek, Modern & Government Health Tech Standard */}
      {/* ================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {t('profile.title')}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-teal-800">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              {t('profile.abdmVerified')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>{t('profile.primaryMobile')}: <strong className="font-mono text-slate-700">+91 98765 43210</strong></span>
            <span>•</span>
            <span>{t('profile.householdMembersCount', { count: members.length })}</span>
            <span>•</span>
            <span className="text-teal-700 font-medium">
              {t('profile.active')}: <strong>{activeMember.name} ({activeMember.relation === 'SELF' ? t('profile.self') : activeMember.relationLabel})</strong>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <FamilyMemberSwitcher variant="compact" />
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 rounded-xl py-2 px-4 cursor-pointer transition-all"
          >
            <UserPlus className="h-4 w-4" />
            {t('profile.addMember')}
          </Button>
        </div>
      </div>

      {/* ================================================== */}
      {/* NAVIGATION TABS */}
      {/* ================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="h-4 w-4" />
          {t('profile.tabMembers')} ({members.length})
        </button>

        <button
          onClick={() => {
            setSelectedAbhaMember(activeMember);
            setActiveTab('abha');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'abha'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          {t('profile.tabAbha')}
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'records'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <FileText className="h-4 w-4" />
          {t('profile.tabVault')} ({MOCK_FAMILY_RECORDS.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-teal-700 text-teal-900 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          {t('profile.tabPhone')}
        </button>
      </div>

      {/* ================================================== */}
      {/* TAB 1: MEMBERS DIRECTORY — SIMPLIFIED (ACTIVE CARD + EXPANDABLE OTHERS) */}
      {/* ================================================== */}
      {activeTab === 'members' && (() => {
        const otherMembers = members.filter((m) => m.id !== activeMember.id);
        const isActiveSelf = activeMember.relation === 'SELF';
        const activeHasPersonalPhone = activeMember.hasOwnPhone || activeMember.phoneType === 'PERSONAL';
        const activeDisplayPhone = activeMember.personalPhone || (activeMember.phone !== '9876543210' ? activeMember.phone : null);

        return (
          <div className="space-y-5">
            {/* Top Bar: Active Status & Quick Dropdown Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    {t('profile.activeMember')}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  OPD tokens, teleconsultations, and lab reports currently apply to this family member.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto relative" ref={switchDropdownRef}>
                {/* Dropdown Switcher Button */}
                <button
                  type="button"
                  onClick={() => setIsSwitchDropdownOpen(!isSwitchDropdownOpen)}
                  className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Click to switch active family member profile"
                >
                  <Users className="h-4 w-4 text-teal-700" />
                  <span>{t('profile.switchProfile')} ({members.length})</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-teal-700 transition-transform duration-200 ${
                      isSwitchDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isSwitchDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                      {t('profile.switchProfile')}
                    </p>
                    <div className="space-y-1">
                      {members.map((m) => {
                        const isCur = m.id === activeMember.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setActiveMemberId(m.id);
                              setIsSwitchDropdownOpen(false);
                              showToast(`Switched active profile to ${m.name}`);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                              isCur
                                ? 'bg-teal-50 border border-teal-200 text-teal-950 font-bold'
                                : 'hover:bg-slate-50 text-slate-700 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                  m.gender === 'F'
                                    ? 'bg-pink-100 text-pink-700'
                                    : m.gender === 'M'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-teal-100 text-teal-700'
                                }`}
                              >
                                {m.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold leading-tight text-slate-900">{m.name}</p>
                                <p className="text-[10px] text-slate-500">{m.relationLabel}</p>
                              </div>
                            </div>
                            {isCur ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
                                <Check className="h-3 w-3" /> {t('profile.active')}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400">
                                {t('profile.switchProfile')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSwitchDropdownOpen(false);
                          setIsAddModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-xl cursor-pointer transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> {t('profile.addMember')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ONLY CURRENTLY ACTIVE MEMBER IN CARD FORMAT */}
            <div className="rounded-2xl border-2 border-teal-600 bg-white p-5 sm:p-6 shadow-md ring-4 ring-teal-500/10 relative overflow-hidden">
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div
                    className={`h-13 w-13 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 ${
                      activeMember.gender === 'F'
                        ? 'bg-pink-100 text-pink-700 border-2 border-pink-200'
                        : activeMember.gender === 'M'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                        : 'bg-teal-100 text-teal-700 border-2 border-teal-200'
                    }`}
                  >
                    {activeMember.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {activeMember.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 border border-teal-300 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                        <Check className="h-3.5 w-3.5 text-teal-700" /> {t('profile.active')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {activeMember.relationLabel}
                      </span>
                      <span>•</span>
                      <span>{activeMember.age} yrs ({activeMember.gender === 'F' ? 'Female' : activeMember.gender === 'M' ? 'Male' : 'Other'})</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-0.5 font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                        <Droplet className="h-3 w-3" /> {activeMember.bloodGroup}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shrink-0 ${
                    isActiveSelf
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {activeMember.relation}
                </span>
              </div>

              {/* ABHA Details */}
              <div className="mt-5 rounded-2xl bg-teal-50/60 p-4 border border-teal-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-teal-600" /> {t('profile.abhaNumber')}
                  </span>
                  <span className="font-mono font-black text-sm text-teal-950">
                    {activeMember.abhaId}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-teal-100/70">
                  <span className="text-xs font-medium text-slate-400">
                    {t('profile.abhaAddress')}
                  </span>
                  <span className="font-mono text-slate-700 font-semibold text-xs">
                    {activeMember.abhaAddress || `${activeMember.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@abdm`}
                  </span>
                </div>
              </div>

              {/* Care Tags / Chronic Conditions */}
              {activeMember.chronicConditions && activeMember.chronicConditions.length > 0 && (
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 font-semibold">
                    {t('profile.careTags')}:
                  </span>
                  {activeMember.chronicConditions.map((cond, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800 shadow-2xs"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              )}

              {/* Phone Linkage Box */}
              <div className="mt-4 rounded-2xl p-3.5 sm:p-4 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 border-slate-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Smartphone className="h-4 w-4 text-slate-500" />
                    {activeHasPersonalPhone && activeDisplayPhone ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        {t('profile.personalPhone')}: +91 {activeDisplayPhone}
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded font-bold">
                          Decoupled
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-800 font-bold">
                        {t('profile.sharedPhone')} (+91 98765 43210)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {activeHasPersonalPhone && activeDisplayPhone
                      ? 'Independent OTP verification & personal login active'
                      : 'Receives hospital SMS & OTPs on primary household phone'}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssigningMember(activeMember)}
                  className="text-xs h-8 px-3 rounded-xl border-teal-600 text-teal-700 hover:bg-teal-50 font-bold cursor-pointer shrink-0"
                >
                  {activeHasPersonalPhone && activeDisplayPhone ? t('profile.changePhone') : t('profile.assignPhone')}
                </Button>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-teal-700 flex items-center gap-1 px-2.5 py-1 bg-teal-50 border border-teal-200/80 rounded-xl">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" /> {t('profile.activeMember')}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAbhaMember(activeMember);
                      setActiveTab('abha');
                    }}
                    className="text-xs h-8 px-3 text-slate-700 hover:text-slate-900 cursor-pointer font-semibold"
                  >
                    <QrCode className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                    {t('profile.viewAbha')}
                  </Button>
                </div>

                {!isActiveSelf && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to remove ${activeMember.name} from this family account? Their ABHA health record will remain intact in ABDM.`
                        )
                      ) {
                        removeMember(activeMember.id);
                        showToast(`Removed ${activeMember.name} from family account`);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    title="Remove member"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{t('profile.removeMember')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* EXPANDABLE SECTION: OTHER HOUSEHOLD MEMBERS */}
            {otherMembers.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                {/* Clickable Header Toggle */}
                <button
                  type="button"
                  onClick={() => setShowOtherMembers(!showOtherMembers)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 bg-slate-50/70 hover:bg-teal-50/40 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-teal-100/70 border border-teal-200 flex items-center justify-center text-teal-800 font-black shadow-2xs group-hover:scale-105 transition-transform">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-teal-900 transition-colors">
                          {t('profile.otherMembers')} ({otherMembers.length})
                        </h4>
                        <span className="text-[10px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">
                          {showOtherMembers ? t('profile.clickToCollapse') : t('profile.clickToExpand')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {showOtherMembers
                          ? 'Click "Switch to this Profile" on any member to make them active'
                          : otherMembers.map((m) => `${m.name} (${m.relationLabel.split(' ')[0]})`).join(' • ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-white border border-slate-200 group-hover:border-teal-300 px-3.5 py-2 rounded-xl shadow-2xs transition-all shrink-0">
                    <span>{showOtherMembers ? t('profile.clickToCollapse') : t('profile.clickToExpand')}</span>
                    {showOtherMembers ? (
                      <ChevronUp className="h-4 w-4 text-teal-700" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-teal-700" />
                    )}
                  </div>
                </button>

                {/* Expanded Grid showing other members on click */}
                {showOtherMembers && (
                  <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/30 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {otherMembers.map((member) => {
                        const isMemSelf = member.relation === 'SELF';
                        const memHasPersonalPhone = member.hasOwnPhone || member.phoneType === 'PERSONAL';
                        const memDisplayPhone = member.personalPhone || (member.phone !== '9876543210' ? member.phone : null);

                        return (
                          <div
                            key={member.id}
                            className="rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs p-5 transition-all relative flex flex-col justify-between"
                          >
                            <div>
                              {/* Top Bar */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
                                      member.gender === 'F'
                                        ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                        : member.gender === 'M'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-teal-100 text-teal-700 border border-teal-200'
                                    }`}
                                  >
                                    {member.name.slice(0, 2).toUpperCase()}
                                  </div>

                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      {member.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                                      <span className="font-semibold text-slate-700">
                                        {member.relationLabel}
                                      </span>
                                      <span>•</span>
                                      <span>{member.age} yrs</span>
                                      <span>•</span>
                                      <span className="inline-flex items-center gap-0.5 font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                        <Droplet className="h-3 w-3" /> {member.bloodGroup}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  {member.relation}
                                </span>
                              </div>

                              {/* ABHA details */}
                              <div className="mt-3.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-slate-400 font-medium">{t('profile.abhaNumber')}</span>
                                  <span className="font-mono font-bold text-teal-900">{member.abhaId}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-slate-400 font-medium">{t('profile.abhaAddress')}</span>
                                  <span className="font-mono text-slate-600 text-[11px]">
                                    {member.abhaAddress || `${member.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@abdm`}
                                  </span>
                                </div>
                              </div>

                              {/* Care Tags */}
                              {member.chronicConditions && member.chronicConditions.length > 0 && (
                                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                                  {member.chronicConditions.map((cond, i) => (
                                    <span
                                      key={i}
                                      className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                                    >
                                      {cond}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Phone Linkage */}
                              <div className="mt-3 text-xs text-slate-600 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <Smartphone className="h-3.5 w-3.5" />
                                  {memHasPersonalPhone && memDisplayPhone ? `+91 ${memDisplayPhone}` : t('profile.sharedPhone')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setAssigningMember(member)}
                                  className="text-[11px] text-teal-700 font-semibold hover:underline cursor-pointer"
                                >
                                  {memHasPersonalPhone && memDisplayPhone ? t('profile.changePhone') : t('profile.assignPhone')}
                                </button>
                              </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setActiveMemberId(member.id);
                                    showToast(`Switched active profile to ${member.name}`);
                                  }}
                                  className="text-xs h-8 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold cursor-pointer shadow-2xs"
                                >
                                  {t('profile.switchToThis')}
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAbhaMember(member);
                                    setActiveTab('abha');
                                  }}
                                  className="text-xs h-8 px-2.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  <QrCode className="h-3.5 w-3.5 mr-1 text-slate-500" />
                                  {t('profile.tabAbha')}
                                </Button>
                              </div>

                              {!isMemSelf && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Are you sure you want to remove ${member.name} from this family account? Their ABHA health record will remain intact in ABDM.`
                                      )
                                    ) {
                                      removeMember(member.id);
                                      showToast(`Removed ${member.name} from family account`);
                                    }
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove member"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Quick Add Member Card */}
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-500 p-6 flex flex-col items-center justify-center gap-2 text-center bg-white hover:bg-teal-50/30 transition-all cursor-pointer group"
                      >
                        <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-teal-700 flex items-center justify-center transition-all shadow-xs">
                          <UserPlus className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                          {t('profile.addMember')}
                        </h4>
                        <p className="text-[11px] text-slate-500 max-w-xs">
                          Add dependent under this mobile number. Instant digital ABHA ID will be generated.
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ================================================== */}
      {/* TAB 2: DIGITAL ABHA CARD (ABDM) */}
      {/* ================================================== */}
      {activeTab === 'abha' && (
        <div className="space-y-6">
          {/* Member selector pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              {t('profile.filterByMember')}:
            </span>
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedAbhaMember(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedAbhaMember.id === m.id
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{m.name}</span>
                <span className="text-[10px] opacity-75">
                  ({m.relation === 'SELF' ? t('profile.self') : m.relationLabel.split(' ')[0]})
                </span>
              </button>
            ))}
          </div>

          {/* Official Ayushman Bharat Digital Card Display */}
          <div className="max-w-xl mx-auto">
            <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-white via-amber-50/20 to-teal-50/30 p-6 shadow-xl relative overflow-hidden">
              {/* Top Tricolor Strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-white to-green-600" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-200 flex items-center justify-center font-bold text-orange-600 text-xs text-center leading-none">
                    🇮🇳<br />NHA
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
                      National Health Authority
                    </h4>
                    <p className="text-[11px] font-bold text-teal-800">
                      Ayushman Bharat Digital Mission (ABDM)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> VERIFIED CITIZEN
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
                {/* Photo & QR */}
                <div className="flex flex-col items-center justify-center gap-3 text-center sm:border-r sm:border-slate-200 sm:pr-4">
                  <div className="h-24 w-24 rounded-2xl bg-teal-900 text-white flex flex-col items-center justify-center font-bold text-xl shadow-md border-2 border-white">
                    {selectedAbhaMember.name.slice(0, 2).toUpperCase()}
                    <span className="text-[9px] font-normal text-teal-200 tracking-wider">
                      PHOTO
                    </span>
                  </div>

                  {/* QR Code preview */}
                  <div
                    onClick={() => setShowQrFullscreen(true)}
                    className="p-1.5 bg-white rounded-xl border border-slate-300 shadow-xs cursor-pointer hover:border-teal-600 transition-all group"
                    title="Click to expand QR Code"
                  >
                    <div className="h-14 w-14 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                      <QrCode className="h-10 w-10 text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 group-hover:text-teal-700 block mt-0.5">
                      Scan at OPD
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Name of Cardholder
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {selectedAbhaMember.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {t('profile.abhaNumber')}
                      </span>
                      <span className="font-mono font-bold text-teal-950 text-xs sm:text-sm">
                        {selectedAbhaMember.abhaId}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {t('profile.abhaAddress')}
                      </span>
                      <span className="font-mono font-bold text-slate-700 text-xs">
                        {selectedAbhaMember.abhaAddress || `${selectedAbhaMember.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@abdm`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {t('profile.ageGender')}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {selectedAbhaMember.gender === 'F' ? 'Female' : selectedAbhaMember.gender === 'M' ? 'Male' : 'Other'} / {selectedAbhaMember.age} Years
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {t('profile.bloodGroup')}
                      </span>
                      <span className="font-bold text-rose-600">
                        {selectedAbhaMember.bloodGroup}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {t('profile.primaryMobile')}
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {selectedAbhaMember.hasOwnPhone && (selectedAbhaMember.personalPhone || selectedAbhaMember.phone !== '9876543210')
                          ? `+91 ${selectedAbhaMember.personalPhone || selectedAbhaMember.phone} (${t('profile.personalPhone')})`
                          : `+91 98765 43210 (${t('profile.sharedPhone')})`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Security Footer */}
              <div className="mt-6 pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-teal-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Govt. of Gujarat Public Health Grid
                </span>
                <span className="font-mono">ABDM-SEC-PASS: #GUJ-2026-OK</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => showToast(`Downloaded ABHA Card for ${selectedAbhaMember.name} (PDF)`)}
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="h-4 w-4" />
                {t('profile.downloadCard')} (PDF)
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(selectedAbhaMember.abhaId);
                  showToast(`Copied ABHA ID: ${selectedAbhaMember.abhaId}`);
                }}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                {t('profile.share')} ABHA ID
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* TAB 3: FAMILY HEALTH RECORDS VAULT */}
      {/* ================================================== */}
      {activeTab === 'records' && (
        <div className="space-y-5">
          {/* Top KPI Category Summary & Filter Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Prescriptions */}
            <div
              onClick={() =>
                setRecordFilterType((prev) =>
                  prev === 'PRESCRIPTION' ? 'ALL' : 'PRESCRIPTION'
                )
              }
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
                recordFilterType === 'PRESCRIPTION'
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                  <Pill className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800">
                  e-Rx
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {prescriptionCount}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  {t('profile.prescriptions')}
                </div>
                <div className="text-[11px] text-slate-500">
                  Active medicine regimens
                </div>
              </div>
            </div>

            {/* Lab Diagnostics */}
            <div
              onClick={() =>
                setRecordFilterType((prev) =>
                  prev === 'LAB_REPORT' ? 'ALL' : 'LAB_REPORT'
                )
              }
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
                recordFilterType === 'LAB_REPORT'
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800">
                  Diagnostics
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {labCount}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  {t('profile.labReports')}
                </div>
                <div className="text-[11px] text-slate-500">
                  Pathology & blood profiles
                </div>
              </div>
            </div>

            {/* Hospital OPD Visits */}
            <div
              onClick={() =>
                setRecordFilterType((prev) =>
                  prev === 'OPD_VISIT' ? 'ALL' : 'OPD_VISIT'
                )
              }
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
                recordFilterType === 'OPD_VISIT'
                  ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-md'
                  : 'border-slate-200 hover:border-amber-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800">
                  Consultations
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {opdCount}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  {t('profile.opdVisits')}
                </div>
                <div className="text-[11px] text-slate-500">
                  Doctor clinical notes & ECG
                </div>
              </div>
            </div>

            {/* Vaccinations */}
            <div
              onClick={() =>
                setRecordFilterType((prev) =>
                  prev === 'VACCINATION' ? 'ALL' : 'VACCINATION'
                )
              }
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white relative overflow-hidden group ${
                recordFilterType === 'VACCINATION'
                  ? 'border-purple-600 ring-2 ring-purple-500/20 shadow-md'
                  : 'border-slate-200 hover:border-purple-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100/80 text-purple-800">
                  Immunization
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">
                  {vaccineCount}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  {t('profile.vaccines')}
                </div>
                <div className="text-[11px] text-slate-500">
                  UIP & booster certificates
                </div>
              </div>
            </div>
          </div>

          {/* Smart Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Live Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={recordSearchQuery}
                  onChange={(e) => setRecordSearchQuery(e.target.value)}
                  placeholder={t('profile.searchRecords')}
                  className="w-full pl-9 pr-9 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
                {recordSearchQuery && (
                  <button
                    onClick={() => setRecordSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher & Clear Button */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                {(recordFilterType !== 'ALL' || recordFilterMemberId !== 'ALL' || recordSearchQuery) && (
                  <button
                    onClick={() => {
                      setRecordFilterType('ALL');
                      setRecordFilterMemberId('ALL');
                      setRecordSearchQuery('');
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}

                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setVaultViewMode('grid')}
                    title="Grid View"
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      vaultViewMode === 'grid'
                        ? 'bg-white text-teal-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setVaultViewMode('timeline')}
                    title="List View"
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      vaultViewMode === 'timeline'
                        ? 'bg-white text-teal-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ListFilter className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Member Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                {t('profile.filterByMember')}:
              </span>
              <button
                onClick={() => setRecordFilterMemberId('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  recordFilterMemberId === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t('profile.allMembers')} ({totalRecordsCount})
              </button>
              {members.map((m) => {
                const count = MOCK_FAMILY_RECORDS.filter((r) => r.memberId === m.id).length;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRecordFilterMemberId(m.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      recordFilterMemberId === m.id
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        recordFilterMemberId === m.id
                          ? 'bg-teal-900 text-teal-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Indicators */}
          {recordFilterType !== 'ALL' && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-500">
              <span>
                Filtering by:{' '}
                <strong className="text-teal-900 font-bold">
                  {recordFilterType.replace('_', ' ')}
                </strong>{' '}
                ({filteredRecords.length} records found)
              </span>
              <button
                onClick={() => setRecordFilterType('ALL')}
                className="text-teal-700 hover:underline font-semibold cursor-pointer"
              >
                Show All Types
              </button>
            </div>
          )}

          {/* Records Display: Grid vs Timeline */}
          {filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No medical records match your criteria</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching with different terms or selecting &quot;All Family&quot; from the filter chips above.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRecordFilterType('ALL');
                  setRecordFilterMemberId('ALL');
                  setRecordSearchQuery('');
                }}
                className="mt-4 text-xs rounded-xl cursor-pointer"
              >
                Reset All Filters
              </Button>
            </div>
          ) : vaultViewMode === 'grid' ? (
            /* ================= GRID VIEW ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecords.map((rec) => {
                const isRx = rec.type === 'PRESCRIPTION';
                const isLab = rec.type === 'LAB_REPORT';
                const isOpd = rec.type === 'OPD_VISIT';
                const isVac = rec.type === 'VACCINATION';

                const theme = isRx
                  ? {
                      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      icon: <Pill className="h-3.5 w-3.5 text-emerald-600" />,
                      borderHover: 'hover:border-emerald-500',
                      label: 'Prescription',
                    }
                  : isLab
                  ? {
                      badge: 'bg-blue-50 text-blue-800 border-blue-200',
                      icon: <Activity className="h-3.5 w-3.5 text-blue-600" />,
                      borderHover: 'hover:border-blue-500',
                      label: 'Lab Diagnostics',
                    }
                  : isVac
                  ? {
                      badge: 'bg-purple-50 text-purple-800 border-purple-200',
                      icon: <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />,
                      borderHover: 'hover:border-purple-500',
                      label: 'Immunization',
                    }
                  : {
                      badge: 'bg-amber-50 text-amber-800 border-amber-200',
                      icon: <Stethoscope className="h-3.5 w-3.5 text-amber-600" />,
                      borderHover: 'hover:border-amber-500',
                      label: 'OPD Encounter',
                    };

                return (
                  <div
                    key={rec.id}
                    className={`rounded-2xl border border-slate-200 bg-white p-5 transition-all flex flex-col justify-between gap-4 ${theme.borderHover} hover:shadow-md group`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${theme.badge}`}
                        >
                          {theme.icon}
                          {theme.label}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Calendar className="h-3 w-3" />
                            {rec.date}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              rec.status === 'ACTIVE'
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : rec.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            ● {rec.status}
                          </span>
                        </div>
                      </div>

                      {/* Title & Patient */}
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                          {rec.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                          <span className="font-semibold text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                            👤 {rec.memberName}
                          </span>
                          <span className="text-slate-400">({rec.relation})</span>
                        </div>
                      </div>

                      {/* Doctor & Facility */}
                      <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.facility}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Stethoscope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700 truncate">{rec.doctor}</span>
                        </div>
                      </div>

                      {/* Clinical Highlight Pill Box */}
                      {isRx && rec.medications && (
                        <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-2.5 space-y-1.5">
                          <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                            <Pill className="h-3 w-3" /> Prescribed Medications:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.medications.map((m, idx) => (
                              <span
                                key={idx}
                                className="bg-white border border-emerald-200 text-emerald-900 font-semibold px-2 py-0.5 rounded-md text-[11px] shadow-2xs"
                              >
                                {m.name} {m.dosage} <span className="text-slate-500 font-normal">({m.timing})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {isLab && rec.labResults && (
                        <div className="rounded-xl bg-blue-50/60 border border-blue-200/80 p-2.5 space-y-1.5">
                          <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                            <Activity className="h-3 w-3" /> Key Test Results:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.labResults.slice(0, 3).map((l, idx) => (
                              <span
                                key={idx}
                                className="bg-white border border-blue-200 text-blue-950 font-semibold px-2 py-0.5 rounded-md text-[11px] shadow-2xs"
                              >
                                {l.test}: <strong className="font-bold text-blue-800">{l.result} {l.unit}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {isOpd && (
                        <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-2.5 space-y-1">
                          <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                            Encounter Observation:
                          </div>
                          <p className="text-xs text-slate-700 line-clamp-2">
                            {rec.summary}
                          </p>
                          {rec.vitals?.bp && (
                            <div className="text-[11px] font-mono text-amber-950 font-bold pt-0.5">
                              Vitals: BP {rec.vitals.bp} • Pulse {rec.vitals.pulse}
                            </div>
                          )}
                        </div>
                      )}

                      {isVac && (
                        <div className="rounded-xl bg-purple-50/60 border border-purple-200/80 p-2.5 space-y-1">
                          <div className="text-[10px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Immunization Status:
                          </div>
                          <p className="text-xs text-purple-950 font-medium">
                            {rec.summary}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        onClick={() => setViewingRecord(rec)}
                        className="bg-slate-900 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl h-8 px-3 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Document
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => showToast(`Downloaded PDF for ${rec.title}`)}
                          className="text-xs h-8 px-2.5 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard?.writeText(rec.careContextId);
                            showToast(`Copied Care Context ID: ${rec.careContextId}`);
                          }}
                          className="text-xs h-8 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
                          title="Copy ABDM ID"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= TIMELINE / LIST VIEW ================= */
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {filteredRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        rec.type === 'PRESCRIPTION'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.type === 'LAB_REPORT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : rec.type === 'VACCINATION'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {rec.type === 'PRESCRIPTION' ? (
                        <Pill className="h-5 w-5" />
                      ) : rec.type === 'LAB_REPORT' ? (
                        <Activity className="h-5 w-5" />
                      ) : rec.type === 'VACCINATION' ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : (
                        <Stethoscope className="h-5 w-5" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {rec.title}
                        </h4>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.2 rounded-full">
                          👤 {rec.memberName} ({rec.relation})
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {rec.date}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {rec.summary}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                        <span>{rec.facility}</span>
                        <span>•</span>
                        <span>{rec.doctor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      onClick={() => setViewingRecord(rec)}
                      className="bg-slate-900 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl h-8 px-3 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showToast(`Downloaded PDF for ${rec.title}`)}
                      className="text-xs h-8 px-2.5 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================== */}
      {/* TAB 4: PHONE & ACCOUNT SETTINGS */}
      {/* ================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('profile.phoneSettingsTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('profile.primaryPhoneDesc')}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    +91 98765 43210 (Primary Head)
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Aadhaar OTP & ABDM Connected
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast('Primary number edit requires Aadhaar OTP authentication.')}
                className="text-xs rounded-xl cursor-pointer"
              >
                Change Number
              </Button>
            </div>

            {/* Decoupling breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Family Phone Allocation Summary
              </h4>

              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{m.name}</span>
                      <span className="text-slate-400">({m.relationLabel})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.hasOwnPhone && (m.personalPhone || m.phone !== '9876543210') ? (
                        <span className="font-mono text-emerald-700 font-bold">
                          +91 {m.personalPhone || m.phone} (Personal)
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Shared on +91 98765 43210
                        </span>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAssigningMember(m)}
                        className="text-[11px] h-6 px-2 text-teal-700 hover:bg-teal-50 cursor-pointer"
                      >
                        {m.hasOwnPhone ? 'Edit' : 'Decouple'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AddFamilyMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Assign Phone Modal */}
      {assigningMember && (
        <AssignPhoneModal
          isOpen={true}
          member={assigningMember}
          onClose={() => setAssigningMember(null)}
        />
      )}

      {/* ================================================== */}
      {/* ABDM OFFICIAL RECORD PREVIEW MODAL */}
      {/* ================================================== */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl sm:max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
            {/* Top ABDM Government Header */}
            <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-700/80 border border-teal-500/40 flex items-center justify-center text-teal-100 font-bold shrink-0">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] uppercase tracking-widest font-extrabold text-teal-200">
                      Ayushman Bharat Digital Mission (ABDM)
                    </span>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.2 text-[10px] font-bold text-emerald-300">
                      VERIFIED EHR
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {viewingRecord.facility}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setViewingRecord(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Document Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Document Reference Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Care Context ID: </span>
                  <span className="font-mono font-bold text-slate-800">{viewingRecord.careContextId}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-3.5 w-3.5 text-teal-700" />
                  <span className="font-medium">{viewingRecord.date} {viewingRecord.time && `• ${viewingRecord.time}`}</span>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="rounded-xl border border-slate-200 p-4 bg-teal-50/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Patient Name</span>
                  <span className="font-bold text-slate-900">{viewingRecord.memberName}</span>
                  <span className="text-[11px] text-teal-700 block">({viewingRecord.relation})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Treating Doctor</span>
                  <span className="font-bold text-slate-900">{viewingRecord.doctor}</span>
                  <span className="text-[11px] text-slate-500 block">{viewingRecord.department || 'Clinical OPD'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Document Type</span>
                  <span className="font-bold text-slate-900">{viewingRecord.type.replace('_', ' ')}</span>
                  <span className="text-[10px] font-mono text-emerald-700 block font-semibold">● {viewingRecord.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Linked Household</span>
                  <span className="font-mono font-bold text-slate-800">+91 98765 43210</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">Primary SIM</span>
                </div>
              </div>

              {/* Clinical Summary */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Clinical Summary & Diagnosis
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                  {viewingRecord.summary}
                </div>
              </div>

              {/* Vitals (if present) */}
              {viewingRecord.vitals && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Recorded Vital Signs
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {viewingRecord.vitals.bp && (
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">Blood Pressure</span>
                        <span className="text-xs font-bold text-slate-900 font-mono">{viewingRecord.vitals.bp}</span>
                      </div>
                    )}
                    {viewingRecord.vitals.pulse && (
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">Pulse Rate</span>
                        <span className="text-xs font-bold text-slate-900 font-mono">{viewingRecord.vitals.pulse}</span>
                      </div>
                    )}
                    {viewingRecord.vitals.spo2 && (
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">SpO2 Level</span>
                        <span className="text-xs font-bold text-slate-900 font-mono">{viewingRecord.vitals.spo2}</span>
                      </div>
                    )}
                    {viewingRecord.vitals.weight && (
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white text-center">
                        <span className="text-[10px] text-slate-400 block font-medium">Body Weight</span>
                        <span className="text-xs font-bold text-slate-900 font-mono">{viewingRecord.vitals.weight}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prescription Table (if prescription) */}
              {viewingRecord.medications && viewingRecord.medications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-emerald-600" /> Prescribed Medications (Rx)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Medicine</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-3">Frequency</th>
                          <th className="py-2.5 px-3">Duration</th>
                          <th className="py-2.5 px-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingRecord.medications.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold text-slate-900">{med.name}</td>
                            <td className="py-2 px-3 font-mono text-teal-800 font-semibold">{med.dosage}</td>
                            <td className="py-2 px-3 text-slate-600">{med.timing}</td>
                            <td className="py-2 px-3 font-medium text-slate-700">{med.duration}</td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">{med.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Lab Results Table (if lab report) */}
              {viewingRecord.labResults && viewingRecord.labResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-blue-600" /> Diagnostic Test Parameters
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Investigation</th>
                          <th className="py-2.5 px-3">Result</th>
                          <th className="py-2.5 px-3">Reference Range</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingRecord.labResults.map((lab, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-bold text-slate-900">{lab.test}</td>
                            <td className="py-2 px-3 font-mono font-bold text-blue-900">
                              {lab.result} <span className="text-[10px] text-slate-500 font-normal">{lab.unit}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{lab.normalRange} {lab.unit}</td>
                            <td className="py-2 px-3">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                <Check className="h-2.5 w-2.5" /> Normal
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tags */}
              {viewingRecord.tags && viewingRecord.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Care Tags:</span>
                  {viewingRecord.tags.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* ABDM Digital Signature Stamp */}
              <div className="p-3.5 rounded-xl border border-dashed border-teal-200 bg-teal-50/40 flex items-center justify-between gap-4">
                <div className="space-y-0.5 text-[11px]">
                  <span className="font-bold text-teal-950 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
                    Digitally Signed via National Health Claims &amp; EHR Exchange
                  </span>
                  <span className="text-slate-500 font-mono text-[10px] block">
                    Signing Authority: {viewingRecord.doctor} {viewingRecord.doctorReg && `(${viewingRecord.doctorReg})`} • NHA-HMIS Hash: #NHA-SEC-99120
                  </span>
                </div>
                <div className="h-10 w-10 bg-white rounded-lg border border-teal-200 flex items-center justify-center p-1 shrink-0">
                  <QrCode className="h-8 w-8 text-teal-900" />
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-slate-600" />
                Print Record
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    showToast(`Downloaded official PDF for ${viewingRecord.title}`);
                  }}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingRecord(null)}
                  className="text-xs rounded-xl cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
