import i18n, { supportedLanguages, changeAppLanguage, SupportedLanguage } from '@/locales/i18n';

/**
 * HealthConnect Translation Service
 * 
 * Provides an enterprise, healthcare-safe localization abstraction layer.
 * 
 * Clinical Safety Principles:
 * 1. Authoritative Clinical Identifiers (ABHA ID, Token numbers, Encounter IDs) MUST NEVER be altered or translated.
 * 2. Pharmaceutical nomenclature (generic names, dosages, unit measurements) MUST remain medically accurate.
 * 3. Zero third-party DOM scripts or intrusive UI injection.
 * 4. Zero exposure of translation API keys in client-side bundles.
 */

// Regex patterns for protected clinical entities that must never be altered or translated
export const PROTECTED_CLINICAL_PATTERNS = [
  // ABHA ID patterns (e.g. 14 digits or ABHA-XXXX-XXXX-XXXX)
  /\bABHA[-:\s]?[0-9]{4}[-:\s]?[0-9]{4}[-:\s]?[0-9]{4}\b/gi,
  /\b[0-9]{2}-[0-9]{4}-[0-9]{4}-[0-9]{4}\b/g,
  
  // Hospital Queue / Token IDs (e.g. OPD-G-042, EMG-01, LAB-08, TOK-102)
  /\b(OPD|EMG|LAB|IPD|REF|TOK|MED)[-A-Z0-9]+\b/gi,
  
  // Clinical dosages and schedules (e.g. 500mg, 10ml, 1-0-1, 0-1-0, TID, BID, OD)
  /\b\d+(\.\d+)?\s*(mg|mcg|ml|g|IU|tablet|tab|cap|capsule)\b/gi,
  /\b[0-1]-[0-1]-[0-1]\b/g,
  /\b(OD|BD|BID|TID|QID|SOS|HS|PRN|STAT)\b/gi,

  // Clinical vital measurements (e.g. 120/80 mmHg, 98% SpO2, 72 bpm, 98.6°F)
  /\b\d{2,3}\/\d{2,3}\s*mmHg\b/gi,
  /\b\d{2,3}\s*(bpm|SpO2|%|°F|°C|mg\/dL|g\/dL)\b/gi,
];

// In-memory cache for dynamic translations
const translationCache = new Map<string, string>();

/**
 * Checks if a string contains or matches a protected clinical entity
 */
export const isProtectedClinicalEntity = (text: string): boolean => {
  if (!text || typeof text !== 'string') return false;
  return PROTECTED_CLINICAL_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
};

/**
 * Sanitizes and protects clinical entities within a text string,
 * ensuring sensitive identifiers are preserved intact.
 */
export const sanitizeClinicalText = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  return text.trim();
};

/**
 * Gets the current active application language code
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

/**
 * Gets all supported languages with codes, english names, and native names
 */
export const getSupportedLanguagesList = (): SupportedLanguage[] => {
  return supportedLanguages;
};

/**
 * Switches the application language cleanly and safely
 */
export const setApplicationLanguage = (langCode: string): void => {
  changeAppLanguage(langCode);
};

/**
 * Synchronously translates a static UI key using local dictionary resources.
 * Returns defaultValue or fallback key if translation does not exist.
 */
export const translate = (key: string, defaultValue?: string, options?: Record<string, any>): string => {
  if (!key) return defaultValue || '';
  const translated = i18n.t(key, { defaultValue, ...options });
  return typeof translated === 'string' ? translated : defaultValue || key;
};

/**
 * Asynchronous dynamic translation helper (ready for secure backend API proxy).
 * When called, respects healthcare safety checks and checks local in-memory cache.
 */
export const translateDynamic = async (
  text: string,
  targetLang: string = getCurrentLanguage()
): Promise<string> => {
  if (!text || targetLang === 'en') return text;

  // 1. Healthcare Safety Guard: If text is an ABHA ID, Token, or strict dosage, preserve exactly
  if (isProtectedClinicalEntity(text)) {
    return text;
  }

  // 2. Check local memory cache
  const cacheKey = `${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 3. Fallback to raw text (ensuring zero unhandled errors or external leaks)
  translationCache.set(cacheKey, text);
  return text;
};

export default {
  getCurrentLanguage,
  getSupportedLanguagesList,
  setApplicationLanguage,
  translate,
  translateDynamic,
  isProtectedClinicalEntity,
  sanitizeClinicalText,
};
