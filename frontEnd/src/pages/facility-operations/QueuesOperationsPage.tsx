import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { queueApi } from '@/api/queueApi';
import { LiveQueueState } from '@/types/queue';
import { QueueDelayModal } from './components/QueueDelayModal';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Search,
  ShieldAlert,
} from 'lucide-react';

export const QueuesOperationsPage: React.FC = () => {
  const [queue, setQueue] = useState<LiveQueueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDept, setActiveDept] = useState('dep_med');
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [issuancePaused, setIssuancePaused] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchToken, setSearchToken] = useState('');

  const departments = [
    { id: 'dep_med', name: 'General Medicine OPD', room: 'Room 4 & 5', activeDoctor: 'Dr. Ramesh Patel' },
    { id: 'dep_cardio', name: 'Cardiology Clinic', room: 'Room 12', activeDoctor: 'Dr. Sunita Rao' },
    { id: 'dep_ortho', name: 'Orthopedics & Trauma OPD', room: 'Room 8', activeDoctor: 'Dr. Amit Joshi' },
    { id: 'dep_peds', name: 'Pediatrics Clinic', room: 'Room 2', activeDoctor: 'Dr. Neha Shah' },
  ];

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await queueApi.getLiveQueue('fac_civil_01', activeDept);
      if (res.data) setQueue(res.data);
    } catch (err) {
      console.error('Failed to load live queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [activeDept]);

  const currentDept = departments.find((d) => d.id === activeDept) || departments[0];

  const waitingTokens = queue?.tokens.filter((t) => t.status === 'WAITING') || [];
  const calledToken = queue?.tokens.find((t) => t.status === 'CALLED');

  const filteredTokens = (queue?.tokens || []).filter((t) => {
    if (!searchToken) return true;
    const query = searchToken.toLowerCase();
    return (
      t.tokenNumber.toLowerCase().includes(query) ||
      t.patientName.toLowerCase().includes(query) ||
      t.patientPhone.includes(query)
    );
  });

  const urgentCount = waitingTokens.filter((t) => t.priority === 'URGENT' || t.priority === 'EMERGENCY').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-3.5 text-xs font-semibold text-teal-900 flex items-center justify-between animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-teal-700 font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Queue Operations
            </span>
            <span className="text-xs text-slate-400">Consolidated OPD Telemetry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Queue Velocity & Disruption Monitor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time waiting rooms, broadcast delay notices to prevent crowd surges, and regulate token issuance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            onClick={() => setDelayModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-2 min-h-[40px] px-3.5 shadow-xs cursor-pointer"
          >
            <Clock className="h-4 w-4" />
            Broadcast +15m Delay
          </Button>

          <Button
            onClick={() => {
              setIssuancePaused(!issuancePaused);
              setToastMsg(
                !issuancePaused
                  ? 'Token issuance PAUSED for front desk clerks.'
                  : 'Token issuance RESUMED for front desk clerks.'
              );
              setTimeout(() => setToastMsg(null), 4000);
            }}
            variant="outline"
            className={`text-xs font-bold gap-2 min-h-[40px] px-3.5 cursor-pointer border ${
              issuancePaused
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {issuancePaused ? (
              <>
                <PlayCircle className="h-4 w-4 text-rose-600" />
                Resume Issuance
              </>
            ) : (
              <>
                <PauseCircle className="h-4 w-4 text-slate-500" />
                Pause Issuance
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Issuance Paused Warning Banner */}
      {issuancePaused && (
        <div className="rounded-xl bg-rose-50 border border-rose-300 p-3.5 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              <strong>Token Issuance Currently Paused:</strong> Registration clerks are blocked from generating new OPD walk-in tokens until backlog clears.
            </span>
          </div>
          <button
            onClick={() => setIssuancePaused(false)}
            className="text-xs font-bold text-rose-800 underline hover:text-rose-950 cursor-pointer"
          >
            Unpause Now
          </button>
        </div>
      )}

      {/* Department Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => setActiveDept(dept.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeDept === dept.id
                ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {dept.name}
          </button>
        ))}
      </div>

      {/* Live Counter Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Currently Called */}
        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Now Consulting</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-teal-700">
              {calledToken?.tokenNumber || queue?.currentTokenNumber || 'None'}
            </span>
            <span className="text-xs text-slate-500 font-medium">{currentDept.room}</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Patient: <span className="font-bold text-slate-800">{calledToken?.patientName || 'Waiting Room Call'}</span>
          </div>
        </Card>

        {/* Waiting Count */}
        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">In Waiting Area</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{waitingTokens.length}</span>
            <span className="text-xs text-slate-500">citizens queued</span>
          </div>
          <div className="mt-2 text-xs font-semibold text-amber-700 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {urgentCount} High-Priority Cases
          </div>
        </Card>

        {/* Avg Consult Time */}
        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Consultation Velocity</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {queue?.averageConsultTimeMinutes || 8}
            </span>
            <span className="text-xs text-slate-500">mins / patient</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Attending: <span className="font-semibold text-slate-700">{currentDept.activeDoctor}</span>
          </div>
        </Card>

        {/* Est Queue Clearing */}
        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Total Wait</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {waitingTokens.length * (queue?.averageConsultTimeMinutes || 8)}
            </span>
            <span className="text-xs text-slate-500">total minutes</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Within Safe OPD Limits
          </div>
        </Card>
      </div>

      {/* Token Queue Table & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Live Tokens Roster</h3>
            <span className="text-xs text-slate-400">({filteredTokens.length} total)</span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search token # or patient name..."
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading department queue state...</div>
        ) : filteredTokens.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No tokens found for this search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Est. Wait</th>
                  <th className="py-3 px-4">Issued At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTokens.map((tok) => {
                  const isCalled = tok.status === 'CALLED';
                  const isUrgent = tok.priority === 'URGENT' || tok.priority === 'EMERGENCY';

                  return (
                    <tr
                      key={tok.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCalled ? 'bg-teal-50/40 font-bold' : isUrgent ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-extrabold text-slate-900 text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {tok.tokenNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{tok.patientName}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {tok.patientAge}y • {tok.patientGender}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tok.priority === 'EMERGENCY'
                              ? 'bg-rose-100 text-rose-800'
                              : tok.priority === 'URGENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tok.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tok.status === 'CALLED'
                              ? 'bg-teal-100 text-teal-800 animate-pulse'
                              : tok.status === 'WAITING'
                              ? 'bg-blue-50 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tok.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tok.status === 'CALLED' ? 'At Counter' : `~${tok.estimatedWaitMinutes} mins`}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(tok.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delay Modal */}
      <QueueDelayModal
        open={delayModalOpen}
        onOpenChange={setDelayModalOpen}
        departmentId={currentDept.id}
        departmentName={currentDept.name}
        onDelayBroadcasted={(mins) => {
          setToastMsg(`Broadcasted +${mins}m wait adjustment for ${currentDept.name}.`);
          setTimeout(() => setToastMsg(null), 4000);
          loadQueue();
        }}
      />
    </div>
  );
};