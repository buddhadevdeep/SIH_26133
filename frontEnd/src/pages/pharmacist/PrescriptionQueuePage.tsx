import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pharmacyApi } from '@/api/pharmacyApi';
import { Prescription } from '@/types/clinical';
import { MedicineInventoryItem } from '@/types/resources';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Clock,
  CheckCircle2,
  Search,
  ArrowRight,
  Stethoscope,
  Pill,
  AlertCircle,
  Calendar,
  Check,
  FileText,
} from 'lucide-react';

export const PrescriptionQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<MedicineInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DISPENSED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxRes, medRes] = await Promise.all([
        pharmacyApi.getPrescriptions(),
        pharmacyApi.getMedicines(),
      ]);
      if (rxRes.success && rxRes.data) setPrescriptions(rxRes.data);
      if (medRes.success && medRes.data) setMedicines(medRes.data);
    } catch (err) {
      console.error('Failed to load prescriptions', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = prescriptions.filter((p) => p.status === 'PENDING').length;
  const dispensedCount = prescriptions.filter((p) => p.status === 'DISPENSED').length;

  const filteredPrescriptions = prescriptions.filter((rx) => {
    // Status filter
    if (statusFilter !== 'ALL' && rx.status !== statusFilter) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    return (
      rx.patientName.toLowerCase().includes(q) ||
      rx.id.toLowerCase().includes(q) ||
      rx.doctorName.toLowerCase().includes(q) ||
      rx.diagnosisSummary.toLowerCase().includes(q) ||
      rx.items.some(
        (it) =>
          it.medicineName.toLowerCase().includes(q) ||
          (it.genericName && it.genericName.toLowerCase().includes(q))
      )
    );
  });

  // Check inventory availability for each prescription
  const checkPrescriptionStock = (rx: Prescription) => {
    let allAvailable = true;
    let anyLow = false;

    rx.items.forEach((it) => {
      const genNorm = (it.genericName || '').toLowerCase().trim();
      const nameNorm = it.medicineName.toLowerCase().trim();
      const med = medicines.find(
        (m) =>
          (genNorm && m.genericName.toLowerCase().includes(genNorm)) ||
          m.medicineName.toLowerCase().includes(nameNorm)
      );

      if (!med || med.availableQuantity < it.totalQuantity || med.status === 'OUT_OF_STOCK') {
        allAvailable = false;
      } else if (med.status === 'LOW_STOCK') {
        anyLow = true;
      }
    });

    return { allAvailable, anyLow };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
              <Pill className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Prescription Fulfillment Station
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Digital Prescriptions Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review clinical orders, verify patient identity, and dispense essential medications safely.
          </p>
        </div>

        {/* Refresh button */}
        <Button
          onClick={loadData}
          variant="outline"
          size="sm"
          className="self-start sm:self-auto text-slate-600 hover:text-slate-900 text-xs font-semibold"
        >
          Refresh Queue
        </Button>
      </div>

      {/* 2. Controls: Status Tabs & Instant Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>Pending</span>
            <span className="ml-1 rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px]">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('DISPENSED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'DISPENSED'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-700" />
            <span>Dispensed</span>
            <span className="ml-1 rounded-full bg-teal-100 text-teal-900 px-1.5 py-0.2 text-[10px]">
              {dispensedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All</span>
            <span className="ml-1 text-slate-400 text-[10px]">{prescriptions.length}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, Rx ID, doctor, or medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 3. Prescription Cards List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading prescriptions...</div>
        ) : filteredPrescriptions.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Prescriptions Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No prescriptions match your current filter and search criteria. Try selecting another tab or clearing search.
            </p>
          </Card>
        ) : (
          filteredPrescriptions.map((rx) => {
            const stockCheck = checkPrescriptionStock(rx);

            return (
              <Card
                key={rx.id}
                className="border-slate-200 hover:border-teal-300 hover:shadow-md transition-all duration-150 overflow-hidden"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Row: Patient Info + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-black text-base text-slate-900 tracking-tight">
                          {rx.patientName}
                        </span>
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {rx.id}
                        </span>
                        <StatusBadge status={rx.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Stethoscope className="h-3.5 w-3.5 text-teal-700" />
                          {rx.doctorName}
                        </span>
                        <span>•</span>
                        <span>{rx.facilityName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {new Date(rx.issuedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          on {new Date(rx.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Stock status badge & Action */}
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      {rx.status === 'PENDING' && (
                        <div className="text-right hidden md:block">
                          {stockCheck.allAvailable ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <Check className="h-3 w-3" /> Stock Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              <AlertCircle className="h-3 w-3" /> Partial / Low Stock
                            </span>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={() => navigate(`/pharmacist/prescriptions/${rx.id}`)}
                        variant={rx.status === 'PENDING' ? 'primary' : 'outline'}
                        className={
                          rx.status === 'PENDING'
                            ? 'bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs min-h-[42px] px-4 shadow-xs'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs min-h-[42px] px-4'
                        }
                      >
                        {rx.status === 'PENDING' ? (
                          <>
                            Open &amp; Dispense
                            <ArrowRight className="h-4 w-4 ml-1.5" />
                          </>
                        ) : (
                          'View Details & Slip'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Middle Row: Diagnosis Summary */}
                  <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3.5 py-2 text-xs text-slate-700">
                    <span className="font-bold text-slate-900">Diagnosis: </span>
                    {rx.diagnosisSummary}
                  </div>

                  {/* Bottom Row: Prescribed Items Grid */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Prescribed Medications ({rx.items.length})
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {rx.items.map((it) => (
                        <div
                          key={it.id}
                          className="rounded-xl border border-slate-200/90 bg-white p-3 space-y-1 text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-extrabold text-slate-900 leading-snug">
                              {it.medicineName}
                            </span>
                            <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                              Qty: {it.totalQuantity}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 font-medium">{it.frequency}</p>

                          {it.instructions && (
                            <p className="text-[11px] text-slate-600 italic truncate">
                              &ldquo;{it.instructions}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
