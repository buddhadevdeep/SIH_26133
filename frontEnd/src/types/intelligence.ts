// District Health Resource Intelligence & Service Gap Mapping Types

export type ServiceAvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
export type GapSeverity = 'CRITICAL' | 'MODERATE' | 'LOW';
export type AreaPriorityStatus = 'ATTENTION_REQUIRED' | 'WATCH' | 'STABLE';
export type DemandLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface DistrictHealthSummary {
  districtName: string;
  telemetryFreshness: string;
  dataTimestamp: string;
  timeRange: 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS';
  areasNeedingAttentionCount: number;
  facilitiesWithCriticalGapsCount: number;
  specialistGapsCount: number;
  diagnosticGapsCount: number;
  medicineShortagesCount: number;
  equipmentGapsCount: number;
}

export interface ServingFacilityRef {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  isNearest: boolean;
}

export interface AreaCaseCategoryDemand {
  category: string;
  recordedCases: number;
  isProjected?: boolean;
  trendPercentage?: number;
}

export interface AreaDemandMetrics {
  mostRequestedServices: string[];
  topCaseCategories: AreaCaseCategoryDemand[];
  diagnosticDemandLevel: DemandLevel;
  referralVolume30d: number;
  appointmentDemandWeekly: number;
  emergencyCasualtyTransfers: number;
}

export interface AreaServiceAvailability {
  generalCare: ServiceAvailabilityStatus;
  specialistCare: ServiceAvailabilityStatus;
  emergencyCasualty: ServiceAvailabilityStatus;
  diagnostics: ServiceAvailabilityStatus;
  pharmacyMeds: ServiceAvailabilityStatus;
  maternalCare: ServiceAvailabilityStatus;
}

export interface AreaCapacityGaps {
  specialistShortages: string[];
  diagnosticGaps: string[];
  medicineShortages: string[];
  equipmentGaps: string[];
}

export interface AreaReferralDependency {
  outwardReferralRatio: number; // e.g. 0.85 = 85% of cases needing secondary/specialist care leave area
  primaryDestinationFacilityId: string;
  primaryDestinationFacilityName: string;
  dominantReferralSpecialties: string[];
  averageTransferDistanceKm: number;
}

export interface AreaIntelligenceProfile {
  id: string;
  name: string;
  block: string;
  populationEstimate: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  servingFacilities: ServingFacilityRef[];
  demand: AreaDemandMetrics;
  serviceAvailability: AreaServiceAvailability;
  capacityGaps: AreaCapacityGaps;
  referralDependency: AreaReferralDependency;
  priorityScore: number; // Transparent composite score: 0 - 100
  priorityReasons: string[];
  status: AreaPriorityStatus;
  suggestedAdministrativeReview: string;
  lastUpdated: string;
}

export interface FacilityIdentifiedGap {
  id: string;
  type: 'SPECIALIST' | 'DIAGNOSTIC' | 'MEDICINE' | 'EQUIPMENT' | 'BED';
  title: string;
  description: string;
  severity: GapSeverity;
  evidence: string;
  administrativeConsideration: string;
}

export interface FacilityGapProfile {
  facilityId: string;
  facilityName: string;
  facilityType: string;
  block: string;
  distanceKm?: number;
  demandMetrics: {
    dailyOpdVolume: number;
    dailyOpdCapacity: number;
    queueCongestionLevel: 'NORMAL' | 'HIGH' | 'CRITICAL';
    referralsReceivedCount: number;
    referralsSentOutCount: number;
  };
  capacityMetrics: {
    activeDoctorsCount: number;
    specialistCount: number;
    totalBeds: number;
    availableBeds: number;
    bedOccupancyRate: number;
    icuBedsTotal: number;
    icuBedsAvailable: number;
    oxygenOperational: boolean;
    bloodBankAvailable: boolean;
  };
  operationalStatus: 'OPEN' | 'LIMITED' | 'EMERGENCY_ONLY';
  overallGapSeverity: GapSeverity;
  identifiedGaps: FacilityIdentifiedGap[];
  lastUpdated: string;
}

export interface SpecialistShortageItem {
  id: string;
  specialty: string;
  currentDoctorsCount: number;
  predictedDemandConsultations: number;
  availableCapacityConsultations: number;
  deficitConsultations: number;
  severity: GapSeverity;
  affectedServingFacilities: string[];
  affectedVillages: string[];
  evidenceText: string;
  administrativeReviewOption: string;
}

export interface EquipmentGapItem {
  id: string;
  equipmentName: string;
  model?: string;
  facilityId: string;
  facilityName: string;
  category: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'DEGRADED' | 'OFFLINE' | 'OUT_OF_SERVICE';
  operationalQuantity: number;
  totalQuantity: number;
  operationalEffect: string;
  referralImpactDescription: string;
  suggestedActionForReview: string;
  lastUpdated: string;
}

export interface MedicineShortageItem {
  id: string;
  medicineName: string;
  genericName: string;
  category: string;
  facilityId: string;
  facilityName: string;
  availableStock: number;
  minimumThreshold: number;
  unit: string;
  deficitUnits: number;
  severity: 'OUT_OF_STOCK' | 'LOW_STOCK';
  affectedClinicalServices: string[];
  nearbyAvailableFacility?: {
    facilityId: string;
    facilityName: string;
    availableStock: number;
  };
  suggestedActionForReview: string;
  lastUpdated: string;
}

export interface DiagnosticGapItem {
  id: string;
  testName: string;
  category: string;
  dailyDemandVolume: number;
  status: 'NORMAL' | 'HIGH_VOLUME' | 'DELAYED' | 'UNAVAILABLE_LOCALLY';
  avgTatHours: number;
  backlogCount: number;
  affectedFacilityId: string;
  affectedFacilityName: string;
  primaryReferralDestination?: string;
  evidenceText: string;
  suggestedActionForReview: string;
}

export interface EvidenceRecommendation {
  id: string;
  category: 'STAFFING' | 'DIAGNOSTICS' | 'MEDICINES' | 'EQUIPMENT' | 'REFERRAL_COORDINATION';
  title: string;
  targetFacilityOrArea: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  whyFlagged: string[];
  evidenceMetrics: {
    label: string;
    value: string;
  }[];
  suggestedActionForReview: string;
  disclaimer: string;
}

export interface DistrictAiQueryResponse {
  query: string;
  answer: string;
  supportingData: {
    label: string;
    value: string;
  }[];
  relevantFacilityOrArea: string;
  provenance: string;
  timestamp: string;
  dataFreshness: string;
  isGrounded: boolean;
}

export interface UnusedResourceItem {
  id: string;
  resourceName: string;
  category: 'EQUIPMENT' | 'BEDS' | 'MEDICINE' | 'DIAGNOSTIC';
  facilityId: string;
  facilityName: string;
  currentStatus: 'IDLE' | 'LOW_UTILIZATION' | 'OFFLINE_MAINTENANCE' | 'SURPLUS_AVAILABLE';
  utilizationRate?: number; // e.g. 18%
  idleQuantity: number | string;
  impactOrCause: string;
  opportunityRecommendation: string;
}

export interface DoctorRequirementItem {
  specialty: string;
  doctorsNeeded: number;
  currentDoctors: number;
  patientBacklog: number;
  avgWaitDays?: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE';
  reason: string;
}

export interface HospitalDoctorRequirement {
  facilityId: string;
  facilityName: string;
  facilityType: string;
  requirements: DoctorRequirementItem[];
}
