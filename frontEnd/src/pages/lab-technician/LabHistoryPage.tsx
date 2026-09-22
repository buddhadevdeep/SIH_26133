import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DiagnosticOrder } from '@/types/clinical';
import { labApi } from '@/api/labApi';
import { LabReportModal } from './components/LabReportModal';
import {
  FileCheck,
  Search,
  Printer,
  CheckCircle2,
  Calendar,
  Award,
  Clock,
  ShieldCheck,
  Building2,
  Download,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';

export const LabHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedReportOrder, setSelectedReportOrder] = useState<DiagnosticOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await labApi.getOrders();
      if (res.data) {
        // Filter to completed / ready reports
        const completed = res.data.filter(
          (o) => o.status === 'REPORT_READY' || o.status === 'COMPLETED'
        );
        setOrders(completed);
      }
    } catch (err) {
      console.error('Failed to load lab history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesCategory = categoryFilter === 'ALL' || o.testCategory === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.patientName.toLowerCase().includes(q) ||
      o.testName.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      (o.patientAbha && o.patientAbha.toLowerCase().includes(q)) ||
      (o.sampleId && o.sampleId.toLowerCase().includes(q)) ||
      (o.barcodeNumber && o.barcodeNumber.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Audit & Documentation
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Verified Reports & Diagnostic Archive
          </h1>
          <p className="text-xs text-slate-500">
            NABL accredited quality log of certified and ABDM-published patient investigation reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 border border-teal-200 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-teal-700" />
            <span>NABL MC-3091 Verified</span>
          </span>
        </div>
      </div>

      {/* Quality KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Published Reports
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">1,482</p>
          <span className="text-[11px] text-teal-700 font-semibold">Synced to ABHA EHR</span>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Average Turnaround
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">38 min</p>
          <span className="text-[11px] text-emerald-800 font-semibold">Under 60m SLA benchmark</span>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            EQAS Quality Score
          </span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">99.4%</p>
          <span className="text-[11px] text-indigo-800 font-semibold">External QC Proficiency</span>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Rejection Rate
          </span>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">1.18%</p>
          <span className="text-[11px] text-amber-800 font-semibold">Pre-analytical threshold &lt;2%</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 p-4 space-y-3 bg-white shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search archive by patient name, test, ABHA ID, barcode, or sample ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs text-slate-700 cursor-pointer focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
            >
              <option value="ALL">All Categories</option>
              <option value="HEMATOLOGY">Hematology</option>
              <option value="BIOCHEMISTRY">Biochemistry</option>
              <option value="MICROBIOLOGY">Microbiology</option>
              <option value="PATHOLOGY">Pathology</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Archived Reports List */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Archived Reports: <strong className="text-slate-800">{filteredOrders.length}</strong>
          </span>
          <span className="text-[11px]">All reports are legally retained for 7 years under NABL</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading archive records...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-1">
              <FileCheck className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No verified reports matching query.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {order.testName}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      REPORT READY
                    </span>
                    {order.isAbnormal ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                        Parameter Flagged
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        Normal Range
                      </span>
                    )}
                    <span className="font-mono text-slate-400 text-[11px]">
                      {order.sampleId || order.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 text-[11px]">
                    <span>
                      Patient: <strong className="text-slate-900">{order.patientName}</strong> ({order.patientAge}Y / {order.patientGender})
                    </span>
                    <span>•</span>
                    <span>ABHA: <strong className="font-mono text-teal-800">{order.patientAbha || '22-8491-0392-1102'}</strong></span>
                    <span>•</span>
                    <span>Doctor: {order.orderedBy}</span>
                  </div>

                  {order.resultSummary && (
                    <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <strong>Observation:</strong> {order.resultSummary}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                    <span>
                      Certified by: <strong className="text-slate-700">{order.technicianName || 'Ramesh Patel, MLT'}</strong>
                    </span>
                    <span>•</span>
                    <span>Released: {order.completedAt ? new Date(order.completedAt).toLocaleString('en-IN') : 'Today'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedReportOrder(order)}
                    className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-9 px-3 flex items-center gap-1.5 font-bold shadow-xs"
                  >
                    <Printer className="h-4 w-4" />
                    <span>View & Print Official Report</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Report Modal */}
      {selectedReportOrder && (
        <LabReportModal
          order={selectedReportOrder}
          isOpen={true}
          onClose={() => setSelectedReportOrder(null)}
        />
      )}
    </div>
  );
};