export type FacilityType =
  | 'PHC'
  | 'CHC'
  | 'DISTRICT_HOSPITAL'
  | 'SUB_DISTRICT_HOSPITAL'
  | 'MEDICAL_COLLEGE'
  | 'SPECIALTY_HOSPITAL';

export interface Department {
  id: string;
  name: string;
  code: string;
  activeDoctors: number;
  currentWaitMinutes: number;
  opdOpen: boolean;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  districtId?: string;
  district: string;
  state: string;
  address: string;
  pincode: string;
  contactNumber: string;
  emergencyNumber: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceKm?: number;
  isOpen: boolean;
  isVerified: boolean;
  emergencyAvailable: boolean;
  currentWaitTimeMinutes: number;
  totalBeds: number;
  availableBeds: number;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  oxygenAvailable: boolean;
  bloodBankAvailable: boolean;
  ambulanceAvailable: boolean;
  specialties: string[];
  equipment: Array<{
    name: string;
    isOperational: boolean;
    quantity: number;
  }>;
  departments: Department[];
  lastUpdated: string;
  rating?: number;
}

export interface FacilityFilterParams {
  search?: string;
  district?: string;
  districtId?: string;
  facilityType?: FacilityType | 'ALL';
  specialty?: string;
  emergencyOnly?: boolean;
  availableBedsOnly?: boolean;
  maxDistanceKm?: number;
  lat?: number;
  lng?: number;
}

export interface FacilityMatchRequest {
  patientId: string;
  clinicalReason: string;
  specialty: string;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  requiredEquipment?: string[];
  requiresIcu?: boolean;
  maxDistanceKm?: number;
}

export interface FacilityMatchResult {
  facility: Facility;
  suitabilityScore: number; // 0 - 100
  clinicalMatchPercent: number;
  specialistAvailability: 'AVAILABLE_NOW' | 'AVAILABLE_TODAY' | 'ON_CALL' | 'UNAVAILABLE';
  equipmentSuitability: boolean;
  bedAvailabilityStatus: 'PLENTY' | 'LIMITED' | 'CRITICAL' | 'NONE';
  distanceKm: number;
  estimatedTransitTimeMins: number;
  matchReasons: string[];
}
