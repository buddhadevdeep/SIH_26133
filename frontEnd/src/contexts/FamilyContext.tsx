import React, { createContext, useContext, useState, useEffect } from 'react';
import { FamilyMember, AddFamilyMemberInput, FamilyRelation } from '@/types/family';

interface FamilyContextType {
  members: FamilyMember[];
  activeMember: FamilyMember;
  activeMemberId: string;
  setActiveMemberId: (id: string) => void;
  addMember: (input: AddFamilyMemberInput) => FamilyMember;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  assignPersonalPhone: (id: string, newPhone: string) => void;
  removeMember: (id: string) => void;
}

const RELATION_LABELS: Record<FamilyRelation, string> = {
  SELF: 'Self (Primary)',
  SPOUSE: 'Spouse',
  CHILD: 'Child / Dependent',
  PARENT: 'Parent',
  SIBLING: 'Sibling',
  OTHER: 'Family Dependent',
};

const DEFAULT_MEMBERS: FamilyMember[] = [
  {
    id: 'mem_01',
    name: 'Rameshwar Sharma',
    relation: 'SELF',
    relationLabel: 'Self (Head of Family)',
    gender: 'M',
    age: 48,
    dob: '1978-04-12',
    bloodGroup: 'O+',
    abhaId: '14-8921-3409-7721',
    phone: '9876543210',
    hasOwnPhone: true,
    isPrimary: true,
    chronicConditions: ['Hypertension'],
    allergies: ['Penicillin'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    emergencyContact: '+91 9876543210',
  },
  {
    id: 'mem_02',
    name: 'Savitri Sharma',
    relation: 'SPOUSE',
    relationLabel: 'Spouse / Wife',
    gender: 'F',
    age: 44,
    dob: '1982-08-25',
    bloodGroup: 'B+',
    abhaId: '14-8921-3409-7722',
    phone: '9876543210',
    hasOwnPhone: false,
    isPrimary: false,
    chronicConditions: ['Hypothyroidism'],
    allergies: [],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    emergencyContact: '+91 9876543210',
  },
  {
    id: 'mem_03',
    name: 'Gopal Sharma',
    relation: 'PARENT',
    relationLabel: 'Father (Senior Citizen)',
    gender: 'M',
    age: 72,
    dob: '1954-02-10',
    bloodGroup: 'O+',
    abhaId: '14-8921-3409-7723',
    phone: '9876543210',
    hasOwnPhone: false,
    isPrimary: false,
    chronicConditions: ['Type 2 Diabetes', 'Osteoarthritis'],
    allergies: ['Sulfa drugs'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    emergencyContact: '+91 9876543210',
  },
  {
    id: 'mem_04',
    name: 'Pooja Sharma',
    relation: 'CHILD',
    relationLabel: 'Daughter',
    gender: 'F',
    age: 16,
    dob: '2010-11-05',
    bloodGroup: 'A+',
    abhaId: '14-8921-3409-7724',
    phone: '9876543210',
    hasOwnPhone: false,
    isPrimary: false,
    chronicConditions: [],
    allergies: [],
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    emergencyContact: '+91 9876543210',
  },
];

const STORAGE_KEY = 'healthconnect_family_members';
const ACTIVE_MEMBER_KEY = 'healthconnect_active_member_id';

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved family members', e);
      }
    }
    return DEFAULT_MEMBERS;
  });

  const [activeMemberId, setActiveMemberIdState] = useState<string>(() => {
    const savedActive = localStorage.getItem(ACTIVE_MEMBER_KEY);
    if (savedActive && members.some((m) => m.id === savedActive)) {
      return savedActive;
    }
    return members[0]?.id || 'mem_01';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_MEMBER_KEY, activeMemberId);
  }, [activeMemberId]);

  const activeMember = members.find((m) => m.id === activeMemberId) || members[0] || DEFAULT_MEMBERS[0];

  const setActiveMemberId = (id: string) => {
    if (members.some((m) => m.id === id)) {
      setActiveMemberIdState(id);
    }
  };

  const addMember = (input: AddFamilyMemberInput): FamilyMember => {
    const newId = `mem_${Date.now()}`;
    // Random 4-digit suffix for ABHA
    const abhaSuffix = Math.floor(1000 + Math.random() * 9000);
    const newAbhaId = `14-8921-3409-${abhaSuffix}`;

    const newMember: FamilyMember = {
      id: newId,
      name: input.name.trim(),
      relation: input.relation,
      relationLabel: RELATION_LABELS[input.relation] || 'Family Dependent',
      gender: input.gender,
      age: input.age,
      dob: input.dob || `${new Date().getFullYear() - input.age}-01-01`,
      bloodGroup: input.bloodGroup || 'O+',
      abhaId: newAbhaId,
      phone: input.phone && input.hasOwnPhone ? input.phone.trim() : (members[0]?.phone || '9876543210'),
      hasOwnPhone: !!input.hasOwnPhone && !!input.phone,
      isPrimary: false,
      chronicConditions: input.chronicConditions || [],
      allergies: input.allergies || [],
      emergencyContact: members[0]?.phone || '+91 9876543210',
    };

    setMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, ...updates };
          if (updates.relation) {
            updated.relationLabel = RELATION_LABELS[updates.relation] || updated.relationLabel;
          }
          return updated;
        }
        return m;
      })
    );
  };

  const assignPersonalPhone = (id: string, newPhone: string) => {
    const cleanPhone = newPhone.replace(/\D/g, '').slice(-10);
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            phone: cleanPhone,
            hasOwnPhone: true,
          };
        }
        return m;
      })
    );
  };

  const removeMember = (id: string) => {
    setMembers((prev) => {
      const filtered = prev.filter((m) => m.id !== id || m.isPrimary);
      return filtered;
    });
    if (activeMemberId === id) {
      setActiveMemberIdState(members[0]?.id || 'mem_01');
    }
  };

  return (
    <FamilyContext.Provider
      value={{
        members,
        activeMember,
        activeMemberId,
        setActiveMemberId,
        addMember,
        updateMember,
        assignPersonalPhone,
        removeMember,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = (): FamilyContextType => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
