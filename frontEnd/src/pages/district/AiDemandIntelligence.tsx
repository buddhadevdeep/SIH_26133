import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChartCard } from '@/components/common/ChartCard';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_AI_SUMMARY } from '@/mock/mockData';
import { aiApi } from '@/api/aiApi';
import { AiDemandIntelligenceSummary } from '@/types/ai';
import {
  BrainCircuit,
  Stethoscope,
  Bed,
  Ambulance,
  Droplet,
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const AiDemandIntelligence: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [aiData, setAiData] = useState<AiDemandIntelligenceSummary>(INITIAL_AI_SUMMARY);
  const [loading, setLoading] = useState(false);

  const fetchAiData = async () => {
    setLoading(true);
    try {
      const res = await aiApi.getDashboard();
      if (res.data) setAiData(res.data);
    } catch (err) {
      console.warn('Live AI dashboard fetch failed, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiData();
  }, [selectedDistrict]);

  const ai = aiData || INITIAL_AI_SUMMARY;

  const specialistChartData = (ai.specialistGaps || []).map((s) => ({
    name: s.specialty,
    Demand: s.predictedDemandConsultations,
    Capacity: s.availableCapacityConsultations,
    Gap: s.gapConsultations,
  }));

  const patientHourlyData = ai.patientLoad?.hourlyBreakdown || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Healthcare Demand Forecast"
        subtitle={`Forecast patient volume, specialist doctor gaps, and hospital bed demand for ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Demand Forecast' },
        ]}
        actions={
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs text-teal-900 font-bold flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-teal-700" />
            <span>Forecast Model: Active</span>
          </div>
        }
      />

      {/* Governance & Safety Principle Banner */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-950 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
        <p className="leading-relaxed">
          <strong>Decision Support Standard: </strong>
          {ai.disclaimer || 'Projections represent advisory statistical estimates based on historical patterns and should be used to support clinical staffing schedules.'}
        </p>
      </div>

      {/* Specialist Capacity Gaps Deck */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Specialist Clinical Capacity Gaps</h3>
          <p className="text-xs text-slate-500">Predicted consultation demand vs available physician hours</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ai.specialistGaps.map((gap) => (
            <Card
              key={gap.specialty}
              className={`p-5 space-y-3 transition-all ${
                gap.shortageSeverity === 'CRITICAL'
                  ? 'border-rose-300 bg-rose-50/30'
                  : gap.shortageSeverity === 'MODERATE'
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {gap.specialty}
                  </span>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {gap.gapConsultations > 0 ? `+${gap.gapConsultations}` : gap.gapConsultations}
                  </p>
                  <span className="text-[10px] text-slate-500">consultation deficit / day</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    gap.shortageSeverity === 'CRITICAL'
                      ? 'bg-rose-200 text-rose-900'
                      : gap.shortageSeverity === 'MODERATE'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {gap.shortageSeverity}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Daily Demand:</span>
                  <strong className="text-slate-900">{gap.predictedDemandConsultations}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current Capacity:</span>
                  <strong className="text-teal-800">{gap.availableCapacityConsultations}</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 font-medium">
                💡 Rec: {gap.suggestedAction}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Specialist Capacity Comparison Chart */}
      <ChartCard
        title="Specialist Demand vs Available Capacity"
        subtitle="Expected daily patient consultation volume vs available clinical duty capacity"
      >
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={specialistChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Demand" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Predicted Demand" />
              <Bar dataKey="Capacity" fill="#0f766e" radius={[6, 6, 0, 0]} name="Available Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Hourly Patient Rush Curve */}
      {patientHourlyData.length > 0 && (
        <ChartCard
          title="Daily OPD Peak Traffic Breakdown"
          subtitle="Hourly outpatient distribution across district hospitals to optimize registration counters"
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientHourlyData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="predicted" fill="#0284c7" radius={[4, 4, 0, 0]} name="Expected Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );
};
