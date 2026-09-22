import React, { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { FamilyRelation } from '@/types/family';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  X,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  HeartPulse,
  Users,
} from 'lucide-react';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_CONDITIONS = [
  'Hypertension',
  'Type 2 Diabetes',
  'Asthma',
  'Hypothyroidism',
  'Heart Condition',
  'None',
];

export const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addMember } = useFamily();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState<FamilyRelation>('CHILD');
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>('F');
  const [age, setAge] = useState<string>('12');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [hasOwnPhone, setHasOwnPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdAbha, setCreatedAbha] = useState('');

  if (!isOpen) return null;

  const handleToggleCondition = (cond: string) => {
    if (cond === 'None') {
      setSelectedConditions([]);
      return;
    }
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions.filter((c) => c !== 'None'), cond]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedAge = parseInt(age, 10) || 1;
    const newMem = addMember({
      name: name.trim(),
      relation,
      gender,
      age: parsedAge,
      bloodGroup,
      hasOwnPhone,
      phone: hasOwnPhone ? phone : undefined,
      chronicConditions: selectedConditions,
      allergies: allergies.trim() ? [allergies.trim()] : [],
    });

    setCreatedAbha(newMem.abhaId);
    setIsSuccess(true);
  };

  const handleDone = () => {
    setIsSuccess(false);
    setName('');
    setAge('12');
    setPhone('');
    setHasOwnPhone(false);
    setSelectedConditions([]);
    setAllergies('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-2xl sm:max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/80 border border-teal-500/40 text-teal-200">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Add Family Member
              </h3>
              <p className="text-xs text-teal-200">
                Link household dependents to your healthcare account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="rounded-lg p-1.5 text-teal-200 hover:text-white hover:bg-teal-700/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">
                  Family Member Added Successfully!
                </h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  {name} has been linked to your household health account and assigned an Ayushman ABHA ID.
                </p>
              </div>

              <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 max-w-xs mx-auto text-left">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                  <ShieldCheck className="h-4 w-4 text-teal-700" />
                  <span>ABHA Health Card ID</span>
                </div>
                <p className="text-base font-mono font-extrabold text-teal-800 mt-1 tracking-wider">
                  {createdAbha}
                </p>
                <p className="text-[11px] text-teal-700 mt-1">
                  Ready for OPD queue tokens & digital prescriptions.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                onClick={handleDone}
                className="w-full max-w-xs mx-auto"
              >
                Close & View Member
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <Input
                label="Full Name *"
                type="text"
                placeholder="e.g. Savitri Sharma / Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* Relation & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Relation to You *
                  </label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value as FamilyRelation)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    <option value="SPOUSE">Spouse (Wife / Husband)</option>
                    <option value="CHILD">Child (Son / Daughter)</option>
                    <option value="PARENT">Parent (Father / Mother)</option>
                    <option value="SIBLING">Sibling (Brother / Sister)</option>
                    <option value="OTHER">Other Dependent</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'Other')}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Age & Blood Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Age (in Years) *"
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mobile Phone Sharing Section */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    id="hasPhone"
                    type="checkbox"
                    checked={hasOwnPhone}
                    onChange={(e) => setHasOwnPhone(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                  />
                  <div>
                    <label
                      htmlFor="hasPhone"
                      className="text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      Does this family member have their own mobile phone?
                    </label>
                    <p className="text-[11px] text-slate-500">
                      If unchecked, they will safely share your registered number for OPD notifications and hospital tokens.
                    </p>
                  </div>
                </div>

                {hasOwnPhone && (
                  <div className="pt-2 animate-in fade-in-50 duration-100">
                    <Input
                      label="Their Dedicated Mobile Number *"
                      type="tel"
                      placeholder="e.g. 9825123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={hasOwnPhone}
                    />
                  </div>
                )}
              </div>

              {/* Known Health Conditions */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Known Health Conditions (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CONDITIONS.map((cond) => {
                    const isSelected = selectedConditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => handleToggleCondition(cond)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-teal-700 text-white font-semibold shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergies */}
              <Input
                label="Known Drug/Food Allergies (Optional)"
                type="text"
                placeholder="e.g. Penicillin, Peanuts, None"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleDone}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save & Generate ABHA Card
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
