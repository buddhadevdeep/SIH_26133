import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { operationsApi } from '@/api/operationsApi';
import { OperationalIssue } from '@/types/operations';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const AlertsCenterPage: React.FC = () => {
  const [issues, setIssues] = useState<OperationalIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [tab, setTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const res = await operationsApi.getIssues();
      if (res.data) setIssues(res.data);
    } catch (err) {
      console.error('Failed to load operational issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleResolve = async (issueId: string) => {
    try {
      await operationsApi.resolveIssue(issueId);
      setIssues((prev) =>
        prev.map((iss) =>
          iss.id === issueId
            ? { ...iss, resolved: true, resolvedAt: new Date().toISOString(), resolvedBy: 'Operations Coordinator' }
            : iss
        )
      );
      setToastMsg('Operational incident marked resolved & logged.');
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      console.error('Failed to resolve issue:', err);
    }
  };

  const filteredIssues = issues.filter((iss) => {
    const matchesTab = tab === 'ACTIVE' ? !iss.resolved : iss.resolved;
    const matchesSeverity = severityFilter === 'ALL' || iss.severity === severityFilter;
    const matchesSearch =
      iss.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSeverity && matchesSearch;
  });

  const activeCount = issues.filter((i) => !i.resolved).length;
  const criticalCount = issues.filter((i) => !i.resolved && i.severity === 'CRITICAL').length;
  const resolvedCount = issues.filter((i) => i.resolved).length;

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
              Operations Incident Center
            </span>
            <span className="text-xs text-slate-400">Gandhinagar Civil Hospital</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Alerts & Disruption Triage</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time operational alerts, queue spikes, ambulance diversions, and facility contingency resolution.
          </p>
        </div>

        <Button
          onClick={loadIssues}
          variant="outline"
          className="self-start sm:self-center border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-2 min-h-[40px] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
          Refresh Feed
        </Button>
      </div>

      {/* Severity Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Active Bottlenecks</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{activeCount}</p>
          <span className="text-xs text-slate-400">Open across all hospital zones</span>
        </Card>

        <Card className="p-4 border-rose-200 bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Critical Severity</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{criticalCount}</p>
          <span className="text-xs text-rose-600 font-semibold">Immediate intervention needed</span>
        </Card>

        <Card className="p-4 border-emerald-200 bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Resolved Today</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</p>
          <span className="text-xs text-emerald-600">Logged in audit trail</span>
        </Card>
      </div>

      {/* Tabs and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setTab('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'ACTIVE'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active Issues ({activeCount})
          </button>
          <button
            onClick={() => setTab('RESOLVED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'RESOLVED'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolution History ({resolvedCount})
          </button>
        </div>

        {/* Severity Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'CRITICAL', 'ATTENTION', 'INFORMATIONAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                severityFilter === sev
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Feed */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading incident feed...</div>
      ) : filteredIssues.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-800">
            {tab === 'ACTIVE' ? 'No active alerts in this category' : 'No resolved logs recorded'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Facility operations are within normal parameters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((iss) => {
            const isCrit = iss.severity === 'CRITICAL';
            const isAttn = iss.severity === 'ATTENTION';

            return (
              <Card
                key={iss.id}
                className={`p-4 border transition-all ${
                  isCrit && !iss.resolved
                    ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                    : isAttn && !iss.resolved
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isCrit
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : isAttn
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {iss.severity}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {iss.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(iss.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{iss.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{iss.description}</p>

                    {iss.resolved && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Resolved at {new Date(iss.resolvedAt || '').toLocaleTimeString()} by {iss.resolvedBy || 'Operations Desk'}
                        </span>
                      </div>
                    )}
                  </div>

                  {!iss.resolved && (
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-2 sm:pt-0">
                      <Link to={iss.actionPath}>
                        <Button className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold gap-1.5 h-9 px-3.5 cursor-pointer shadow-xs">
                          {iss.actionLabel}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>

                      <Button
                        onClick={() => handleResolve(iss.id)}
                        variant="outline"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9 px-3 cursor-pointer"
                      >
                        Mark Handled
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};