import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DiagnosticOrder } from '@/types/clinical';
import { labApi } from '@/api/labApi';
import { SampleBarcodeLabelModal } from './components/SampleBarcodeLabelModal';
import { SampleRejectionModal } from './components/SampleRejectionModal';
import {
  Barcode,
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  TestTube2,
  Clock,
  Printer,
  ShieldCheck,
  Building2,
  ArrowRight,
  Filter,
  Check,
  AlertCircle,
  FileWarning,
} from 'lucide-react';

export const SampleDeskPage: React.FC = () => {
  const [activeDeskTab, setActiveDeskTab] = useState<'COLLECTION' | 'RECEPTION'>('COLLECTION');
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  const [selectedLabelOrder, setSelectedLabelOrder] = useState<DiagnosticOrder | null>(null);
  const [selectedRejectOrder, setSelectedRejectOrder] = useState<DiagnosticOrder | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await labApi.getOrders();
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to load sample desk orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const collectionOrders = orders.filter(
    (o) =>
      o.status === 'AWAITING_SAMPLE' &&
      (!searchQuery ||
        o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const receptionOrders = orders.filter(
    (o) =>
      (o.status === 'SAMPLE_COLLECTED' || o.status === 'SAMPLE_RECEIVED') &&
      (!searchQuery ||
        o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.barcodeNumber && o.barcodeNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.sampleId && o.sampleId.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleCollect = async (order: DiagnosticOrder) => {
    try {
      const res = await labApi.collectSample(order.id, {
        technicianName: 'Ramesh Patel, MLT',
        notes: 'Specimen drawn at central phlebotomy booth. Patient identity verified.',
      });
      if (res.data) {
        setSelectedLabelOrder(res.data);
      }
      await fetchOrders();
    } catch (err) {
      console.error('Failed to collect sample', err);
    }
  };

  const handleReceiveAndLoad = async (orderId: string) => {
    try {
      await labApi.receiveSample(orderId, { technicianName: 'Ramesh Patel, MLT' });
      await labApi.startProcessing(orderId, { technicianName: 'Ramesh Patel, MLT' });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to receive and load sample', err);
    }
  };

  const handleBarcodeLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        (o.barcodeNumber && o.barcodeNumber.toLowerCase() === query) ||
        (o.sampleId && o.sampleId.toLowerCase() === query) ||
        o.id.toLowerCase() === query
    );

    if (found) {
      setScannedFeedback(`Found order: ${found.testName} for ${found.patientName}`);
      if (found.status === 'SAMPLE_COLLECTED' || found.status === 'SAMPLE_RECEIVED') {
        setActiveDeskTab('RECEPTION');
      } else if (found.status === 'AWAITING_SAMPLE') {
        setActiveDeskTab('COLLECTION');
      }
      setSearchQuery(found.patientName);
    } else {
      setScannedFeedback(`No active order matching barcode: "${barcodeInput}"`);
    }
    setTimeout(() => setScannedFeedback(null), 5000);
  };

  const handleConfirmRejection = async (reason: string, notes: string) => {
    if (!selectedRejectOrder) return;
    await labApi.rejectSample(selectedRejectOrder.id, {
      reason,
      notes,
      technicianName: 'Ramesh Patel, MLT',
    });
    setSelectedRejectOrder(null);
    await fetchOrders();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Phlebotomy & Specimen Desk
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sample Collection & Accession Desk
          </h1>
          <p className="text-xs text-slate-500">
            Verify patient identity, confirm tube collection, print thermal barcodes, and accept samples
          </p>
        </div>

        {/* Rapid Barcode Scanner Search */}
        <form onSubmit={handleBarcodeLookup} className="flex items-center gap-2">
          <div className="relative">
            <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Scan Barcode / Sample ID..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-56 sm:w-64 rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 font-mono focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-9 px-3"
          >
            Accession
          </Button>
        </form>
      </div>

      {scannedFeedback && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs font-bold text-teal-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
          <span>{scannedFeedback}</span>
        </div>
      )}

      {/* Dual Workstation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveDeskTab('COLLECTION');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeDeskTab === 'COLLECTION'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <TestTube2 className="h-4 w-4" />
          <span>1. Phlebotomy Collection ({collectionOrders.length} Due)</span>
        </button>

        <button
          onClick={() => {
            setActiveDeskTab('RECEPTION');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-6 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeDeskTab === 'RECEPTION'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Barcode className="h-4 w-4" />
          <span>2. Specimen Reception & Loading ({receptionOrders.length} Ready)</span>
        </button>
      </div>

      {/* Search Input for Current Tab */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={
            activeDeskTab === 'COLLECTION'
              ? 'Filter patients waiting for blood/urine collection...'
              : 'Filter accessioned tubes waiting for analyzers...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
        />
      </div>

      {/* Tab 1: Phlebotomy Collection */}
      {activeDeskTab === 'COLLECTION' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Phlebotomy Collection Station
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify 2 patient identifiers (Name & ABHA/Phone) before venipuncture
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                {collectionOrders.length} Walk-in Patients
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading phlebotomy queue...</div>
            ) : collectionOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700">Phlebotomy queue is clear!</p>
                <p className="text-slate-400">All pending specimen collections have been drawn.</p>
              </div>
            ) : (
              collectionOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {order.patientName}
                      </span>
                      <span className="text-slate-500">
                        ({order.patientAge}Y / {order.patientGender})
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        ABHA: {order.patientAbha || '22-8491-0392-1102'}
                      </span>
                      {order.priority && order.priority !== 'ROUTINE' && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-extrabold text-rose-800 uppercase">
                          {order.priority}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Test: {order.testName}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                        Container: <strong>{order.containerType || 'K2 EDTA Lavender Top'}</strong>
                      </span>
                      <span className="text-slate-500">Ordered by {order.orderedBy}</span>
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50/70 p-1.5 rounded border border-amber-200">
                        <strong>Clinical Instruction:</strong> {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCollect(order)}
                      className="bg-teal-700 hover:bg-teal-800 text-white text-xs h-9 px-3 flex items-center gap-1.5 font-bold shadow-xs"
                    >
                      <Barcode className="h-4 w-4" />
                      <span>Collect & Print Label</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Specimen Reception & Loading */}
      {activeDeskTab === 'RECEPTION' && (
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Specimen Reception & Analyzer Loading Desk
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect tube integrity. Pre-analytical rejection protocol active for hemolyzed/clotted tubes.
                </p>
              </div>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
                {receptionOrders.length} Specimen Tubes
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading reception desk...</div>
            ) : receptionOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-1">
                <CheckCircle2 className="h-8 w-8 text-sky-600 mx-auto" />
                <p className="font-bold text-slate-700">No unhandled specimen tubes at desk.</p>
                <p className="text-slate-400">All collected tubes have been loaded onto analyzers.</p>
              </div>
            ) : (
              receptionOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {order.testName}
                      </span>
                      <StatusBadge status={order.status} />
                      <span className="font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                        {order.sampleId || 'SMP-482109'}
                      </span>
                      {order.barcodeNumber && (
                        <span className="font-mono text-slate-500 text-[11px]">
                          BC: {order.barcodeNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 text-[11px]">
                      <span>
                        Patient: <strong className="text-slate-900">{order.patientName}</strong> ({order.patientAge}Y / {order.patientGender})
                      </span>
                      <span>•</span>
                      <span>Container: <strong>{order.containerType || 'Standard'}</strong></span>
                      <span>•</span>
                      <span>Sample: <strong>{order.sampleType || 'Whole Blood'}</strong></span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Collected at: {order.sampleCollectedAt ? new Date(order.sampleCollectedAt).toLocaleTimeString('en-IN') : 'Just now'} • Ordered by {order.orderedBy}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLabelOrder(order)}
                      className="text-xs h-9 px-2.5 border-slate-200 text-slate-700 hover:text-slate-900 flex items-center gap-1"
                      title="Re-print Barcode Label"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Label</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRejectOrder(order)}
                      className="text-xs h-9 border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center gap-1 font-semibold"
                    >
                      <FileWarning className="h-3.5 w-3.5" />
                      <span>Reject Specimen</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReceiveAndLoad(order.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-3 flex items-center gap-1.5 font-bold shadow-xs"
                    >
                      <TestTube2 className="h-4 w-4" />
                      <span>Accept & Load Analyzer</span>
                    </Button>
                  </div>
                </div>
              ))
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

      {selectedRejectOrder && (
        <SampleRejectionModal
          order={selectedRejectOrder}
          isOpen={true}
          onClose={() => setSelectedRejectOrder(null)}
          onConfirm={handleConfirmRejection}
        />
      )}
    </div>
  );
};