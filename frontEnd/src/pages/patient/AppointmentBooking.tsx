import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INITIAL_FACILITIES } from '@/mock/mockData';
import { appointmentApi } from '@/api/queueApi';
import { facilityApi } from '@/api/facilityApi';
import { directoryApi } from '@/api/directoryApi';
import { Facility } from '@/types/facility';
import { DistrictDoctor } from '@/types/admin';
import { useFamily } from '@/contexts/FamilyContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Building2,
  Stethoscope,
  CheckCircle2,
  Printer,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  User,
  Ticket,
  ArrowRight,
  RotateCcw,
  Languages,
  Eye,
  X,
  Search,
  Plus,
  Phone,
  Calendar,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export interface AppointmentRecord {
  id: string;
  tokenNumber: string;
  hospitalName: string;
  department: string;
  room: string;
  doctorName: string;
  patientName: string;
  patientPhone: string;
  disease: string;
  date: string;
  timeSlot: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  bookingDate: string;
}

// Initial Appointments History
const INITIAL_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: 'APT-2026-001',
    tokenNumber: 'OPD-28',
    hospitalName: 'Gandhinagar Civil Hospital',
    department: 'General Medicine',
    room: 'Room 4 (1st Floor)',
    doctorName: 'Dr. Arvind Patel (MD Medicine)',
    patientName: 'Govindbhai Patel',
    patientPhone: '9825011122',
    disease: 'Fever & Cold (તાવ / बुखार)',
    date: '2026-09-14',
    timeSlot: '10:30 AM',
    status: 'CONFIRMED',
    bookingDate: '2026-09-12',
  },
  {
    id: 'APT-2026-002',
    tokenNumber: 'OPD-15',
    hospitalName: 'Mansa Community Health Centre (CHC)',
    department: 'General Medicine',
    room: 'Room 2 (Ground Floor)',
    doctorName: 'Dr. Vikramaditya Mehta',
    patientName: 'Govindbhai Patel',
    patientPhone: '9825011122',
    disease: 'Blood Pressure / Sugar Review',
    date: '2026-08-28',
    timeSlot: '11:00 AM',
    status: 'COMPLETED',
    bookingDate: '2026-08-25',
  },
  {
    id: 'APT-2026-003',
    tokenNumber: 'OPD-09',
    hospitalName: 'Pethapur Primary Health Centre (PHC)',
    department: 'Outpatient Care',
    room: 'Room 1',
    doctorName: 'Dr. Priya Sharma',
    patientName: 'Govindbhai Patel',
    patientPhone: '9825011122',
    disease: 'Cough & Throat Soreness',
    date: '2026-08-10',
    timeSlot: '09:30 AM',
    status: 'COMPLETED',
    bookingDate: '2026-08-08',
  },
  {
    id: 'APT-2026-004',
    tokenNumber: 'OPD-33',
    hospitalName: 'Kalol Sub-District Hospital',
    department: 'Orthopedics',
    room: 'Room 5',
    doctorName: 'Dr. Rajesh Varma',
    patientName: 'Govindbhai Patel',
    patientPhone: '9825011122',
    disease: 'Knee Joint Pain',
    date: '2026-07-22',
    timeSlot: '02:30 PM',
    status: 'CANCELLED',
    bookingDate: '2026-07-19',
  },
];

const HOSPITALS_LIST = [
  'Gandhinagar Civil Hospital',
  'Pethapur Primary Health Centre (PHC)',
  'Mansa Community Health Centre (CHC)',
  'Kalol Sub-District Hospital',
  'Adalaj Community Health Centre',
];

const QUICK_DISEASE_CHIPS = [
  { en: 'Fever & Cold', gu: 'તાવ અને શરદી', hi: 'बुखार और जुकाम' },
  { en: 'Cough & Throat Pain', gu: 'ખાંસી અને ગળામાં દુખાવો', hi: 'खांसी और गला दर्द' },
  { en: 'Blood Pressure / Sugar Check', gu: 'બીપી / સુગર તપાસ', hi: 'बीपी / शुगर जांच' },
  { en: 'Joint / Body Pain', gu: 'સાંધા-શરીરનો દુખાવો', hi: 'जोड़ों व शरीर में दर्द' },
  { en: 'Acidity / Stomach Ache', gu: 'પેટમાં દુખાવો / એસિડિટી', hi: 'पेट दर्द / गैस' },
  { en: 'General Routine Checkup', gu: 'સામાન્ય તપાસ', hi: 'सामान्य चेकअप' },
];

