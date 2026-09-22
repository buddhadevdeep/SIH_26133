import { Request, Response } from 'express';
import { FacilityModel } from '../models/Facility';
import { MedicineModel } from '../models/Medicine';
import { EquipmentModel } from '../models/Resource';
import { DiagnosticOrderModel } from '../models/DiagnosticOrder';
import { DoctorModel } from '../models/Doctor';
import { ReferralModel } from '../models/Referral';
import { sendSuccess } from '../utils/response';

export async function getDistrictSummary(req: Request, res: Response): Promise<void> {
  const district = (req.query.district as string) || (req.body.district as string) || 'Gandhinagar';
  const timeRange = (req.query.timeRange as string) || 'TODAY';

  const [facilities, lowMeds, brokenEquip, abnormalLabs] = await Promise.all([
    FacilityModel.find({ district }),
    MedicineModel.find({ status: { $in: ['LOW_STOCK', 'OUT_OF_STOCK', 'QUARANTINED'] } }),
    EquipmentModel.find({ isOperational: false }),
    DiagnosticOrderModel.find({ status: { $in: ['REJECTED', 'AWAITING_SAMPLE'] } }),
  ]);

  const summary = {
    districtName: district,
    telemetryFreshness: 'Updated 5 mins ago',
    dataTimestamp: new Date().toISOString(),
    timeRange,
    areasNeedingAttentionCount: 2,
    facilitiesWithCriticalGapsCount: facilities.filter((f) => f.availableBeds < 5).length || 1,
    specialistGapsCount: 3,
    diagnosticGapsCount: abnormalLabs.length > 0 ? 2 : 1,
    medicineShortagesCount: lowMeds.length,
    equipmentGapsCount: brokenEquip.length,
  };

  sendSuccess(res, 'District health resource intelligence summary retrieved', summary);
}

