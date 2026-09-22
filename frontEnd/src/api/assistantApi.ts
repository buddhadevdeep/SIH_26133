import { apiRequest } from './client';

export interface AssistantActionChip {
  label: string;
  action: 'NAVIGATE' | 'EMERGENCY' | 'SUGGEST' | 'CALL';
  path?: string;
  phone?: string;
  type?: string;
}

export interface RecommendedHospital {
  id: string;
  name: string;
  type: string;
  matchedSpecialty?: string;
  distanceKm: number;
  driveTimeMinutes?: number;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  emergencyNumber?: string;
  contactNumber?: string;
  availableBeds?: number;
  icuBedsAvailable?: number;
  emergencyAvailable?: boolean;
  doctorOnDuty?: {
    name: string;
    specialty: string;
    qualification?: string;
    opdRoom?: string;
    status?: string;
  };
  opdSchedule?: string;
}

export interface AssistantResponse {
  answer: string;
  intent: string;
  is_emergency: boolean;
  matchedCondition?: string | null;
  urgency?: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  doctor?: {
    name: string;
    specialty: string;
    room?: string;
  } | null;
  facility?: {
    name: string;
    availableBeds?: number;
    icuBeds?: number;
  } | null;
  recommendedHospitals?: RecommendedHospital[];
  actionChips?: AssistantActionChip[];
  sources?: string[];
  latency_ms?: number;
  retrievedContext?: any;
}

export const assistantApi = {
  sendMessage: async (payload: {
    message: string;
    image?: string;
    userId?: string;
    sessionId?: string;
    history?: { role: string; content: string }[];
    latitude?: number;
    longitude?: number;
  }): Promise<{ success: boolean; data?: AssistantResponse; error?: string }> => {
    // 1. Send to Node.js backend which connects directly with MongoDB live facilities & doctors
    try {
      const res = await apiRequest<AssistantResponse>('/chat', 'POST', payload);
      if (res.data) {
        return { success: true, data: res.data };
      }
    } catch (e: any) {
      console.warn('[assistantApi] Primary /api/v1/chat request failed, trying Python model endpoint:', e?.message || e);
    }

    // 2. Fallback to Python Model endpoint if Node backend unavailable
    try {
      const response = await fetch('/pyapi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: payload.message,
          image: payload.image,
          userId: payload.userId || 'PAT-1001',
          sessionId: payload.sessionId || 'sess_portal_patient',
          history: payload.history || [],
          latitude: payload.latitude,
          longitude: payload.longitude,
        }),
      });

      if (response.ok) {
        const rawData = await response.json();
        return {
          success: true,
          data: {
            answer: rawData.answer,
            intent: rawData.intent,
            is_emergency: rawData.is_emergency || false,
            sources: rawData.sources || [],
            retrievedContext: rawData.retrievedContext,
            latency_ms: rawData.latency_ms,
          },
        };
      }
    } catch (err) {
      console.warn('[assistantApi] Fallback /pyapi/chat also failed:', err);
    }

    return { success: false, error: 'Medical chat service temporarily unavailable' };
  },

  resetSession: async (sessionId: string) => {
    try {
      await fetch(`/pyapi/chat/reset?session_id=${encodeURIComponent(sessionId)}`, { method: 'POST' });
    } catch (e) {
      console.warn('[assistantApi] Reset failed:', e);
    }
  },

  predictDisease: async (symptoms: string[], topK: number = 5) => {
    try {
      const resp = await fetch('/pyapi/predict-disease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, top_k: topK }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn('[assistantApi] Predict disease failed:', e);
    }
    return null;
  },

  textToSpeech: async (text: string, languageCode: string = 'gu-IN', speaker: string = 'pooja') => {
    try {
      const resp = await fetch('/pyapi/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language_code: languageCode, speaker }),
      });
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn('[assistantApi] TTS failed:', e);
    }
    return null;
  },

  speechToText: async (audioBlob: Blob, languageCode: string = 'gu-IN') => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_query.webm');
      formData.append('language_code', languageCode);
      const resp = await fetch('/pyapi/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn('[assistantApi] STT failed:', e);
    }
    return null;
  },
};
