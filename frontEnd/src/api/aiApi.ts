import { apiRequest } from './client';
import { AiDemandIntelligenceSummary } from '@/types/ai';

export const aiApi = {
  getDashboard: () =>
    apiRequest<AiDemandIntelligenceSummary>('/ai/dashboard', 'GET'),

  acknowledgeAlert: (alertId: string, notes?: string) =>
    apiRequest<{ acknowledged: boolean }>(`/ai/alerts/${alertId}/acknowledge`, 'PATCH', { notes }),
};
