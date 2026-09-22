import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DiagnosticOrder } from '@/types/clinical';
import { labApi } from '@/api/labApi';
import { SampleBarcodeLabelModal } from './components/SampleBarcodeLabelModal';
import { LabReportModal } from './components/LabReportModal';
import { SampleRejectionModal } from './components/SampleRejectionModal';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  Activity,
  ArrowLeft,
  Printer,
  Barcode,
  TestTube2,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  FileWarning,
} from 'lucide-react';

export const TestOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<DiagnosticOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState<DiagnosticOrder | null>(null);
  const [selectedReportOrder, setSelectedReportOrder] = useState<DiagnosticOrder | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await labApi.getOrderById(id);
      if (res.data) {
        setOrder(res.data);
      }
    } catch (err) {
      console.error('Failed to load order details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCollect = async () => {
    if (!order) return;
    try {
      const res = await labApi.collectSample(order.id, {
        technicianName: 'Ramesh Patel, MLT',
        notes: 'Drawn at phlebotomy booth. Patient identity checked.',
      });
      if (res.data) {
        setOrder(res.data);
        setSelectedLabelOrder(res.data);
      }
    } catch (err) {
      console.error('Failed to collect sample', err);
    }
  };

  const handleStartProcessing = async () => {
    if (!order) return;
    try {
      const res = await labApi.startProcessing(order.id, {
        technicianName: 'Ramesh Patel, MLT',
      });
      if (res.data) {
        setOrder(res.data);
      }
    } catch (err) {
      console.error('Failed to start processing', err);
    }
  };

  const handleConfirmRejection = async (reason: string, notes: string) => {
    if (!order) return;
    try {
      const res = await labApi.rejectSample(order.id, {
        reason,
        notes,
        technicianName: 'Ramesh Patel, MLT',
      });
      if (res.data) {
        setOrder(res.data);
      }
      setIsRejectModalOpen(false);
    } catch (err) {
      console.error('Failed to reject sample', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading test order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-bold text-slate-800">Diagnostic order not found.</p>
        <Link to="/lab-technician/tests">
          <Button variant="outline" size="sm">
            Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back and Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/lab-technician/tests')}
            className="rounded-xl p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Back to Queue"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Order #{order.id}
              </span>
              <StatusBadge status={order.status} />
              {order.priority && order.priority !== 'ROUTINE' && (
                <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800 uppercase">
                  {order.priority}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {order.testName}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {order.barcodeNumber && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLabelOrder(order)}
              className="text-xs flex items-center gap-1.5"
            >
              <Barcode className="h-4 w-4" />
              <span>Print Barcode</span>
            </Button>
          )}

          {order.status === 'AWAITING_SAMPLE' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleCollect}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <TestTube2 className="h-4 w-4" />
              <span>Confirm Phlebotomy Collection</span>
            </Button>
          )}

          {(order.status === 'SAMPLE_COLLECTED' || order.status === 'SAMPLE_RECEIVED') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRejectModalOpen(true)}
                className="border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs flex items-center gap-1"
              >
                <FileWarning className="h-3.5 w-3.5" />
                <span>Reject Specimen</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Activity className="h-4 w-4" />
                <span>Load on Analyzer</span>
              </Button>
            </>
          )}

          {order.status === 'PROCESSING' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/lab-technician/tests/${order.id}/result`)}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <FlaskConical className="h-4 w-4" />
              <span>Enter Parameter Results</span>
            </Button>
          )}

          {(order.status === 'REPORT_READY' || order.status === 'COMPLETED') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedReportOrder(order)}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <FileCheck className="h-4 w-4" />
              <span>View Official Report</span>
            </Button>
          )}
        </div>
      </div>

      {/* Rejection notice banner (if rejected) */}
      {order.status === 'REJECTED' && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-5 space-y-2 text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-700" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Specimen Rejected (Pre-Analytical Failure)
            </h3>
          </div>
          <p>
            <strong>Reason:</strong> {order.rejectionReason}
          </p>
          {order.rejectionNotes && (
            <p>
              <strong>Technologist Observation:</strong> {order.rejectionNotes}
            </p>
          )}
          <p className="text-[11px] text-rose-700 pt-1 border-t border-rose-200">
            A notification has been sent to the treating medical officer ({order.orderedBy}) and ward desk to order a fresh sample collection.
          </p>
        </div>
      )}

      {/* Patient & Order Demographics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Info */}
        <Card className="border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="h-4 w-4 text-teal-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Patient Demographics
            </h3>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-base font-black text-slate-900">{order.patientName}</p>
            <p className="text-slate-600">
              {order.patientAge} Years Old • {order.patientGender}
            </p>
            <p className="text-slate-500 font-mono text-[11px]">
              ABHA: <strong>{order.patientAbha || '22-8491-0392-1102'}</strong>
            </p>
            <p className="text-slate-500 text-[11px]">
              Contact: <strong>{order.patientPhone || '+91 98765 43210'}</strong>
            </p>
          </div>
        </Card>

        {/* Specimen & Doctor Info */}
        <Card className="border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <TestTube2 className="h-4 w-4 text-teal-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Specimen & Referral Details
            </h3>
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-slate-900">
              Specimen: {order.sampleType || 'Whole Blood'}
            </p>
            <p className="text-slate-600">
              Container: <strong>{order.containerType || 'K2 EDTA Lavender Top'}</strong>
            </p>
            <p className="text-slate-600">
              Ordered by: <strong>{order.orderedBy}</strong> ({order.facilityName})
            </p>
            <p className="font-mono text-[11px] text-teal-800">
              Sample ID: {order.sampleId || 'Awaiting Phlebotomy'} • BC: {order.barcodeNumber || 'Pending'}
            </p>
          </div>
        </Card>
      </div>

      {/* Specimen Journey & Lifecycle Timeline */}
      <Card className="border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Clock className="h-4 w-4 text-teal-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Specimen Chain of Custody & Lifecycle Timeline
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-xs">
          {/* Step 1 */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
              ✓
            </span>
            <span className="font-bold text-slate-900 block">1. Order Placed</span>
            <span className="text-[10px] text-slate-500 block">By {order.orderedBy}</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              {new Date(order.orderedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Step 2 */}
          <div
            className={`p-3 rounded-xl border space-y-1 ${
              order.status !== 'AWAITING_SAMPLE'
                ? 'border-slate-200 bg-slate-50'
                : 'border-amber-300 bg-amber-50/70'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                order.status !== 'AWAITING_SAMPLE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-200 text-amber-900'
              }`}
            >
              {order.status !== 'AWAITING_SAMPLE' ? '✓' : '2'}
            </span>
            <span className="font-bold text-slate-900 block">2. Phlebotomy</span>
            <span className="text-[10px] text-slate-500 block">
              {order.sampleCollectedAt ? 'Drawn & Labeled' : 'Pending Patient Draw'}
            </span>
          </div>

          {/* Step 3 */}
          <div
            className={`p-3 rounded-xl border space-y-1 ${
              order.status === 'PROCESSING' ||
              order.status === 'REPORT_READY' ||
              order.status === 'COMPLETED'
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-200 bg-white opacity-60'
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
              3
            </span>
            <span className="font-bold text-slate-900 block">3. Lab Accession</span>
            <span className="text-[10px] text-slate-500 block">
              {order.sampleReceivedAt ? 'Verified at Desk' : 'In transit / Pending'}
            </span>
          </div>

          {/* Step 4 */}
          <div
            className={`p-3 rounded-xl border space-y-1 ${
              order.status === 'PROCESSING' ||
              order.status === 'REPORT_READY' ||
              order.status === 'COMPLETED'
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-200 bg-white opacity-60'
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">
              4
            </span>
            <span className="font-bold text-slate-900 block">4. Analyzer Run</span>
            <span className="text-[10px] text-slate-500 block">
              {order.processedAt ? 'Bench Testing Done' : 'Awaiting Load'}
            </span>
          </div>

          {/* Step 5 */}
          <div
            className={`p-3 rounded-xl border space-y-1 ${
              order.status === 'REPORT_READY' || order.status === 'COMPLETED'
                ? 'border-emerald-300 bg-emerald-50/70'
                : 'border-slate-200 bg-white opacity-60'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${
                order.status === 'REPORT_READY' || order.status === 'COMPLETED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              5
            </span>
            <span className="font-bold text-slate-900 block">5. Report Released</span>
            <span className="text-[10px] text-slate-500 block">
              {order.completedAt ? 'Published to EHR' : 'Pending Results'}
            </span>
          </div>
        </div>
      </Card>

      {/* Parameter Results Table (if results are available) */}
      {order.resultParameters && order.resultParameters.length > 0 && (
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Validated Parameter Findings
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Biological values and reference ranges recorded for this specimen
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReportOrder(order)}
              className="text-xs border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Official Report</span>
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-4">Parameter</th>
                  <th className="py-2.5 px-4">Result Value</th>
                  <th className="py-2.5 px-4">Unit</th>
                  <th className="py-2.5 px-4">Reference Range</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.resultParameters.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-4 font-black text-slate-900 font-mono text-sm">
                      {p.value}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{p.unit}</td>
                    <td className="py-2.5 px-4 text-slate-600">{p.referenceRange}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          p.status === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : p.status === 'ABNORMAL'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {order.resultSummary && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block mb-1">Technologist Summary:</span>
                <p className="text-slate-700">{order.resultSummary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {isRejectModalOpen && (
        <SampleRejectionModal
          order={order}
          isOpen={true}
          onClose={() => setIsRejectModalOpen(false)}
          onConfirm={handleConfirmRejection}
        />
      )}
    </div>
  );
};