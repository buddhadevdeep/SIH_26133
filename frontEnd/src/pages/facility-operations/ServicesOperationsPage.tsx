import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { operationsApi } from '@/api/operationsApi';
import { OperationalService } from '@/types/operations';
import { ServiceInterruptionModal } from './components/ServiceInterruptionModal';
import { QueueDelayModal } from './components/QueueDelayModal';
import {
  Activity,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Search,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

export const ServicesOperationsPage: React.FC = () => {
  const [services, setServices] = useState<OperationalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<OperationalService | null>(null);
  const [delayTargetService, setDelayTargetService] = useState<OperationalService | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await operationsApi.getServices();
      if (res.data) setServices(res.data);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const filteredServices = services.filter((s) => {
    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const counts = {
    total: services.length,
    operational: services.filter((s) => s.status === 'OPERATIONAL').length,
    degraded: services.filter((s) => s.status === 'DEGRADED').length,
    offline: services.filter((s) => s.status === 'OFFLINE').length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-3.5 text-xs font-semibold text-teal-900 flex items-center justify-between animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-teal-700 font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Department Operations
            </span>
            <span className="text-xs text-slate-400">Civil Hospital Gandhinagar</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Services & OPD Status Matrix</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor and adjust department operational conditions, wait queues, clinician staffing, and downtime notices.
          </p>
        </div>

        <Button
          onClick={loadServices}
          variant="outline"
          className="self-start sm:self-center border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold gap-2 min-h-[40px] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
          Refresh Matrix
        </Button>
      </div>

      {/* Service Status KPI Ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Services</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{counts.total}</p>
          <span className="text-[11px] text-slate-400">Clinical & Support</span>
        </Card>
        <Card className="p-3.5 border-emerald-200 bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Operational</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{counts.operational}</p>
          <span className="text-[11px] text-emerald-600">Normal Throughput</span>
        </Card>
        <Card className="p-3.5 border-amber-200 bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Degraded / Slow</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{counts.degraded}</p>
          <span className="text-[11px] text-amber-600">High Wait Times</span>
        </Card>
        <Card className="p-3.5 border-rose-200 bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">Offline / Halted</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{counts.offline}</p>
          <span className="text-[11px] text-rose-600">Maintenance / Paused</span>
        </Card>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search department by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { label: 'All', value: 'ALL' },
            { label: 'OPD Clinics', value: 'CLINICAL_OPD' },
            { label: 'Emergency & ICU', value: 'EMERGENCY_ICU' },
            { label: 'Diagnostics & Lab', value: 'DIAGNOSTICS' },
            { label: 'Pharmacy', value: 'PHARMACY' },
            { label: 'Support', value: 'SUPPORT_SERVICES' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                categoryFilter === cat.value
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading operational service catalog...</div>
      ) : filteredServices.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700">No departments match your search criteria</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
            }}
            className="text-xs text-teal-700 font-bold mt-2 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((srv) => {
            const isOp = srv.status === 'OPERATIONAL';
            const isDeg = srv.status === 'DEGRADED';
            const isOff = srv.status === 'OFFLINE';

            return (
              <Card
                key={srv.id}
                className={`p-4 border transition-all flex flex-col justify-between hover:shadow-xs ${
                  isOff
                    ? 'border-rose-300 bg-rose-50/10'
                    : isDeg
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {srv.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{srv.name}</h3>
                      <span className="text-[11px] text-slate-500 font-medium">{srv.category}</span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isOp
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isDeg
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {isOp && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                      {isDeg && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                      {isOff && <PauseCircle className="h-3 w-3 text-rose-600" />}
                      {srv.status}
                    </span>
                  </div>

                  {/* Status Notes / Interruptions */}
                  {srv.statusReason && (
                    <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <p className="font-semibold text-[11px]">Active Notice:</p>
                      <p className="text-[11px] mt-0.5">{srv.statusReason}</p>
                    </div>
                  )}

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Wait Time</span>
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          srv.currentWaitMinutes > 40
                            ? 'text-rose-700'
                            : srv.currentWaitMinutes > 20
                            ? 'text-amber-700'
                            : 'text-slate-800'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {srv.currentWaitMinutes} mins
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Staffing</span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-teal-700" />
                        {srv.activeStaffCount} Clinicians
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2">
                    Hours: <span className="font-medium text-slate-600">{srv.operatingHours}</span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    onClick={() => setDelayTargetService(srv)}
                    variant="outline"
                    className="text-[11px] font-bold text-amber-800 border-amber-200 hover:bg-amber-50 h-8 px-2.5 cursor-pointer"
                  >
                    <Clock className="h-3 w-3 mr-1 text-amber-600" />
                    +15m Delay
                  </Button>

                  <Button
                    onClick={() => setSelectedService(srv)}
                    className="text-[11px] font-bold bg-teal-700 hover:bg-teal-800 text-white h-8 px-3 cursor-pointer"
                  >
                    <SlidersHorizontal className="h-3 w-3 mr-1" />
                    Modify Status
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ServiceInterruptionModal
        open={!!selectedService}
        onOpenChange={(open) => !open && setSelectedService(null)}
        service={selectedService}
        onServiceUpdated={(updated) => {
          setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setToastMsg(`Status for "${updated.name}" updated to ${updated.status}.`);
          setTimeout(() => setToastMsg(null), 4000);
        }}
      />

      {delayTargetService && (
        <QueueDelayModal
          open={!!delayTargetService}
          onOpenChange={(open) => !open && setDelayTargetService(null)}
          departmentId={delayTargetService.id}
          departmentName={delayTargetService.name}
          onDelayBroadcasted={(delayMinutes) => {
            setServices((prev) =>
              prev.map((s) =>
                s.id === delayTargetService.id
                  ? { ...s, currentWaitMinutes: Math.max(0, s.currentWaitMinutes + delayMinutes) }
                  : s
              )
            );
            setToastMsg(`Broadcasted ${delayMinutes} min delay for ${delayTargetService.name}.`);
            setTimeout(() => setToastMsg(null), 4000);
          }}
        />
      )}
    </div>
  );
};