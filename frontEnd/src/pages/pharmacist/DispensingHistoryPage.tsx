import React, { useState, useEffect } from 'react';
import { pharmacyApi } from '@/api/pharmacyApi';
import { DispensingRecord } from '@/types/resources';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  History,
  Search,
  Printer,
  CheckCircle2,
  FileText,
  Clock,
  X,
} from 'lucide-react';

export const DispensingHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<DispensingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DispensingRecord | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await pharmacyApi.getDispensingHistory();
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load dispensing history', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((rec) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      rec.patientName.toLowerCase().includes(q) ||
      rec.prescriptionId.toLowerCase().includes(q) ||
      rec.id.toLowerCase().includes(q) ||
      rec.doctorName.toLowerCase().includes(q) ||
      rec.items.some(
        (it) =>
          it.medicineName.toLowerCase().includes(q) ||
          (it.genericName && it.genericName.toLowerCase().includes(q)) ||
          it.batchNumber.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in-50 duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
              <History className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Dispensary Compliance &amp; Record Book
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Dispensing History &amp; Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Chronological audit trail of fulfilled prescriptions, batch tracking, and patient handover receipts.
          </p>
        </div>

        <Button
          onClick={loadHistory}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto text-slate-600 hover:text-slate-900 text-xs font-semibold"
        >
          Refresh Log
        </Button>
      </div>

      {/* 2. Search & Stats Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, Rx ID, doctor, or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 px-2 font-medium">
          Showing <strong>{filteredHistory.length}</strong> of {history.length} dispensed transactions
        </div>
      </div>

      {/* 3. History Records List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading dispensing logs...</div>
        ) : filteredHistory.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Dispensing Records Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              No transactions match your search. Completed dispensations will automatically appear here.
            </p>
          </Card>
        ) : (
          filteredHistory.map((rec) => (
            <Card
              key={rec.id}
              className="border-slate-200 hover:border-teal-300 hover:shadow-xs transition-all overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Top Row: Patient, Rx Code, Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900">
                        {rec.patientName}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({rec.patientAge}Y • {rec.patientGender})
                      </span>
                      <span className="font-mono text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200 px-2 py-0.5 rounded-md">
                        {rec.prescriptionId}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="h-3 w-3" /> Dispensed
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Doctor: <strong className="text-slate-700">{rec.doctorName}</strong></span>
                      <span>•</span>
                      <span>Dispensed by: <strong className="text-teal-800">{rec.dispensedBy}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {new Date(rec.dispensedAt).toLocaleDateString()} at{' '}
                        {new Date(rec.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setSelectedRecord(rec)}
                    variant="outline"
                    size="sm"
                    className="self-start sm:self-auto border-slate-300 text-slate-700 hover:text-teal-900 hover:border-teal-300 text-xs font-bold px-3 py-1.5 min-h-[38px]"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5 text-teal-700" />
                    Handover Receipt
                  </Button>
                </div>

                {/* Items Dispensed */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Dispensed Items ({rec.items.length})
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {rec.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-900 block">{item.medicineName}</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            Batch: <strong>{item.batchNumber}</strong>
                          </span>
                          <p className="text-[11px] text-slate-600 font-medium italic">
                            {item.dosageInstructions}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-black text-sm text-teal-900 bg-teal-100/70 px-2 py-0.5 rounded">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Counselling note */}
                {rec.notes && (
                  <div className="bg-teal-50/50 border border-teal-100 rounded-xl px-3.5 py-2 text-xs text-teal-950">
                    <span className="font-bold">Pharmacist Counselling Note: </span>
                    {rec.notes}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 4. Handover Slip Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl sm:max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Patient Medication Handover Slip
                  </h3>
                  <p className="text-xs text-slate-500">Official Dispensary Receipt • {selectedRecord.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="text-sm font-black text-slate-900 uppercase">
                  {selectedRecord.facilityName || 'Gandhinagar Civil Hospital'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Department of Health &amp; Family Welfare • Outpatient Pharmacy Counter
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Rx ID: <strong>{selectedRecord.prescriptionId}</strong> • Dispensed: {new Date(selectedRecord.dispensedAt).toLocaleDateString()} {new Date(selectedRecord.dispensedAt).toLocaleTimeString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient</span>
                  <span className="font-extrabold text-slate-900">{selectedRecord.patientName}</span>
                  <span className="text-[11px] text-slate-500 block">{selectedRecord.patientAge}Y • {selectedRecord.patientGender}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Prescribed By</span>
                  <span className="font-extrabold text-slate-900">{selectedRecord.doctorName}</span>
                  <span className="text-[11px] text-slate-500 block">Dispensed by: {selectedRecord.dispensedBy}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                  Dispensed Medications
                </span>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                  {selectedRecord.items.map((it, idx) => (
                    <div key={idx} className="p-3 bg-white space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{it.medicineName}</span>
                        <span className="text-teal-800">Qty: {it.quantity} {it.unit}</span>
                      </div>
                      <div className="text-slate-600 font-medium">
                        Instructions: {it.dosageInstructions}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Batch: {it.batchNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRecord.notes && (
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-[11px] text-teal-950">
                  <strong>Pharmacist Advice:</strong> {selectedRecord.notes}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Button
                onClick={() => setSelectedRecord(null)}
                variant="outline"
                className="text-xs font-bold"
              >
                Close Window
              </Button>

              <Button
                onClick={() => window.print()}
                variant="primary"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs min-h-[40px] px-5"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Slip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
