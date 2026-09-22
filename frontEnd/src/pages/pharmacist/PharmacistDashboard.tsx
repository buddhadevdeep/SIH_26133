import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { pharmacyApi } from '@/api/pharmacyApi';
import { Prescription } from '@/types/clinical';
import { MedicineInventoryItem, DispensingRecord } from '@/types/resources';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowRight,
  Package,
  Calendar,
  History,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';

export const PharmacistDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines, setMedicines] = useState<MedicineInventoryItem[]>([]);
  const [history, setHistory] = useState<DispensingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxRes, medRes, histRes] = await Promise.all([
        pharmacyApi.getPrescriptions(),
        pharmacyApi.getMedicines(),
        pharmacyApi.getDispensingHistory(),
      ]);

      if (rxRes.success && rxRes.data) setPrescriptions(rxRes.data);
      if (medRes.success && medRes.data) setMedicines(medRes.data);
      if (histRes.success && histRes.data) setHistory(histRes.data);
    } catch (err) {
      console.error('Failed to load pharmacy dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingPrescriptions = prescriptions.filter((p) => p.status === 'PENDING');
  const dispensedTodayCount = history.length;
  const lowStockItems = medicines.filter(
    (m) => m.status === 'LOW_STOCK' || m.status === 'OUT_OF_STOCK'
  );
  const expiringBatches = medicines.filter((m) => m.status === 'EXPIRING_SOON');

  // Filtered queue for quick search on dashboard
  const filteredPending = pendingPrescriptions.filter((rx) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      rx.patientName.toLowerCase().includes(q) ||
      rx.id.toLowerCase().includes(q) ||
      rx.doctorName.toLowerCase().includes(q) ||
      rx.items.some(
        (it) =>
          it.medicineName.toLowerCase().includes(q) ||
          (it.genericName && it.genericName.toLowerCase().includes(q))
      )
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      {/* 1. Header Banner - Clean Green Theme */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 border border-teal-300 px-3 py-0.5 text-xs font-bold text-teal-900">
              <Pill className="h-3.5 w-3.5 text-teal-700" />
              <span>Outpatient Pharmacy Dispensing Station</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Welcome back, {user?.name || 'Pharmacist Priya Nair'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {user?.facilityName || 'Gandhinagar Civil Hospital'} • Counter 2 (OPD Base) • Safe dispensing with live inventory synchronization.
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => navigate('/pharmacist/prescriptions')}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 min-h-[42px] rounded-xl shadow-xs cursor-pointer"
            >
              <Clock className="h-4 w-4 mr-2 text-teal-200" />
              View Dispense Queue ({pendingPrescriptions.length})
            </Button>
            <Button
              onClick={() => navigate('/pharmacist/stock')}
              className="bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 font-bold text-xs sm:text-sm px-4 py-2.5 min-h-[42px] rounded-xl cursor-pointer shadow-2xs"
            >
              <Package className="h-4 w-4 mr-2 text-teal-700" />
              Stock Inventory
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Urgent Attention Banner (if any stock is low or near expiry) */}
      {(lowStockItems.length > 0 || expiringBatches.length > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Action Required: {lowStockItems.length} Low Stock Alert{lowStockItems.length > 1 ? 's' : ''} &amp; {expiringBatches.length} Expiring Batch{expiringBatches.length > 1 ? 'es' : ''}
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Ensure alternate supply or batch quarantine to avoid patient dispensing interruptions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lowStockItems.length > 0 && (
              <Button
                onClick={() => navigate('/pharmacist/stock')}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-900 bg-white hover:bg-amber-100 text-xs font-bold"
              >
                Inspect Stock
              </Button>
            )}
            {expiringBatches.length > 0 && (
              <Button
                onClick={() => navigate('/pharmacist/expiry')}
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Review Expiry Watch
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3. Real-Time Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Prescriptions */}
        <Card
          onClick={() => navigate('/pharmacist/prescriptions')}
          className="p-5 border-slate-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-2">
            {pendingPrescriptions.length}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-amber-800 font-medium">Awaiting dispensing</span>
            <span className="text-teal-700 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              Queue &rarr;
            </span>
          </div>
        </Card>

        {/* Dispensed Today */}
        <Card
          onClick={() => navigate('/pharmacist/history')}
          className="p-5 border-slate-200 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dispensed Today
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 group-hover:bg-teal-100 transition-colors">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-teal-800 mt-2">
            {dispensedTodayCount}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-emerald-700 font-semibold">100% Stock Synchronized</span>
            <span className="text-teal-700 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              History &rarr;
            </span>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card
          onClick={() => navigate('/pharmacist/stock')}
          className="p-5 border-slate-200 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Low Stock Items
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 mt-2">
            {lowStockItems.length}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-rose-700 font-medium truncate max-w-[130px]">
              {lowStockItems[0]?.medicineName || 'All optimal'}
            </span>
            <span className="text-rose-700 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              Stock &rarr;
            </span>
          </div>
        </Card>

        {/* Expiring Batches */}
        <Card
          onClick={() => navigate('/pharmacist/expiry')}
          className="p-5 border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Expiring Batches
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-700 mt-2">
            {expiringBatches.length}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-amber-800 font-medium">Near expiry (&lt;60d)</span>
            <span className="text-amber-700 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center">
              Watch &rarr;
            </span>
          </div>
        </Card>
      </div>

      {/* 4. Quick Prescription Search & Live Queue Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Pending Prescriptions Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-700" />
                  Live Prescriptions Queue
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time digital doctor prescriptions awaiting clinical verification &amp; dispensing
                </p>
              </div>

              {/* Fast Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, Rx ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading prescription queue...</div>
              ) : filteredPending.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">All Prescriptions Dispensed!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    There are no pending prescriptions awaiting verification in the queue right now.
                  </p>
                </div>
              ) : (
                filteredPending.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-200 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {rx.patientName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {rx.id}
                        </span>
                        <StatusBadge status={rx.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                          {rx.doctorName}
                        </span>
                        <span>•</span>
                        <span className="text-slate-600 truncate max-w-xs font-medium">
                          {rx.diagnosisSummary}
                        </span>
                      </div>

                      {/* Medicine pills preview */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {rx.items.map((it) => (
                          <span
                            key={it.id}
                            className="inline-flex items-center text-[11px] bg-teal-50/80 text-teal-900 border border-teal-100 px-2 py-0.5 rounded-lg font-medium"
                          >
                            {it.medicineName.split(' ')[0]} {it.dosage} ({it.totalQuantity})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                      <Button
                        onClick={() => navigate(`/pharmacist/prescriptions/${rx.id}`)}
                        variant="primary"
                        size="sm"
                        className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs min-h-[38px] px-3.5"
                      >
                        Open &amp; Dispense
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {pendingPrescriptions.length > 3 && (
                <div className="pt-2 text-center">
                  <Button
                    onClick={() => navigate('/pharmacist/prescriptions')}
                    variant="ghost"
                    size="sm"
                    className="text-teal-800 hover:text-teal-950 text-xs font-bold"
                  >
                    View All {pendingPrescriptions.length} Prescriptions in Queue &rarr;
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Quick Links, Stock Snapshot & Quality Protocol */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Pharmacist Workspaces
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1">
              <Link
                to="/pharmacist/prescriptions"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-teal-700" />
                  <span>Prescription Queue</span>
                </div>
                <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                  {pendingPrescriptions.length}
                </span>
              </Link>

              <Link
                to="/pharmacist/stock"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 text-teal-700" />
                  <span>Stock Inventory</span>
                </div>
                <span className="text-slate-400 text-xs">{medicines.length} items</span>
              </Link>

              <Link
                to="/pharmacist/expiry"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span>Expiry &amp; Quarantine Watch</span>
                </div>
                <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                  {expiringBatches.length}
                </span>
              </Link>

              <Link
                to="/pharmacist/history"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <History className="h-4 w-4 text-teal-700" />
                  <span>Dispense History Log</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Safe Dispensing Checklist Card */}
          <Card className="border-teal-100 bg-teal-50/50 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                Good Dispensing Practice (GPP)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-teal-950 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>Verify patient identity &amp; ABHA ID before handing over medications.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>Confirm dosage, duration, and frequency with bilingual instructions slip.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>Ensure batch expiry is checked. Never dispense expired or quarantined stock.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
                <span>Authoritative stock deduction occurs automatically upon 1-click confirmation.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