const TIME_SLOTS = ['09:30 AM', '10:30 AM', '11:30 AM', '02:30 PM', '04:00 PM'];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const AppointmentBooking: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const { activeMember } = useFamily();
  const { userCoords } = useLocationContext();
  const [searchParams] = useSearchParams();

  // Active View Tab: 'LIST' (Table view of all appointments) vs 'BOOK' (Voice + 5-field form)
  const initialTab = searchParams.get('action') === 'book' || searchParams.get('facilityId') ? 'BOOK' : 'LIST';
  const [activeTab, setActiveTab] = useState<'LIST' | 'BOOK'>(initialTab);

  // Appointments List State
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(() => {
    const stored = localStorage.getItem('sanjeevani_patient_appointments');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_APPOINTMENTS;
  });

  // Table Search & Filter
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // View Details Modal State (Triggered by [View] button)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);

  // Form States & Live Directory
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [doctors, setDoctors] = useState<DistrictDoctor[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(searchParams.get('facilityId') || 'fac_civil_01');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL');
  const [hospitalName, setHospitalName] = useState('Gandhinagar Civil Hospital & Medical College');
  const [patientName, setPatientName] = useState(activeMember?.name || 'Govindbhai Patel');
  const [disease, setDisease] = useState('Fever & Cold');
  const [date, setDate] = useState('2026-09-14');
  const [timeSlot, setTimeSlot] = useState('10:30 AM');

  // Facilities sorted by distance from user location
  const sortedFacilities = React.useMemo(() => {
    return facilities.map((fac) => {
      if (userCoords && fac.coordinates) {
        const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, fac.coordinates.lat, fac.coordinates.lng);
        return { ...fac, distanceKm: dist };
      }
      return fac;
    }).sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });
  }, [facilities, userCoords]);

  // Load live facilities and doctors from MongoDB
  useEffect(() => {
    facilityApi.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        setFacilities(res.data);
        const match = res.data.find((f) => f.id === selectedFacilityId) || res.data[0];
        if (match) {
          setSelectedFacilityId(match.id);
          setHospitalName(match.name);
        }
      }
    }).catch(console.warn);

    directoryApi.getDoctors().then((res) => {
      if (res.data && res.data.length > 0) {
        setDoctors(res.data);
      }
    }).catch(console.warn);
  }, []);

  // Voice Assistant States
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [spokenTranscript, setSpokenTranscript] = useState<string>('');
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN' | 'gu-IN'>('en-IN');
  const recognitionRef = useRef<any>(null);

  // Booking Result States
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookedRecord, setBookedRecord] = useState<AppointmentRecord | null>(null);

  // Available doctors for the chosen hospital
  const availableDoctors = doctors.filter((d) => {
    if (!selectedFacilityId || selectedFacilityId === 'ALL') return true;
    return d.facilityId === selectedFacilityId || (d as any).hospital?.toLowerCase().includes(hospitalName.toLowerCase().slice(0, 8));
  });

  useEffect(() => {
    appointmentApi.getAll(activeMember?.id).then((res) => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const liveMapped: AppointmentRecord[] = res.data.map((apt: any) => ({
          id: apt.id,
          tokenNumber: apt.tokenNumber ? (apt.tokenNumber.startsWith('OPD-') ? apt.tokenNumber : `OPD-${apt.tokenNumber}`) : 'OPD-28',
          hospitalName: apt.facilityName || 'Gandhinagar Civil Hospital',
          department: apt.departmentName || apt.specialty || 'General Medicine',
          room: apt.roomNumber || 'Room 4 (1st Floor)',
          doctorName: apt.doctorName || 'Dr. Arvind Patel (MD Medicine)',
          patientName: apt.patientName || activeMember?.name || 'Govindbhai Patel',
          patientPhone: apt.patientPhone || activeMember?.phone || '9825011122',
          disease: apt.reasonForVisit || apt.specialty || 'General Consultation',
          date: apt.date || '2026-09-14',
          timeSlot: apt.timeSlot || '10:30 AM',
          status: apt.status === 'COMPLETED' ? 'COMPLETED' : apt.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED',
          bookingDate: apt.createdAt ? apt.createdAt.split('T')[0] : '2026-09-12',
        }));
        setAppointments(liveMapped);
      }
    }).catch(console.warn);
  }, [activeMember?.id]);

  useEffect(() => {
    if (currentLang === 'gu') setVoiceLang('gu-IN');
    else if (currentLang === 'hi') setVoiceLang('hi-IN');
    else setVoiceLang('en-IN');
  }, [currentLang]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Web Speech Recognition Controller
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
        setSpokenTranscript('');
        setVoiceFeedback(
          voiceLang === 'gu-IN'
            ? 'સાંભળી રહ્યું છે... બોલો (દા.ત. "સિવિલ હોસ્પિટલ, તાવ, કાલે સવારે 10 વાગે")'
            : voiceLang === 'hi-IN'
            ? 'सुन रहा है... बोलें (उदा. "सिविल अस्पताल, बुखार, कल सुबह 10 बजे")'
            : 'Listening... Speak hospital, name, problem, date, time'
        );
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const clean = fullTranscript.trim();
        if (clean) {
          setSpokenTranscript(clean);
          parseSpokenAppointment(clean);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'no-speech') return;

        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceFeedback('Microphone permission blocked. Please allow mic in browser settings.');
        } else {
          setVoiceFeedback('Mic stopped. Click mic to speak again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const parseSpokenAppointment = (spoken: string) => {
    const lower = spoken.toLowerCase();
    const detected: string[] = [];

    if (
      lower.includes('civil') ||
      lower.includes('सिविल') ||
      lower.includes('સિવિલ') ||
      lower.includes('gandhinagar') ||
      lower.includes('ગાંધીનગર')
    ) {
      setHospitalName('Gandhinagar Civil Hospital');
      detected.push('Hospital: Civil Hospital');
    } else if (lower.includes('pethapur') || lower.includes('પેથાપુર') || lower.includes('पेथापुर')) {
      setHospitalName('Pethapur Primary Health Centre (PHC)');
      detected.push('Hospital: Pethapur PHC');
    } else if (lower.includes('mansa') || lower.includes('માણસા') || lower.includes('मानसा')) {
      setHospitalName('Mansa Community Health Centre (CHC)');
      detected.push('Hospital: Mansa CHC');
    } else if (lower.includes('kalol') || lower.includes('કલોલ') || lower.includes('कलोल')) {
      setHospitalName('Kalol Sub-District Hospital');
      detected.push('Hospital: Kalol Hospital');
    }

    const nameMatch = lower.match(
      /(?:my name is|mera naam|naam|maru naam|name is)\s+([a-zA-Z\u0900-\u097F\u0A80-\u0AFF]+)/i
    );
    if (nameMatch && nameMatch[1]) {
      const extractedName = nameMatch[1].trim();
      const capitalized = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
      setPatientName(capitalized);
      detected.push(`Name: ${capitalized}`);
    }

    if (
      lower.includes('fever') ||
      lower.includes('bukhar') ||
      lower.includes('tav') ||
      lower.includes('તાવ') ||
      lower.includes('बुखार')
    ) {
      setDisease('Fever & Cold (તાવ / बुखार)');
      detected.push('Disease: Fever & Cold');
    } else if (
      lower.includes('cough') ||
      lower.includes('cold') ||
      lower.includes('khansi') ||
      lower.includes('sardi') ||
      lower.includes('ઉધરસ') ||
      lower.includes('ખાંસી')
    ) {
      setDisease('Cough & Throat Pain');
      detected.push('Disease: Cough');
    } else if (
      lower.includes('bp') ||
      lower.includes('pressure') ||
      lower.includes('sugar') ||
      lower.includes('બીપી') ||
      lower.includes('સુગર')
    ) {
      setDisease('Blood Pressure / Sugar Check');
      detected.push('Disease: BP/Sugar');
    } else if (
      lower.includes('pain') ||
      lower.includes('dard') ||
      lower.includes('sandha') ||
      lower.includes('દુખાવો') ||
      lower.includes('दर्द')
    ) {
      setDisease('Joint / Body Pain');
      detected.push('Disease: Body Pain');
    } else if (
      lower.includes('stomach') ||
      lower.includes('gas') ||
      lower.includes('acidity') ||
      lower.includes('પેટ') ||
      lower.includes('पेट')
    ) {
      setDisease('Acidity / Stomach Ache');
      detected.push('Disease: Stomach Ache');
    } else if (!detected.some((d) => d.includes('Hospital'))) {
      setDisease(spoken);
    }

    if (
      lower.includes('tomorrow') ||
      lower.includes('kal') ||
      lower.includes('aavtikal') ||
      lower.includes('કાલે') ||
      lower.includes('कल')
    ) {
      setDate('2026-09-15');
      detected.push('Date: Tomorrow');
    } else if (
      lower.includes('today') ||
      lower.includes('aaje') ||
      lower.includes('aaj') ||
      lower.includes('આજે') ||
      lower.includes('आज')
    ) {
      setDate('2026-09-14');
      detected.push('Date: Today');
    }

    if (
      lower.includes('morning') ||
      lower.includes('savare') ||
      lower.includes('subah') ||
      lower.includes('સવારે') ||
      lower.includes('सुबह') ||
      lower.includes('10')
    ) {
      setTimeSlot('10:30 AM');
      detected.push('Time: 10:30 AM');
    } else if (
      lower.includes('afternoon') ||
      lower.includes('bapore') ||
      lower.includes('dopahar') ||
      lower.includes('બપોરે') ||
      lower.includes('दोपहर') ||
      lower.includes('2')
    ) {
      setTimeSlot('02:30 PM');
      detected.push('Time: 02:30 PM');
    }

    if (detected.length > 0) {
      setVoiceFeedback(`✓ Auto-filled: ${detected.join(' • ')}`);
    }
  };

  // Submit Booking
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const chosenFacility = facilities.find(
        (f) => f.id === selectedFacilityId || f.name.toLowerCase() === hospitalName.toLowerCase()
      ) || facilities[0];

      const chosenDoctor = doctors.find((d) => d.id === selectedDoctorId) || availableDoctors[0];

      const res = await appointmentApi.book({
        facilityId: chosenFacility.id,
        facilityName: chosenFacility.name,
        doctorId: chosenDoctor?.id,
        doctorName: chosenDoctor?.name,
        specialty: chosenDoctor?.specialty || 'General Medicine',
        roomNumber: (chosenDoctor as any)?.roomNumber || (chosenDoctor as any)?.opdRoom || 'Room 4 (1st Floor)',
        departmentName: chosenDoctor?.specialty || 'General Medicine OPD',
        date,
        timeSlot,
        patientName,
        patientPhone: activeMember?.phone || '9825011122',
        patientId: activeMember?.id || 'usr_pat_01',
        reasonForVisit: `${disease} (${patientName})`,
        createToken: true,
      });

      const serverApt = res.data;
      const newTokenNumber = serverApt?.tokenNumber ? (serverApt.tokenNumber.startsWith('OPD-') ? serverApt.tokenNumber : `OPD-${serverApt.tokenNumber}`) : `OPD-${Math.floor(20 + Math.random() * 30)}`;
      const newRecord: AppointmentRecord = {
        id: serverApt?.id || `APT-2026-00${appointments.length + 1}`,
        tokenNumber: newTokenNumber,
        hospitalName: serverApt?.facilityName || chosenFacility.name,
        department: serverApt?.departmentName || serverApt?.specialty || chosenDoctor?.specialty || 'General Medicine',
        room: serverApt?.roomNumber || (chosenDoctor as any)?.roomNumber || (chosenDoctor as any)?.opdRoom || 'Room 4 (1st Floor)',
        doctorName: serverApt?.doctorName || chosenDoctor?.name || 'Dr. Arvind Patel (MD Medicine)',
        patientName: serverApt?.patientName || patientName,
        patientPhone: serverApt?.patientPhone || activeMember?.phone || '9825011122',
        disease: serverApt?.reasonForVisit || disease,
        date: serverApt?.date || date,
        timeSlot: serverApt?.timeSlot || timeSlot,
        status: 'CONFIRMED',
        bookingDate: serverApt?.createdAt ? serverApt.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
      };

      const updated = [newRecord, ...appointments.filter((a) => a.id !== newRecord.id)];
      setAppointments(updated);
      localStorage.setItem('sanjeevani_patient_appointments', JSON.stringify(updated));

      setBookedRecord(newRecord);
      setIsBooked(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered appointments for table
  const searchLower = tableSearch.toLowerCase().trim();
  const filteredAppointments = appointments.filter((item) => {
    if (tableFilter !== 'ALL' && item.status !== tableFilter) return false;
    if (!searchLower) return true;
    return (
      item.hospitalName.toLowerCase().includes(searchLower) ||
      item.patientName.toLowerCase().includes(searchLower) ||
      item.disease.toLowerCase().includes(searchLower) ||
      item.tokenNumber.toLowerCase().includes(searchLower) ||
      item.doctorName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="w-full space-y-4 pb-12 font-sans">
      {/* ================================================== */}
      {/* TOP HEADER & NAVIGATION TABS */}
      {/* ================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-xs">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                {currentLang === 'gu'
                  ? 'મારા હોસ્પિટલ અપોઈન્ટમેન્ટ્સ'
                  : currentLang === 'hi'
                  ? 'मेरी अस्पताल अपॉइंटमेंट्स'
                  : 'My Hospital Appointments'}
              </h1>
              <p className="text-xs text-slate-500">
                {currentLang === 'gu'
                  ? 'તમારા બધા છેલ્લા અપોઈન્ટમેન્ટ્સ જુઓ અને નવી બુક કરો'
                  : currentLang === 'hi'
                  ? 'अपनी सभी पिछली अपॉइंटमेंट्स देखें और नई बुक करें'
                  : 'View all your past appointments in table view or book a new OPD token'}
              </p>
            </div>
          </div>

          {/* Tab Switcher: Table View vs Book New */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab('LIST');
                setIsBooked(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'LIST'
                  ? 'bg-white text-teal-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-teal-700" />
              <span>
                {currentLang === 'gu' ? 'બધા અપોઈન્ટમેન્ટ્સ (ટેબલ)' : currentLang === 'hi' ? 'सभी अपॉइंटमेंट्स (टेबल)' : 'All Appointments (Table)'}
              </span>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {appointments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('BOOK');
                setIsBooked(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'BOOK'
                  ? 'bg-teal-700 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                {currentLang === 'gu' ? '+ નવી અપોઈન્ટમેન્ટ બુક કરો' : currentLang === 'hi' ? '+ नई अपॉइंटमेंट बुक करें' : '+ Book New Appointment'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 1. TABLE VIEW: ALL LAST / PAST APPOINTMENTS */}
      {/* ================================================== */}
      {activeTab === 'LIST' && (
        <div className="space-y-3.5">
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by hospital, patient, disease, doctor, or token..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CONFIRMED', label: 'Confirmed' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'CANCELLED', label: 'Cancelled' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTableFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl border cursor-pointer transition-colors ${
                    tableFilter === f.id
                      ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <CalendarDays className="h-8 w-8 mx-auto text-slate-300" />
                <p>No appointments found matching your criteria.</p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab('BOOK')}
                  className="bg-teal-700 text-white text-xs font-bold mt-2"
                >
                  Book New Appointment Now
                </Button>
              </div>
            ) : (
              <div>
                {/* Mobile Screen Cards View (Visible on Mobile Only) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {filteredAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                      {/* Top Bar: Token & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                            {apt.tokenNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {apt.id}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : apt.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {apt.status === 'CONFIRMED'
                            ? '● Confirmed'
                            : apt.status === 'COMPLETED'
                            ? '✓ Completed'
                            : '✕ Cancelled'}
                        </span>
                      </div>

                      {/* Hospital & Department */}
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {apt.hospitalName}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {apt.department} • {apt.room}
                        </p>
                      </div>

                      {/* Patient & Problem */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Patient</span>
                          <span className="font-bold text-slate-800 truncate block">{apt.patientName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Disease</span>
                          <span className="font-bold text-teal-900 truncate block">{apt.disease}</span>
                        </div>
                      </div>

                      {/* Date, Time & Action Button */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          <span>{apt.date} • {apt.timeSlot}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAppointment(apt)}
                          className="text-xs bg-white text-teal-800 border-teal-300 hover:bg-teal-50 font-bold gap-1 h-8 px-3 rounded-xl cursor-pointer shadow-2xs"
                        >
                          <Eye className="h-3 w-3 text-teal-700" />
                          <span>View Details</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop & Tablet Table View (Hidden on Mobile) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5 pl-4">Token / ID</th>
                        <th className="p-3.5">Hospital Name</th>
                        <th className="p-3.5">Patient Name</th>
                        <th className="p-3.5">Disease / Problem</th>
                        <th className="p-3.5">Date & Time</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAppointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-teal-50/40 transition-colors">
                          {/* Token / ID */}
                          <td className="p-3.5 pl-4">
                            <span className="font-mono font-black text-xs text-teal-900 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 block w-fit">
                              {apt.tokenNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {apt.id}
                            </span>
                          </td>

                          {/* Hospital */}
                          <td className="p-3.5">
                            <strong className="font-black text-slate-900 block truncate max-w-[180px]">
                              {apt.hospitalName}
                            </strong>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                              {apt.department} • {apt.room}
                            </span>
                          </td>

                          {/* Patient Name */}
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {apt.patientName}
                          </td>

                          {/* Disease / Problem */}
                          <td className="p-3.5 text-slate-700 font-medium">
                            <span className="block truncate max-w-[160px] font-semibold text-teal-950">
                              {apt.disease}
                            </span>
                          </td>

                          {/* Date & Time */}
                          <td className="p-3.5 whitespace-nowrap">
                            <strong className="text-slate-900 block font-bold">{apt.date}</strong>
                            <span className="text-[11px] text-slate-500 font-mono">{apt.timeSlot}</span>
                          </td>

                          {/* Status */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                apt.status === 'CONFIRMED'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : apt.status === 'COMPLETED'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {apt.status === 'CONFIRMED'
                                ? '● Confirmed'
                                : apt.status === 'COMPLETED'
                                ? '✓ Completed'
                                : '✕ Cancelled'}
                            </span>
                          </td>

                          {/* ACTION: THE VIEW BUTTON (SHOWS ALL DETAILS) */}
                          <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAppointment(apt)}
                              className="text-xs bg-white text-teal-800 border-teal-300 hover:bg-teal-50 font-bold gap-1.5 h-8 px-3 rounded-xl cursor-pointer shadow-2xs"
                            >
                              <Eye className="h-3.5 w-3.5 text-teal-700" />
                              <span>View Details</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 2. VIEW DETAILS MODAL: "SHOW DETAILS ALL" */}
      {/* ================================================== */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Appointment Details • {selectedAppointment.tokenNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Reference ID: {selectedAppointment.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Banner */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                selectedAppointment.status === 'CONFIRMED'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : selectedAppointment.status === 'COMPLETED'
                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold">
                  {selectedAppointment.status === 'CONFIRMED'
                    ? 'Appointment Confirmed • Awaiting Hospital OPD Check-In'
                    : selectedAppointment.status === 'COMPLETED'
                    ? 'Consultation Completed • Records Synced to ABHA'
                    : 'Appointment Cancelled'}
                </span>
              </div>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white/80 border">
                {selectedAppointment.tokenNumber}
              </span>
            </div>

            {/* ALL DETAILS GRID */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3 text-xs">
              {/* Hospital & Department */}
              <div className="space-y-1 border-b border-slate-200 pb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hospital & Location:
                </span>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sm font-black text-slate-900 block">
                      {selectedAppointment.hospitalName}
                    </strong>
                    <p className="text-slate-600">
                      Department: <strong>{selectedAppointment.department}</strong> • {selectedAppointment.room}
                    </p>
                    <p className="text-teal-800 font-semibold mt-0.5">
                      Attending Doctor: {selectedAppointment.doctorName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-1 border-b border-slate-200 pb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Patient Information:
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Patient Full Name:</span>
                  <strong className="font-black text-slate-900">{selectedAppointment.patientName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Registered Phone:</span>
                  <span className="font-mono font-bold text-slate-800">+91 {selectedAppointment.patientPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">ABHA Health ID:</span>
                  <span className="font-mono text-teal-800 font-bold">ABHA-GJ-882194</span>
                </div>
              </div>

              {/* Clinical Disease / Reason */}
              <div className="space-y-1 border-b border-slate-200 pb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Disease / Problem / Reason for Visit:
                </span>
                <p className="font-bold text-teal-950 bg-teal-50 p-2 rounded-lg border border-teal-200">
                  {selectedAppointment.disease}
                </p>
              </div>

              {/* Date & Time Slot */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Schedule & Timing:
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Appointment Date:</span>
                  <strong className="font-black text-slate-900">{selectedAppointment.date}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Assigned Time Slot:</span>
                  <strong className="font-black text-teal-800 font-mono">{selectedAppointment.timeSlot}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Booked On:</span>
                  <span className="text-slate-500 font-mono">{selectedAppointment.bookingDate}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="w-full sm:w-auto text-xs font-bold gap-1.5 h-10 px-4 rounded-xl cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                <span>Print Appointment Slip</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedAppointment(null)}
                className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white text-xs font-black h-10 px-5 rounded-xl cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 3. BOOK NEW APPOINTMENT (VOICE FIRST + 5 BASIC FIELDS) */}
      {/* ================================================== */}
      {activeTab === 'BOOK' && (
        <>
          {isBooked && bookedRecord ? (
            <Card className="border-2 border-emerald-400 bg-white shadow-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 text-white p-5 text-center space-y-1">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-100 animate-bounce" />
                <h2 className="text-xl sm:text-2xl font-black">
                  Appointment Booked Successfully!
                </h2>
                <p className="text-xs text-emerald-100">
                  Your new appointment is saved and added to your appointments table!
                </p>
              </div>

              <CardContent className="p-5 space-y-4">
                <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl text-center">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">
                    Your OPD Token Number
                  </span>
                  <p className="text-3xl sm:text-4xl font-black text-teal-900 font-mono mt-1">
                    {bookedRecord.tokenNumber}
                  </p>
                </div>

                <div className="space-y-2.5 text-xs text-slate-800 divide-y divide-slate-100">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-teal-600" /> Hospital:
                    </span>
                    <strong className="font-black text-slate-900 text-right">{bookedRecord.hospitalName}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <User className="h-4 w-4 text-teal-600" /> Patient:
                    </span>
                    <strong className="font-black text-slate-900">{bookedRecord.patientName}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Stethoscope className="h-4 w-4 text-teal-600" /> Disease:
                    </span>
                    <strong className="font-black text-teal-800">{bookedRecord.disease}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-teal-600" /> Date:
                    </span>
                    <strong className="font-black text-slate-900">{bookedRecord.date}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-teal-600" /> Time Slot:
                    </span>
                    <strong className="font-black text-slate-900">{bookedRecord.timeSlot}</strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="w-full text-xs font-bold gap-1.5 h-11 rounded-xl cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-slate-600" />
                    <span>Print Slip</span>
                  </Button>

                  <Button
                    onClick={() => {
                      setIsBooked(false);
                      setActiveTab('LIST');
                    }}
                    variant="primary"
                    className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-black gap-1.5 h-11 rounded-xl cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>View All Appointments Table ➔</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-xs">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      Book New OPD Appointment
                    </h2>
                    <p className="text-xs text-slate-500">
                      Speak or fill 5 simple details to schedule your hospital visit
                    </p>
                  </div>
                </div>

                {/* Voice Language Selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
                  <span className="text-[10px] font-bold text-slate-400 px-1 flex items-center gap-1">
                    <Languages className="h-3 w-3" /> Voice:
                  </span>
                  <button
                    type="button"
                    onClick={() => setVoiceLang('en-IN')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      voiceLang === 'en-IN' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceLang('hi-IN')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      voiceLang === 'hi-IN' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    हिंदी
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceLang('gu-IN')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      voiceLang === 'gu-IN' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    ગુજરાતી
                  </button>
                </div>
              </div>

              <CardContent className="p-4 sm:p-6 space-y-5">
                {/* Voice Bar */}
                <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 rounded-2xl p-4 sm:p-5 text-white shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-200" />
                        <span className="text-sm font-black">
                          {voiceLang === 'gu-IN'
                            ? 'બોલીને ફોર્મ ભરો (માઇક દબાવો)'
                            : voiceLang === 'hi-IN'
                            ? 'बोलकर फॉर्म भरें (माइक दबाएं)'
                            : 'Voice Auto-Fill (Tap & Speak)'}
                        </span>
                      </div>
                      <p className="text-xs text-teal-100">
                        Speak hospital, patient name, disease, date, and time together
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md shrink-0 ${
                        isListening
                          ? 'bg-rose-500 text-white ring-4 ring-rose-300 animate-pulse'
                          : 'bg-white text-teal-800 hover:bg-teal-50'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-5 w-5 animate-spin" />
                          <span>Listening... (Click to Stop)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5 text-teal-700" />
                          <span>🎙️ Click to Speak</span>
                        </>
                      )}
                    </button>
                  </div>

                  {(isListening || spokenTranscript || voiceFeedback) && (
                    <div className="bg-black/25 backdrop-blur-xs p-3 rounded-xl text-xs space-y-1 border border-white/20">
                      {spokenTranscript && (
                        <div className="flex items-center gap-2 text-amber-200 font-semibold">
                          <Volume2 className="h-4 w-4 shrink-0" />
                          <span>Heard: "{spokenTranscript}"</span>
                        </div>
                      )}
                      {voiceFeedback && <p className="text-white font-medium">{voiceFeedback}</p>}
                    </div>
                  )}
                </div>

                {/* 5-Field Form */}
                <form onSubmit={handleBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* FIELD 1: HOSPITAL (Live from MongoDB) */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-teal-700" />
                          <span>1. Hospital / Healthcare Centre</span>
                        </span>
                        <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                          Live DB
                        </span>
                      </label>
                      <select
                        value={selectedFacilityId}
                        onChange={(e) => {
                          const fId = e.target.value;
                          setSelectedFacilityId(fId);
                          const matchedFac = facilities.find((f) => f.id === fId);
                          if (matchedFac) setHospitalName(matchedFac.name);
                        }}
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white font-bold text-slate-900"
                      >
                        {sortedFacilities.map((fac) => (
                          <option key={fac.id} value={fac.id}>
                            {fac.name} {fac.distanceKm !== undefined ? `• [${fac.distanceKm} km away]` : `(${fac.type?.replace('_', ' ') || 'Hospital'})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* FIELD 2: ATTENDING DOCTOR & DEPARTMENT (Live from MongoDB) */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Stethoscope className="h-4 w-4 text-teal-700" />
                          <span>2. Attending Doctor & Department</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {availableDoctors.length} doctors available
                        </span>
                      </label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white font-bold text-slate-900"
                      >
                        <option value="ALL">
                          Any Available Medical Officer (General Medicine OPD)
                        </option>
                        {availableDoctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name} • {doc.specialty} ({(doc as any).roomNumber || (doc as any).opdRoom || 'Room 4'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* FIELD 3: PATIENT NAME */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-teal-700" />
                      <span>3. Patient Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter full name..."
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white font-bold text-slate-900"
                    />
                  </div>

                  {/* FIELD 4: DISEASE / PROBLEM */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Stethoscope className="h-4 w-4 text-teal-700" />
                        <span>4. Disease / Problem / Chief Complaint</span>
                      </label>
                      <span className="text-[11px] text-slate-400">1-Tap to select:</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_DISEASE_CHIPS.map((item, idx) => {
                        const label = currentLang === 'gu' ? item.gu : currentLang === 'hi' ? item.hi : item.en;
                        const isSel = disease.toLowerCase().includes(item.en.toLowerCase().slice(0, 5));
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setDisease(item.en)}
                            className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                              isSel
                                ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      required
                      value={disease}
                      onChange={(e) => setDisease(e.target.value)}
                      placeholder="e.g. Fever, Cough, Headache, Acidity..."
                      className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white font-bold text-slate-900"
                    />
                  </div>

                  {/* FIELD 5 (DATE) & FIELD 6 (TIME) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-teal-700" />
                          <span>5. Date</span>
                        </label>
                        <div className="flex gap-1 text-xs">
                          <button
                            type="button"
                            onClick={() => setDate('2026-09-14')}
                            className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold cursor-pointer ${
                              date === '2026-09-14' ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Today
                          </button>
                          <button
                            type="button"
                            onClick={() => setDate('2026-09-15')}
                            className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold cursor-pointer ${
                              date === '2026-09-15' ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            Tomorrow
                          </button>
                        </div>
                      </div>

                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-teal-700" />
                        <span>6. Time Slot</span>
                      </label>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {TIME_SLOTS.map((slot, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setTimeSlot(slot)}
                            className={`text-xs px-2.5 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                              timeSlot === slot
                                ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      variant="primary"
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white font-black text-sm sm:text-base h-12 sm:h-14 rounded-2xl shadow-md gap-2 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>{isLoading ? 'Booking Appointment...' : '📅 Confirm & Book Appointment'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentBooking;
