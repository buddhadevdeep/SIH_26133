export interface District {
  id: string;
  name: string;
  code: string;
  state: string;
  status: 'ACTIVE' | 'INACTIVE';
  headquarters?: string;
  population?: number;
  totalFacilities?: number;
  activeDoctors?: number;
}
