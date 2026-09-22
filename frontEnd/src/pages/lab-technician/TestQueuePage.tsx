import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DiagnosticOrder } from '@/types/clinical';
import { labApi } from '@/api/labApi';
import { SampleBarcodeLabelModal } from './components/SampleBarcodeLabelModal';
import { LabReportModal } from './components/LabReportModal';
import {
  FlaskConical,
  Search,
  Filter,
  ArrowRight,
  Barcode,
  Clock,
  Activity,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Zap,
  FileCheck,
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'AWAITING_SAMPLE', label: 'Phlebotomy Due' },
  { id: 'SAMPLE_RECEIVED', label: 'Received at Lab' },
  { id: 'PROCESSING', label: 'In Processing' },
  { id: 'REPORT_READY', label: 'Reports Ready' },
  { id: 'REJECTED', label: 'Rejected' },
];

export const TestQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialStatus = searchParams.get('status') || 'ALL';
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLabelOrder, setSelectedLabelOrder] = useState<DiagnosticOrder | null>(null);
  const [selectedReportOrder, setSelectedReportOrder] = useState<DiagnosticOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await labApi.getOrders({
        status: activeStatus !== 'ALL' ? activeStatus : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        search: searchQuery || undefined,
      });
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch test queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeStatus, categoryFilter, priorityFilter, searchQuery]);

  const handleStatusTabClick = (statusId: string) => {
    setActiveStatus(statusId);
    if (statusId === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', statusId);
    }
    setSearchParams(searchParams);
  };

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Laboratory Worklist
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Diagnostic Orders Queue
          </h1>
          <p className="text-xs text-slate-500">
            Real-time accessioning, specimen processing, and validation pipeline
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveStatus('ALL');
              setCategoryFilter('ALL');
              setPriorityFilter('ALL');
              setSearchQuery('');
            }}
            className="text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/lab-technician/samples')}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs flex items-center gap-1.5"
          >
            <Barcode className="h-4 w-4" />
            <span>Sample Reception</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 p-4 space-y-3 bg-white shadow-xs">
        {/* Top Search & Dropdown Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, phone, test name, order ID, barcode, or sample ID..."
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

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs text-slate-700 cursor-pointer focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="STAT">STAT (Emergency)</option>
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusTabClick(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeStatus === tab.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Orders List / Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{orders.length}</strong> laboratory orders
          </span>
          <span className="text-[11px]">Sorted by urgency and order timestamp</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading diagnostic worklist...</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-2">
              <FlaskConical className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No diagnostic orders match the current criteria.</p>
              <p className="text-slate-400">Try changing status tabs or clearing search queries.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                {/* Left: Test Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {order.testName}
                    </span>
                    <StatusBadge status={order.status} />
                    {order.priority && order.priority !== 'ROUTINE' && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          order.priority === 'STAT'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {order.priority}
                      </span>
                    )}
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                      {order.testCategory}
                    </span>
                  </div>

                  {/* Patient demographics & Specimen context */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-slate-600 text-[11px]">
                    <div>
                      Patient: <strong className="text-slate-800">{order.patientName}</strong> ({order.patientAge}Y / {order.patientGender})
                    </div>
                    <div>
                      Specimen: <strong className="text-slate-800">{order.sampleType || 'Whole Blood'}</strong> ({order.containerType || 'Standard Tube'})
                    </div>
                    <div>
                      Sample ID: <span className="font-mono font-semibold text-teal-800">{order.sampleId || 'Not collected'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    <span>Order: <strong>{order.id}</strong></span>
                    <span>•</span>
                    <span>Ordered by {order.orderedBy} ({order.facilityName})</span>
                    {order.barcodeNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-slate-600">BC: {order.barcodeNumber}</span>
                      </>
                    )}
                  </div>

                  {order.resultSummary && (
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-200 text-slate-700 text-[11px]">
                      <strong>Finding:</strong> {order.resultSummary}
                    </div>
                  )}

                  {order.rejectionReason && (
                    <div className="rounded-lg bg-rose-50 p-2 border border-rose-200 text-rose-800 text-[11px]">
                      <strong>Rejected:</strong> {order.rejectionReason} {order.rejectionNotes && `— ${order.rejectionNotes}`}
                    </div>
                  )}
                </div>

                {/* Right: Operational Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                  {order.barcodeNumber && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLabelOrder(order)}
                      className="text-xs h-9 px-2.5 border-slate-200 text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
                      title="Print tube barcode label"
                    >
                      <Barcode className="h-4 w-4" />
                      <span className="hidden sm:inline">Label</span>
                    </Button>
                  )}

                  {order.status === 'AWAITING_SAMPLE' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/lab-technician/samples')}
                      className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Phlebotomy Due</span>
                    </Button>
                  )}

                  {(order.status === 'SAMPLE_COLLECTED' || order.status === 'SAMPLE_RECEIVED') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartProcessing(order.id)}
                      className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
                    >
                      <Activity className="h-4 w-4" />
                      <span>Load Analyzer</span>
                    </Button>
                  )}

                  {order.status === 'PROCESSING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/lab-technician/tests/${order.id}/result`)}
                      className="text-xs h-9 bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5"
                    >
                      <span>Enter Results</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}

                  {(order.status === 'REPORT_READY' || order.status === 'COMPLETED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReportOrder(order)}
                      className="text-xs h-9 border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 font-semibold flex items-center gap-1.5"
                    >
                      <FileCheck className="h-4 w-4" />
                      <span>View Report</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/lab-technician/tests/${order.id}`)}
                    className="text-xs h-9 px-2 text-slate-400 hover:text-slate-700"
                    title="View order details and specimen journey"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

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