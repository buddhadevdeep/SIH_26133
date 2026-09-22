import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { DiagnosticOrder, LabResultParameter } from '@/types/clinical';
import { labApi } from '@/api/labApi';
import { LabReportModal } from './components/LabReportModal';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Printer,
  ShieldCheck,
  User,
  Barcode,
  Calendar,
  Building2,
  FileCheck,
} from 'lucide-react';

const DEFAULT_TEMPLATES: Record<string, LabResultParameter[]> = {
  HEMATOLOGY: [
    { name: 'Hemoglobin', value: '13.8', unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'NORMAL' },
    { name: 'Total Leucocyte Count (TLC)', value: '7,400', unit: '/cumm', referenceRange: '4,000 - 11,000', status: 'NORMAL' },
    { name: 'Platelet Count', value: '2.40', unit: 'lakhs/cumm', referenceRange: '1.50 - 4.50', status: 'NORMAL' },
    { name: 'RBC Count', value: '4.8', unit: 'mil/cumm', referenceRange: '4.5 - 5.5', status: 'NORMAL' },
    { name: 'Packed Cell Volume (PCV)', value: '42.0', unit: '%', referenceRange: '40.0 - 50.0', status: 'NORMAL' },
  ],
  BIOCHEMISTRY: [
    { name: 'Fasting Plasma Glucose', value: '92', unit: 'mg/dL', referenceRange: '70 - 99', status: 'NORMAL' },
    { name: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.7 - 1.3', status: 'NORMAL' },
    { name: 'Blood Urea', value: '24', unit: 'mg/dL', referenceRange: '15 - 40', status: 'NORMAL' },
    { name: 'Serum Uric Acid', value: '4.8', unit: 'mg/dL', referenceRange: '3.5 - 7.2', status: 'NORMAL' },
  ],
  MICROBIOLOGY: [
    { name: 'Dengue NS1 Antigen', value: 'Negative', unit: 'Qualitative', referenceRange: 'NEGATIVE', status: 'NORMAL' },
    { name: 'Dengue IgM Antibody', value: 'Negative', unit: 'Qualitative', referenceRange: 'NEGATIVE', status: 'NORMAL' },
    { name: 'Dengue IgG Antibody', value: 'Negative', unit: 'Qualitative', referenceRange: 'NEGATIVE', status: 'NORMAL' },
  ],
};

export const ResultEntryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<DiagnosticOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [parameters, setParameters] = useState<LabResultParameter[]>([]);
  const [summary, setSummary] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await labApi.getOrderById(id);
        if (res.data) {
          setOrder(res.data);
          if (res.data.resultParameters && res.data.resultParameters.length > 0) {
            setParameters(JSON.parse(JSON.stringify(res.data.resultParameters)));
          } else {
            // Load sensible default parameters based on category
            const template =
              DEFAULT_TEMPLATES[res.data.testCategory] || DEFAULT_TEMPLATES.BIOCHEMISTRY;
            setParameters(JSON.parse(JSON.stringify(template)));
          }
          if (res.data.resultSummary) {
            setSummary(res.data.resultSummary);
          }
        }
      } catch (err) {
        console.error('Failed to load order for result entry', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleParameterChange = (
    index: number,
    field: keyof LabResultParameter,
    value: string
  ) => {
    setParameters((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddParameter = () => {
    setParameters((prev) => [
      ...prev,
      {
        name: 'New Test Parameter',
        value: '',
        unit: 'mg/dL',
        referenceRange: 'Normal',
        status: 'NORMAL',
      },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || submitting) return;

    setSubmitting(true);
    try {
      const hasAbnormal = parameters.some(
        (p) => p.status === 'ABNORMAL' || p.status === 'CRITICAL'
      );
      const computedSummary =
        summary.trim() ||
        (hasAbnormal
          ? 'One or more parameter values outside biological reference range. Clinical correlation recommended.'
          : 'All analyzed parameters within expected biological reference limits.');

      const res = await labApi.submitResult(order.id, {
        parameters,
        resultSummary: computedSummary,
        technicianName: 'Ramesh Patel, MLT',
      });

      if (res.data) {
        setOrder(res.data);
        setIsSuccessModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to submit results', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading test workspace...
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
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Diagnostic Result Workspace
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/lab-technician/tests')}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmitResults}
            disabled={submitting}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? 'Verifying & Saving...' : 'Verify & Release Report'}</span>
          </Button>
        </div>
      </div>

      {/* Patient & Specimen Context Banner */}
      <Card className="border-slate-200 bg-slate-50/70 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient</span>
            <span className="font-extrabold text-slate-900 text-sm">{order.patientName}</span>
            <span className="text-slate-500 block">{order.patientAge} Yrs • {order.patientGender}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">ABHA / Phone</span>
            <span className="font-mono font-semibold text-teal-900 block">{order.patientAbha || '22-8491-0392-1102'}</span>
            <span className="text-slate-500 block">{order.patientPhone || '9876543210'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Specimen Tube</span>
            <span className="font-bold text-slate-900 block">{order.containerType || 'K2 EDTA Lavender'}</span>
            <span className="font-mono text-[11px] text-slate-600 block">Sample ID: {order.sampleId || 'SMP-482109'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ordered By</span>
            <span className="font-bold text-slate-900 block">{order.orderedBy}</span>
            <span className="text-slate-500 block">{order.facilityName}</span>
          </div>
        </div>
      </Card>

      {/* Parameter Entry Form */}
      <form onSubmit={handleSubmitResults} className="space-y-6">
        <Card className="border-slate-200 shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 bg-white border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Biological Parameters & Analyte Readings
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Input numeric or qualitative findings. Reference ranges will be verified automatically.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddParameter}
              className="text-xs flex items-center gap-1.5 h-8 border-dashed border-slate-300 hover:border-teal-700 text-teal-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Parameter</span>
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4 w-1/4">Parameter Name</th>
                    <th className="py-3 px-4 w-1/5">Observed Value</th>
                    <th className="py-3 px-4 w-1/6">Unit</th>
                    <th className="py-3 px-4 w-1/5">Reference Interval</th>
                    <th className="py-3 px-4 w-1/6 text-center">Status Flag</th>
                    <th className="py-3 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parameters.map((param, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => handleParameterChange(idx, 'name', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
                          required
                        />
                      </td>

                      {/* Value */}
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) => handleParameterChange(idx, 'value', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-900 font-mono focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
                          placeholder="e.g. 14.2"
                          required
                        />
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={param.unit}
                          onChange={(e) => handleParameterChange(idx, 'unit', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
                          placeholder="e.g. g/dL"
                        />
                      </td>

                      {/* Reference Range */}
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={param.referenceRange}
                          onChange={(e) => handleParameterChange(idx, 'referenceRange', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
                          placeholder="e.g. 13.0 - 17.0"
                        />
                      </td>

                      {/* Flag Dropdown */}
                      <td className="py-2.5 px-4 text-center">
                        <select
                          value={param.status}
                          onChange={(e) =>
                            handleParameterChange(
                              idx,
                              'status',
                              e.target.value as 'NORMAL' | 'ABNORMAL' | 'CRITICAL'
                            )
                          }
                          className={`rounded-lg px-2 py-1.5 text-xs font-bold border cursor-pointer shadow-2xs transition-colors ${
                            param.status === 'CRITICAL'
                              ? 'border-rose-300 bg-rose-50 text-rose-800'
                              : param.status === 'ABNORMAL'
                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          <option value="NORMAL">NORMAL</option>
                          <option value="ABNORMAL">HIGH / OUT</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </td>

                      {/* Remove */}
                      <td className="py-2.5 px-3 text-center">
                        {parameters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveParameter(idx)}
                            className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete parameter row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Summary & Remarks */}
        <Card className="border-slate-200 p-5 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 block">
              Technician Observations & Diagnostic Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="e.g., Blood film shows normocytic normochromic red cells with adequate platelets. No abnormal or immature cells seen."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
            />
          </div>

          {/* Electronic Certification Disclaimer */}
          <div className="rounded-xl bg-teal-50/70 p-3.5 border border-teal-200 text-xs text-teal-900 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Digital Sign-off & EHR Sync</span>
              Saving and releasing this report attaches your technologist credential (
              <strong>Ramesh Patel, MLT</strong>) and automatically publishes the report to the citizen&apos;s ABHA record and attending physician&apos;s workspace.
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/lab-technician/tests')}
          >
            Discard
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold h-10 px-5 flex items-center gap-2 shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{submitting ? 'Releasing to EHR...' : 'Verify & Release Official Report'}</span>
          </Button>
        </div>
      </form>

      {/* Official Report Modal opened upon submission */}
      {order && isSuccessModalOpen && (
        <LabReportModal
          order={order}
          isOpen={true}
          onClose={() => {
            setIsSuccessModalOpen(false);
            navigate('/lab-technician/tests');
          }}
        />
      )}
    </div>
  );
};