import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { queueApi, tokenApi } from '@/api/queueApi';
import { LiveQueueState, Token, PriorityLevel } from '@/types/queue';
import { OpdTokenSlipModal } from './components/OpdTokenSlipModal';
import {
  Ticket,
  Volume2,
  UserPlus,
  Clock,
  Building2,
  Users,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export const QueueCounterPage: React.FC = () => {
  const [queue, setQueue] = useState<LiveQueueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Manual Walk-in Token Modal state
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInAge, setWalkInAge] = useState('45');
  const [walkInGender, setWalkInGender] = useState<'M' | 'F' | 'Other'>('M');
  const [walkInDept, setWalkInDept] = useState('dep_med');
  const [walkInPriority, setWalkInPriority] = useState<PriorityLevel>('ROUTINE');
  const [generatingWalkIn, setGeneratingWalkIn] = useState(false);

  // OPD Slip Modal state
  const [activeSlipToken, setActiveSlipToken] = useState<Token | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await queueApi.getLiveQueue('fac_civil_01');
      if (res.data) setQueue(res.data);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleCallNext = async () => {
    try {
      setCallingNext(true);
      const res = await queueApi.callNext('fac_civil_01', 'dep_med');
      if (res.data?.queue) {
        setQueue(res.data.queue);
        if (res.data.calledToken) {
          setActionNotice(
            `Called Token ${res.data.calledToken.tokenNumber} (${res.data.calledToken.patientName}) to Room 4`
          );
        } else {
          setActionNotice('No more waiting tokens in queue.');
        }
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Failed to call next:', err);
      alert('Failed to call next token.');
    } finally {
      setCallingNext(false);
    }
  };

  const handleManualWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInPhone.trim()) {
      alert('Please provide patient name and phone number.');
      return;
    }

    try {
      setGeneratingWalkIn(true);
      const res = await tokenApi.generateToken({
        patientName: walkInName.trim(),
        patientPhone: walkInPhone.replace(/\D/g, ''),
        facilityId: 'fac_civil_01',
        departmentId: walkInDept,
        priority: walkInPriority,
      });

      if (res.data) {
        const t = res.data;
        t.patientAge = parseInt(walkInAge, 10) || 45;
        t.patientGender = walkInGender;
        // Refresh queue
        await fetchQueue();
        setWalkInModalOpen(false);
        setActiveSlipToken(t);
        setSlipModalOpen(true);
        setWalkInName('');
        setWalkInPhone('');
        setActionNotice(`Walk-in Token ${t.tokenNumber} issued successfully.`);
        setTimeout(() => setActionNotice(null), 5000);
      }
    } catch (err) {
      console.error('Failed to generate manual token:', err);
      alert('Failed to generate manual token.');
    } finally {
      setGeneratingWalkIn(false);
    }
  };

  const tokens = queue?.tokens || [];
  const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
  const currentCalledToken = tokens.find((t) => t.status === 'CALLED');

  const filteredTokens = tokens.filter((t) => {
    if (selectedDept === 'ALL') return true;
    return t.departmentId === selectedDept;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-xs font-semibold text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-teal-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/registration-clerk"
              className="text-xs font-semibold text-slate-500 hover:text-teal-700"
            >
              ? Front Desk
            </Link>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-1">OPD Token Counter Desk</h1>
          <p className="text-xs text-slate-500">
            Real-time OPD queue dispatch, token calls, and manual walk-in token issuance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchQueue}
            disabled={loading}
            className="text-xs font-semibold gap-1.5 h-10 px-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setWalkInModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs gap-2 min-h-[40px] px-4 cursor-pointer shadow-sm"
          >
            <Ticket className="h-4 w-4" />
            Issue Walk-in Token
          </Button>
        </div>
      </div>

      {/* Hero Counter Calling Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Calling Banner (7 cols) */}
        <div className="md:col-span-7 rounded-2xl bg-gradient-to-r from-teal-800 to-teal-950 p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="bg-teal-700/80 text-teal-100 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-teal-600/50 flex items-center gap-1.5">
                <Volume2 className="h-3 w-3 text-teal-200 animate-pulse" />
                Live OPD Counter 1
              </span>
              <span className="text-xs text-teal-200 font-mono">Room 4 � Dr. Arvind Patel</span>
            </div>

            <div className="my-5 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-teal-200/80 block">
                Currently Calling Token
              </span>
              <div className="text-5xl md:text-6xl font-black text-white font-mono tracking-tight my-1">
                {currentCalledToken?.tokenNumber || queue?.currentTokenNumber || '�'}
              </div>
              <p className="text-sm font-bold text-teal-100">
                {currentCalledToken?.patientName || 'Govindbhai Prajapati'}
              </p>
              <span className="text-xs text-teal-200/80">
                General Medicine OPD Consultation
              </span>
            </div>
          </div>

          <Button
            onClick={handleCallNext}
            disabled={callingNext || waitingTokens.length === 0}
            className="w-full bg-white text-teal-950 hover:bg-teal-50 font-black text-xs gap-2 min-h-[44px] cursor-pointer shadow-sm"
          >
            <Volume2 className="h-4 w-4 text-teal-700" />
            {callingNext ? 'Calling Token...' : `Call Next Token (${waitingTokens.length} Waiting)`}
          </Button>
        </div>

        {/* Counter Metrics (5 cols) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          <Card className="p-4 border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Waiting Patients</span>
            <p className="text-3xl font-black text-teal-700 my-1">{waitingTokens.length}</p>
            <span className="text-[11px] text-slate-400">Across active clinics</span>
          </Card>

          <Card className="p-4 border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Wait Time</span>
            <p className="text-3xl font-black text-slate-900 my-1">
              ~{(waitingTokens.length * 6) || 12}m
            </p>
            <span className="text-[11px] text-slate-400">Estimated OPD turnaround</span>
          </Card>

          <Card className="p-4 border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Issued Today</span>
            <p className="text-3xl font-black text-slate-900 my-1">{tokens.length}</p>
            <span className="text-[11px] text-emerald-700 font-semibold">Active queue</span>
          </Card>

          <Card className="p-4 border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Urgent Priority</span>
            <p className="text-3xl font-black text-amber-600 my-1">
              {tokens.filter((t) => t.priority === 'URGENT' || t.priority === 'EMERGENCY').length}
            </p>
            <span className="text-[11px] text-amber-700 font-semibold">Fast-tracked</span>
          </Card>
        </div>
      </div>

      {/* Queue Token List Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold">OPD Tokens Live Distribution</CardTitle>
            <p className="text-xs text-slate-500">Live order of patient consultation</p>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] uppercase">Clinic:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 bg-white shadow-2xs cursor-pointer px-2.5 text-xs text-slate-800 font-medium"
            >
              <option value="ALL">All Departments</option>
              <option value="dep_med">General Medicine OPD</option>
              <option value="dep_cardio">Cardiology</option>
              <option value="dep_ortho">Orthopedics</option>
              <option value="dep_peds">Pediatrics</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading token queue...</div>
          ) : filteredTokens.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No tokens in this queue.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {filteredTokens.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Left: Position & Token Number */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="font-mono text-slate-400 text-xs font-semibold w-6 text-center">
                      #{idx + 1}
                    </span>

                    <span className="font-mono font-black text-sm bg-teal-100/70 text-teal-950 px-2.5 py-1 rounded-lg border border-teal-200">
                      {t.tokenNumber}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {t.patientName}
                        </span>
                        {t.priority !== 'ROUTINE' && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.priority === 'EMERGENCY'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.priority}
                          </span>
                        )}
                        <StatusBadge status={t.status} />
                      </div>

                      <p className="text-slate-500 text-xs mt-0.5">
                        {t.patientAge}Y � Phone: +91 {t.patientPhone} � {t.departmentName}
                      </p>
                    </div>
                  </div>

                  {/* Right: Room & Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right hidden sm:block">
                      <span className="font-semibold text-slate-800 text-xs block">
                        {t.roomNumber || 'Room 4'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.status === 'WAITING' ? `~${t.estimatedWaitMinutes}m wait` : 'In Consultation'}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveSlipToken(t);
                        setSlipModalOpen(true);
                      }}
                      className="text-xs font-semibold h-8 px-2.5 gap-1"
                    >
                      <Printer className="h-3 w-3 text-slate-500" /> Slip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Walk-In Token Modal */}
      {walkInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-2xl sm:max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-teal-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-teal-200" />
                <h3 className="font-bold text-sm">Issue Manual Walk-in OPD Token</h3>
              </div>
              <button
                onClick={() => setWalkInModalOpen(false)}
                className="rounded-lg p-1 text-teal-100 hover:bg-teal-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleManualWalkInSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Citizen Name</label>
                <Input
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Rameshwar Sharma"
                  className="h-10 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                  <Input
                    required
                    type="tel"
                    maxLength={10}
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="h-10 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Age (Years)</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    max={120}
                    value={walkInAge}
                    onChange={(e) => setWalkInAge(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Select Department</label>
                <select
                  value={walkInDept}
                  onChange={(e) => setWalkInDept(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white shadow-2xs px-3 text-xs text-slate-900 font-semibold cursor-pointer"
                >
                  <option value="dep_med">General Medicine OPD (Room 4 � Dr. Arvind Patel)</option>
                  <option value="dep_cardio">Cardiology Clinic (Room 6 � Dr. Arvind Patel)</option>
                  <option value="dep_ortho">Orthopedics Clinic (Room 8 � Dr. Rajesh Mehta)</option>
                  <option value="dep_peds">Pediatrics Clinic (Room 2 � Dr. Sneha Desai)</option>
                  <option value="dep_gyn">Gynecology Clinic (Room 5 � Dr. Bhavna Joshi)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ROUTINE', 'URGENT', 'EMERGENCY'] as const).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setWalkInPriority(pr)}
                      className={`h-9 rounded-lg border text-xs font-semibold transition-all ${
                        walkInPriority === pr
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWalkInModalOpen(false)}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={generatingWalkIn}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5"
                >
                  {generatingWalkIn ? 'Generating...' : 'Issue Token & Slip'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPD Token Slip Modal */}
      <OpdTokenSlipModal
        isOpen={slipModalOpen}
        onClose={() => setSlipModalOpen(false)}
        token={activeSlipToken}
      />
    </div>
  );
};
