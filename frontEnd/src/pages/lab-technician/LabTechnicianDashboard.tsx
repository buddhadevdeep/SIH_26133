import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DiagnosticOrder } from '@/types/clinical';
import { labApi } from '@/api/labApi';
import { SampleBarcodeLabelModal } from './components/SampleBarcodeLabelModal';
import { LabReportModal } from './components/LabReportModal';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Barcode,
  ArrowRight,
  Printer,
  ChevronRight,
  Search,
  Activity,
  ShieldAlert,
  Sliders,
  Cpu,
  RefreshCw,
  QrCode,
  FileCheck,
  Zap,
} from 'lucide-react';

export const LabTechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState<DiagnosticOrder | null>(null);
  const [selectedReportOrder, setSelectedReportOrder] = useState<DiagnosticOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await labApi.getOrders();
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch diagnostic orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Quick stats
  const awaitingSample = orders.filter((o) => o.status === 'AWAITING_SAMPLE');
  const samplesReadyToProcess = orders.filter(
    (o) => o.status === 'SAMPLE_COLLECTED' || o.status === 'SAMPLE_RECEIVED'
  );
  const inProcessing = orders.filter((o) => o.status === 'PROCESSING');
  const reportsReady = orders.filter(
    (o) => o.status === 'REPORT_READY' || o.status === 'COMPLETED'
  );
  const statUrgentOrders = orders.filter(
    (o) =>
      (o.priority === 'STAT' || o.priority === 'URGENT') &&
      o.status !== 'REPORT_READY' &&
      o.status !== 'COMPLETED' &&
      o.status !== 'REJECTED'
  );

  const handleStartProcessing = async (orderId: string) => {
    try {
      await labApi.startProcessing(orderId);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to start processing', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Station Header - Clean Green Theme */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Laboratory Work Desk • {user?.facilityName || 'Gandhinagar Civil Hospital'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Central Pathology & Diagnostic Hub
          </h1>
          <p className="text-xs text-slate-600">
            Duty Technologist: <strong className="text-slate-900">{user?.name || 'Ramesh Patel, MLT'}</strong> • NABL MC-3091 Calibrated Workstation
          </p>
        </div>

        {/* Quick Navigation Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => navigate('/lab-technician/tests')}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl cursor-pointer shadow-xs"
          >
            <FlaskConical className="h-4 w-4 text-teal-200" />
            <span>All Test Orders</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/lab-technician/samples')}
            className="bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 font-bold text-xs flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl cursor-pointer shadow-2xs"
          >
            <QrCode className="h-4 w-4 text-teal-700" />
            <span>Sample Desk</span>
          </Button>
        </div>
      </div>

      {/* STAT / Urgent Attention Alert Banner (if any pending) */}
      {statUrgentOrders.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white animate-bounce">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                  STAT / Critical Diagnostic Alert
                </span>
                <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[10px] font-extrabold text-rose-900">
                  {statUrgentOrders.length} Urgent {statUrgentOrders.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
              <p className="text-xs text-rose-900 mt-0.5 font-medium">
                {statUrgentOrders[0].testName} for patient{' '}
                <strong>{statUrgentOrders[0].patientName}</strong> ({statUrgentOrders[0].priority} Priority). Immediate analyzer processing and result entry required.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (statUrgentOrders[0].status === 'PROCESSING') {
                navigate(`/lab-technician/tests/${statUrgentOrders[0].id}/result`);
              } else {
                navigate(`/lab-technician/tests/${statUrgentOrders[0].id}`);
              }
            }}
            className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shrink-0 self-start sm:self-center"
          >
            Handle STAT Order
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Operational Workload Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Awaiting Sample */}
        <Card
          onClick={() => navigate('/lab-technician/tests?status=AWAITING_SAMPLE')}
          className="p-4 border-slate-200 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phlebotomy Due</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">
              {awaitingSample.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">pending draws</span>
          </div>
          <span className="mt-2 inline-block text-[11px] font-semibold text-amber-800">
            Awaiting Specimen Collection →
          </span>
        </Card>

        {/* 2. Received / Ready */}
        <Card
          onClick={() => navigate('/lab-technician/tests?status=SAMPLE_RECEIVED')}
          className="p-4 border-slate-200 hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ready to Load</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Barcode className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-800">
              {samplesReadyToProcess.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">tubes logged</span>
          </div>
          <span className="mt-2 inline-block text-[11px] font-semibold text-sky-800">
            Accessioned at Lab Desk →
          </span>
        </Card>

        {/* 3. In Processing */}
        <Card
          onClick={() => navigate('/lab-technician/tests?status=PROCESSING')}
          className="p-4 border-slate-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">On Analyzers</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-800">
              {inProcessing.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">running</span>
          </div>
          <span className="mt-2 inline-block text-[11px] font-semibold text-indigo-800">
            Awaiting Result Entry →
          </span>
        </Card>

        {/* 4. Reports Ready Today */}
        <Card
          onClick={() => navigate('/lab-technician/history')}
          className="p-4 border-slate-200 hover:border-teal-400 hover:shadow-sm transition-all cursor-pointer bg-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reports Released</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-teal-800">
              {reportsReady.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">verified</span>
          </div>
          <span className="mt-2 inline-block text-[11px] font-semibold text-teal-800">
            Pushed to Patient EHR →
          </span>
        </Card>
      </div>

      {/* Main Workspace: Active Orders & Automated Analyzers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Diagnostic Pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Active Diagnostic Pipeline
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Orders requiring immediate phlebotomy, analyzer loading, or result entry
                </p>
              </div>
              <Link
                to="/lab-technician/tests"
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                View Full Queue ({orders.length}) <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading diagnostic pipeline...</div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">No active laboratory orders.</div>
              ) : (
                orders.slice(0, 6).map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 truncate">
                          {order.testName}
                        </span>
                        <StatusBadge status={order.status} />
                        {order.priority && order.priority !== 'ROUTINE' && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              order.priority === 'STAT'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {order.priority}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {order.sampleId || order.id}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[11px]">
                        <span>
                          Patient: <strong className="text-slate-800">{order.patientName}</strong> ({order.patientAge}Y / {order.patientGender})
                        </span>
                        <span>•</span>
                        <span>
                          Container: <strong className="text-slate-700">{order.containerType || 'Standard'}</strong>
                        </span>
                        <span>•</span>
                        <span>By {order.orderedBy}</span>
                      </div>

                      {order.resultSummary && (
                        <p className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100 line-clamp-1">
                          <strong>Finding:</strong> {order.resultSummary}
                        </p>
                      )}
                    </div>

                    {/* Stage Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {order.barcodeNumber && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLabelOrder(order)}
                          className="text-xs h-8 px-2 border-slate-200 text-slate-600 hover:text-slate-900"
                          title="Print tube barcode label"
                        >
                          <Barcode className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {order.status === 'AWAITING_SAMPLE' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate('/lab-technician/samples')}
                          className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                          Phlebotomy Due
                        </Button>
                      )}

                      {(order.status === 'SAMPLE_COLLECTED' || order.status === 'SAMPLE_RECEIVED') && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartProcessing(order.id)}
                          className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          <span>Load Analyzer</span>
                        </Button>
                      )}

                      {order.status === 'PROCESSING' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/lab-technician/tests/${order.id}/result`)}
                          className="text-xs h-8 bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1"
                        >
                          <span>Enter Result</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {(order.status === 'REPORT_READY' || order.status === 'COMPLETED') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReportOrder(order)}
                          className="text-xs h-8 border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 font-semibold flex items-center gap-1"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>View Report</span>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/lab-technician/tests/${order.id}`)}
                        className="text-xs h-8 px-2 text-slate-400 hover:text-slate-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Analyzer Status & Quality Board */}
        <div className="space-y-4">
          {/* Automated Analyzers Station */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-teal-700" />
                  Analyzer Bench Status
                </CardTitle>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  All Online
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {/* Analyzer 1 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Sysmex XN-550</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Automated 5-Part Hematology</p>
                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                  <span>Reagent: <strong>84%</strong></span>
                  <span>QC Passed: <strong>08:00 AM</strong></span>
                </div>
              </div>

              {/* Analyzer 2 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Roche Cobas c311</span>
                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-800">
                    BATCH ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Clinical Chemistry & Electrolytes</p>
                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                  <span>Active Tubes: <strong>3 in disc</strong></span>
                  <span>QC Passed: <strong>08:15 AM</strong></span>
                </div>
              </div>

              {/* Analyzer 3 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Bio-Rad D-10 HPLC</span>
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                    STANDBY
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Hemoglobin A1c Glycated Fraction</p>
                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                  <span>Cartridge: <strong>14/20 runs</strong></span>
                  <span>Calibrated: <strong>Today</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Laboratory Quality Standards Card */}
          <Card className="border-slate-200 bg-gradient-to-br from-teal-900 to-slate-900 text-white p-5 shadow-xs rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
              NABL & Quality Assurance
            </span>
            <h4 className="text-base font-black mt-1">ABDM Health Record Interoperability</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every verified report is automatically encrypted and pushed directly to the citizen&apos;s Ayushman Bharat Health Account (ABHA) record.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Avg Turnaround</span>
                <span className="text-lg font-black text-white">42 Min</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Rejection Rate</span>
                <span className="text-lg font-black text-teal-300">1.2%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {selectedLabelOrder && (
        <SampleBarcodeLabelModal
          order={selectedLabelOrder}
          isOpen={true}
          onClose={() => setSelectedLabelOrder(null)}
        />
      )}

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