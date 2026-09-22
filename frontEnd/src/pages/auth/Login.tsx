import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  HeartPulse,
  Stethoscope,
  UsersRound,
  Pill,
  ClipboardList,
  Building2,
  ShieldCheck,
  FlaskConical,
  Activity,
} from 'lucide-react';
import { UserRole, StaffSubType } from '@/types/auth';
import { authApi } from '@/api/authApi';
import { resolveLandingRoute } from '@/utils/navigation';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, verifyOtp } = useAuth();

  const [authMode, setAuthMode] = useState<'PATIENT' | 'STAFF'>('PATIENT');

  // =====================================================
  // PATIENT OTP STATES
  // =====================================================
  const [phone, setPhone] = useState('9876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // =====================================================
  // STAFF STATES
  // =====================================================
  const [staffRole, setStaffRole] = useState<UserRole>('DOCTOR');
  const [staffSubType, setStaffSubType] = useState<StaffSubType>('PHARMACIST');
  const [identifier, setIdentifier] = useState('dr.arvind.patel@gujarat.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // =====================================================
  // PATIENT - SEND OTP
  // =====================================================
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      await authApi.sendPatientOtp({ phone });
      setOtpSent(true);
      // Demo OTP
      setOtp('123456');
    } catch {
      setOtpError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // PATIENT - VERIFY OTP
  // =====================================================
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      await verifyOtp({ phone, otp });
      navigate('/patient');
    } catch {
      setOtpError('Invalid OTP entered. (Demo OTP is 123456)');
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // STAFF LOGIN
  // =====================================================
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setLoginError('');

    try {
      const loggedUser = await login({
        identifier,
        password,
        role: staffRole,
        staffSubType: staffRole === 'FACILITY_STAFF' ? staffSubType : undefined,
      });

      const targetRoute = resolveLandingRoute(
        loggedUser || ({ role: staffRole, staffSubType: staffRole === 'FACILITY_STAFF' ? staffSubType : undefined } as any)
      );
      navigate(targetRoute);
    } catch {
      setLoginError('Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // STAFF DEMO CREDENTIALS
  // =====================================================
  const setDemoCredentials = (role: UserRole, subType?: StaffSubType) => {
    setAuthMode('STAFF');
    setStaffRole(role);
    if (subType) {
      setStaffSubType(subType);
    }
    setLoginError('');

    if (role === 'DOCTOR') {
      setIdentifier('dr.arvind.patel@gujarat.gov.in');
    } else if (role === 'FACILITY_STAFF') {
      if (subType === 'PHARMACIST') {
        setIdentifier('priya.pharma@civilhospital.in');
      } else if (subType === 'FACILITY_OPERATIONS') {
        setIdentifier('vikram.ops@civilhospital.in');
      } else {
        setIdentifier('rajesh.reg@civilhospital.in');
      }
    } else if (role === 'HOSPITAL_ADMIN') {
      setIdentifier('hospitaladmin');
    } else if (role === 'DISTRICT_ADMIN') {
      setIdentifier('meet');
    } else if (role === 'SUPER_ADMIN') {
      setIdentifier('superadmin');
    }

    setPassword('••••••••••••');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* =================================================
          HEADER
      ================================================= */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md group-hover:bg-teal-800 transition-colors">
            <HeartPulse className="h-7 w-7" />
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          SANJEEVANI-CONNECT
        </h2>
        <p className="text-xs font-semibold text-teal-800 mt-1 uppercase tracking-wider">
          Integrated Public Healthcare Access Platform
        </p>
      </div>

      {/* =================================================
          LOGIN CARD
      ================================================= */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="pb-4">
            <Tabs
              value={authMode}
              onValueChange={(value) => setAuthMode(value as 'PATIENT' | 'STAFF')}
            >
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="PATIENT" className="w-full justify-center">
                  Citizen / Patient
                </TabsTrigger>
                <TabsTrigger value="STAFF" className="w-full justify-center">
                  Authorized Staff
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            {/* =================================================
                CITIZEN / PATIENT LOGIN
            ================================================= */}
            {authMode === 'PATIENT' && (
              <div>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Citizen Mobile Login
                      </p>
                      <p className="text-xs text-slate-500">
                        Enter your 10-digit mobile number to access your queue tokens and health records.
                      </p>
                    </div>

                    <Input
                      label="Mobile Number"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={otpError}
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      isLoading={isLoading}
                    >
                      Send Verification OTP
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="rounded-xl bg-[#E8F2FA] border border-[#C6E0F2] p-3.5 text-xs text-[#1D6394] flex items-center justify-between">
                      <span>OTP dispatched to +91 {phone}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp('');
                          setOtpError('');
                        }}
                        className="text-[#2B6CB0] font-bold underline hover:text-[#1B365D]"
                      >
                        Change
                      </button>
                    </div>

                    <Input
                      label="Enter 6-Digit OTP"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      error={otpError}
                      helperText="Demo Evaluation OTP is 123456"
                      required
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      isLoading={isLoading}
                    >
                      Verify & Sign In to Health Portal
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* =================================================
                AUTHORIZED STAFF LOGIN
            ================================================= */}
            {authMode === 'STAFF' && (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Healthcare Personnel Sign In
                  </p>
                  <p className="text-xs text-slate-500">
                    Role-guarded portal for doctors, ASHA workers, facility administrators and district officials.
                  </p>
                </div>

                {/* STAFF ROLE SELECT */}
                <div className="space-y-1.5">
                  <Select
                    label="Select Your Operational Role"
                    value={staffRole}
                    onValueChange={(val) => {
                      const role = val as UserRole;
                      setStaffRole(role);
                      setLoginError('');
                      if (role === 'FACILITY_STAFF') {
                        setStaffSubType('PHARMACIST');
                      }
                    }}
                    options={[
                      { value: 'DOCTOR', label: 'Doctor / Medical Specialist', sublabel: 'OPD consultations, triage, and e-prescriptions' },
                      { value: 'FACILITY_STAFF', label: 'Hospital Facility Staff', sublabel: 'Registration, pharmacy dispensary, and operations' },
                      { value: 'HOSPITAL_ADMIN', label: 'Hospital Admin (Superintendent)', sublabel: 'Facility governance, beds, doctor rosters & staff' },
                      { value: 'DISTRICT_ADMIN', label: 'District Health Admin', sublabel: 'District monitoring, shortages, and leaves' },
                      { value: 'SUPER_ADMIN', label: 'Super Admin (Technical Center)', sublabel: 'Platform config and system audit logs' },
                    ]}
                  />
                </div>

                {/* FACILITY STAFF SUBTYPE */}
                {staffRole === 'FACILITY_STAFF' && (
                  <div className="space-y-1.5">
                    <Select
                      label="Staff Subtype & Permissions"
                      value={staffSubType}
                      onValueChange={(val) => {
                        const subtype = val as StaffSubType;
                        setStaffSubType(subtype);
                        setDemoCredentials('FACILITY_STAFF', subtype);
                      }}
                      options={[
                        { value: 'REGISTRATION_CLERK', label: 'Registration Clerk (Counter & Tokens)', sublabel: 'Patient registration & OPD token issuance' },
                        { value: 'PHARMACIST', label: 'Pharmacist (Dispensing & Stock)', sublabel: 'Prescription fulfillment & dispensary stock' },
                        { value: 'FACILITY_OPERATIONS', label: 'Facility Operations (Beds & Fleet)', sublabel: 'Bed capacity, ambulance dispatch & staff leaves' },
                      ]}
                    />
                  </div>
                )}

                {/* IDENTIFIER */}
                <Input
                  label="Official Username / Email / Government ID"
                  placeholder="e.g. username (doc_priya, clerk_civil), email, or mobile"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />

                {/* PASSWORD */}
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {loginError && (
                  <p className="text-xs font-medium text-red-600">
                    {loginError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Authenticate & Open Dashboard
                </Button>

                {/* QUICK DEMO ACCESS */}
                <div className="mt-6 pt-5 border-t border-[#E2EDF3]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Quick Demo Access
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Select a role to auto-fill credentials
                      </p>
                    </div>
                    <span className="rounded-full bg-[#E1EFFA] border border-[#C6E0F2] px-2.5 py-1 text-[10px] font-bold text-[#1D6394]">
                      DEMO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {/* DOCTOR */}
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('DOCTOR')}
                      className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:border-[#2B6CB0] hover:bg-[#E1EFFA] hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E1EFFA] text-[#1D6394] group-hover:bg-[#2B6CB0] group-hover:text-white transition-colors">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-[#1D6394] truncate">Doctor</p>
                        <p className="text-[10px] text-slate-400 truncate">Medical</p>
                      </div>
                    </button>

                    {/* PHARMACIST */}
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('FACILITY_STAFF', 'PHARMACIST')}
                      className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200 transition-colors">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-amber-700 truncate">Pharmacist</p>
                        <p className="text-[10px] text-slate-400 truncate">Pharmacy</p>
                      </div>
                    </button>

                    {/* REGISTRATION */}
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('FACILITY_STAFF', 'REGISTRATION_CLERK')}
                      className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 group-hover:bg-violet-200 transition-colors">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-violet-700 truncate">Register</p>
                        <p className="text-[10px] text-slate-400 truncate">Counter</p>
                      </div>
                    </button>


                    {/* HOSPITAL ADMIN */}
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('HOSPITAL_ADMIN')}
                      className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">Hospital Admin</p>
                        <p className="text-[10px] text-slate-400 truncate">Superintendent</p>
                      </div>
                    </button>

                    {/* DISTRICT ADMIN */}
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('DISTRICT_ADMIN')}
                      className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 truncate">District Admin</p>
                        <p className="text-[10px] text-slate-400 truncate">Chief Officer</p>
                      </div>
                    </button>

                    {/* SUPER ADMIN */}
                    <button
                      type="button"
                      onClick={() => setDemoCredentials('SUPER_ADMIN')}
                      className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 group-hover:bg-rose-200 transition-colors">
                        <UsersRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-rose-700 truncate">Super Admin</p>
                        <p className="text-[10px] text-slate-400 truncate">State Apex</p>
                      </div>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
