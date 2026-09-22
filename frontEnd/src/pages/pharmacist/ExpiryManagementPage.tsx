import React, { useState, useEffect } from 'react';
import { pharmacyApi } from '@/api/pharmacyApi';
import { MedicineInventoryItem } from '@/types/resources';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  X,
  RefreshCw,
  Ban,
} from 'lucide-react';

export const ExpiryManagementPage: React.FC = () => {
  const [medicines, setMedicines] = useState<MedicineInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNDER_30' | '30_TO_60' | 'QUARANTINED'>('ALL');

  // Quarantine Modal State
  const [quarantineModalMed, setQuarantineModalMed] = useState<MedicineInventoryItem | null>(null);
  const [quarantineReason, setQuarantineReason] = useState('Near expiry safety hold (<30 days)');
  const [submittingQuarantine, setSubmittingQuarantine] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const res = await pharmacyApi.getMedicines();
      if (res.success && res.data) {
        setMedicines(res.data);
      }
    } catch (err) {
      console.error('Failed to load medicines for expiry watch', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate days to expiry
  const getDaysToExpiry = (expiryDateStr: string) => {
    const today = new Date();
    const exp = new Date(expiryDateStr);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Identify at-risk batches
  const atRiskBatches = medicines.filter((m) => {
    const days = getDaysToExpiry(m.expiryDate);
    return days <= 120 || m.status === 'EXPIRING_SOON' || m.status === 'QUARANTINED';
  });

  const filteredBatches = atRiskBatches.filter((m) => {
    const days = getDaysToExpiry(m.expiryDate);
    if (filterTab === 'UNDER_30') return days <= 30 && m.status !== 'QUARANTINED';
    if (filterTab === '30_TO_60') return days > 30 && days <= 60 && m.status !== 'QUARANTINED';
    if (filterTab === 'QUARANTINED') return m.status === 'QUARANTINED' || days < 0;
    return true;
  });

  const handleQuarantine = async () => {
    if (!quarantineModalMed) return;

    setSubmittingQuarantine(true);
    try {
      const res = await pharmacyApi.quarantineBatch(
        quarantineModalMed.id,
        quarantineReason || 'Quarantined by Pharmacist for quality assurance'
      );

      if (res.success && res.data) {
        setMedicines((prev) =>
          prev.map((m) => (m.id === res.data.id ? res.data : m))
        );
        setToastMessage(`Batch ${quarantineModalMed.batchNumber} successfully placed under quarantine.`);
        setQuarantineModalMed(null);
      }
    } catch (err) {
      console.error('Quarantine error', err);
      alert('Failed to quarantine batch. Please try again.');
    } finally {
      setSubmittingQuarantine(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in-50 duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <Calendar className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Quality Assurance &amp; Pharmacovigilance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Expiry &amp; Quarantine Watch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Proactively track near-expiry batches, execute quarantine holds, and prevent patient risk.
          </p>
        </div>

        <Button
          onClick={loadMedicines}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto text-slate-600 hover:text-slate-900 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh Batches
        </Button>
      </div>

      {/* Toast banner */}
      {toastMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Safety Protocol Card */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl shrink-0 mt-0.5">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-900">
              Hospital Drug Safety &amp; Disposal Protocol
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
              Medications expiring in &lt;30 days must be flagged for immediate utilization or returned to District Central Medical Stores. Once quarantined, batches are strictly blocked from being selected during dispensing.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filterTab === 'ALL'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          All Monitored ({atRiskBatches.length})
        </button>

        <button
          onClick={() => setFilterTab('UNDER_30')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            filterTab === 'UNDER_30'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Critical: &lt;30 Days
        </button>

        <button
          onClick={() => setFilterTab('30_TO_60')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            filterTab === '30_TO_60'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-800 hover:bg-amber-50'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Warning: 30–60 Days
        </button>

        <button
          onClick={() => setFilterTab('QUARANTINED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            filterTab === 'QUARANTINED'
              ? 'bg-purple-800 text-white shadow-xs'
              : 'text-purple-800 hover:bg-purple-50'
          }`}
        >
          <Ban className="h-3.5 w-3.5" />
          Quarantined Batches
        </button>
      </div>

      {/* 4. Batches List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading batch monitors...</div>
        ) : filteredBatches.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Batches in This Category</h3>
            <p className="text-xs text-slate-500 mt-1">
              All monitored batches are outside this risk window or handled properly.
            </p>
          </Card>
        ) : (
          filteredBatches.map((med) => {
            const daysRemaining = getDaysToExpiry(med.expiryDate);
            const isExpired = daysRemaining <= 0;
            const isUnder30 = daysRemaining <= 30;
            const isQuarantined = med.status === 'QUARANTINED';

            return (
              <Card
                key={med.id}
                className={`border transition-all overflow-hidden ${
                  isQuarantined
                    ? 'border-purple-200 bg-purple-50/20'
                    : isExpired
                    ? 'border-rose-300 bg-rose-50/30'
                    : isUnder30
                    ? 'border-rose-200 bg-white'
                    : 'border-amber-200 bg-white'
                }`}
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900">
                        {med.medicineName}
                      </span>
                      <StatusBadge status={med.status} />
                      <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        Batch: {med.batchNumber}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Generic: <strong className="text-slate-700">{med.genericName}</strong></span>
                      <span>•</span>
                      <span>Category: {med.category}</span>
                      <span>•</span>
                      <span>
                        Expiry: <strong>{new Date(med.expiryDate).toLocaleDateString()}</strong>
                      </span>
                    </div>

                    {/* Quarantine details if active */}
                    {isQuarantined && med.quarantineReason && (
                      <p className="text-xs text-purple-900 bg-purple-100/70 border border-purple-200 rounded-lg px-3 py-1 font-semibold">
                        🔒 Quarantine Reason: {med.quarantineReason}
                      </p>
                    )}
                  </div>

                  {/* Right: Days remaining & Actions */}
                  <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-right space-y-1">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tight ${
                          isExpired
                            ? 'bg-rose-100 text-rose-800'
                            : isUnder30
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {isExpired ? 'EXPIRED' : `${daysRemaining} Days Left`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Current Stock: <strong>{med.availableQuantity.toLocaleString()} {med.unit}</strong>
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {!isQuarantined ? (
                        <Button
                          onClick={() => setQuarantineModalMed(med)}
                          variant="outline"
                          size="sm"
                          className="border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100 text-xs font-bold min-h-[38px] px-3.5"
                        >
                          <Ban className="h-3.5 w-3.5 mr-1.5 text-purple-700" />
                          Quarantine Batch
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-purple-800 bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200">
                          Quarantine Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 5. Quarantine Modal */}
      {quarantineModalMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl sm:max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Quarantine Batch Hold</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Batch: {quarantineModalMed.batchNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuarantineModalMed(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <p className="font-bold">Caution:</p>
                <p>
                  Placing this batch into quarantine will immediately prevent it from being allocated or dispensed to patients across all dispensary counters.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Medicine: <span className="font-normal text-slate-900">{quarantineModalMed.medicineName}</span>
                </label>
                <p className="text-slate-500">
                  Stock on Hold: {quarantineModalMed.availableQuantity.toLocaleString()} {quarantineModalMed.unit}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quarantine Reason / Justification:
                </label>
                <select
                  value={quarantineReason}
                  onChange={(e) => setQuarantineReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 shadow-2xs rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                >
                  <option value="Near expiry safety hold (<30 days)">Near expiry safety hold (&lt;30 days)</option>
                  <option value="Expired drug - Awaiting disposal">Expired drug - Awaiting disposal</option>
                  <option value="Cold chain excursion / temperature breach">Cold chain excursion / temperature breach</option>
                  <option value="Packaging damage / compromised seal">Packaging damage / compromised seal</option>
                  <option value="Discoloration or physical defect reported">Discoloration or physical defect reported</option>
                  <option value="Central government recall order">Central government recall order</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                onClick={() => setQuarantineModalMed(null)}
                variant="outline"
                size="sm"
                className="text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuarantine}
                disabled={submittingQuarantine}
                variant="primary"
                size="sm"
                className="bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold min-h-[38px] px-4"
              >
                {submittingQuarantine ? 'Processing...' : 'Confirm Quarantine Hold'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
