import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INITIAL_ASHA_PATIENTS } from '@/mock/mockData';
import { ashaApi } from '@/api/ashaApi';
import { AshaPatient } from '@/types/asha';
import { formatDate } from '@/lib/formatters';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Phone,
  User,
  Calendar,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  Share2,
  Activity,
  HeartPulse,
  Baby,
  Stethoscope,
} from 'lucide-react';

export const HighRiskPatients: React.FC = () => {
  const [patientsList, setPatientsList] = useState<AshaPatient[]>(INITIAL_ASHA_PATIENTS);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'MATERNAL' | 'INFANT' | 'NCD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    ashaApi.getCitizens().then((res) => {
      if (res.data && res.data.length > 0) {
        setPatientsList(res.data);
      }
    }).catch(console.warn);
  }, []);

  const allHighRisk = useMemo(() => patientsList.filter((p) => p.isHighRisk), [patientsList]);

  const filteredPatients = useMemo(() => {
    return allHighRisk.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.village && p.village.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.abhaId && p.abhaId.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterCategory === 'MATERNAL') return p.category === 'MATERNAL';
      if (filterCategory === 'INFANT') return p.category === 'INFANT';
      if (filterCategory === 'NCD') return p.category === 'NCD_HYPERTENSION' || p.category === 'NCD_DIABETES' || p.category === 'ELDERLY';
      return true;
    });
  }, [allHighRisk, filterCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Priority Care Register"
        subtitle="Focused tracking for high-risk maternal cases, severe childhood conditions, and critical chronic illnesses."
        breadcrumbs={[{ label: 'Frontline Dashboard', to: '/asha' }, { label: 'Priority Register' }]}
        actions={
          <Link to="/asha/referrals">
            <Button variant="outline" size="sm" className="gap-2 min-h-[44px]">
              <Share2 className="h-4 w-4 text-teal-700" />
              <span>Active Referrals ({allHighRisk.length})</span>
            </Button>
          </Link>
        }
      />

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total High-Priority</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{allHighRisk.length}</span>
            <span className="text-xs text-rose-700 font-semibold">Active Monitoring</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned across 2 village sectors</p>
        </Card>

        <Card className="p-4 border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Maternal Priority</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-700">
              {allHighRisk.filter((p) => p.category === 'MATERNAL').length}
            </span>
            <span className="text-xs text-slate-500">High-Risk ANC/PNC</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Gestational HTN & Anemia care</p>
        </Card>

        <Card className="p-4 border-slate-200/90 bg-white shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">NCD & Chronic Care</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-teal-800">
              {allHighRisk.filter((p) => p.category === 'NCD_HYPERTENSION' || p.category === 'NCD_DIABETES' || p.category === 'ELDERLY').length}
            </span>
            <span className="text-xs text-slate-500">Severe Chronic / Suspects</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Under PHC MO clinical plans</p>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 border-slate-200/90 bg-white shadow-xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search priority citizens by name, ABHA ID, or village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 min-h-[44px]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { key: 'ALL', label: `All Priority (${allHighRisk.length})` },
            { key: 'MATERNAL', label: 'Maternal ANC' },
            { key: 'INFANT', label: 'Infant UIP' },
            { key: 'NCD', label: 'NCD / Geriatric' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterCategory(tab.key as any)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors min-h-[36px] ${
                filterCategory === tab.key
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Patient Cards */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <Card className="p-12 text-center border-slate-200/90 bg-white">
            <CheckCircle2 className="mx-auto h-12 w-12 text-teal-600 mb-2" />
            <h3 className="text-base font-bold text-slate-900">No Priority Cases in Selected Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              All citizens in this filter category are currently within healthy baseline telemetry parameters.
            </p>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id} className="border-slate-200/90 bg-white shadow-xs overflow-hidden hover:border-teal-300 transition-colors">
              {/* Header Bar */}
              <div className="bg-slate-50/80 border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-sm shrink-0">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{patient.name}</h3>
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold text-rose-800 uppercase tracking-wide">
                        Priority Monitoring
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {patient.gender === 'F' ? 'Female' : 'Male'}, {patient.age} yrs • {patient.village} • ABHA:{' '}
                      <span className="font-mono text-slate-700">{patient.abhaId || 'In Progress'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                    {patient.category?.replace(/_/g, ' ')}
                  </span>
                  {patient.gestationalWeek && (
                    <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 border border-teal-200">
                      Week {patient.gestationalWeek}
                    </span>
                  )}
                </div>
              </div>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Clinical Red Flags Callout */}
                <div className="rounded-xl bg-rose-50/50 p-3.5 border border-rose-200/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-900">
                    <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
                    <span>Clinical Red Flags & Risk Indicators</span>
                  </div>
                  <ul className="list-disc pl-5 text-xs text-rose-950 font-semibold space-y-1">
                    {patient.highRiskReasons?.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* Follow-up & Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Emergency Contact:</span>
                    <span className="font-bold text-slate-800">{patient.emergencyContactName || 'Family Member'}</span>{' '}
                    <span className="text-slate-600">(+91 {patient.emergencyContactPhone || patient.phone})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Scheduled Clinical Review:</span>
                    <span className="font-bold text-teal-800 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(patient.nextFollowUpDate)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <a
                    href={`tel:${patient.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 min-h-[44px] transition-colors"
                  >
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>Call Citizen</span>
                  </a>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/asha/vitals?patientId=${patient.id}`}>
                      <Button variant="outline" size="sm" className="text-xs min-h-[44px] font-bold">
                        <Activity className="h-3.5 w-3.5 mr-1 text-teal-700" />
                        Log Vitals
                      </Button>
                    </Link>
                    <Link to={`/asha/vitals?tab=screening&patientId=${patient.id}`}>
                      <Button variant="outline" size="sm" className="text-xs min-h-[44px] font-bold">
                        <Stethoscope className="h-3.5 w-3.5 mr-1 text-teal-700" />
                        Re-Screen
                      </Button>
                    </Link>
                    <Link to="/asha/referrals">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs min-h-[44px] bg-teal-700 hover:bg-teal-800 font-bold"
                      >
                        <Share2 className="h-3.5 w-3.5 mr-1" />
                        Refer to PHC / CHC
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
