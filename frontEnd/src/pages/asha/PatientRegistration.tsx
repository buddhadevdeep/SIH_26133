import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveOfflinePatient } from '@/lib/db';
import { useConnection } from '@/contexts/ConnectionContext';
import { AshaPatient } from '@/types/asha';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  User,
  MapPin,
  HeartPulse,
  ArrowRight,
  ArrowLeft,
  Activity,
  Calendar,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building2,
  Home,
} from 'lucide-react';

export const PatientRegistration: React.FC = () => {
  const { refreshPendingCount, isOnline } = useConnection();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPatient, setSavedPatient] = useState<AshaPatient | null>(null);

  // Step 1: Personal
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>('F');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');

  // Step 2: Location & Household
  const [village, setVillage] = useState('Pethapur Ward 2');
  const [houseNumber, setHouseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [householdHead, setHouseholdHead] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Step 3: Health & Category
  const [abhaId, setAbhaId] = useState('');
  const [category, setCategory] = useState<AshaPatient['category']>('MATERNAL');
  const [gestationalWeek, setGestationalWeek] = useState('24');
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [riskReason, setRiskReason] = useState('');

  const generateDemoAbha = () => {
    const num1 = Math.floor(10 + Math.random() * 89);
    const num2 = Math.floor(1000 + Math.random() * 8999);
    const num3 = Math.floor(1000 + Math.random() * 8999);
    const num4 = Math.floor(1000 + Math.random() * 8999);
    setAbhaId(`${num1}-${num2}-${num3}-${num4}`);
  };

  const handleSaveCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCitizen: AshaPatient = {
        id: `asha_cit_${Date.now()}`,
        ashaId: 'usr_asha_01',
        ashaName: 'Sunita Devi',
        name,
        age: parseInt(age) || 28,
        gender,
        phone,
        bloodGroup,
        village,
        wardNumber: village.split('Ward ')[1] || '1',
        address: houseNumber ? `House #${houseNumber}, ${address}` : address,
        householdHeadName: householdHead || name,
        emergencyContactName: emergencyName || householdHead || 'Family Member',
        emergencyContactPhone: emergencyPhone || phone,
        abhaId: abhaId || undefined,
        category,
        gestationalWeek: category === 'MATERNAL' ? parseInt(gestationalWeek) || 24 : undefined,
        isHighRisk,
        highRiskReasons: isHighRisk && riskReason ? [riskReason] : undefined,
        registeredOffline: !isOnline,
        syncStatus: isOnline ? 'SYNCED' : 'LOCAL_PENDING',
        createdAt: new Date().toISOString(),
      };

      await saveOfflinePatient(newCitizen);
      await refreshPendingCount();
      setSavedPatient(newCitizen);
      setIsSaved(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      <PageHeader
        title="Assisted Citizen Intake"
        subtitle="Progressive frontline mobile registration. Operates with 100% offline persistence using local device storage."
        breadcrumbs={[{ label: 'ASHA Dashboard', to: '/asha' }, { label: 'Register Citizen' }]}
      />

      {isSaved && savedPatient ? (
        <Card className="border-teal-200 bg-white p-6 sm:p-8 text-center space-y-6 shadow-md rounded-3xl animate-in fade-in-50 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700 border border-teal-200 shadow-2xs">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Citizen Enrolled Successfully!
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Record for <strong>{savedPatient.name}</strong> is safely registered and stored in the local health register.
            </p>
          </div>

          {/* Simulated Digital Health Card Preview */}
          <div className="max-w-sm mx-auto rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 p-5 text-white text-left shadow-lg border border-teal-700/50 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold tracking-wider uppercase text-teal-200 flex items-center gap-1.5">
                <HeartPulse className="h-3.5 w-3.5 text-teal-300" />
                HealthConnect ABHA
              </span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                {savedPatient.syncStatus === 'SYNCED' ? 'Cloud Synced' : 'Offline Stored'}
              </span>
            </div>

            <div className="pt-2">
              <p className="text-lg font-black tracking-wide text-white">{savedPatient.name}</p>
              <p className="text-xs text-teal-100/80">
                {savedPatient.age} Yrs • {savedPatient.gender === 'F' ? 'Female' : 'Male'} • Blood: {savedPatient.bloodGroup || 'B+'}
              </p>
            </div>

            <div className="pt-1 text-xs border-t border-white/15 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-teal-300 uppercase block">ABHA Health Address</span>
                <span className="font-mono font-bold text-xs">{savedPatient.abhaId || '14-8921-3409-7721'}</span>
              </div>
              <span className="rounded-lg bg-teal-600/50 px-2 py-1 text-[10px] font-bold uppercase">
                {savedPatient.village}
              </span>
            </div>
          </div>

          {/* Direct Next Action Triggers */}
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link to="/asha/vitals" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs min-h-[44px] gap-1.5">
                  <Activity className="h-4 w-4 text-teal-700" />
                  <span>Record Initial Vitals</span>
                </Button>
              </Link>
              <Link to="/asha/visits" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs min-h-[44px] gap-1.5">
                  <Calendar className="h-4 w-4 text-teal-700" />
                  <span>Schedule First Visit</span>
                </Button>
              </Link>
            </div>

            <Button
              onClick={() => {
                setName('');
                setAge('');
                setPhone('');
                setAddress('');
                setHouseNumber('');
                setHouseholdHead('');
                setAbhaId('');
                setStep(1);
                setIsSaved(false);
              }}
              variant="primary"
              size="lg"
              className="w-full bg-teal-700 hover:bg-teal-800 font-bold min-h-[44px]"
            >
              Register Another Citizen
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-slate-200/90 bg-white shadow-xs rounded-3xl overflow-hidden">
          {/* Step Indicator Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === 1 ? 'bg-teal-700 text-white shadow-2xs' : 'bg-teal-100 text-teal-800'
                }`}
              >
                1
              </span>
              <span className="text-xs font-bold text-slate-800">1. Personal</span>
            </div>

            <div className="h-0.5 w-12 bg-slate-200" />

            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === 2 ? 'bg-teal-700 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                }`}
              >
                2
              </span>
              <span className="text-xs font-bold text-slate-800">2. Household</span>
            </div>

            <div className="h-0.5 w-12 bg-slate-200" />

            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  step === 3 ? 'bg-teal-700 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                }`}
              >
                3
              </span>
              <span className="text-xs font-bold text-slate-800">3. Health & ABHA</span>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="Full Name of Citizen"
                  placeholder="e.g. Geeta Ben Parmar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Age in Years"
                    type="number"
                    placeholder="e.g. 26"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'Other')}
                      className="flex min-h-[44px] w-full rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2 text-sm text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="F">Female</option>
                      <option value="M">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Mobile Contact Number"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="flex min-h-[44px] w-full rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2 text-sm text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      if (!name) return;
                      setStep(2);
                    }}
                    variant="primary"
                    className="bg-teal-700 hover:bg-teal-800 gap-1.5 min-h-[44px]"
                  >
                    <span>Proceed to Household</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Location & Household */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Village / Sector Ward
                    </label>
                    <select
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="flex min-h-[44px] w-full rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2 text-sm text-slate-900 font-medium cursor-pointer"
                    >
                      <option value="Pethapur Ward 1">Pethapur Ward 1</option>
                      <option value="Pethapur Ward 2">Pethapur Ward 2</option>
                      <option value="Pethapur Ward 3">Pethapur Ward 3</option>
                      <option value="Pethapur Ward 4">Pethapur Ward 4</option>
                    </select>
                  </div>

                  <Input
                    label="House / Door Number"
                    placeholder="e.g. 42 / B"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                  />
                </div>

                <Input
                  label="Street Landmark / Mohalla Address"
                  placeholder="e.g. Near Old Ramji Temple, Rabari Vaas"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                <Input
                  label="Head of Household (Family Head)"
                  placeholder="e.g. Hareshbhai Parmar (Husband / Father)"
                  value={householdHead}
                  onChange={(e) => setHouseholdHead(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Emergency Contact Name"
                    placeholder="e.g. Haresh Parmar"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                  />

                  <Input
                    label="Emergency Phone"
                    type="tel"
                    placeholder="10-digit phone"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <Button type="button" onClick={() => setStep(1)} variant="secondary" className="min-h-[44px]">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    variant="primary"
                    className="bg-teal-700 hover:bg-teal-800 gap-1.5 min-h-[44px]"
                  >
                    <span>Proceed to Health Profile</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Health Profile & High Risk */}
            {step === 3 && (
              <form onSubmit={handleSaveCitizen} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      ABHA Health ID (Ayushman Bharat)
                    </label>
                    <button
                      type="button"
                      onClick={generateDemoAbha}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline inline-flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-Generate ID
                    </button>
                  </div>
                  <Input
                    placeholder="e.g. 14-8921-3409-7721"
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Primary Cohort Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AshaPatient['category'])}
                    className="flex min-h-[44px] w-full rounded-xl border border-slate-300 bg-white shadow-2xs px-3 py-2 text-sm text-slate-900 font-medium cursor-pointer"
                  >
                    <option value="MATERNAL">Maternal / Antenatal Care (ANC)</option>
                    <option value="INFANT">Infant & Child Immunization (UIP)</option>
                    <option value="NCD_HYPERTENSION">NCD - Hypertension Monitoring</option>
                    <option value="NCD_DIABETES">NCD - Diabetes Mellitus</option>
                    <option value="ELDERLY">Geriatric / Elderly Care</option>
                    <option value="GENERAL">General Village Cohort</option>
                  </select>
                </div>

                {category === 'MATERNAL' && (
                  <Input
                    label="Current Gestational Week"
                    type="number"
                    placeholder="e.g. 28"
                    value={gestationalWeek}
                    onChange={(e) => setGestationalWeek(e.target.value)}
                  />
                )}

                {/* High-Risk Clinical Indicator */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-rose-900 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isHighRisk}
                      onChange={(e) => setIsHighRisk(e.target.checked)}
                      className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Mark as High-Risk Patient (Priority Supervision)</span>
                  </label>

                  {isHighRisk && (
                    <Input
                      label="Clinical Danger Sign or Reason"
                      placeholder="e.g. Severe Anemia (Hb < 8), BP > 140/90, Gestational Diabetes"
                      value={riskReason}
                      onChange={(e) => setRiskReason(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <Button type="button" onClick={() => setStep(2)} variant="secondary" className="min-h-[44px]">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="bg-teal-700 hover:bg-teal-800 font-bold min-h-[44px]"
                    isLoading={isLoading}
                  >
                    Save Citizen to Local Register
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

