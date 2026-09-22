export type BedType = 'GENERAL' | 'ICU' | 'EMERGENCY' | 'MATERNITY' | 'PEDIATRIC' | 'ISOLATION';

export interface BedCategory {
  type: BedType;
  total: number;
  occupied: number;
  available: number;
  lastUpdated: string;
}

export interface BedSummary {
  facilityId: string;
  facilityName: string;
  totalBeds: number;
  totalAvailable: number;
  totalOccupied: number;
  icuTotal: number;
  icuAvailable: number;
  emergencyTotal: number;
  emergencyAvailable: number;
  categories: BedCategory[];
  lastUpdated: string;
  isStale: boolean;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface BloodStockItem {
  bloodGroup: BloodGroup;
  unitsAvailable: number;
  minimumThreshold: number;
  status: 'OPTIMAL' | 'MODERATE' | 'LOW' | 'CRITICAL';
  expiringIn7Days: number;
  lastUpdated: string;
}

export interface BloodInventory {
  facilityId: string;
  facilityName: string;
  stock: BloodStockItem[];
  totalUnits: number;
  isStale: boolean;
}

export type AmbulanceStatus = 'AVAILABLE' | 'ON_CALL' | 'IN_TRANSIT' | 'MAINTENANCE';

export interface Ambulance {
  id: string;
  vehicleNumber: string; // e.g. "GJ-01-AX-9921"
  type: 'ADVANCED_LIFE_SUPPORT' | 'BASIC_LIFE_SUPPORT' | 'NEONATAL';
  driverName: string;
  driverPhone: string;
  facilityId: string;
  facilityName: string;
  status: AmbulanceStatus;
  currentLocationName?: string;
  currentCoordinates?: { lat: number; lng: number };
  assignedPatientName?: string;
  lastUpdated: string;
}

export interface MedicineInventoryItem {
  id: string;
  facilityId: string;
  medicineName: string;
  genericName: string;
  category: string;
  batchNumber: string;
  availableQuantity: number;
  minimumStockThreshold: number;
  unit: string; // e.g. "Tablets", "Vials", "Strips"
  expiryDate: string; // YYYY-MM-DD
  status: 'IN_STOCK' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'OUT_OF_STOCK' | 'QUARANTINED';
  quarantineReason?: string;
  lastUpdated: string;
}

export interface DispensingRecordItem {
  medicineName: string;
  genericName?: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  dosageInstructions: string;
}

export interface DispensingRecord {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  facilityId: string;
  facilityName: string;
  dispensedBy: string;
  dispensedAt: string;
  items: DispensingRecordItem[];
  notes?: string;
}

export interface EquipmentItem {
  id: string;
  facilityId: string;
  facilityName: string;
  name: string; // e.g. "CT Scanner 128 Slice", "Digital X-Ray", "Ultrasound Sonography"
  category: string;
  model: string;
  department: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  quantity: number;
  operationalQuantity: number;
  lastServicedDate: string;
  nextServiceDate: string;
  isStale: boolean;
  lastUpdated: string;
}
