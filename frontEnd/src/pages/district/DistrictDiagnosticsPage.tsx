import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocationContext } from '@/contexts/LocationContext';
import { INITIAL_EQUIPMENT } from '@/mock/mockData';
import { resourceApi } from '@/api/resourceApi';
import { EquipmentItem } from '@/types/resources';
import {
  FlaskConical,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  Filter,
  Check,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface LabTestCategory {
  id: string;
  name: string;
  category: string;
  testsToday: number;
  avgTatHours: number;
  criticalBacklog: number;
  status: 'NORMAL' | 'HIGH_VOLUME' | 'DELAYED';
}

const MOCK_LAB_CATEGORIES: LabTestCategory[] = [
  {
    id: 'lab_01',
    name: 'Complete Blood Count (CBC / Hemogram)',
    category: 'Hematology',
    testsToday: 184,
    avgTatHours: 0.8,
    criticalBacklog: 0,
    status: 'NORMAL',
  },
  {
    id: 'lab_02',
    name: 'Dengue NS1 Antigen & Serology',
    category: 'Microbiology & Serology',
    testsToday: 76,
    avgTatHours: 1.2,
    criticalBacklog: 4,
    status: 'HIGH_VOLUME',
  },
  {
    id: 'lab_03',
    name: 'Liver & Renal Function Tests (LFT/KFT)',
    category: 'Biochemistry',
    testsToday: 112,
    avgTatHours: 2.1,
    criticalBacklog: 0,
    status: 'NORMAL',
  },
  {
    id: 'lab_04',
    name: 'TrueNat TB Molecular Screening',
    category: 'Molecular Diagnostics',
    testsToday: 32,
    avgTatHours: 3.5,
    criticalBacklog: 1,
    status: 'NORMAL',
  },
  {
    id: 'lab_05',
    name: 'Digital Radiography (X-Ray)',
    category: 'Radiology',
    testsToday: 95,
    avgTatHours: 0.5,
    criticalBacklog: 0,
    status: 'NORMAL',
  },
  {
    id: 'lab_06',
    name: 'Computed Tomography (CT Scan)',
    category: 'Radiology',
    testsToday: 41,
    avgTatHours: 1.5,
    criticalBacklog: 2,
    status: 'HIGH_VOLUME',
  },
];

export const DistrictDiagnosticsPage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

  // Form State
  const [selectedMachine, setSelectedMachine] = useState(INITIAL_EQUIPMENT[0]?.name || '');
  const [faultDescription, setFaultDescription] = useState('Calibration deviation detected');

  useEffect(() => {
    resourceApi.getEquipment().then((res) => {
      if (res.data && res.data.length > 0) {
        setEquipmentList(res.data);
        setSelectedMachine(res.data[0].name);
      }
    }).catch(console.warn);
  }, []);

  const filteredEquipment = equipmentList.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTests = MOCK_LAB_CATEGORIES.reduce((acc, c) => acc + c.testsToday, 0);
  const totalEquipment = equipmentList.length;
  const operationalCount = equipmentList.filter((e) => e.status === 'OPERATIONAL').length;
  const maintenanceCount = equipmentList.filter((e) => e.status !== 'OPERATIONAL').length;

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueSuccess(`Work order generated for ${selectedMachine}. Gujarat Medical Equipment Maintenance (BME) engineer alerted.`);
    setShowIssueModal(false);

    setTimeout(() => {
      setIssueSuccess(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="District Diagnostics & Lab Network"
        subtitle={`Monitor lab test volume, turnaround times, and biomedical machine uptime across ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Diagnostics' },
        ]}
        actions={
          <Button
            onClick={() => setShowIssueModal(true)}
            size="sm"
            className="gap-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white"
          >
            <Wrench className="h-4 w-4" />
            <span>Report Equipment Issue</span>
          </Button>
        }
      />

      {/* Success Notification */}
      {issueSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
          <p className="font-semibold">{issueSuccess}</p>
        </div>
      )}

      {/* 3 Decision-Driving KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Lab Tests Today</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <FlaskConical className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalTests}</p>
          <span className="text-[11px] text-teal-700 font-medium">Across all district public labs · avg TAT 1.5h</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Equipment Uptime</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {Math.round((operationalCount / (totalEquipment || 1)) * 100)}%
          </p>
          <span className="text-[11px] text-emerald-700 font-medium">{operationalCount} of {totalEquipment} machines active</span>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Service Due / Alert</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{maintenanceCount}</p>
          <span className="text-[11px] text-amber-700 font-medium">Scheduled biomedical maintenance</span>
        </Card>
      </div>

      {/* Routine Lab Test Panels */}
      <Card className="p-5 bg-white border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">High-Volume Diagnostic Panels</h3>
            <p className="text-xs text-slate-500">Daily processing count and turnaround performance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_LAB_CATEGORIES.map((lab) => (
            <div
              key={lab.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {lab.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    lab.status === 'HIGH_VOLUME'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {lab.status === 'HIGH_VOLUME' ? 'High Surge' : 'Optimal'}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900">{lab.name}</h4>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Tests Today: <strong>{lab.testsToday}</strong>
                </span>
                <span>
                  Avg TAT: <strong>{lab.avgTatHours}h</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Biomedical Equipment Health Table */}
      <Card className="p-5 bg-white border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Biomedical Equipment Registry</h3>
            <p className="text-xs text-slate-500">Operational status, calibration certificates, and preventive maintenance</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-teal-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-2.5 px-3">Equipment Name</th>
                <th className="py-2.5 px-3">Facility & Location</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Serial / Model</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Next Service</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipment.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{eq.name}</span>
                    <span className="text-[10px] text-slate-400">Qty: {eq.quantity}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-slate-800 font-medium block">{eq.facilityName}</span>
                    <span className="text-[10px] text-slate-400">{eq.department}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {eq.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{eq.model}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        eq.status === 'OPERATIONAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{eq.nextServiceDate}</td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMachine(eq.name);
                        setShowIssueModal(true);
                      }}
                      className="text-xs font-semibold"
                    >
                      Log Service
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Equipment Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl sm:max-w-3xl p-6 sm:p-8 bg-white border-slate-200 shadow-xl space-y-4 rounded-3xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
                <Wrench className="h-5 w-5" />
                <h3>Biomedical Equipment Work Order</h3>
              </div>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportIssue} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Equipment Unit</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700"
                >
                  {equipmentList.map((e) => (
                    <option key={e.id} value={e.name}>
                      {e.name} ({e.facilityName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Maintenance Type</label>
                <select className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium shadow-2xs focus:outline-hidden focus:border-teal-700">
                  <option>Preventive Maintenance (PM)</option>
                  <option>Corrective Repair / Breakdown</option>
                  <option>NABL / AERB Calibration</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue Description</label>
                <textarea
                  rows={3}
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-teal-700"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIssueModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                >
                  Issue Work Order
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