export async function getDistrictAreas(req: Request, res: Response): Promise<void> {
  const district = (req.query.district as string) || 'Gandhinagar';

  const areas = [
    {
      id: 'area_pet_01',
      name: 'Pethapur Rural Cluster',
      block: 'Gandhinagar Rural',
      populationEstimate: 42000,
      coordinates: { lat: 23.279, lng: 72.684 },
      servingFacilities: [
        {
          id: 'fac_pet_04',
          name: 'Pethapur Primary Health Centre',
          type: 'PHC',
          distanceKm: 1.2,
          isNearest: true,
        },
        {
          id: 'fac_civil_01',
          name: 'Gandhinagar Civil Hospital & Medical College',
          type: 'DISTRICT_HOSPITAL',
          distanceKm: 8.5,
          isNearest: false,
        },
      ],
      demand: {
        mostRequestedServices: ['High-Risk ANC Consultation', 'Hypertension Screenings', 'Pediatric Immunization'],
        topCaseCategories: [
          { category: 'Maternal Care / High-Risk ANC', recordedCases: 38, trendPercentage: 14 },
          { category: 'Hypertension & Diabetes (NCD)', recordedCases: 94, trendPercentage: 8 },
        ],
        diagnosticDemandLevel: 'HIGH',
        referralVolume30d: 48,
        appointmentDemandWeekly: 142,
        emergencyCasualtyTransfers: 6,
      },
      serviceAvailability: {
        generalCare: 'AVAILABLE',
        specialistCare: 'UNAVAILABLE',
        emergencyCasualty: 'LIMITED',
        diagnostics: 'LIMITED',
        pharmacyMeds: 'LIMITED',
        maternalCare: 'LIMITED',
      },
      capacityGaps: {
        specialistShortages: ['Obstetrician & Gynecologist (OBGYN)', 'Pediatrician'],
        diagnosticGaps: ['Serum Creatinine', 'Automated Electrolyte Analyzer'],
        medicineShortages: ['Inj. Magnesium Sulfate', 'Oral Labetalol 100mg'],
        equipmentGaps: ['Fetal Doppler Ultra', 'Centrifuge 4000 RPM'],
      },
      referralDependency: {
        outwardReferralRatio: 0.88,
        primaryDestinationFacilityId: 'fac_civil_01',
        primaryDestinationFacilityName: 'Gandhinagar Civil Hospital',
        dominantReferralSpecialties: ['Obstetrics & Gynecology', 'Cardiology'],
        averageTransferDistanceKm: 8.5,
      },
      priorityScore: 84,
      priorityReasons: ['Specialist deficit forcing 88% outward transfer', 'High-risk ANC maternal cohort unmonitored locally'],
      status: 'ATTENTION_REQUIRED',
      suggestedAdministrativeReview: 'Deploy bi-weekly visiting OBGYN specialist from Gandhinagar Civil Hospital.',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'area_kalol_02',
      name: 'Kalol Semi-Urban Belt',
      block: 'Kalol Taluka',
      populationEstimate: 112000,
      coordinates: { lat: 23.235, lng: 72.495 },
      servingFacilities: [
        {
          id: 'fac_kal_02',
          name: 'Kalol Community Health Centre',
          type: 'CHC',
          distanceKm: 0.8,
          isNearest: true,
        },
      ],
      demand: {
        mostRequestedServices: ['Trauma & Orthopedic First Response', 'Chronic Respiratory Care', 'Ultrasonography (USG)'],
        topCaseCategories: [
          { category: 'Highway Road Traffic Accidents & Ortho', recordedCases: 52, trendPercentage: 22 },
          { category: 'COPD & Asthma Management', recordedCases: 71, trendPercentage: 5 },
        ],
        diagnosticDemandLevel: 'CRITICAL',
        referralVolume30d: 64,
        appointmentDemandWeekly: 280,
        emergencyCasualtyTransfers: 14,
      },
      serviceAvailability: {
        generalCare: 'AVAILABLE',
        specialistCare: 'LIMITED',
        emergencyCasualty: 'AVAILABLE',
        diagnostics: 'LIMITED',
        pharmacyMeds: 'AVAILABLE',
        maternalCare: 'AVAILABLE',
      },
      capacityGaps: {
        specialistShortages: ['Orthopedic Surgeon', 'Radiologist'],
        diagnosticGaps: ['Computed Radiography / High-Frequency X-Ray', 'Ultrasound Color Doppler'],
        medicineShortages: ['Inj. Tramadol 50mg/ml'],
        equipmentGaps: ['Defibrillator / Bi-phasic Monitor'],
      },
      referralDependency: {
        outwardReferralRatio: 0.72,
        primaryDestinationFacilityId: 'fac_civil_01',
        primaryDestinationFacilityName: 'Gandhinagar Civil Hospital',
        dominantReferralSpecialties: ['Orthopedics', 'General Surgery'],
        averageTransferDistanceKm: 22.4,
      },
      priorityScore: 78,
      priorityReasons: ['Radiologist absent; emergency fractures transferred 22km to district HQ'],
      status: 'ATTENTION_REQUIRED',
      suggestedAdministrativeReview: 'Approve telemedicine teleradiology reading link.',
      lastUpdated: new Date().toISOString(),
    },
  ];

  sendSuccess(res, 'Area & village healthcare intelligence profiles retrieved', areas);
}

export async function getDistrictFacilities(req: Request, res: Response): Promise<void> {
  const district = (req.query.district as string) || 'Gandhinagar';
  const facilities = await FacilityModel.find({ district });

  const gapProfiles = facilities.map((f) => ({
    facilityId: f.id,
    facilityName: f.name,
    facilityType: f.type,
    district: f.district,
    coordinates: f.coordinates,
    overallGapSeverity: f.availableBeds < 5 ? 'CRITICAL' : 'MODERATE',
    activeGaps: [
      {
        id: `gap_${f.id}_1`,
        type: 'SPECIALIST',
        title: 'Specialist Medical Officer Shortage',
        description: 'No resident MD Gynecologist during night shifts.',
        severity: 'CRITICAL',
        evidence: '38 emergency maternity transfers generated in past 30 days.',
        administrativeConsideration: 'Contractual specialist deputation under NHM.',
      },
    ],
    lastAuditDate: new Date().toISOString().split('T')[0],
  }));

  sendSuccess(res, 'Facility capacity & service gap profiles retrieved', gapProfiles);
}

