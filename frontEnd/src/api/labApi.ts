import { apiRequest } from './client';
import { DiagnosticOrder, LabResultParameter } from '@/types/clinical';

export interface DiagnosticOrderFilters {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
}

export const labApi = {
  /**
   * Fetch diagnostic orders with optional filters (status, category, priority, search)
   */
  getOrders: (filters?: DiagnosticOrderFilters) => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
    if (filters?.category && filters.category !== 'ALL') params.set('category', filters.category);
    if (filters?.priority && filters.priority !== 'ALL') params.set('priority', filters.priority);
    if (filters?.search && filters.search.trim()) params.set('search', filters.search.trim());
    const qs = params.toString();
    return apiRequest<DiagnosticOrder[]>(qs ? `/diagnostics/orders?${qs}` : '/diagnostics/orders', 'GET');
  },

  /**
   * Fetch single diagnostic order details by ID
   */
  getOrderById: (orderId: string) =>
    apiRequest<DiagnosticOrder>(`/diagnostics/orders/${orderId}`, 'GET'),

  /**
   * Phlebotomy / Sample Collection confirmation with tube barcode assignment
   */
  collectSample: (orderId: string, payload?: { technicianName?: string; notes?: string }) =>
    apiRequest<DiagnosticOrder>(`/diagnostics/orders/${orderId}/collect`, 'PATCH', payload),

  /**
   * Specimen Receipt & accession verification at lab reception desk
   */
  receiveSample: (orderId: string, payload?: { technicianName?: string }) =>
    apiRequest<DiagnosticOrder>(`/diagnostics/orders/${orderId}/receive`, 'PATCH', payload),

  /**
   * Pre-analytical rejection (hemolyzed, clotted, insufficient volume, incorrect container)
   */
  rejectSample: (
    orderId: string,
    payload: { reason: string; notes?: string; technicianName?: string }
  ) =>
    apiRequest<DiagnosticOrder>(`/diagnostics/orders/${orderId}/reject`, 'PATCH', payload),

  /**
   * Mark specimen loaded onto analyzer / bench testing initiated
   */
  startProcessing: (orderId: string, payload?: { technicianName?: string }) =>
    apiRequest<DiagnosticOrder>(`/diagnostics/orders/${orderId}/process`, 'PATCH', payload),

  /**
   * Record validated test parameter values, biological reference range flags, and release report
   */
  submitResult: (
    orderId: string,
    payload: {
      parameters: LabResultParameter[];
      resultSummary?: string;
      technicianName?: string;
    }
  ) =>
    apiRequest<DiagnosticOrder>(`/diagnostics/orders/${orderId}/result`, 'PATCH', payload),
};