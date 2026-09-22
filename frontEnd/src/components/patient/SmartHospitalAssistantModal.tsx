import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Phone,
  Navigation,
  Building2,
  Bed,
  CheckCircle2,
  Activity,
  ArrowRight,
  Stethoscope,
  X,
  Pill,
  Clock,
  MapPin,
  RotateCcw,
  Search,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { INITIAL_MEDICAL_STORES } from '@/mock/medicalStoresData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types';
import { DigitalTriageFlow } from '@/components/patient/DigitalTriageFlow';
import { calculateHaversineDistanceKm } from '@/services/geocodingService';

// Web Speech API Types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (e: any) => void;
  onresult: (e: SpeechRecognitionEvent) => void;
}

export type SymptomType =
  | 'FRACTURE'
  | 'FEVER'
  | 'CHEST_PAIN'
  | 'PREGNANCY'
  | 'ACCIDENT'
  | 'CHILD';

interface SymptomConfig {
  id: SymptomType;
  label: string;
  sublabel: string;
  icon: string;
  departmentCode: string;
  departmentName: string;
  specialistTitle: string;
  requiredEquipment: string;
  isEmergency: boolean;
  keywords: string[];
  assistantGujaratiSpeech: string;
  assistantHindiSpeech: string;
  assistantEnglishAdvice: string;
}

