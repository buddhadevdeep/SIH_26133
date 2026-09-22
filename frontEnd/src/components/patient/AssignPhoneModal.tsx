import React, { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { FamilyMember } from '@/types/family';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  X,
  Phone,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface AssignPhoneModalProps {
  member: FamilyMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignPhoneModal: React.FC<AssignPhoneModalProps> = ({
  member,
  isOpen,
  onClose,
}) => {
  const { assignPersonalPhone } = useFamily();

  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'ENTER_PHONE' | 'VERIFY_OTP' | 'SUCCESS'>('ENTER_PHONE');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !member) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setOtp('123456'); // Pre-fill demo evaluation OTP
    setStep('VERIFY_OTP');
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== '123456' && otp.length < 6) {
      setError('Invalid OTP. (Demo OTP is 123456)');
      return;
    }
    assignPersonalPhone(member.id, phone);
    setStep('SUCCESS');
  };

  const handleResetAndClose = () => {
    setStep('ENTER_PHONE');
    setPhone('');
    setOtp('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-xl sm:max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-900 to-teal-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-teal-200 border border-teal-500/30">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Assign Dedicated Phone Number
              </h3>
              <p className="text-[11px] text-teal-200 truncate">
                For {member.name} ({member.relationLabel})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded-lg p-1.5 text-teal-200 hover:text-white hover:bg-teal-700/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === 'ENTER_PHONE' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-700" />
                  Independent Healthcare Login
                </p>
                <p className="text-teal-700 text-[11px] leading-relaxed">
                  Once assigned, <strong>{member.name}</strong> will receive their own SMS tokens and can log into HealthConnect directly using this phone number.
                </p>
              </div>

              <Input
                label="New Dedicated Mobile Number *"
                type="tel"
                placeholder="e.g. 9825012345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={error}
                required
              />

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={handleResetAndClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Send Verification OTP
                </Button>
              </div>
            </form>
          )}

          {step === 'VERIFY_OTP' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 flex items-center justify-between">
                <span>OTP sent to +91 {phone}</span>
                <button
                  type="button"
                  onClick={() => setStep('ENTER_PHONE')}
                  className="text-teal-700 font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              <Input
                label="Enter 6-Digit OTP *"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                helperText="Evaluation Demo OTP is 123456"
                error={error}
                required
              />

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setStep('ENTER_PHONE')}>
                  Back
                </Button>
                <Button type="submit" variant="primary">
                  Verify & Decouple Phone
                </Button>
              </div>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4">
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Mobile Number Successfully Updated!
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  <strong>{member.name}</strong> now has their own dedicated mobile number (+91 {phone}) linked to ABHA ID {member.abhaId}.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-left text-xs text-emerald-900">
                <p className="font-semibold">Independent Login Active</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  They can now log in directly from any smartphone using +91 {phone}.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleResetAndClose}
                className="w-full"
              >
                Close & View Profile
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
