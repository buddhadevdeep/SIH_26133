export type FamilyRelation =
  | 'SELF'
  | 'SPOUSE'
  | 'CHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'OTHER';

export interface FamilyMember {
  id: string;
  name: string;
  relation: FamilyRelation;
  relationLabel: string;
  gender: 'M' | 'F' | 'Other';
  age: number;
  dob: string;
  bloodGroup: string;
  abhaId: string;
  abhaAddress?: string;
  phone: string;
  hasOwnPhone: boolean;
  phoneType?: 'SHARED' | 'PERSONAL';
  personalPhone?: string;
  isPrimary: boolean;
  chronicConditions: string[];
  allergies: string[];
  avatar?: string;
  emergencyContact?: string;
}

export interface AddFamilyMemberInput {
  name: string;
  relation: FamilyRelation;
  gender: 'M' | 'F' | 'Other';
  age: number;
  dob?: string;
  bloodGroup: string;
  phone?: string;
  hasOwnPhone?: boolean;
  phoneType?: 'SHARED' | 'PERSONAL';
  personalPhone?: string;
  chronicConditions?: string[];
  allergies?: string[];
}
