import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/contexts/SocketContext';
import { useFamily } from '@/contexts/FamilyContext';
import { INITIAL_LIVE_QUEUE } from '@/mock/mockData';
import { Token } from '@/types/queue';
import { queueApi } from '@/api/queueApi';
import { Link } from 'react-router-dom';
import { FamilyMemberSwitcher } from '@/components/patient/FamilyMemberSwitcher';
import {
  Ticket,
  Clock,
  Building2,
  BellRing,
  Navigation,
  CheckCircle2,
  Users,
  MapPin,
  QrCode,
  RefreshCw,
  History,
  X,
  Stethoscope,
  FileText,
  Volume2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PastToken {
  id: string;
  tokenNumber: string;
  patientName: string;
  relation: string;
  facilityName: string;
  departmentName: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'COMPLETED' | 'SERVED' | 'CLOSED';
  notes: string;
  recordUrl?: string;
}

const MOCK_PAST_TOKENS: PastToken[] = [
  {
    id: 'past_tok_01',
    tokenNumber: 'A-028',
    patientName: 'Rameshwar Sharma',
    relation: 'Self',
    facilityName: 'Pethapur Primary Health Centre',
    departmentName: 'General Medicine OPD (Room 2)',
    doctorName: 'Dr. Ananya Patel (MO)',
    date: '02 Sep 2026',
    time: '10:15 AM',
    status: 'COMPLETED',
    notes: 'Seasonal cough & low-grade fever. Paracetamol + Ambroxol prescribed.',
    recordUrl: '/patient/records',
  },
  {
    id: 'past_tok_02',
    tokenNumber: 'B-014',
    patientName: 'Sunita Sharma',
    relation: 'Mother',
    facilityName: 'Gandhinagar Civil Hospital',
    departmentName: 'Obstetrics & Gynecology OPD (Room 5)',
    doctorName: 'Dr. Meenakshi Sundaram',
    date: '28 Aug 2026',
    time: '11:40 AM',
    status: 'COMPLETED',
    notes: 'Annual gynecological wellness checkup & CBC blood profile.',
    recordUrl: '/patient/records',
  },
  {
    id: 'past_tok_03',
    tokenNumber: 'P-006',
    patientName: 'Aarav Sharma',
    relation: 'Son',
    facilityName: 'Mansa Community Health Centre',
    departmentName: 'Pediatric Care & Immunization (Room 3)',
    doctorName: 'Dr. Sangeeta Rao',
    date: '14 Jul 2026',
    time: '09:50 AM',
    status: 'COMPLETED',
    notes: 'Td Booster vaccine administered. Certificate issued.',
    recordUrl: '/patient/records',
  },
  {
    id: 'past_tok_04',
    tokenNumber: 'C-019',
    patientName: 'Gopal Sharma',
    relation: 'Father',
    facilityName: 'Gandhinagar Civil Hospital',
    departmentName: 'Cardiology Super-Specialty OPD (Room 8)',
    doctorName: 'Dr. Vikramaditya Mehta (MD Card)',
    date: '10 Jun 2026',
    time: '02:20 PM',
    status: 'COMPLETED',
    notes: 'Routine hypertension follow-up & 12-lead ECG review.',
    recordUrl: '/patient/records',
  },
];

export const TokenExperience: React.FC = () => {
  const { t } = useTranslation();
  const { activeMember } = useFamily();
  const { simulateCallToken } = useSocket();

  const [token, setToken] = useState<Token>(
    INITIAL_LIVE_QUEUE.tokens.find(
      (t) => t.patientId === 'usr_pat_01'
    ) || INITIAL_LIVE_QUEUE.tokens[3]
  );

  const [showQrModal, setShowQrModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPastTokens, setShowPastTokens] = useState(false);
  const [activePastFilter, setActivePastFilter] = useState<'ALL' | 'THIS_MONTH'>('ALL');

  const fetchLiveQueue = () => {
    setIsRefreshing(true);
    queueApi.getLiveQueue('fac_civil_01').then((res) => {
      if (res.data?.tokens && res.data.tokens.length > 0) {
        const matched = res.data.tokens.find(
          (t) => t.patientId === activeMember?.id || t.patientPhone === activeMember?.phone
        ) || res.data.tokens[0];
        if (matched) setToken(matched);
      }
    }).catch(console.warn).finally(() => {
      setTimeout(() => setIsRefreshing(false), 400);
    });
  };

  useEffect(() => {
    fetchLiveQueue();
  }, [activeMember?.id]);

  const handleRefresh = () => {
    fetchLiveQueue();
  };

  const filteredPastTokens = activePastFilter === 'ALL'
    ? MOCK_PAST_TOKENS
    : MOCK_PAST_TOKENS.filter((t) => t.date.includes('Sep 2026'));

  return (
    <div className="w-full space-y-5 font-sans">
      {/* =====================================================
          SLEEK COMPACT TOP STATUS BAR
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-800">
              Live OPD Active
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <Building2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
            <span className="font-semibold text-slate-800">Gandhinagar Civil Hospital</span>
            <span className="text-slate-400">(Room 4)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <FamilyMemberSwitcher variant="compact" />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs h-7 px-2.5 gap-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-teal-600' : 'text-slate-400'}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* =====================================================
          MAIN LIVE QUEUE & ACTIVE TOKEN DISPLAY CARD
      ====================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Live OPD Counter
            </span>
          </div>
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
            Room 4 Active
          </span>
        </div>

        {/* Responsive 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Calling Counter & Quick Actions */}
          <div className="lg:col-span-6 space-y-4">
            {/* Hospital & Doctor Details */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{token.facilityName || 'Gandhinagar Civil Hospital'}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-teal-700" />
                General Medicine OPD
              </h2>
              <p className="text-xs text-slate-500">
                Doctor: Dr. Arvind Patel (MD) • Room 4 (1st Floor)
              </p>
            </div>

            {/* Simple Light "Now Serving" Card */}
            <div className="rounded-xl bg-teal-50/70 border border-teal-200/80 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                Now Calling at Counter
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold text-teal-900 font-mono tracking-tight my-1">
                {INITIAL_LIVE_QUEUE.currentTokenNumber}
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Patient: Govindbhai P. • Inside Room
              </p>
            </div>

            {/* 3 Simple Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                <span className="text-[10px] text-slate-400 block font-medium">Total Waiting</span>
                <span className="font-bold text-sm text-slate-800 block mt-0.5">
                  {INITIAL_LIVE_QUEUE.totalWaiting}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                <span className="text-[10px] text-slate-400 block font-medium">Avg. Consult</span>
                <span className="font-bold text-sm text-amber-700 block mt-0.5">
                  6-8 min
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                <span className="text-[10px] text-slate-400 block font-medium">Queue Status</span>
                <span className="font-bold text-sm text-emerald-700 block mt-0.5">
                  On Time
                </span>
              </div>
            </div>

            {/* Simple Utilities (Includes Scan QR, Voice Alert & Room Map) */}
            <div className="pt-1 flex gap-2">
              <Button
                onClick={() => setShowQrModal(true)}
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold"
              >
                <QrCode className="h-3.5 w-3.5 mr-1 text-teal-700" />
                Scan QR
              </Button>

              <Button
                onClick={() => simulateCallToken(token)}
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
              >
                <Volume2 className="h-3.5 w-3.5 mr-1 text-teal-600" />
                Voice Alert
              </Button>

              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  <Navigation className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Room Map
                </Button>
              </a>
            </div>
          </div>

          {/* Right Column: Queue Flow Progression & Estimated Wait */}
          <div className="lg:col-span-6 space-y-3">
            {/* Active Token Pill Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-200">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-teal-700 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-teal-950 block">
                    Your Token: <span className="font-mono">{token.tokenNumber}</span>
                  </span>
                  <span className="text-[11px] text-teal-700">
                    Patient: {activeMember?.name || 'Self'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-teal-900 block">
                  7 Ahead
                </span>
                <span className="text-[10px] text-teal-600">
                  Est. ~35 min wait
                </span>
              </div>
            </div>

            {/* Simple Clean Queue Progression Sequence */}
            <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                <span>Live Queue Progression</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                <span className="font-mono font-bold text-slate-400 line-through">A-034</span>
                <span className="text-[10px] text-slate-400">Consultation Done</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900">
                <span className="font-mono text-sm">{INITIAL_LIVE_QUEUE.currentTokenNumber}</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                  Now Inside Room 4
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                <span className="font-mono font-semibold text-slate-700">A-036</span>
                <span className="text-[10px] text-slate-500">Next Up at Door</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-teal-50 border border-teal-300 text-xs font-bold text-teal-900">
                <span className="font-mono text-sm">{token.tokenNumber} ({activeMember?.name || 'You'})</span>
                <span className="text-[10px] bg-teal-200 text-teal-800 px-1.5 py-0.2 rounded font-semibold">
                  7 People Ahead
                </span>
              </div>
            </div>

            {/* Helpful Queue Alert */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-[11px] text-slate-600 flex items-start gap-2">
              <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Please proceed near <strong>Room 4</strong> when 2 patients remain ahead. Announcements will broadcast over speakers and send SMS notifications.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          PAST TOKENS / VISIT HISTORY (Collapsible)
      ==================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPastTokens(!showPastTokens)}
          className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <History className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {t('tokens.history')}
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.2 rounded-full">
                  {MOCK_PAST_TOKENS.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click to view previous consultations and dispensary tokens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-teal-700 hidden sm:inline">
              {showPastTokens ? 'Hide History' : 'View History'}
            </span>
            <div className="p-1 rounded-md bg-slate-100 text-slate-600">
              {showPastTokens ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {showPastTokens && (
          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs font-medium text-slate-500">
                Filter:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActivePastFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePastFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({MOCK_PAST_TOKENS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivePastFilter('THIS_MONTH')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePastFilter === 'THIS_MONTH'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>

            {/* Past Tokens List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPastTokens.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-500 hover:shadow-xs transition-all p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        {item.tokenNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                        <Check className="h-2.5 w-2.5" /> {item.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {item.departmentName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {item.notes}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-medium text-slate-600">
                        👤 {item.patientName} ({item.relation})
                      </span>
                      <span>•</span>
                      <span>{item.facilityName}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">
                        {item.date} at {item.time}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link to="/patient/records">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-2 rounded-lg border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                      >
                        <FileText className="h-3 w-3 mr-1 text-teal-700" />
                        Record
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Collapse Button */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowPastTokens(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 py-1 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                Close History
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          QR CODE MODAL FOR CHECK-IN AT HOSPITAL KIOSK
      ====================================================== */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-md sm:max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hospital OPD QR Check-in
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <span className="text-xs font-bold text-teal-800">
                TOKEN {token.tokenNumber}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {activeMember?.name || token.patientName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan this QR at the OPD kiosk or counter reader
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl inline-block shadow-inner">
              <QrCode className="h-32 w-32 text-white" />
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              ABHA ID: {activeMember?.abhaId || '14-8921-3409-7721'}
            </p>

            <Button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl h-9 cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
