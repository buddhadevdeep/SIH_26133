export type OutbreakRiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'HIGH_RISK';

export interface DiseaseForecastPoint {
  date: string; // YYYY-MM-DD or Month
  observedCases?: number;
  expectedCases: number;
  forecastCases: number;
  upperConfidence: number;
  lowerConfidence: number;
  isAnomaly?: boolean;
}

export interface DiseaseTrend {
  diseaseName: string; // e.g. "Dengue", "Acute Respiratory Infection (ARI)", "Malaria", "Viral Hepatitis"
  district: string;
  trendDirection: 'RISING' | 'STABLE' | 'DECLINING';
  percentageChange: number;
  timeframe: '30_DAYS' | '60_DAYS' | '90_DAYS';
  forecastPoints: DiseaseForecastPoint[];
}

export interface OutbreakAlert {
  id: string;
  diseaseName: string;
  district: string;
  affectedBlock: string;
  riskLevel: OutbreakRiskLevel;
  observedCases: number;
  expectedThreshold: number;
  standardDeviation: number;
  trend: 'SHARP_INCREASE' | 'MODERATE_INCREASE' | 'CLUSTER_DETECTED';
  detectedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actionTakenNotes?: string;
  disclaimer: 'Unusual increase detected — requires epidemiologic & clinician verification. Not a confirmed outbreak.';
}

export interface SpecialistDemandGap {
  specialty: string; // e.g. "Cardiology", "Obstetrics & Gynecology", "Pediatrics", "Neurology", "Orthopedics"
  currentDoctors: number;
  predictedDemandConsultations: number;
  availableCapacityConsultations: number;
  gapConsultations: number; // positive = shortage
  shortageSeverity: 'NORMAL' | 'MODERATE' | 'CRITICAL';
  suggestedAction: string;
}

export interface PatientLoadForecast {
  timeframe: 'TODAY' | 'TOMORROW' | 'NEXT_7_DAYS' | 'NEXT_30_DAYS';
  predictedPatients: number;
  historicalAverage: number;
  facilityCapacity: number;
  peakHour?: string;
  hourlyBreakdown?: Array<{
    hour: string;
    predicted: number;
    capacity: number;
  }>;
}

export interface BedDemandGap {
  category: 'GENERAL' | 'ICU' | 'EMERGENCY' | 'PEDIATRIC';
  requiredBeds: number;
  availableBeds: number;
  capacityGap: number; // positive = shortage
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AmbulanceDemandForecast {
  predictedEmergencyCalls: number;
  activeFleetCount: number;
  demandGap: number;
  hotspotBlocks: string[];
}

export interface BloodDemandGap {
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  currentUnits: number;
  predictedDemandUnits: number;
  gapUnits: number; // positive = deficit
  risk: 'SAFE' | 'LOW_STOCK' | 'CRITICAL_DEFICIT';
}

export interface AiDemandIntelligenceSummary {
  updatedAt: string;
  disclaimer: 'AI-assisted demand intelligence — forecasts generated from historical public healthcare data. Requires clinical & administrative verification.';
  diseaseForecasts: DiseaseTrend[];
  outbreakAlerts: OutbreakAlert[];
  specialistGaps: SpecialistDemandGap[];
  patientLoad: PatientLoadForecast;
  bedDemands: BedDemandGap[];
  ambulanceDemand: AmbulanceDemandForecast;
  bloodDemands: BloodDemandGap[];
}