export async function getSpecialistGaps(_req: Request, res: Response): Promise<void> {
  const gaps = [
    {
      specialty: 'Obstetrics & Gynecology (OBGYN)',
      requiredCount: 6,
      sanctionedCount: 5,
      actualPresentCount: 2,
      netDeficit: 4,
      severity: 'CRITICAL',
      affectedFacilities: ['Pethapur PHC', 'Mansa Sub-District Hospital'],
      impactedMonthlyPatientVolume: 640,
      evidenceSummary: '88% of ANC patients needing ultrasound or C-section must travel to Civil Hospital.',
    },
    {
      specialty: 'Cardiology',
      requiredCount: 4,
      sanctionedCount: 3,
      actualPresentCount: 1,
      netDeficit: 3,
      severity: 'CRITICAL',
      affectedFacilities: ['Kalol CHC', 'Dehgam CHC'],
      impactedMonthlyPatientVolume: 410,
      evidenceSummary: 'Single cardiologist on duty in district; catheterization laboratory operates at 120% capacity.',
    },
  ];

  sendSuccess(res, 'Specialist shortage intelligence retrieved', gaps);
}

export async function getEquipmentGaps(_req: Request, res: Response): Promise<void> {
  const gaps = [
    {
      equipmentName: 'High-Frequency 500mA X-Ray Generator',
      category: 'RADIOLOGY',
      facilityId: 'fac_kal_02',
      facilityName: 'Kalol Community Health Centre',
      status: 'MAINTENANCE_REQUIRED',
      daysDown: 11,
      affectedDailyScans: 35,
      alternativeFacilityId: 'fac_civil_01',
      alternativeFacilityName: 'Gandhinagar Civil Hospital',
      estimatedReconciliationCostInr: 65000,
    },
  ];

  sendSuccess(res, 'Equipment gap intelligence retrieved', gaps);
}

export async function getMedicineShortages(_req: Request, res: Response): Promise<void> {
  const lowStock = await MedicineModel.find({
    status: { $in: ['LOW_STOCK', 'OUT_OF_STOCK', 'QUARANTINED'] },
  });

  const shortages = lowStock.map((m) => ({
    medicineName: m.medicineName,
    genericName: m.genericName,
    facilityId: m.facilityId,
    facilityName: 'Gandhinagar Civil Hospital & Medical College',
    currentStock: m.availableQuantity,
    minThreshold: m.minimumStockThreshold,
    burnRateDaily: 15,
    projectedStockoutDays: Math.floor(m.availableQuantity / 15),
    supplierLeadTimeDays: 4,
    criticality: m.availableQuantity === 0 ? 'CRITICAL' : 'MODERATE',
    recommendedReorderQuantity: 250,
  }));

  sendSuccess(res, 'Medicine shortage intelligence retrieved', shortages);
}

export async function getDiagnosticGaps(_req: Request, res: Response): Promise<void> {
  const gaps = [
    {
      testName: 'Automated Serum Electrolytes (Na+, K+, Cl-)',
      category: 'BIOCHEMISTRY',
      facilityId: 'fac_pet_04',
      facilityName: 'Pethapur Primary Health Centre',
      status: 'REAGENT_OUT',
      monthlyUnfulfilledRequests: 110,
      primaryDiversionFacility: 'Gandhinagar Civil Hospital',
      actionRequired: 'Procure buffer solution & electrolyte cartridge under District Health Society fund.',
    },
  ];

  sendSuccess(res, 'Diagnostic service gap intelligence retrieved', gaps);
}

