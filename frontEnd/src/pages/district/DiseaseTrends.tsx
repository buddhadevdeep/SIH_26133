import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChartCard } from '@/components/common/ChartCard';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_AI_SUMMARY } from '@/mock/mockData';
import { aiApi } from '@/api/aiApi';
import { TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const DiseaseTrends: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [selectedDisease, setSelectedDisease] = useState('Dengue & Vector-Borne Fever');
  const [trends, setTrends] = useState(INITIAL_AI_SUMMARY.diseaseForecasts);

  useEffect(() => {
    aiApi.getDashboard().then((res) => {
      if (res.data?.diseaseForecasts && res.data.diseaseForecasts.length > 0) {
        setTrends(res.data.diseaseForecasts);
      }
    }).catch(console.warn);
  }, [selectedDistrict]);

  const currentTrend = trends.find((t) => t.diseaseName === selectedDisease) || trends[0] || INITIAL_AI_SUMMARY.diseaseForecasts[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disease Trends & Surveillance"
        subtitle={`Track seasonal illness patterns, fever spikes, and epidemiological forecasts for ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Disease Trends' },
        ]}
      />

      {/* Advisory Banner */}
      <div className="rounded-2xl bg-teal-50/70 border border-teal-200 p-3.5 text-xs text-teal-950 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
        <p className="leading-relaxed">
          <strong>Surveillance Guidance: </strong>
          Projections indicate statistical deviations vs seasonal baselines to assist in early source reduction and vector fogging.
        </p>
      </div>

      {/* Disease Selection Pills */}
      <div className="flex flex-wrap gap-2">
        {trends.map((t) => (
          <button
            key={t.diseaseName}
            onClick={() => setSelectedDisease(t.diseaseName)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedDisease === t.diseaseName
                ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.diseaseName}
          </button>
        ))}
      </div>

      {/* Primary Trend Chart */}
      <ChartCard
        title={`${currentTrend.diseaseName} — Actual vs Seasonal Baseline & 30-Day Forecast`}
        subtitle="Statistical projection computed from 3-year historical hospital OPD/IPD data"
      >
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentTrend.forecastPoints} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
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
              <Line
                type="monotone"
                dataKey="expectedCases"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                name="Historical Baseline"
              />
              <Line
                type="monotone"
                dataKey="observedCases"
                stroke="#0f766e"
                strokeWidth={3}
                name="Observed Cases"
              />
              <Line
                type="monotone"
                dataKey="forecastCases"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Forecast Projection"
              />
              <Line
                type="monotone"
                dataKey="upperConfidence"
                stroke="#fca5a5"
                strokeDasharray="2 2"
                name="Upper Bound (95%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Suggested Interventions Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 bg-white border-slate-200 space-y-2">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
            1. Field Mobilization
          </span>
          <h4 className="font-bold text-slate-900">Intensify ASHA Fever Surveys</h4>
          <p className="text-slate-600 leading-relaxed">
            Direct ASHAs in Pethapur and Mansa rural pockets to record daily temperature logs and distribute ORS packets.
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 space-y-2">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
            2. Hospital Triage
          </span>
          <h4 className="font-bold text-slate-900">Prepare Dedicated Isolation Wards</h4>
          <p className="text-slate-600 leading-relaxed">
            Reserve 20 mosquito-netted inpatient beds at Gandhinagar Civil Hospital and verify NS1 antigen kit supplies.
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 space-y-2">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
            3. Supply Pre-Positioning
          </span>
          <h4 className="font-bold text-slate-900">Buffer IV Fluids & Platelets</h4>
          <p className="text-slate-600 leading-relaxed">
            Ensure minimum buffer of 1,000 units of Normal Saline and confirm blood bank apheresis platelet availability.
          </p>
        </Card>
      </div>
    </div>
  );
};