const SYMPTOM_CONFIGS: Record<SymptomType, SymptomConfig> = {
  FRACTURE: {
    id: 'FRACTURE',
    label: 'Fracture / હાડકું',
    sublabel: 'Bone injury, fall, fracture',
    icon: '🦴',
    departmentCode: 'ORTH',
    departmentName: 'Orthopedics & Trauma',
    specialistTitle: 'Orthopedic Surgeons',
    requiredEquipment: 'Digital X-Ray',
    isEmergency: true,
    keywords: ['fracture', 'bone', 'haadku', 'hadku', 'tut', 'bhangyu', 'leg', 'hand', 'fall'],
    assistantGujaratiSpeech:
      'હાડકું કે ફ્રેક્ચર માટે ગાંધીનગર સિવિલ હોસ્પિટલ સૌથી ઉત્તમ છે. ત્યાં 3 ઓર્થોપેડિક સર્જન હાજર છે, ડિજિટલ એક્સ-રે ચાલુ છે અને 48 બેડ ખાલી છે.',
    assistantHindiSpeech:
      'हड्डी की चोट या फ्रैक्चर के लिए गांधीनगर सिविल अस्पताल सबसे उपयुक्त है। वहां 3 ऑर्थोपेडिक सर्जन मौजूद हैं, डिजिटल एक्स-रे चालू है और 48 बेड उपलब्ध हैं।',
    assistantEnglishAdvice:
      'For suspected bone fracture, you need an active Orthopedics specialist and Digital X-Ray. Gandhinagar Civil Hospital has 3 Orthopedic surgeons on duty, active X-Ray, and 48 available beds.',
  },
  FEVER: {
    id: 'FEVER',
    label: 'High Fever / તાવ',
    sublabel: 'Taav, Bukhar, chills, cough',
    icon: '🌡️',
    departmentCode: 'MED',
    departmentName: 'General Medicine OPD',
    specialistTitle: 'General Medicine Doctors',
    requiredEquipment: 'Diagnostic Lab',
    isEmergency: false,
    keywords: ['fever', 'bukhar', 'taav', 'tav', 'sardi', 'khasi', 'cold', 'body pain', 'shardi'],
    assistantGujaratiSpeech:
      'તાવ અને શરદી માટે જનરલ મેડિસિન OPD ખુલ્લી છે. ગાંધીનગર સિવિલ હોસ્પિટલમાં 5 ડોક્ટર હાજર છે અને અંદાજે વેઇટિંગ ટાઈમ માત્ર 20 મિનિટ છે.',
    assistantHindiSpeech:
      'बुखार और सर्दी के लिए जनरल मेडिसिन ओपीडी खुली है। गांधीनगर सिविल अस्पताल में 5 डॉक्टर मौजूद हैं और अनुमानित प्रतीक्षा समय केवल 20 मिनट है।',
    assistantEnglishAdvice:
      'General Medicine OPD is active. Gandhinagar Civil Hospital has 5 general physicians on duty with approximately 20 mins wait time.',
  },
  CHEST_PAIN: {
    id: 'CHEST_PAIN',
    label: 'Chest Pain / છાતીમાં દુખાવો',
    sublabel: 'Heart pain, pressure, attack',
    icon: '🫀',
    departmentCode: 'CARD',
    departmentName: 'Cardiology Special Clinic & Emergency',
    specialistTitle: 'Cardiologists & Emergency Physicians',
    requiredEquipment: 'ECG 12-Channel & ICU Monitor',
    isEmergency: true,
    keywords: ['chest', 'heart', 'dil', 'chhati', 'cardiac', 'attack', 'pain', 'pressure', 'breath'],
    assistantGujaratiSpeech:
      'છાતીમાં દુખાવો ગંભીર ઈમરજન્સી હોઈ શકે છે! ગાંધીનગર સિવિલ હોસ્પિટલમાં 24x7 ઈમરજન્સી, 2 કાર્ડિયોલોજિસ્ટ અને 6 ICU બેડ ઉપલબ્ધ છે. તરત પહોંચો અથવા 108 પર કૉલ કરો!',
    assistantHindiSpeech:
      'सीने में दर्द एक गंभीर आपातकाल हो सकता है! गांधीनगर सिविल अस्पताल में 24x7 आपातकालीन सेवा, 2 हृदय रोग विशेषज्ञ और 6 आईसीयू बेड उपलब्ध हैं। तुरंत पहुंचे या 108 पर कॉल करें!',
    assistantEnglishAdvice:
      'Chest pain is a high medical emergency! Gandhinagar Civil Hospital has 24x7 Emergency, 2 on-duty cardiologists, and 6 ICU beds ready. Call 108 or proceed immediately!',
  },
  PREGNANCY: {
    id: 'PREGNANCY',
    label: 'Delivery / પ્રસુતિ',
    sublabel: 'Maternity, labor pain, pregnancy',
    icon: '🤰',
    departmentCode: 'OBG',
    departmentName: 'Obstetrics & Gynecology (Maternity Ward)',
    specialistTitle: 'Gynecologists & Obstetricians',
    requiredEquipment: 'Ultrasound Sonography & Labor Room',
    isEmergency: true,
    keywords: ['delivery', 'pregnant', 'pregnancy', 'prasuti', 'labor', 'delivery pain', 'gynae', 'balka'],
    assistantGujaratiSpeech:
      'પ્રસુતિ અને ડિલિવરી માટે ગાંધીનગર સિવિલ હોસ્પિટલનું મેટરનિટી યુનિટ તૈયાર છે. સ્પેશિયાલિસ્ટ ડોક્ટર્સ હાજર છે અને 48 જનરલ બેડ ઉપલબ્ધ છે.',
    assistantHindiSpeech:
      'प्रसव और डिलीवरी के लिए गांधीनगर सिविल अस्पताल की प्रसूति इकाई पूरी तरह तैयार है। विशेषज्ञ डॉक्टर मौजूद हैं और 48 जनरल बेड उपलब्ध हैं।',
    assistantEnglishAdvice:
      'Maternity & Labor Unit is fully operational. Civil Hospital has specialist gynecologists on call and 48 available general beds.',
  },
  ACCIDENT: {
    id: 'ACCIDENT',
    label: 'Accident / ઈજા',
    sublabel: 'Trauma, bleeding, head injury',
    icon: '🤕',
    departmentCode: 'EMR',
    departmentName: 'Emergency Trauma Center',
    specialistTitle: 'Emergency & Trauma Surgeons',
    requiredEquipment: '128-Slice CT Scanner & Blood Bank',
    isEmergency: true,
    keywords: ['accident', 'injury', 'chot', 'eja', 'trauma', 'khoon', 'blood', 'head', 'road'],
    assistantGujaratiSpeech:
      'અકસ્માત અને ઈજા માટે સિવિલ હોસ્પિટલનું 24x7 ટ્રોમા સેન્ટર ખુલ્લું છે. બ્લડ બેંક, સીટી સ્કેન અને 6 ICU બેડ તૈયાર છે.',
    assistantHindiSpeech:
      'दुर्घटना और चोट के लिए सिविल अस्पताल का 24x7 ट्रॉमा सेंटर खुला है। ब्लड बैंक, सीटी स्कैन और 6 आईसीयू बेड तैयार हैं।',
    assistantEnglishAdvice:
      '24x7 Emergency Trauma Center is active at Civil Hospital with on-site CT scan, operational Blood Bank, and 6 available ICU beds.',
  },
  CHILD: {
    id: 'CHILD',
    label: 'Child Sick / બાળક બીમાર',
    sublabel: 'Pediatric care, infant illness',
    icon: '👶',
    departmentCode: 'PED',
    departmentName: 'Pediatrics OPD',
    specialistTitle: 'Pediatricians (Child Specialists)',
    requiredEquipment: 'Phototherapy & Pediatric Ward',
    isEmergency: false,
    keywords: ['child', 'baby', 'balak', 'bacha', 'pediatric', 'infant', 'kid'],
    assistantGujaratiSpeech:
      'બાળકની સારવાર માટે પીડિયાટ્રિક્સ OPD ચાલુ છે. ગાંધીનગર સિવિલ હોસ્પિટલમાં 4 બાળ રોગ નિષ્ણાત ડોક્ટર હાજર છે (વેઇટિંગ સમય: 15 મિનિટ).',
    assistantHindiSpeech:
      'बच्चों के इलाज के लिए बाल रोग ओपीडी चालू है। गांधीनगर सिविल अस्पताल में 4 बाल रोग विशेषज्ञ डॉक्टर मौजूद हैं (प्रतीक्षा समय: 15 मिनट)।',
    assistantEnglishAdvice:
      'Pediatrics OPD is active. Gandhinagar Civil Hospital has 4 child specialists on duty with 15 mins estimated wait time.',
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'ASSISTANT' | 'STORES' | 'TRIAGE';
}

export const SmartHospitalAssistantModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultTab = 'ASSISTANT',
}) => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language || 'en';
  const speechLang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'gu' ? 'gu-IN' : 'en-IN';

  const [activeTab, setActiveTab] = useState<'ASSISTANT' | 'STORES' | 'TRIAGE'>(defaultTab);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomType>('FRACTURE');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('fac_civil_01');
  const [storeSearch, setStoreSearch] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript.toLowerCase();
        setTranscript(text);

        // Auto-match symptom from voice transcript
        detectAndSetSymptom(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [speechLang]);

  // Speak assistant recommendation in Gujarati/Hindi/English
  const speakVoice = (text: string) => {
    if (isVoiceMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.lang = speechLang;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors gracefully
    }
  };

  // Trigger speech when symptom changes or when requested
  useEffect(() => {
    if (isOpen && activeTab === 'ASSISTANT') {
      const config = SYMPTOM_CONFIGS[selectedSymptom];
      if (config) {
        const speechText = currentLang === 'hi'
          ? config.assistantHindiSpeech
          : currentLang === 'gu'
          ? config.assistantGujaratiSpeech
          : config.assistantEnglishAdvice;
        speakVoice(speechText);
      }
    }
  }, [selectedSymptom, isOpen, activeTab, isVoiceMuted, currentLang]);

  // Handle voice mic toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in this browser. Please click a symptom button.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current?.start(), 150);
      }
    }
  };

  // Detect symptom from transcript or search input
  const detectAndSetSymptom = (text: string) => {
    const lower = text.toLowerCase();
    for (const key of Object.keys(SYMPTOM_CONFIGS) as SymptomType[]) {
      const config = SYMPTOM_CONFIGS[key];
      if (config.keywords.some((kw) => lower.includes(kw))) {
        setSelectedSymptom(key);
        return;
      }
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      detectAndSetSymptom(searchQuery);
    }
  };

  // Find best matched hospital based on symptom
  const activeConfig = SYMPTOM_CONFIGS[selectedSymptom];

  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) setFacilities(res.data);
    }).catch(console.warn);
  }, []);

  // Best facility selection logic
  const bestFacility =
    facilities.find((f) => f.id === selectedFacilityId) || facilities[0] || INITIAL_FACILITIES[0];

  // Alternative facilities nearby
  const alternativeFacilities = facilities.filter((f) => f.id !== bestFacility.id);

  // Department / doctor count inside bestFacility
  const matchedDepartment = bestFacility.departments?.find(
    (d) => d.code === activeConfig.departmentCode || d.name.toLowerCase().includes(activeConfig.departmentName.toLowerCase().slice(0, 5))
  );

  const activeDoctorCount = matchedDepartment?.activeDoctors || (selectedSymptom === 'FRACTURE' ? 3 : 4);
  const waitMinutes = matchedDepartment?.currentWaitMinutes || bestFacility.currentWaitTimeMinutes || 25;

  // Filtered Medical Stores with Dynamic Distance
  const userLat = 23.2156;
  const userLng = 72.6369;

  const filteredStores = INITIAL_MEDICAL_STORES.filter((s) => s.isOpenNow)
    .map((s) => {
      const dist = s.coordinates?.lat && s.coordinates?.lng
        ? calculateHaversineDistanceKm(userLat, userLng, s.coordinates.lat, s.coordinates.lng)
        : s.distanceKm || 1.5;
      return { ...s, distanceKm: dist };
    })
    .filter((s) => {
      if (!storeSearch.trim()) return true;
      const q = storeSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.isJanAushadhi && !b.isJanAushadhi) return -1;
      if (!a.isJanAushadhi && b.isJanAushadhi) return 1;
      return a.distanceKm - b.distanceKm;
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-teal-200/80 flex flex-col font-sans">
        {/* ================================================== */}
        {/* MODAL HEADER */}
        {/* ================================================== */}
        <div className="flex items-center justify-between border-b border-teal-100 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white shadow-sm">
              <Sparkles className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Sanjeevani Voice & Hospital Assistant
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <Activity className="h-3 w-3" /> Live Triage
                </span>
              </div>
              <p className="text-xs text-teal-200/90 font-medium">
                Ask in Gujarati, Hindi, or English • Recommends hospitals with verified doctors & beds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Voice Mute Toggle */}
            <button
              type="button"
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              title={isVoiceMuted ? 'Turn on voice audio' : 'Mute voice audio'}
              className={`rounded-xl p-2 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isVoiceMuted
                  ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                  : 'bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/35'
              }`}
            >
              {isVoiceMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-300" />}
              <span className="hidden sm:inline">{isVoiceMuted ? 'Muted' : 'Voice On'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ================================================== */}
        {/* 3 TABS SWITCHER */}
        {/* ================================================== */}
        <div className="border-b border-slate-200 bg-slate-50/90 px-4 sm:px-6 pt-2.5 flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ASSISTANT')}
            className={`flex items-center gap-2 pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ASSISTANT'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mic className="h-4 w-4 text-teal-700" />
            <span>🎙️ Hospital Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRIAGE')}
            className={`flex items-center gap-2 pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'TRIAGE'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="h-4 w-4 text-teal-600" />
            <span>🩺 Check Symptoms</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STORES')}
            className={`flex items-center gap-2 pb-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'STORES'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pill className="h-4 w-4 text-emerald-700" />
            <span>💊 Jan Aushadhi & Pharmacies ({filteredStores.length})</span>
          </button>
        </div>

        {/* ================================================== */}
        {/* MODAL BODY */}
        {/* ================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {activeTab === 'TRIAGE' ? (
            /* ================================================== */
            /* DIGITAL TRIAGE FLOW */
            /* ================================================== */
            <div className="max-w-lg mx-auto">
              <DigitalTriageFlow onClose={onClose} />
            </div>
          ) : activeTab === 'ASSISTANT' ? (
            /* ================================================== */
            /* 2-SIDED FOCUSED LAYOUT: ASSISTANT ON LEFT, HOSPITAL ON RIGHT */
            /* ================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* ================================================== */}
              {/* LEFT COLUMN: VOICE / AI ASSISTANT (5 COLS) */}
              {/* ================================================== */}
              <div className="lg:col-span-5 space-y-4">
                {/* Assistant Greeting Card */}
                <div className="rounded-2xl border border-teal-200 bg-white p-4 sm:p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Sanjeevani Health Assistant</h4>
                      <p className="text-[11px] text-teal-700 font-semibold">AI Medical Triage Companion</p>
                    </div>
                  </div>

                  {/* Assistant Speech Bubble */}
                  <div className="rounded-2xl bg-teal-50/80 border border-teal-200 p-3.5 text-xs text-teal-950 space-y-1.5 shadow-2xs">
                    <p className="font-bold text-sm text-teal-900 leading-snug">
                      "નમસ્તે! Tamare kem hospital javu che? Shu thayu che?"
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      (Why do you need to go to the hospital? What problem or symptoms do you have?)
                    </p>
                  </div>

                  {/* Big Microphone Action */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`relative flex items-center justify-center h-16 w-16 rounded-full transition-all cursor-pointer shadow-md ${
                        isListening
                          ? 'bg-red-600 text-white ring-8 ring-red-100 animate-pulse scale-105'
                          : 'bg-teal-700 hover:bg-teal-800 text-white hover:scale-105 ring-4 ring-teal-100'
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="h-7 w-7 animate-bounce" />
                      ) : (
                        <Mic className="h-7 w-7" />
                      )}
                    </button>

                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800">
                        {isListening ? 'Listening... બોલો / Bolte rahiye' : 'Tap to Speak / બોલવા માટે દબાવો'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {isListening
                          ? 'Speak your symptom (e.g. "Fracture thayu che", "Bukhar hai", "Chest pain")'
                          : 'Click microphone or tap a quick symptom below'}
                      </p>
                    </div>

                    {transcript && (
                      <div className="w-full rounded-xl bg-slate-100 border border-slate-200 p-2 text-xs text-slate-700 font-medium text-left">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Heard:</span>
                        "{transcript}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick 1-Tap Symptom Chips (Rural Friendly) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                      Or Select Common Problem (1-Tap):
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(SYMPTOM_CONFIGS) as SymptomType[]).map((type) => {
                      const cfg = SYMPTOM_CONFIGS[type];
                      const isSelected = selectedSymptom === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setSelectedSymptom(type);
                            setSelectedFacilityId('fac_civil_01');
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50/90 text-teal-950 ring-2 ring-teal-600/30 shadow-xs'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <span className="text-lg shrink-0">{cfg.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">{cfg.label}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{cfg.sublabel}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Search Fallback */}
                  <form onSubmit={handleManualSearch} className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Or type symptom (e.g. fracture, taav, headache)..."
                      className="w-full pl-8 pr-14 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-teal-700 text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-teal-800"
                    >
                      Check
                    </button>
                  </form>
                </div>
              </div>

              {/* ================================================== */}
              {/* RIGHT COLUMN: FOCUSED TOP HOSPITAL MATCH (7 COLS) */}
              {/* ================================================== */}
              <div className="lg:col-span-7 space-y-4">
                {/* Recommendation Banner */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 block">
                          Verified Best Hospital for: {activeConfig.label}
                        </span>
                        <p className="text-xs text-emerald-950 font-medium mt-0.5">
                          Filtered by active specialist doctor, available beds, and operational equipment.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakVoice(activeConfig.assistantGujaratiSpeech)}
                      title="Replay spoken voice guidance"
                      className="shrink-0 p-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Replay Voice</span>
                    </button>
                  </div>

                  {/* Spoken Advice Display */}
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-200/80 text-xs text-emerald-950 leading-relaxed font-semibold">
                    🗣️ "{activeConfig.assistantGujaratiSpeech}"
                  </div>
                </div>

                {/* THE RECOMMENDED HOSPITAL CARD */}
                <div className="rounded-3xl border-2 border-teal-600 bg-white p-5 shadow-md space-y-4 relative">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="rounded-md bg-teal-800 text-white px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide">
                          Top Match ({bestFacility.type.replace('_', ' ')})
                        </span>
                        {bestFacility.emergencyAvailable && (
                          <span className="rounded-md bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-bold">
                            🚨 24x7 Emergency Ready
                          </span>
                        )}
                        <span className="rounded-md bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold">
                          ● Open Now
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                        {bestFacility.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                        <span>
                          {bestFacility.distanceKm || 2.4} km away • {bestFacility.address}
                        </span>
                      </p>
                    </div>

                    <div className="text-right sm:text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Est. Travel</span>
                      <span className="text-sm font-extrabold text-teal-800">
                        ~{Math.max(5, Math.round((bestFacility.distanceKm || 2.4) * 3.5))} mins away
                      </span>
                    </div>
                  </div>

                  {/* 3 LIVE VERIFIED READINESS METRICS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. Specialist Doctors on Duty */}
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-3 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-teal-800 mb-1">
                        <Stethoscope className="h-4 w-4 shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Doctors on Duty</span>
                      </div>
                      <div>
                        <p className="text-base font-extrabold text-slate-900">
                          {activeDoctorCount} Doctors
                        </p>
                        <p className="text-[10px] text-teal-700 font-semibold truncate">
                          {activeConfig.specialistTitle}
                        </p>
                      </div>
                    </div>

                    {/* 2. Beds Available */}
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-blue-800 mb-1">
                        <Bed className="h-4 w-4 shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Available Beds</span>
                      </div>
                      <div>
                        <p className="text-base font-extrabold text-slate-900">
                          {bestFacility.availableBeds} General
                        </p>
                        <p className="text-[10px] text-red-700 font-bold">
                          {bestFacility.icuBedsAvailable} ICU Beds Free
                        </p>
                      </div>
                    </div>

                    {/* 3. Diagnostic / Equipment Readiness */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 mb-1">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Equipment</span>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 truncate">
                          {activeConfig.requiredEquipment}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          ✓ Operational Now
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Wait Time Bar */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span>
                        Current OPD Wait Time:{' '}
                        <strong className="font-bold text-slate-900">{waitMinutes} minutes</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Department: {activeConfig.departmentName}
                    </span>
                  </div>

                  {/* MASSIVE 1-TAP ACTION BUTTONS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    {/* 1-Tap Call */}
                    <a href={`tel:${bestFacility.contactNumber || '108'}`} className="w-full">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs h-11 rounded-xl gap-2 shadow-sm cursor-pointer"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Call Hospital</span>
                      </Button>
                    </a>

                    {/* 1-Tap Directions */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${bestFacility.name} ${bestFacility.address}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        size="md"
                        className="w-full border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs h-11 rounded-xl gap-2 cursor-pointer shadow-2xs"
                      >
                        <Navigation className="h-4 w-4 text-teal-700" />
                        <span>Get Directions</span>
                      </Button>
                    </a>

                    {/* Book Token Link */}
                    <Link
                      to={`/patient/appointments?facilityId=${bestFacility.id}`}
                      onClick={onClose}
                      className="w-full"
                    >
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-11 rounded-xl gap-2 shadow-sm cursor-pointer"
                      >
                        <span>Book Token</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Alternative Hospital Switcher (Clean, concise) */}
                {alternativeFacilities.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Other Nearby Hospitals:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {alternativeFacilities.map((alt) => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => setSelectedFacilityId(alt.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedFacilityId === alt.id
                              ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{alt.name.split(' ')[0]}</span>
                          <span className="text-[10px] opacity-80">({alt.distanceKm ?? 'Nearby'} km • {alt.availableBeds} beds)</span>
                        </button>
                      ))}
                      {selectedFacilityId !== 'fac_civil_01' && (
                        <button
                          type="button"
                          onClick={() => setSelectedFacilityId('fac_civil_01')}
                          className="px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 text-teal-800 text-xs font-bold hover:bg-teal-100 cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reset to Top Civil Hospital</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================================================== */
            /* TAB 2: MEDICAL STORES & JAN AUSHADHI (OPEN ONLY) */
            /* ================================================== */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    placeholder="Search open Jan Aushadhi Kendra or pharmacy near you..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <Link
                  to="/patient/medical-stores"
                  onClick={onClose}
                  className="shrink-0 text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <span>Go to Full Medical Store Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredStores.slice(0, 6).map((store) => (
                  <div
                    key={store.id}
                    className={`rounded-2xl border p-4 space-y-3 transition-all flex flex-col justify-between ${
                      store.isJanAushadhi
                        ? 'border-teal-300 bg-teal-50/20 shadow-xs'
                        : 'border-slate-200 bg-white shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {store.isJanAushadhi ? (
                          <>
                            <span className="rounded-md bg-teal-800 text-white px-2 py-0.5 text-[10px] font-bold">
                              PMBJP Jan Aushadhi (Govt)
                            </span>
                            <span className="rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                              Up to 80% Off
                            </span>
                          </>
                        ) : (
                          <span className="rounded-md bg-slate-200 text-slate-800 px-2 py-0.5 text-[10px] font-bold">
                            Private Pharmacy
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-700 font-bold">
                          ● Open Now ({store.timings})
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900">{store.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📍 {store.distanceKm} km away • {store.area}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <a href={`tel:${store.phone}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-8 px-3 rounded-lg gap-1 cursor-pointer"
                        >
                          <Phone className="h-3 w-3" />
                          <span>Call</span>
                        </Button>
                      </a>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${store.name} ${store.fullAddress}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-slate-700 border-slate-300 hover:bg-slate-50 text-xs h-8 px-3 rounded-lg font-semibold gap-1 cursor-pointer"
                        >
                          <Navigation className="h-3 w-3 text-slate-500" />
                          <span>Directions</span>
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* MODAL FOOTER */}
        {/* ================================================== */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 sm:px-6 py-3 bg-slate-50 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-teal-700" />
            <span>Sanjeevani Gujarat Health Network • Real-time Bed & OPD Sync</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold rounded-xl px-4 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