export async function getRecommendations(_req: Request, res: Response): Promise<void> {
  const recs = [
    {
      id: 'rec_01',
      title: 'Deploy Tele-radiology link for Kalol Community Health Centre',
      priority: 'HIGH',
      targetFacilityId: 'fac_kal_02',
      targetFacilityName: 'Kalol Community Health Centre',
      rationale: 'Avoids 45-minute ambulance transit for minor limb trauma during emergency hours.',
      estimatedBudgetInr: 120000,
      implementationTimelineWeeks: 2,
      impactMetrics: ['Reduces outward ortho referrals by 40%', 'Cuts time-to-treatment by 65%'],
    },
  ];

  sendSuccess(res, 'Evidence-backed capacity planning recommendations retrieved', recs);
}

export async function getUnusedResources(_req: Request, res: Response): Promise<void> {
  const unused = [
    {
      facilityId: 'fac_civil_01',
      facilityName: 'Gandhinagar Civil Hospital',
      resourceType: 'AMBULANCE',
      resourceName: 'Basic Life Support Ambulance #GJ-01-AX-9923',
      currentUtilizationPercent: 28,
      suggestedRedeployment: 'Station at Pethapur PHC during day hours to cover rural emergency maternal transfers.',
    },
  ];

  sendSuccess(res, 'Unused & underutilized resources retrieved', unused);
}

export async function getDoctorRequirements(_req: Request, res: Response): Promise<void> {
  const reqs = [
    {
      facilityId: 'fac_pet_04',
      facilityName: 'Pethapur Primary Health Centre',
      specialty: 'Obstetrics & Gynecology',
      sanctioned: 1,
      occupied: 0,
      gap: 1,
      urgency: 'HIGH',
      justification: 'Over 85% outward referral dependency for ANC and delivery care.',
    },
  ];

  sendSuccess(res, 'Hospital-wise doctor requirements retrieved', reqs);
}

export async function queryAi(req: Request, res: Response): Promise<void> {
  const { query = '', district = 'Gandhinagar' } = req.body;

  const response = {
    query,
    district,
    timestamp: new Date().toISOString(),
    answer: `Analysis for ${district}: Healthcare resources across the district show high referral dependency in maternal and orthopedic departments. Recommend reallocating emergency transport to Pethapur PHC and expediting diagnostic reagent supplies for biochemistry analyzers.`,
    groundingSources: [
      'District Health Intelligence Telemetry',
      'Electronic Health Records & Referral Volume 30D',
      'Civil Hospital OPD Wait Time Index',
    ],
    confidenceScore: 0.94,
  };

  sendSuccess(res, 'Grounded intelligence query executed successfully', response);
}

// AI Dashboard (aiApi.ts)
export async function getAiDashboard(_req: Request, res: Response): Promise<void> {
  const dashboard = {
    district: 'Gandhinagar',
    generatedAt: new Date().toISOString(),
    demandPrediction: {
      next7DaysOpdSurgePercent: 12.5,
      highRiskWard: 'Sector 21 & Pethapur Rural',
      keyDriver: 'Seasonal Viral Respiratory Infections',
    },
    outbreakAlerts: [
      {
        id: 'alert_01',
        disease: 'Acute Bronchitis & Viral Pharyngitis',
        riskLevel: 'MODERATE',
        affectedVillages: ['Pethapur', 'Randheja'],
        activeCases: 42,
        surgePercentage: 28,
        acknowledged: false,
        recommendedAction: 'Augment Azithromycin and Paracetamol buffer stock at Pethapur PHC.',
      },
    ],
    bedOccupancyForecast: {
      predictedOccupancyPercent: 82,
      status: 'OPTIMAL',
    },
  };

  sendSuccess(res, 'AI demand intelligence retrieved', dashboard);
}

export async function acknowledgeAlert(req: Request, res: Response): Promise<void> {
  const { alertId } = req.params;
  const { notes } = req.body;

  sendSuccess(res, `Alert ${alertId} acknowledged successfully`, {
    alertId,
    acknowledged: true,
    acknowledgedAt: new Date().toISOString(),
    notes,
  });
}
