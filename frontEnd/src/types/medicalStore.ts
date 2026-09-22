export type MedicalStoreType =
  | 'JAN_AUSHADHI'
  | 'HOSPITAL_PHARMACY'
  | 'PRIVATE_CHEMIST'
  | '24X7_EMERGENCY';

export type MedicineStockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'CALL_TO_VERIFY';

export interface StoreMedicineItem {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  status: MedicineStockStatus;
  quantityAvailable?: number;
  genericPrice?: number; // PMBJP Subsidized Price
  brandPrice?: number;   // Private Retail Brand MRP
  unit: string;          // e.g. "Strip of 10 Tabs"
}

export interface MedicalStore {
  id: string;
  name: string;
  type: MedicalStoreType;
  isJanAushadhi: boolean;      // Top Priority
  hasLiveApi: boolean;         // True: Real-time stock stream; False: Traditional local store
  licenseNumber: string;       // e.g. "GMC/DL/2022/9482"
  distanceKm?: number;         // Distance from active citizen's location
  area: string;                // e.g. "Sector 21 Market"
  fullAddress: string;
  pincode?: string;
  district?: string;
  state?: string;
  phone: string;
  whatsappPhone?: string;
  timings: string;             // e.g. "8:00 AM - 10:30 PM" or "Open 24x7"
  isOpenNow: boolean;
  rating: number;              // e.g. 4.8
  reviewCount: number;
  discountPercentage?: number; // e.g. 75 for Jan Aushadhi
  coordinates: {
    lat: number;
    lng: number;
  };
  lastSyncTimestamp?: string;  // e.g. "2 mins ago"
  stockCatalog: StoreMedicineItem[];
}
