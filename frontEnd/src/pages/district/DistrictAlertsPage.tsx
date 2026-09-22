import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocationContext } from '@/contexts/LocationContext';
import { operationsApi } from '@/api/operationsApi';
import { aiApi } from '@/api/aiApi';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  GitBranch,
  Pill,
  Droplet,
  Ambulance,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';

interface DistrictAlert {
  id: string;
  title: string;
  category: 'STOCK' | 'REFERRAL' | 'DISEASE' | 'FLEET' | 'COLD_CHAIN';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  facilityName: string;
  block: string;
  description: string;
  recommendedAction: string;
  timestamp: string;
  status: 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED';
}

const INITIAL_DISTRICT_ALERTS: DistrictAlert[] = [
  {
    id: 'alt_01',
    title: 'O-Negative Blood Reserves Below Minimum Buffer',
    category: 'STOCK',
    severity: 'CRITICAL',
    facilityName: 'Gandhinagar Civil Hospital',
    block: 'Sector 12',
    description: 'Only 3 units of O-Negative PRBC remaining. Minimum safety threshold is 8 units.',
    recommendedAction: 'Issue emergency voluntary donor appeal and request 5 units from Red Cross.',
    timestamp: '25 mins ago',
    status: 'ACTIVE',
  },
  {
    id: 'alt_02',
    title: 'Emergency Referral SLA Approaching Delay (REF-2026-8812)',
    category: 'REFERRAL',
    severity: 'HIGH',
    facilityName: 'Mansa CHC → Civil Hospital',
    block: 'Mansa',
    description: 'Severe pre-eclampsia referral patient transfer en-route. Triage bed reservation required.',
    recommendedAction: 'Direct high-dependency obstetric team to prepare emergency triage OT.',
    timestamp: '42 mins ago',
    status: 'ACTIVE',
  },
  {
    id: 'alt_03',
    title: 'Localized Dengue Cluster Signal Detected (14 cases)',
    category: 'DISEASE',
    severity: 'HIGH',
    facilityName: 'Pethapur Primary Health Centre',
    block: 'Pethapur Sub-center 2',
    description: 'Syndromic fever count is 2.8x above weekly baseline. Early vector cluster pattern identified.',
    recommendedAction: 'Dispatch ASHA vector larvicide team for anti-mosquito fogging in Sector 4 & 5.',
    timestamp: '2 hours ago',
    status: 'ACTIVE',
  },
  {
    id: 'alt_04',
    title: '108 Ambulance Coverage Gap in Kalol Rural Corridor',
    category: 'FLEET',
    severity: 'MEDIUM',
    facilityName: 'Kalol Sub-District Hospital',
    block: 'Kalol',
    description: '2 out of 3 stationed ambulances currently committed to long-distance transfers.',
    recommendedAction: 'Temporarily stage standby ambulance from Mansa to Kalol bypass intersection.',
    timestamp: '3 hours ago',
    status: 'ACTIVE',
  },
  {
    id: 'alt_05',
    title: 'ILR Vaccine Freezer Temperature Deviation (+7.8°C)',
    category: 'COLD_CHAIN',
    severity: 'MEDIUM',
    facilityName: 'Adraj PHC Cold Chain Point',
    block: 'Adraj',
    description: 'Ice-lined refrigerator temperature rose from +4°C to +7.8°C following local power cut.',
    recommendedAction: 'Backup diesel generator verified active; verify return to +2°C to +8°C safe window.',
    timestamp: '4 hours ago',
    status: 'RESOLVED',
  },
];

export const DistrictAlertsPage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [alerts, setAlerts] = useState<DistrictAlert[]>(INITIAL_DISTRICT_ALERTS);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    Promise.allSettled([operationsApi.getIssues(), aiApi.getDashboard()]).then(([issuesRes, aiRes]) => {
      let combinedAlerts = [...INITIAL_DISTRICT_ALERTS];
      if (issuesRes.status === 'fulfilled' && issuesRes.value.data && issuesRes.value.data.length > 0) {
        const liveIssues: DistrictAlert[] = issuesRes.value.data.map((iss: any) => ({
          id: iss.id,
          title: iss.title,
          category: (iss.category as any) || 'STOCK',
          severity: iss.severity as any,
          facilityName: iss.facilityName || 'Civil Hospital',
          block: iss.location || selectedDistrict,
          description: iss.description,
          recommendedAction: `Assigned to ${iss.assignedTo || 'Operations team'}`,
          timestamp: 'Just now',
          status: iss.status === 'RESOLVED' ? 'RESOLVED' : 'ACTIVE',
        }));
        combinedAlerts = [...liveIssues, ...combinedAlerts.filter((a) => !liveIssues.some((l) => l.id === a.id))];
      }
      setAlerts(combinedAlerts);
    }).catch(console.warn);
  }, [selectedDistrict]);

  const filteredAlerts = alerts.filter((alt) => {
    const matchesSeverity = severityFilter === 'ALL' || alt.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || alt.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  const handleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === 'RESOLVED' ? 'ACTIVE' : 'RESOLVED' } : a))
    );
  };

  const getCategoryIcon = (category: DistrictAlert['category']) => {
    switch (category) {
      case 'STOCK':
        return <Droplet className="h-4 w-4 text-rose-600" />;
      case 'REFERRAL':
        return <GitBranch className="h-4 w-4 text-teal-700" />;
      case 'DISEASE':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'FLEET':
        return <Ambulance className="h-4 w-4 text-sky-600" />;
      case 'COLD_CHAIN':
        return <Clock className="h-4 w-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Health Alerts"
        subtitle={`Urgent clinical, referral, and resource notifications across ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Alerts' },
        ]}
      />

      {/* 3 Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Incidents</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{activeAlerts}</p>
          <span className="text-[11px] text-amber-700 font-medium">Requiring supervision today</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Critical Priority</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{criticalCount}</p>
          <span className="text-[11px] text-rose-700 font-medium">Urgent intervention needed</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Resolved Today</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{resolvedCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Mitigated & closed</span>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Severity Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-2">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  severityFilter === sev
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev === 'ALL' ? 'All Severities' : sev}
              </button>
            ))}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5">
            {['ALL', 'ACTIVE', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Statuses' : st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No alerts match your filter</h3>
          <p className="text-xs text-slate-500 mt-1">All district systems are operating normally.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alt) => {
            const isResolved = alt.status === 'RESOLVED';
            const isCritical = alt.severity === 'CRITICAL';

            return (
              <Card
                key={alt.id}
                className={`p-5 bg-white border transition-all ${
                  isResolved
                    ? 'opacity-60 border-slate-200'
                    : isCritical
                    ? 'border-rose-200 bg-rose-50/10 hover:border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                        isCritical ? 'bg-rose-100' : 'bg-slate-100'
                      }`}
                    >
                      {getCategoryIcon(alt.category)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            alt.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : alt.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {alt.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {alt.facilityName} ({alt.block})
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400">{alt.timestamp}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{alt.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{alt.description}</p>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2 text-xs">
                        <span className="font-bold text-teal-800 block mb-0.5">Recommended Action:</span>
                        <p className="text-slate-700">{alt.recommendedAction}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 self-end sm:self-start">
                    <Button
                      size="sm"
                      variant={isResolved ? 'outline' : 'primary'}
                      onClick={() => handleResolveAlert(alt.id)}
                      className={`text-xs font-semibold gap-1.5 ${
                        isResolved
                          ? 'border-slate-200 text-slate-600'
                          : 'bg-teal-700 hover:bg-teal-800 text-white'
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <Clock className="h-3.5 w-3.5" />
                          <span>Reopen</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Resolve Alert</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
