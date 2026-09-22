import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pharmacyApi } from '@/api/pharmacyApi';
import { useAuth } from '@/contexts/AuthContext';
import { Prescription } from '@/types/clinical';
import { MedicineInventoryItem } from '@/types/resources';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  CheckCircle2,
  Pill,
  Stethoscope,
  ShieldCheck,
  Printer,
  FileText,
  AlertCircle,
  X,
  Phone,
  Hash,
} from 'lucide-react';

export const PrescriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [medicines, setMedicines] = useState<MedicineInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (rxId: string) => {
    setLoading(true);
    try {
      const [rxRes, medRes] = await Promise.all([
        pharmacyApi.getPrescriptionById(rxId),
        pharmacyApi.getMedicines(),
      ]);

      if (rxRes.success && rxRes.data) {
        setPrescription(rxRes.data);
        // Initialize verification checklist
        const initVerified: Record<string, boolean> = {};
        rxRes.data.items.forEach((it) => {
          initVerified[it.id] = rxRes.data.status === 'DISPENSED';
        });
        setVerifiedItems(initVerified);
        if (rxRes.data.pharmacyNotes) {
          setPharmacistNotes(rxRes.data.pharmacyNotes);
        }
      }
      if (medRes.success && medRes.data) {
        setMedicines(medRes.data);
      }
    } catch (err) {
      console.error('Failed to load prescription detail', err);
    } finally {
      setLoading(false);
    }
  };

  // Find inventory match for each item
  const findInventoryMatch = (medicineName: string, genericName?: string) => {
    const genNorm = (genericName || '').toLowerCase().trim();
    const nameNorm = medicineName.toLowerCase().trim();

    return medicines.find((m) => {
      const mGen = m.genericName.toLowerCase().trim();
      const mName = m.medicineName.toLowerCase().trim();
      if (genNorm && (mGen.includes(genNorm) || genNorm.includes(mGen))) return true;
      if (mName.includes(nameNorm) || nameNorm.includes(mName)) return true;
      return false;
    });
  };

  const toggleVerify = (itemId: string) => {
    if (prescription?.status === 'DISPENSED') return;
    setVerifiedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleDispenseAll = async () => {
    if (!prescription || prescription.status === 'DISPENSED') return;

    setDispensing(true);
    try {
      const res = await pharmacyApi.dispensePrescription(prescription.id, {
        pharmacistName: user?.name ? `${user.name} (Pharmacist)` : 'Priya Nair (Pharmacist)',
        notes: pharmacistNotes || 'Verified batch numbers and dosage. Handover slip provided.',
      });

      if (res.success && res.data) {
        setPrescription(res.data);
        setToastMessage('Prescription dispensed and stock deducted successfully!');
        setShowSlipModal(true);
        // Reload medicines to reflect deducted stock
        const updatedMeds = await pharmacyApi.getMedicines();
        if (updatedMeds.success && updatedMeds.data) {
          setMedicines(updatedMeds.data);
        }
      }
    } catch (err) {
      console.error('Dispense error', err);
      alert('Failed to dispense prescription. Please check stock and try again.');
    } finally {
      setDispensing(false);
    }
  };

  // Hindi translation helper for dosage guidance
  const getHindiInstructions = (frequency: string, instructions?: string) => {
    let hindi = '';
    const fLower = frequency.toLowerCase();

    if (fLower.includes('1-0-1') || fLower.includes('twice')) {
      hindi = 'दिन में दो बार: सुबह और शाम (खाने के बाद)';
    } else if (fLower.includes('1-0-0') || fLower.includes('morning')) {
      hindi = 'दिन में एक बार: रोज़ सुबह (नाश्ते के बाद)';
    } else if (fLower.includes('0-0-1') || fLower.includes('bedtime') || fLower.includes('night')) {
      hindi = 'दिन में एक बार: रात को सोने से पहले';
    } else if (fLower.includes('sos') || fLower.includes('as needed')) {
      hindi = 'ज़रूरत पड़ने पर (तेज़ बुखार या दर्द होने पर)';
    } else {
      hindi = 'डॉक्टर की सलाह के अनुसार नियमित समय पर लें';
    }

    if (instructions?.toLowerCase().includes('empty stomach')) {
      hindi += ' • खाली पेट लें (नाश्ते से 30 मिनट पहले)';
    }

    return hindi;
  };

  if (loading) {
    return (
      <div className="py-24 text-center max-w-lg mx-auto space-y-3">
        <div className="w-10 h-10 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">Loading prescription workspace...</p>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Prescription Not Found</h2>
        <p className="text-xs text-slate-500">The requested prescription ID could not be loaded.</p>
        <Button onClick={() => navigate('/pharmacist/prescriptions')} variant="primary">
          Return to Queue
        </Button>
      </div>
    );
  }

  const allItemsChecked = prescription.items.every((it) => verifiedItems[it.id]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in-50 duration-200">
      {/* 1. Back Navigation & Quick Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/pharmacist/prescriptions')}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Queue
          </Button>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
            {prescription.id}
          </span>
          <StatusBadge status={prescription.status} />
        </div>

        {/* Handover slip button if already dispensed */}
        {prescription.status === 'DISPENSED' && (
          <Button
            onClick={() => setShowSlipModal(true)}
            variant="outline"
            size="sm"
            className="border-teal-300 text-teal-900 bg-teal-50 hover:bg-teal-100 font-bold text-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print / View Handover Slip
          </Button>
        )}
      </div>

      {/* Success Toast / Feedback Banner */}
      {toastMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-bold text-emerald-900">
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

      {/* 2. Patient & Prescriber Banner */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-linear-to-r from-slate-900 to-teal-950 text-white p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Patient Demographic */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                Patient Demographics &amp; Identity
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                {prescription.patientName}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  48Y • Male
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Hash className="h-3 w-3 text-teal-400" />
                  ABHA: 14-8921-3409-7721
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-teal-400" />
                  +91 98765 43210
                </span>
                <span>•</span>
                <span>OPD Patient</span>
              </div>
            </div>

            {/* Prescribing Doctor Info */}
            <div className="rounded-2xl bg-white/10 p-3.5 border border-white/10 text-xs space-y-1 min-w-[240px]">
              <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">
                Prescribing Clinician
              </span>
              <p className="font-extrabold text-white text-sm flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-teal-400" />
                {prescription.doctorName}
              </p>
              <p className="text-slate-300 text-[11px]">{prescription.facilityName}</p>
              <p className="text-[10px] text-slate-400">
                Issued: {new Date(prescription.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(prescription.issuedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Diagnosis Strip */}
        <div className="bg-teal-50/70 border-t border-b border-teal-100 px-5 py-3 text-xs text-teal-950 flex items-start gap-2">
          <FileText className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-teal-900">Clinical Diagnosis: </span>
            <span>{prescription.diagnosisSummary}</span>
          </div>
        </div>
      </Card>

      {/* 3. Clinical Checklist & Dispense Verification Table */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-700" />
              Prescription Items Verification Checklist
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify medicine brand/generic, strength, batch number, and physical stock before dispensing
            </p>
          </div>
          {prescription.status === 'PENDING' && (
            <span className="text-xs font-semibold text-slate-500">
              {Object.values(verifiedItems).filter(Boolean).length} of {prescription.items.length} verified
            </span>
          )}
        </CardHeader>

        <CardContent className="p-0 divide-y divide-slate-100">
          {prescription.items.map((item, index) => {
            const matchedMed = findInventoryMatch(item.medicineName, item.genericName);
            const isVerified = verifiedItems[item.id] || false;
            const isStockSufficient = matchedMed && matchedMed.availableQuantity >= item.totalQuantity;

            return (
              <div
                key={item.id}
                onClick={() => toggleVerify(item.id)}
                className={`p-5 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isVerified ? 'bg-teal-50/30' : 'hover:bg-slate-50/70'
                }`}
              >
                {/* Left: Checkbox + Medicine Info */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={() => toggleVerify(item.id)}
                      disabled={prescription.status === 'DISPENSED'}
                      className="h-5 w-5 rounded-md border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {item.medicineName}
                      </span>
                      {item.genericName && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Generic: {item.genericName}
                        </span>
                      )}
                      <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                        {item.dosage}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Frequency: {item.frequency}
                      </span>
                      <span>•</span>
                      <span>Duration: {item.duration}</span>
                      <span>•</span>
                      <span>Route: {item.route || 'Oral'}</span>
                    </div>

                    {item.instructions && (
                      <p className="text-xs text-amber-900 bg-amber-50/70 border border-amber-200/60 rounded-lg px-2.5 py-1 font-medium italic">
                        Guidance: &ldquo;{item.instructions}&rdquo;
                      </p>
                    )}

                    {/* Hindi dosage translation helper */}
                    <p className="text-[11px] text-teal-900 font-medium">
                      🇮🇳 {getHindiInstructions(item.frequency, item.instructions)}
                    </p>
                  </div>
                </div>

                {/* Right: Live Stock & Batch Badge + Quantity */}
                <div className="shrink-0 flex md:flex-col items-start md:items-end justify-between md:justify-center gap-2 pl-8 md:pl-0">
                  <div className="text-left md:text-right space-y-1">
                    <div className="flex items-center gap-1.5 justify-start md:justify-end">
                      <span className="text-xs font-bold text-slate-500 uppercase">Dispense:</span>
                      <span className="font-black text-sm text-teal-900 bg-teal-100/80 px-2 py-0.5 rounded-md">
                        {item.totalQuantity} {matchedMed?.unit || 'Units'}
                      </span>
                    </div>

                    {matchedMed ? (
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <p className="font-mono">
                          Batch: <strong>{matchedMed.batchNumber}</strong>
                        </p>
                        <p>
                          Avail: <strong>{matchedMed.availableQuantity.toLocaleString()}</strong> ({matchedMed.status.replace(/_/g, ' ')})
                        </p>
                        <p className="text-slate-400">
                          Exp: {new Date(matchedMed.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        General Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 4. Pharmacist Clinical Handover Notes & Authoritative Dispensing Action */}
      <Card className="border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Pharmacist Dispensing Notes &amp; Patient Counselling Record
          </label>
          <textarea
            rows={2}
            value={pharmacistNotes}
            onChange={(e) => setPharmacistNotes(e.target.value)}
            disabled={prescription.status === 'DISPENSED'}
            placeholder="e.g. Verified patient identity. Advised to take medication after food. Warning on drowsiness given."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        {/* Footer Action Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-teal-700" />
            <span>
              Authoritative stock deduction will occur across hospital inventory upon confirmation.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {prescription.status === 'DISPENSED' ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Prescription Fulfilled &amp; Dispensed</span>
              </div>
            ) : (
              <Button
                onClick={handleDispenseAll}
                disabled={dispensing || !allItemsChecked}
                variant="primary"
                className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm px-6 py-3 min-h-[44px] shadow-sm disabled:opacity-50"
              >
                {dispensing ? (
                  'Deducting Stock & Dispensing...'
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Dispensing &amp; Deduct Stock
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 5. Bilingual Handover Instructions & Printable Slip Modal */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl sm:max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 my-8 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Patient Medication Handover Slip
                  </h3>
                  <p className="text-xs text-slate-500">Official Pharmacy Dispensation Receipt</p>
                </div>
              </div>
              <button
                onClick={() => setShowSlipModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Slip Content */}
            <div id="handover-slip" className="space-y-4 text-xs">
              {/* Slip Hospital Banner */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h4 className="text-sm font-black text-slate-900 uppercase">
                  {prescription.facilityName || 'Gandhinagar Civil Hospital'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Department of Health &amp; Family Welfare • Outpatient Pharmacy Counter
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Rx ID: <strong>{prescription.id}</strong> • Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Patient and Doctor info */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient</span>
                  <span className="font-extrabold text-slate-900">{prescription.patientName}</span>
                  <span className="text-[11px] text-slate-500 block">48Y • Male • ABHA: 14-8921-3409</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Doctor</span>
                  <span className="font-extrabold text-slate-900">{prescription.doctorName}</span>
                  <span className="text-[11px] text-slate-500 block">Dispensed by: {user?.name || 'Priya Nair'}</span>
                </div>
              </div>

              {/* Medication Table with Bilingual Instructions */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                  Medication Dosage &amp; Instructions (दवा लेने के निर्देश)
                </span>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                  {prescription.items.map((it) => {
                    const matchedMed = findInventoryMatch(it.medicineName, it.genericName);
                    return (
                      <div key={it.id} className="p-3 bg-white space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{it.medicineName} ({it.dosage})</span>
                          <span className="text-teal-800">Qty: {it.totalQuantity}</span>
                        </div>
                        <div className="text-slate-600 font-medium">
                          English: {it.frequency} • {it.instructions || 'As advised'}
                        </div>
                        <div className="text-teal-900 font-semibold bg-teal-50 px-2 py-0.5 rounded text-[11px]">
                          🇮🇳 {getHindiInstructions(it.frequency, it.instructions)}
                        </div>
                        {matchedMed && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Batch: {matchedMed.batchNumber} | Expiry: {matchedMed.expiryDate}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Safety Guidance Warning */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Safety Notice:</strong> Store all medications out of reach of children in a cool, dry place away from direct sunlight. Complete antibiotic courses even if symptoms improve. In case of any adverse reaction, report to the Civil Hospital Emergency immediately.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <Button
                onClick={() => setShowSlipModal(false)}
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
                Print Handover Slip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
