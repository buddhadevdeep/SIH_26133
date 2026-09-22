import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Building2,
  TrendingUp,
  GitBranch,
  Pill,
  Users,
  Activity,
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  frequency: string;
  lastGenerated: string;
  indicators: string[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'rep_01',
    title: 'Monthly OPD & IPD Clinical Footfall Summary',
    category: 'Clinical Operations',
    description: 'Aggregated outpatient consultations, admissions, bed occupancy days, and average length of stay.',
    frequency: 'Monthly',
    lastGenerated: '01 Mar 2026',
    indicators: ['Total OPD Visits', 'Inpatient Admissions', 'Bed Occupancy Rate', 'Emergency Casualties'],
  },
  {
    id: 'rep_02',
    title: 'District Referral Continuity & SLA Audit',
    category: 'Triage & Referrals',
    description: 'Cross-facility referral completion rates, ambulance dispatch intervals, and SLA breach analysis.',
    frequency: 'Bi-Weekly',
    lastGenerated: '08 Mar 2026',
    indicators: ['Referrals Initiated', 'Arrival Confirmation Rate', 'Avg Transit Time', 'Emergency Triage SLAs'],
  },
  {
    id: 'rep_03',
    title: 'Maternal & Child Health (MCH) Surveillance',
    category: 'Public Health',
    description: 'Institutional delivery percentages, high-risk pregnancy registrations, and immunization coverage.',
    frequency: 'Monthly',
    lastGenerated: '28 Feb 2026',
    indicators: ['ANC Registrations', 'Institutional Deliveries', 'ASHA High-Risk Tracked', 'Full Immunization'],
  },
  {
    id: 'rep_04',
    title: 'Essential Medicines List (EML) Consumption & Stockout Log',
    category: 'Supply Chain',
    description: 'District pharmacy issue registers, fast-moving drugs velocity, and stockout incidents.',
    frequency: 'Monthly',
    lastGenerated: '05 Mar 2026',
    indicators: ['Total Indent Value', 'Stockout Incidents', 'Near-Expiry Disposals', 'Buffer Deficits'],
  },
  {
    id: 'rep_05',
    title: 'Integrated Disease Surveillance Programme (IDSP) Form P/L',
    category: 'Epidemiology',
    description: 'Weekly syndromic reporting of fever, vector-borne, and acute diarrheal diseases across blocks.',
    frequency: 'Weekly',
    lastGenerated: '09 Mar 2026',
    indicators: ['Dengue/Malaria Cases', 'Waterborne Outbreaks', 'Cluster Signals', 'Serology Testing'],
  },
];

export const DistrictReportsPage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [selectedReportId, setSelectedReportId] = useState('rep_01');
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const currentReport = REPORT_TEMPLATES.find((r) => r.id === selectedReportId) || REPORT_TEMPLATES[0];

  const handleExport = (format: 'CSV' | 'PDF') => {
    setExportNotice(`${currentReport.title} exported as ${format} for ${selectedDistrict}.`);
    setTimeout(() => {
      setExportNotice(null);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Health Reports"
        subtitle={`Generate, preview, and download statutory health reports for ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Reports' },
        ]}
      />

      {/* Export Confirmation */}
      {exportNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
          <p className="font-semibold">{exportNotice}</p>
        </div>
      )}

      {/* Filter / Range Selector */}
      <Card className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Reporting Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="p-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 shadow-2xs focus:outline-hidden cursor-pointer"
            >
              <option value="LAST_30_DAYS">Last 30 Days (Feb - Mar 2026)</option>
              <option value="THIS_MONTH">This Month (March 2026)</option>
              <option value="LAST_QUARTER">Last Quarter (Q3 FY 2025-26)</option>
              <option value="ANNUAL">Financial Year 2025-2026</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('CSV')}
              className="text-xs font-semibold gap-1.5 text-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport('PDF')}
              className="text-xs font-semibold gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Templates Grid & Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template Selection */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
            Available Official Reports ({REPORT_TEMPLATES.length})
          </span>

          {REPORT_TEMPLATES.map((tmpl) => {
            const isSelected = tmpl.id === selectedReportId;
            return (
              <Card
                key={tmpl.id}
                onClick={() => setSelectedReportId(tmpl.id)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/40 shadow-xs ring-1 ring-teal-600/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {tmpl.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{tmpl.frequency}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2">{tmpl.title}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Right 2 Columns: Report Live Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 bg-white border-slate-200 space-y-6">
            {/* Header of Report */}
            <div className="pb-4 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-teal-100 text-teal-800">
                  Government of Gujarat • Dept of Health & Family Welfare
                </span>
                <span className="text-xs text-slate-400">Generated: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{currentReport.title}</h2>
              <p className="text-xs text-slate-500">
                Jurisdiction: <strong>{selectedDistrict} District Public Health Grid</strong> • Scope: All PHCs, CHCs, Sub-District & District Hospitals
              </p>
            </div>

            {/* Indicator Highlights */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reported Performance Indicators
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentReport.indicators.map((ind, idx) => (
                  <div key={ind} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-500 font-semibold block">{ind}</span>
                    <p className="text-lg font-black text-teal-800">
                      {idx === 0 ? '14,820' : idx === 1 ? '1,240' : idx === 2 ? '78.4%' : '98.2%'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabular Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Facility Breakdown Sample
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Facility Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Volume Tracked</th>
                      <th className="py-2.5 px-3">Compliance</th>
                      <th className="py-2.5 px-3 text-right">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {INITIAL_FACILITIES.map((fac, idx) => (
                      <tr key={fac.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{fac.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{fac.type.replace(/_/g, ' ')}</td>
                        <td className="py-2.5 px-3 text-slate-900 font-medium">
                          {idx === 0 ? '6,420' : idx === 1 ? '2,810' : '1,540'}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-bold">
                          {idx === 0 ? '99.1%' : '96.4%'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Footer */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
              <span>Digitally authenticated by District Health Office, {selectedDistrict}</span>
              <span>HealthConnect National Health Stack Portal</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
