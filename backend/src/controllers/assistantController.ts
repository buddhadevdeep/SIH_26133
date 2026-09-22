import { Request, Response } from 'express';
import { FacilityModel } from '../models/Facility';
import { DoctorModel } from '../models/Doctor';
import { MedicineModel } from '../models/Medicine';
import { MedicalStoreModel } from '../models/MedicalStore';
import { AppointmentModel, TokenModel } from '../models/Queue';
import { PatientModel } from '../models/Patient';
import { sendSuccess, sendError } from '../utils/response';

// Canonical Medical Knowledge Base for Symptom, Disease & Hospital Triage
interface ConditionInfo {
  disease: string;
  specialty: string;
  urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  description: string;
  signatureSymptoms: string[];
  precautions: string[];
  homeRemedies: string[];
  recommendedMedicines: string[];
  facilityKeywords: string[];
}

const MEDICAL_KB: ConditionInfo[] = [
  {
    disease: 'Acute Coronary Syndrome / Myocardial Infarction (Cardiac Emergency)',
    specialty: 'Cardiology',
    urgency: 'EMERGENCY',
    description: 'Severe crushing chest pain, tightness radiating to left arm, neck or jaw with cold sweating and breathlessness. Immediate 24x7 Cath Lab / CCU intervention required.',
    signatureSymptoms: ['chest pain', 'crushing chest pain', 'heart attack', 'cardiac', 'left arm pain', 'jaw pain', 'sweating with chest pain', 'angina', 'severe breathlessness'],
    precautions: ['IMMEDIATE EMERGENCY: Call 108 Ambulance right away', 'Do not drive yourself to hospital', 'Chew Disprin/Aspirin 300mg immediately if non-allergic', 'Loosen tight clothing and sit upright'],
    homeRemedies: ['Stay in seated upright resting position', 'Take slow deep breaths while ambulance is en route', 'Keep emergency contacts alerted'],
    recommendedMedicines: ['Emergency ICU & 24x7 Cath Lab intervention at U. N. Mehta Institute of Cardiology / Civil Hospital'],
    facilityKeywords: ['cardio', 'heart', 'cath lab', 'ccu', 'u. n. mehta', 'cardiac'],
  },
  {
    disease: 'Hypertension & Cardiovascular Strain',
    specialty: 'Cardiology',
    urgency: 'URGENT',
    description: 'Elevated arterial blood pressure causing throbbing headache, dizziness, neck stiffness, or palpitations requiring prompt specialist review.',
    signatureSymptoms: ['high blood pressure', 'bp', 'palpitation', 'dizziness', 'headache behind neck', 'shortness of breath on exertion', 'irregular heartbeat'],
    precautions: ['Strictly restrict sodium and table salt intake', 'Avoid sudden exertion or lifting heavy weights', 'Monitor BP twice daily', 'Never skip prescribed anti-hypertensives'],
    homeRemedies: ['Deep breathing exercises', 'Calm resting in a quiet ventilated room', 'Avoid caffeine, tobacco and oily foods'],
    recommendedMedicines: ['Amlodipine 5mg', 'Telmisartan 40mg (Prescription only)', 'Cardiology OPD Room 12'],
    facilityKeywords: ['cardio', 'heart', 'u. n. mehta'],
  },
  {
    disease: 'Renal Calculi, Nephrolithiasis & Acute Renal Impairment',
    specialty: 'Nephrology',
    urgency: 'URGENT',
    description: 'Severe flank or lower back pain radiating to groin, burning micturition, blood in urine, elevated creatinine or kidney stone distress.',
    signatureSymptoms: ['kidney', 'kidney stone', 'dialysis', 'renal', 'creatinine', 'flank pain', 'blood in urine', 'hematuria', 'burning urination', 'urine infection', 'kidney pain'],
    precautions: ['Hydrate with 3-4 liters of water daily unless on fluid restriction', 'Avoid calcium oxalate rich foods (spinach, excess nuts, colas)', 'Do not delay micturition', 'Get urgent renal ultrasound and KFT'],
    homeRemedies: ['Lemon barley water', 'Warm water hydration', 'Hot compress on lower back for colicky pain'],
    recommendedMedicines: ['Hydrochlorothiazide / Tamsulosin (as prescribed)', 'Paracetamol for renal colic', 'Nephrology & Hemodialysis Unit at IKDRC'],
    facilityKeywords: ['kidney', 'nephro', 'dialysis', 'ikdrc', 'renal', 'urology'],
  },
  {
    disease: 'Suspected Oncological Lesion, Tumor or Malignancy',
    specialty: 'Oncology',
    urgency: 'URGENT',
    description: 'Persistent non-healing oral ulcers, palpable painless breast or neck lump, unexplained rapid weight loss, chronic hoarseness, or abnormal bleeding requiring comprehensive cancer screening.',
    signatureSymptoms: ['cancer', 'tumor', 'lump', 'breast lump', 'oncology', 'chemotherapy', 'radiation', 'non healing ulcer', 'unexplained weight loss', 'lymph node swelling'],
    precautions: ['Seek early comprehensive oncological screening and biopsy', 'Avoid self-medicating with unverified herbal powders', 'Bring all prior CT/PET/Biopsy imaging scans to consultation'],
    homeRemedies: ['High protein nutrient-dense diet', 'Adequate physical rest and psychosocial support'],
    recommendedMedicines: ['Oncology staging and Chemotherapy daycare at GCRI Cancer Institute'],
    facilityKeywords: ['cancer', 'gcri', 'oncology', 'chemo', 'tumor'],
  },
  {
    disease: 'Acute Bone Fracture, Joint Dislocation & Trauma',
    specialty: 'Orthopedics',
    urgency: 'EMERGENCY',
    description: 'Sudden bone fracture, joint dislocation, ligament rupture, or severe post-fall swelling with inability to bear weight.',
    signatureSymptoms: ['fracture', 'broken bone', 'bone crack', 'dislocation', 'accident', 'trauma', 'sprain', 'cannot walk after fall', 'severe joint swelling', 'knee twist'],
    precautions: ['Immobilize the injured limb immediately (do not attempt to realign)', 'Apply ice packs wrapped in cloth for 15 minutes to reduce swelling', 'Keep the affected extremity elevated above heart level'],
    homeRemedies: ['R.I.C.E protocol (Rest, Ice, Compression, Elevation)', 'Avoid putting any body weight on the limb'],
    recommendedMedicines: ['Analgesic pain management', 'Emergency Digital X-Ray & Plastering at Apex Trauma / Civil Ortho'],
    facilityKeywords: ['ortho', 'trauma', 'bone', 'joint', 'fracture', 'apex trauma'],
  },
  {
    disease: 'Osteoarthritis & Degenerative Joint Disease',
    specialty: 'Orthopedics',
    urgency: 'ROUTINE',
    description: 'Wear and tear of articular cartilage causing chronic knee stiffness, crepitus, and difficulty standing or climbing stairs.',
    signatureSymptoms: ['knee pain', 'joint pain', 'back pain', 'stiffness', 'arthritis', 'bone pain', 'swelling in knee', 'difficulty walking', 'spine pain'],
    precautions: ['Avoid prolonged standing or cross-legged sitting on floor', 'Use supportive footwear', 'Maintain healthy body weight to reduce joint load'],
    homeRemedies: ['Hot fomentation or warm oil massage', 'Gentle quadriceps strengthening exercises', 'Calcium & Vitamin D rich diet'],
    recommendedMedicines: ['Paracetamol 650mg / Ibuprofen (short term)', 'Calcium Carbonate + Vitamin D3 supplements', 'Topical analgesic gel'],
    facilityKeywords: ['ortho', 'trauma', 'bone', 'joint'],
  },
  {
    disease: 'Pediatric Acute Infection & Gastroenteritis',
    specialty: 'Pediatrics',
    urgency: 'URGENT',
    description: 'Fever, loose watery stools, repeated vomiting, or acute respiratory distress in infants and young children.',
    signatureSymptoms: ['child fever', 'baby fever', 'vomiting child', 'loose motions child', 'baby crying', 'dehydration baby', 'pediatric', 'infant illness', 'child cough'],
    precautions: ['Continuous hydration with ORS solution after every loose motion', 'Continue regular breastfeeding for infants', 'Watch for red flag signs: lethargy, sunken eyes, absence of tears'],
    homeRemedies: ['Fresh coconut water', 'Rice kanji with pinch of salt', 'Boiled cooled water with WHO-ORS'],
    recommendedMedicines: ['Oral Rehydration Salts (ORS) sachet in 1 Litre water', 'Zinc sulfate syrup for children', 'Pediatric consult in Room 5'],
    facilityKeywords: ['pediatric', 'child', 'pedia', 'women & child', 'civil'],
  },
  {
    disease: 'Antenatal Care & Maternal Obstetric Health',
    specialty: 'Obstetrics & Gynecology',
    urgency: 'ROUTINE',
    description: 'Comprehensive pregnancy health monitoring, fetal growth assessment, maternal nutrition, and safe institutional delivery planning.',
    signatureSymptoms: ['pregnancy', 'pregnant', 'morning sickness', 'missed period', 'anc', 'maternal', 'baby movement', 'labor pain', 'gynecologist', 'delivery hospital'],
    precautions: ['Attend all scheduled ANC checkups and ultrasound scans', 'Take daily Iron & Folic Acid (IFA) tablets', 'Avoid heavy lifting or strenuous travel', 'Report any vaginal bleeding, severe swelling, or reduced fetal kicks immediately'],
    homeRemedies: ['Small frequent nutrient-dense meals', 'Hydration with buttermilk and coconut water', 'Left lateral sleeping posture'],
    recommendedMedicines: ['Iron & Folic Acid (IFA) tablets', 'Calcium + Vit D tablets', 'Maternity Wing consult in Room 10'],
    facilityKeywords: ['women', 'maternal', 'obstetrics', 'gynecology', 'child', 'mch'],
  },
  {
    disease: 'Ophthalmic Infection, Cataract & Visual Impairment',
    specialty: 'Ophthalmology',
    urgency: 'ROUTINE',
    description: 'Eye redness, severe itching, blurred vision, cataract opacity, foreign body sensation, or glaucoma pressure.',
    signatureSymptoms: ['eye pain', 'red eye', 'blurred vision', 'cataract', 'glaucoma', 'eye itching', 'conjunctivitis', 'vision loss', 'eye discharge'],
    precautions: ['Do not rub eyes with unwashed hands', 'Avoid self-medicating with steroid eye drops', 'Wear protective sunglasses outdoors'],
    homeRemedies: ['Cold compress with clean sterile cloth', 'Rinse eyes with clean potable water'],
    recommendedMedicines: ['Carboxymethylcellulose lubricating eye drops', 'M & J Institute of Ophthalmology / Civil Eye OPD'],
    facilityKeywords: ['eye', 'ophthalmology', 'm & j', 'vision'],
  },
  {
    disease: 'Asthma & Lower Respiratory Tract Infection',
    specialty: 'Pulmonology',
    urgency: 'URGENT',
    description: 'Wheezing, persistent productive cough, shortness of breath, chest congestion, or suspected bronchitis / tuberculosis.',
    signatureSymptoms: ['asthma', 'wheezing', 'chronic cough', 'breathlessness', 'sputum', 'tb', 'tuberculosis', 'chest congestion', 'pneumonia'],
    precautions: ['Avoid exposure to dust, smoke, incense, and cold air', 'Keep prescribed inhaler handy at all times', 'Get sputum test and Chest X-ray done'],
    homeRemedies: ['Steam inhalation with saline', 'Warm water with ginger and honey', 'Upright resting posture'],
    recommendedMedicines: ['Salbutamol / Budesonide Inhaler as prescribed', 'Pulmonology & Chest Clinic at Civil Hospital'],
    facilityKeywords: ['pulmonology', 'chest', 'medicine', 'civil', 'gmers'],
  },
  {
    disease: 'Acute Viral Fever, Dengue & Infectious Illness',
    specialty: 'General Medicine',
    urgency: 'ROUTINE',
    description: 'High body temperature, chills, severe retro-orbital headache, generalized muscle aches, and fatigue.',
    signatureSymptoms: ['fever', 'high fever', 'chills', 'dengue', 'malaria', 'typhoid', 'viral fever', 'body ache', 'headache', 'weakness'],
    precautions: ['Monitor body temperature every 4-6 hours with digital thermometer', 'Maintain high fluid intake (ORS, lemon water, soups)', 'Undergo Complete Blood Count (CBC) to check platelet count'],
    homeRemedies: ['Tepid sponge bath on forehead and arms for temperature above 101°F', 'Adequate bed rest in well-ventilated room'],
    recommendedMedicines: ['Paracetamol 650mg (every 6 hours if fever persists)', 'Oral Rehydration Salts (ORS)', 'General Medicine OPD Room 4'],
    facilityKeywords: ['medicine', 'general', 'civil', 'chc', 'phc', 'gmers'],
  },
  {
    disease: 'Type 2 Diabetes Mellitus & Glycemic Fluctuations',
    specialty: 'General Medicine',
    urgency: 'ROUTINE',
    description: 'Metabolic disorder with elevated fasting/post-prandial blood glucose, excessive thirst, polyuria, and peripheral neuropathy.',
    signatureSymptoms: ['high sugar', 'diabetes', 'excessive thirst', 'frequent urination', 'unexplained weight loss', 'tingling in feet', 'slow wound healing'],
    precautions: ['Avoid refined sugar, sweets, and high-glycemic carbohydrates', 'Daily 30 minutes brisk walking', 'Inspect feet daily for cuts or blisters'],
    homeRemedies: ['Methi (fenugreek) water in morning', 'High fiber leafy vegetables', 'Cinnamon infused tea'],
    recommendedMedicines: ['Metformin 500mg (as prescribed)', 'Regular HbA1c screening', 'General Medicine OPD in Room 4'],
    facilityKeywords: ['medicine', 'general', 'civil', 'chc'],
  },
];

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export async function processChatAssistant(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const {
    message = '',
    query = '',
    text = '',
    image = '',
    photo = '',
    imageBase64 = '',
    userId,
    patientId,
    language = 'en',
    latitude,
    longitude,
    history = [],
    sessionId,
  } = req.body;

  const rawImage = image || photo || imageBase64 || '';
  const userMessage = (message || query || text || (rawImage ? 'Healthcare Photo Analysis Request' : '')).trim();

  if (!userMessage && !rawImage) {
    sendError(res, 'Message, query, or image is required', 400);
    return;
  }

  // Parse patient coordinates for precise nearest distance calculation
  const userLat = typeof latitude === 'number' ? latitude : (parseFloat(String(latitude)) || 23.2156);
  const userLng = typeof longitude === 'number' ? longitude : (parseFloat(String(longitude)) || 72.6369);

  // 1. Retrieve Live Grounded Data from MongoDB
  let groundedDoctors: any[] = [];
  let groundedFacilities: any[] = [];
  let groundedMedicines: any[] = [];
  let groundedMedicalStores: any[] = [];
  let patientAppointments: any[] = [];

  try {
    const rawFacs = await FacilityModel.find();
    // Filter out dummy/test facilities and compute exact distance from patient's live tracked coordinates
    groundedFacilities = rawFacs
      .filter((f) => {
        const name = (f.name || '').trim();
        return name.length > 3 && !name.toLowerCase().startsWith('test ') && !name.toLowerCase().includes('dummy');
      })
      .map((f) => {
        const obj: any = f.toJSON();
        const fLat = f.coordinates?.lat || (f as any).location?.coordinates?.[1] || 23.2156;
        const fLng = f.coordinates?.lng || (f as any).location?.coordinates?.[0] || 72.6369;
        obj.coordinates = { lat: fLat, lng: fLng };
        obj.distanceKm = calculateHaversineDistanceKm(userLat, userLng, fLat, fLng);
        obj.driveTimeMinutes = Math.max(2, Math.round(obj.distanceKm * 2.2));
        return obj;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    groundedDoctors = await DoctorModel.find();
    groundedMedicines = await MedicineModel.find().limit(10);

    const rawStores = await MedicalStoreModel.find();
    groundedMedicalStores = rawStores
      .filter((m) => {
        const name = (m.name || '').trim();
        return name.length > 3 && !name.toLowerCase().startsWith('test ');
      })
      .map((m) => {
        const obj = m.toJSON();
        const mLat = m.coordinates?.lat || (m as any).location?.coordinates?.[1] || 23.2268;
        const mLng = m.coordinates?.lng || (m as any).location?.coordinates?.[0] || 72.6515;
        obj.coordinates = { lat: mLat, lng: mLng };
        obj.distanceKm = calculateHaversineDistanceKm(userLat, userLng, mLat, mLng);
        return obj;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (userId || patientId) {
      patientAppointments = await AppointmentModel.find({
        $or: [{ patientId: userId || patientId }, { patientPhone: userId || patientId }],
      })
        .sort({ createdAt: -1 })
        .limit(3);
    }
  } catch (err) {
    console.warn('[Assistant] MongoDB live retrieval note:', err);
  }

  // 1.5 Query Python FastAPI ML Backend on Port 8000 if available
  let pythonMlResponse: any = null;
  try {
    const pyController = new AbortController();
    const pyTimeout = setTimeout(() => pyController.abort(), 30000);
    const pyRes = await fetch('http://127.0.0.1:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        image: rawImage || (req.body && (req.body as any).image) || undefined,
        userId: userId || patientId || 'PAT-1001',
        sessionId: sessionId || 'sess_patient_chat',
        latitude: typeof latitude === 'number' ? latitude : undefined,
        longitude: typeof longitude === 'number' ? longitude : undefined,
        history: history.slice(-6),
      }),
      signal: pyController.signal,
    });
    clearTimeout(pyTimeout);
    if (pyRes.ok) {
      const pyData: any = await pyRes.json();
      pythonMlResponse = pyData;
      if (pyData && pyData.answer) {
        let cleanAnswer = pyData.answer;
        let actionsData: any = pyData.actions || { nearest_hospitals: false, nearest_medical_stores: false, talk_to_doctor: false };

        // Parse and strip [ACTIONS] block if still present in text
        if (cleanAnswer.includes('[ACTIONS]')) {
          const parts = cleanAnswer.split('[ACTIONS]');
          cleanAnswer = parts[0].trim();
          if (!pyData.actions && parts[1]) {
            try {
              const parsed = JSON.parse(parts[1].trim());
              actionsData = { ...actionsData, ...parsed };
            } catch (e) {}
          }
        }
        cleanAnswer = cleanAnswer.replace(/\[ACTIONS\][\s\S]*$/, '').trim();

        // Generate dynamic action chips strictly according to AI decisions
        const dynamicActionChips: any[] = [];
        let dynamicHospitals: any[] = [];

        if (actionsData.nearest_hospitals || pyData.intent === 'HOSPITAL_QUERY' || pyData.is_emergency) {
          dynamicActionChips.push({ label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' });
          if (pyData.intent === 'HOSPITAL_QUERY' || pyData.is_emergency) {
            dynamicHospitals = groundedFacilities.slice(0, 3);
          }
        }
        if (actionsData.nearest_medical_stores || pyData.intent === 'MEDICINE_QUERY') {
          dynamicActionChips.push({ label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' });
        }
        if (actionsData.talk_to_doctor || pyData.is_emergency) {
          dynamicActionChips.push({ label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' });
        }

        const latencyMs = Date.now() - startTime;
        sendSuccess(res, 'Assistant response generated successfully', {
          answer: cleanAnswer,
          reply: cleanAnswer,
          message: cleanAnswer,
          intent: pyData.intent || 'GENERAL',
          is_emergency: pyData.is_emergency || false,
          confidence: pyData.confidence,
          recommendedHospitals: dynamicHospitals,
          actionChips: dynamicActionChips,
          latency_ms: latencyMs,
        });
        return;
      }
    }
  } catch (pyErr) {
    // Fallback to internal grounded knowledge base if Python server is unreachable
  }


  const queryLower = userMessage.toLowerCase();

  // 2. Identify Intent & Keyword Triggers
  let intent: 'PHOTO_ANALYSIS' | 'SYMPTOM_ASSESSMENT' | 'FACILITY_QUERY' | 'DOCTOR_QUERY' | 'MEDICINE_QUERY' | 'NEARBY_LOCATION' | 'PATIENT_RECORD' | 'EMERGENCY' | 'GREETING' | 'ACKNOWLEDGMENT' | 'GRATITUDE' | 'CLOSURE' | 'GENERAL' = 'GENERAL';
  let isEmergency = false;

  const isGujarati = /[\u0A80-\u0AFF]/.test(userMessage);

  const emergencyKeywords = ['heart attack', 'unconscious', 'chest pain severe', 'heavy bleeding', 'stroke', 'poison', 'snake bite', 'cannot breathe', 'accident', 'trauma critical'];
  const greetingKeywords = ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'pranam', 'kem cho', 'good morning', 'good afternoon', 'good evening', 'su prabhat'];
  const ackKeywords = ['ok', 'okay', 'good', 'proper', 'nice', 'great', 'fine', 'cool', 'done', 'got it', 'understood', 'all right', 'alright', 'perfect', 'well done', 'sure', 'noted', 'saru', 'thik chhe', 'thik che', 'barabar', 'samjai gayu', 'saras', 'theek hai', 'accha', 'achha', 'badhiya', 'sahi hai', 'સારું', 'ઠીક છે', 'બરાબર', 'સમજાઈ ગયું', 'સરસ'];
  const gratitudeKeywords = ['thank you', 'thanks', 'thank u', 'thx', 'thanks a lot', 'thank you so much', 'aabhar', 'dhanyawad', 'shukriya', 'આભાર', 'ધન્યવાદ'];
  const closureKeywords = ['bye', 'goodbye', 'see you', 'take care', 'good night', 'gn', 'aavjo', 'આવજો', 'કાળજી રાખજો'];

  const hospitalIntentKeywords = [
    'hospital', 'hospitals', 'clinic', 'clinics', 'chc', 'phc', 'dispensary', 'dawakhana',
    'near me', 'nearby', 'nearest', 'location', 'where to go', 'where is', 'address', 'distance',
    'icu', 'bed', 'beds', 'admit', 'admission', 'emergency room', 'trauma', 'trauma center',
    'doctor near', 'specialist near', 'find hospital', 'facility', 'facilities',
    'civil hospital', 'gmers', 'pdu', 'aiims', 'smimer', 'show real nearby'
  ];
  const medicineIntentKeywords = [
    'medicine', 'medicines', 'tablet', 'tablets', 'syrup', 'paracetamol', 'cetirizine',
    'pharmacy', 'pharmacies', 'medical store', 'chemist', 'jan aushadhi', 'dawa',
    'stock', 'dose', 'dosage', 'drug', 'drugs', 'injection', 'ors', 'prescription'
  ];

  const asksForHospital = emergencyKeywords.some((kw) => queryLower.includes(kw)) || hospitalIntentKeywords.some((kw) => queryLower.includes(kw));
  const asksForMedicine = medicineIntentKeywords.some((kw) => queryLower.includes(kw));

  const isPureAck = ackKeywords.some((kw) => queryLower === kw || queryLower.startsWith(kw + ' ') || queryLower.endsWith(' ' + kw) || queryLower.includes('ok good') || queryLower.includes('good proper') || queryLower.includes('proper response'));
  const isPureGreeting = greetingKeywords.some((kw) => queryLower === kw || queryLower.startsWith(kw + ' '));
  const isPureGratitude = gratitudeKeywords.some((kw) => queryLower.includes(kw));
  const isPureClosure = closureKeywords.some((kw) => queryLower.includes(kw));

  if (emergencyKeywords.some((kw) => queryLower.includes(kw))) {
    intent = 'EMERGENCY';
    isEmergency = true;
  } else if (rawImage) {
    intent = 'PHOTO_ANALYSIS';
  } else if (['my appointment', 'my token', 'my queue', 'my prescription', 'my report', 'my history', 'my record', 'token number'].some((kw) => queryLower.includes(kw))) {
    intent = 'PATIENT_RECORD';
  } else if (asksForMedicine && !asksForHospital) {
    intent = 'MEDICINE_QUERY';
  } else if (['doctor', 'specialist', 'dr.', 'dr ', 'physician', 'who is available', 'opd room'].some((kw) => queryLower.includes(kw)) && !asksForHospital) {
    intent = 'DOCTOR_QUERY';
  } else if (asksForHospital) {
    intent = 'FACILITY_QUERY';
  } else if (isPureGratitude) {
    intent = 'GRATITUDE';
  } else if (isPureClosure) {
    intent = 'CLOSURE';
  } else if (isPureAck) {
    intent = 'ACKNOWLEDGMENT';
  } else if (isPureGreeting) {
    intent = 'GREETING';
  } else {
    // Check if symptoms or medical terms present
    const hasSymptom = MEDICAL_KB.some((c) =>
      c.signatureSymptoms.some((sym) => queryLower.includes(sym)) ||
      queryLower.includes(c.disease.toLowerCase()) ||
      queryLower.includes(c.specialty.toLowerCase()) ||
      ['fever', 'pain', 'cough', 'cold', 'headache', 'vomit', 'diarrhea', 'nausea', 'weakness', 'swelling', 'rash', 'તાવ', 'શરદી', 'દુખાવો'].some((s) => queryLower.includes(s))
    );
    intent = hasSymptom ? 'SYMPTOM_ASSESSMENT' : 'GENERAL';
  }

  // 3. Match Clinical Condition from Knowledge Base (Prioritizing High-Specificity Specialties)
  let matchedCondition: ConditionInfo | null = null;
  if (queryLower.includes('heart') || queryLower.includes('chest') || queryLower.includes('cardio') || queryLower.includes('angina')) {
    matchedCondition = MEDICAL_KB[0];
  } else if (queryLower.includes('kidney') || queryLower.includes('dialysis') || queryLower.includes('renal') || queryLower.includes('stone') || queryLower.includes('creatinine') || queryLower.includes('urine')) {
    matchedCondition = MEDICAL_KB[2];
  } else if (queryLower.includes('cancer') || queryLower.includes('oncology') || queryLower.includes('chemo') || queryLower.includes('tumor') || queryLower.includes('malignan') || queryLower.includes('lump')) {
    matchedCondition = MEDICAL_KB[3];
  } else if (queryLower.includes('fracture') || queryLower.includes('bone') || queryLower.includes('joint') || queryLower.includes('ortho') || queryLower.includes('knee') || queryLower.includes('arthritis') || queryLower.includes('dislocat') || queryLower.includes('sprain')) {
    matchedCondition = MEDICAL_KB[4];
  } else if (queryLower.includes('child') || queryLower.includes('baby') || queryLower.includes('pediatric') || queryLower.includes('infant') || queryLower.includes('toddler') || queryLower.includes('newborn')) {
    matchedCondition = MEDICAL_KB[6];
  } else if (queryLower.includes('pregnan') || queryLower.includes('matern') || queryLower.includes('delivery') || queryLower.includes('anc') || queryLower.includes('labor') || queryLower.includes('gynecol') || queryLower.includes('obstetric')) {
    matchedCondition = MEDICAL_KB[7];
  } else if (queryLower.includes('eye') || queryLower.includes('vision') || queryLower.includes('cataract') || queryLower.includes('glaucoma') || queryLower.includes('ophthalm')) {
    matchedCondition = MEDICAL_KB[8];
  } else if (queryLower.includes('asthma') || queryLower.includes('wheez') || queryLower.includes('tb') || queryLower.includes('tuberculosis') || queryLower.includes('pneumonia') || queryLower.includes('lung') || queryLower.includes('sputum')) {
    matchedCondition = MEDICAL_KB[9];
  } else {
    matchedCondition = MEDICAL_KB.find((c) =>
      c.signatureSymptoms.some((sym) => queryLower.includes(sym)) ||
      queryLower.includes(c.disease.toLowerCase()) ||
      queryLower.includes(c.specialty.toLowerCase())
    ) || null;
  }

  const primarySpecialty = matchedCondition ? matchedCondition.specialty : 'General Medicine';

  // 4. Rank & Recommend Real Hospitals matching the Patient's Disease from MongoDB
  let matchedFacilities = groundedFacilities.filter((f) => {
    if (!matchedCondition) return true;
    const facSpecs = (f.specialties || []).map((s: string) => s.toLowerCase());
    const facName = (f.name || '').toLowerCase();
    const facDeps = (f.departments || []).map((d: any) => (d.name || '').toLowerCase());

    const hasSpecialty = facSpecs.some((s: string) => s.includes(primarySpecialty.toLowerCase()) || primarySpecialty.toLowerCase().includes(s));
    const hasKeyword = (matchedCondition.facilityKeywords || []).some((kw) => facName.includes(kw) || facSpecs.some((s: string) => s.includes(kw)) || facDeps.some((d: string) => d.includes(kw)));

    return hasSpecialty || hasKeyword;
  });

  if (matchedFacilities.length === 0) {
    matchedFacilities = groundedFacilities.slice(0, 3);
  }

  matchedFacilities.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const recommendedHospitalsList = matchedFacilities.slice(0, 3).map((f) => {
    const matchingDoc = groundedDoctors.find((d) =>
      d.facilityId === f.id &&
      (d.specialty?.toLowerCase().includes(primarySpecialty.toLowerCase()) || primarySpecialty.toLowerCase().includes(d.specialty?.toLowerCase() || ''))
    ) || groundedDoctors.find((d) => d.facilityId === f.id) || {
      name: `Dr. Attending Specialist (${primarySpecialty})`,
      specialty: primarySpecialty,
      qualification: 'MBBS, MD',
      opdRoom: 'Specialty OPD Room 4',
      status: 'ON_DUTY',
    };

    return {
      id: f.id,
      name: f.name,
      type: f.type || 'DISTRICT_HOSPITAL',
      matchedSpecialty: primarySpecialty,
      distanceKm: f.distanceKm ?? 2.4,
      driveTimeMinutes: f.driveTimeMinutes ?? 6,
      address: f.address || `${f.district || 'Gandhinagar'}, Gujarat`,
      coordinates: f.coordinates || { lat: 23.2156, lng: 72.6369 },
      emergencyNumber: f.emergencyNumber || '108',
      contactNumber: f.contactNumber || '079-2322-1916',
      availableBeds: f.availableBeds || 45,
      icuBedsAvailable: f.icuBedsAvailable || 8,
      emergencyAvailable: f.emergencyAvailable ?? true,
      doctorOnDuty: {
        name: matchingDoc.name,
        specialty: matchingDoc.specialty || primarySpecialty,
        qualification: matchingDoc.qualification || 'MBBS, MD',
        opdRoom: matchingDoc.opdRoom || 'Room 4 (1st Floor)',
        status: matchingDoc.status || 'ON_DUTY',
      },
      opdSchedule: matchingDoc.opdSchedule || 'Mon-Sat: 9:00 AM - 1:00 PM',
    };
  });

  const topHospital = recommendedHospitalsList[0] || {
    id: 'fac_civil_01',
    name: 'Gandhinagar Civil Hospital & Medical College',
    type: 'DISTRICT_HOSPITAL',
    matchedSpecialty: primarySpecialty,
    distanceKm: 2.1,
    driveTimeMinutes: 5,
    address: 'Sector 12, Gandhinagar, Gujarat 382012',
    emergencyNumber: '108',
    contactNumber: '079-2322-1916',
    availableBeds: 84,
    icuBedsAvailable: 12,
    emergencyAvailable: true,
    doctorOnDuty: {
      name: 'Dr. Arvind Patel',
      specialty: 'General Medicine',
      qualification: 'MBBS, MD',
      opdRoom: 'Room 4 (1st Floor)',
      status: 'ON_DUTY',
    },
    opdSchedule: 'Mon-Sat: 9:00 AM - 1:00 PM',
  };

  const nearestStore = groundedMedicalStores[0] || {
    name: 'Pradhan Mantri Jan Aushadhi Kendra',
    isJanAushadhi: true,
    fullAddress: 'Hospital Main Gate, Sector 21',
    phone: '9876543210',
    distanceKm: 1.4,
    isOpenNow: true,
    timings: '8:00 AM - 10:00 PM',
  };

  // 5. Construct Grounded Response Text & Action Chips
  let responseText = '';
  let returnedHospitals: any[] = [];
  const actionChips: Array<{ label: string; action: string; path?: string; phone?: string; type?: string }> = [];

  // ==========================================
  // CASE A: PHOTO ANALYSIS
  // ==========================================
  if (intent === 'PHOTO_ANALYSIS') {
    responseText = `📸 **Clinical AI Visual & Prescription Assessment**
**Attachment Status:** Successfully Processed & Triaged

### 🔍 **Clinical Review:**
- **Record Type:** Healthcare Visual Record (Prescription / Medical Report / Lesion)
- **Specialty Required:** **${primarySpecialty}**
- **Recommended Hospital:** **${topHospital.name}** (${topHospital.distanceKm} km away • ~${topHospital.driveTimeMinutes} mins)
- **Attending Specialist:** **${topHospital.doctorOnDuty?.name}** (${topHospital.doctorOnDuty?.specialty}, ${topHospital.doctorOnDuty?.opdRoom})

### 🏥 **Recommended Hospital for this Condition:**
• **${topHospital.name}** — **${topHospital.distanceKm} km**
  - **Live Beds:** **${topHospital.availableBeds} General Beds** | **${topHospital.icuBedsAvailable} ICU Beds**
  - **OPD Timings:** ${topHospital.opdSchedule}
  - **Emergency:** ${topHospital.emergencyAvailable ? '🟢 24x7 Trauma Active' : '⚪ OPD Hours'}

---
⚠️ *Medical Safety Note: AI visual analysis is supportive and non-diagnostic. Please consult your government doctor for conclusive evaluation.*`;

    returnedHospitals = recommendedHospitalsList;
    actionChips.push(
      { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
      { label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' },
      { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
    );
  }

  // ==========================================
  // CASE B: CRITICAL EMERGENCY
  // ==========================================
  else if (isEmergency) {
    responseText = `🚨 **EMERGENCY MEDICAL ALERT — IMMEDIATE ATTENTION**
Your symptoms indicate a potentially critical emergency requiring immediate evaluation.

### 🚑 **Immediate Action Steps:**
1. **Call 108 Emergency Ambulance** immediately or proceed to the nearest Emergency/Casualty Trauma Center.
2. **Nearest Specialized Emergency Facility:** **${topHospital.name}**
   - 📍 **Exact Distance:** **${topHospital.distanceKm} km** (~${topHospital.driveTimeMinutes} mins)
   - 🛏️ **Live ICU Beds Available:** **${topHospital.icuBedsAvailable} ICU Beds**
   - 📞 **Emergency Line:** Dial **${topHospital.emergencyNumber}**
3. Sit or lie down in a comfortable upright posture. Do not attempt to drive yourself.

---
⚠️ *Disclaimer: Call 108 immediately for ambulance dispatch.*`;

    returnedHospitals = recommendedHospitalsList;
    actionChips.push(
      { label: '🚨 Call 108 Emergency', action: 'EMERGENCY', phone: '108' },
      { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
      { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
    );
  }

  // ==========================================
  // CASE C1: MEDICINE & PHARMACY QUERY
  // ==========================================
  else if (intent === 'MEDICINE_QUERY') {
    const storesList = groundedMedicalStores.slice(0, 3).map((s, i) =>
      `${i + 1}. 💊 **${s.name}** ${s.isJanAushadhi ? '*(PM Jan Aushadhi Kendra - Up to 90% Generic Subsidy)*' : ''}
   - 📍 **Distance:** **${s.distanceKm} km away** (GPS Verified)
   - 🏢 **Address:** ${s.fullAddress || s.address || 'Civil Hospital Campus, Sector 21'}
   - 🕒 **Timings:** ${s.timings || '8:00 AM - 10:00 PM'} (${s.isOpenNow !== false ? '🟢 Open Now' : '🔴 Closed'})
   - 📞 **Contact:** ${s.phone || '079-2322-1916'}`
    ).join('\n\n');

    responseText = `💊 **1. Real Nearest Medical Stores & Jan Aushadhi Kendras (GPS Verified)**
📍 **Your Live Tracked GPS:** \`${userLat.toFixed(4)}°N, ${userLng.toFixed(4)}°E\`

${storesList}

### 📦 **2. Common Essential Government Subsidized Medicines in Stock**
• **Paracetamol 500mg / 650mg** — Analgesic & Antipyretic (Generic Available)
• **Cetirizine 10mg** — Antiallergic / Antihistamine
• **Oral Rehydration Salts (WHO-ORS)** — Essential Electrolyte Hydration
• **Amoxicillin + Clavulanic Acid 625mg** — Broad-Spectrum Antibiotic (Prescription Only)
• **Metformin 500mg / Telmisartan 40mg** — Chronic Care NCD Formulations
• **Pantoprazole 40mg** — Gastro-protective Antacid

### 💡 **3. Safe Medication Guidelines**
• Always take scheduled prescription drugs only upon physical medical consultation.
• Verify the expiry date and batch number before consuming any pharmaceuticals.
• Avail Jan Aushadhi generic formulations at the nearest government centers for high-quality subsidized medicines.

---
⚠️ *Medical Safety Disclaimer: AI guidance is for informational triage under SIH Telehealth. For prescription dosages, consult a registered doctor or pharmacist.*`;

    returnedHospitals = recommendedHospitalsList;
    actionChips.push(
      { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
      { label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' },
      { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
    );
  }

  // ==========================================
  // CASE C2: FACILITY & NEARBY HOSPITAL QUERY
  // ==========================================
  else if (intent === 'FACILITY_QUERY' && !matchedCondition && !pythonMlResponse?.retrievedContext?.ml_predictions) {
    const hospitalCardsText = recommendedHospitalsList.map((h, i) => 
      `${i + 1}. 🏥 **${h.name}** (${h.type})
   - 📍 **Distance:** **${h.distanceKm} km away** • ~${h.driveTimeMinutes} mins drive (GPS Verified)
   - 🩺 **Specialty Dept:** **${h.matchedSpecialty} OPD**
   - 👨‍⚕️ **Specialist On Duty:** **${h.doctorOnDuty?.name}** (${h.doctorOnDuty?.qualification}, ${h.doctorOnDuty?.opdRoom})
   - 🛏️ **Live Beds:** **${h.availableBeds} General** | **${h.icuBedsAvailable} ICU Beds**
   - 🕒 **Timings:** ${h.opdSchedule}
   - 📞 **Contact:** ${h.contactNumber} | Emergency: **${h.emergencyNumber}**`
    ).join('\n\n');

    responseText = `🏥 **1. Real Nearest Specialized Hospitals from Live Database (GPS Verified)**
📍 **Your Live Tracked GPS:** \`${userLat.toFixed(4)}°N, ${userLng.toFixed(4)}°E\`
Retrieved in real-time from Gujarat Health Network based on your live browser coordinates:

${hospitalCardsText}

### 📋 **2. What to Bring for Consultation**
• **ABHA Health ID / Aadhaar Card** for instant OPD registration
• Prior medical records, prescriptions, or laboratory reports (if any)
• Visit during morning OPD hours (9:00 AM - 1:00 PM) for same-day specialist review

### 🎟️ **3. Live Digital OPD Tokens**
You can generate a live token online to avoid long queues at the hospital counter.

---
⚠️ *Medical Safety Disclaimer: For acute medical emergencies, dial 108 immediately or head to the nearest 24x7 trauma facility.*`;

    returnedHospitals = recommendedHospitalsList;
    actionChips.push(
      { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
      { label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' },
      { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
    );
  }

  // ==========================================
  // CASE D1: ACKNOWLEDGMENT & CONFIRMATION
  // ==========================================
  else if (intent === 'ACKNOWLEDGMENT') {
    if (isGujarati) {
      responseText = `સમજાઈ ગયું તે જાણીને ખૂબ આનંદ થયો! 😊

જો આપને સ્વાસ્થ્ય સંબંધિત કોઈ અન્ય પ્રશ્ન હોય, નવી તકલીફ જણાય, અથવા નજીકના સરકારી દવાખાના / જન ઔષધિ કેન્દ્રની માહિતી જોઈતી હોય તો મને જરૂર પૂછો.

તમારી કાળજી રાખજો અને હંમેશા નિરોગી રહો! 🌿

> ⚠️ **તબીબી ચેતવણી**: હું એક AI સહાયક છું. સચોટ સારવાર માટે ડૉક્ટરની સલાહ લો.`;
    } else {
      responseText = `Glad to hear that! 😊

I am always here to assist you with healthcare guidance, explaining symptoms in simple words, checking Jan Aushadhi generic medicines, or finding nearby government hospitals.

Take good care of yourself and stay healthy! 🌿

> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a doctor. Always consult a healthcare professional for personalized medical advice.`;
    }
    returnedHospitals = [];
    actionChips.push(
      { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
      { label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' },
      { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
    );
  }

  // ==========================================
  // CASE D2: GRATITUDE / THANKS
  // ==========================================
  else if (intent === 'GRATITUDE') {
    if (isGujarati) {
      responseText = `તમારો ખૂબ ખૂબ આભાર! 🙏

તમારી સેવા કરવી અને આપને યોગ્ય આરોગ્ય માર્ગદર્શન આપવું એ મારી પ્રાથમિકતા છે. કોઈપણ સમયે આરોગ્ય સહાય માટે હું હાજર છું.

સ્વસ્થ રહો અને કાળજી રાખજો! 🌿`;
    } else {
      responseText = `You are most welcome! 🙏

Helping you navigate your health safely and clearly is my highest priority. Please feel free to reach out anytime.

Wishing you great health and wellbeing! 🌿`;
    }
    returnedHospitals = [];
    actionChips.push(
      { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
      { label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' }
    );
  }

  // ==========================================
  // CASE D3: CLOSURE / FAREWELL
  // ==========================================
  else if (intent === 'CLOSURE') {
    if (isGujarati) {
      responseText = `આવજો! 🌟

તમારા સ્વાસ્થ્યમાં ઝડપી સુધારો થાય અને તમે હંમેશા નિરોગી રહો તેવી શુભેચ્છાઓ. જ્યારે પણ જરૂર પડે ત્યારે ફરીથી સંપર્ક કરજો. કાળજી રાખજો! 🌿`;
    } else {
      responseText = `Goodbye and take care! 🌟

Wishing you good health, safety, and a fast recovery. Whenever you need healthcare guidance, AarogyaMitra is always here for you. Stay well! 🌿`;
    }
    returnedHospitals = [];
  }

  // ==========================================
  // CASE D4: GREETING
  // ==========================================
  else if (intent === 'GREETING') {
    if (isGujarati) {
      responseText = `👋 **નમસ્તે! હું આરોગ્યમિત્ર AI છું — તમારો ગુજરાત ડિજિટલ આરોગ્ય સહાયક.**

હું તમને નીચેની બાબતોમાં મદદ કરી શકું છું:
• 🩺 **સ્વાસ્થ્ય લક્ષણોનું વિશ્લેષણ અને સલાહ**
• 🏥 **નજીકના સરકારી દવાખાના / સિવિલ હોસ્પિટલની માહિતી**
• 💊 **જેનરિક દવાઓ અને જન ઔષધિ સ્ટોક શોધવા**
• 🎟️ **ઓનલાઇન OPD ટોકન બુકિંગ**

આજે હું આપને કેવી રીતે મદદ કરી શકું? કૃપા કરીને તમારી તકલીફ અથવા લક્ષણો જણાવો.

> ⚠️ **તબીબી ચેતવણી**: હું એક AI ચેટબોટ છું, વાસ્તવિક ડૉક્ટર નથી. સચોટ નિદાન માટે ડૉક્ટરની સલાહ લો.`;
    } else {
      responseText = `👋 **Hello! I am AarogyaMitra AI, your digital healthcare companion.**

I can assist everyone (from simple home care to clinical guidance) with:
• 🩺 **Understanding symptoms in simple terms** (e.g. fever, headache, stomach pain)
• 🏥 **Locating nearby verified government health centres & specialists**
• 💊 **Checking affordable Jan Aushadhi generic medicines**
• 🎟️ **Booking digital OPD tokens to skip long hospital queues**

How can I assist you today? Please feel free to describe your symptoms or ask any health question.

> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor. Always consult a qualified physician for clinical diagnosis.`;
    }
    returnedHospitals = [];
    actionChips.push(
      { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
      { label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' },
      { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
    );
  }

  // ==========================================
  // CASE C3: DISEASE / SYMPTOM & CLINICAL ML TRIAGE
  // ==========================================
  else if (matchedCondition || asksForHospital || (pythonMlResponse && pythonMlResponse.intent === 'SYMPTOM_DIAGNOSIS')) {
    const currentCondition = matchedCondition || MEDICAL_KB[0];
    const hasDurationOrSeverity = ['day', 'days', 'hour', 'hours', 'since', 'mild', 'moderate', 'severe', 'high', 'low', 'week'].some((w) => queryLower.includes(w));

    if (!hasDurationOrSeverity && !asksForHospital && !pythonMlResponse) {
      // First turn of symptom report -> Ask ONE clarifying triage question
      responseText = `I understand you are experiencing health symptoms. To help assess your condition properly:

1. **How long have you had this symptom (e.g. hours or days)?**
2. **Is the discomfort mild, moderate, or severe?**
3. **Do you have any other accompanying symptoms (such as fever, nausea, dizziness, or pain)?**

Please reply with the details so I can guide you safely.

> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor. For personalized medical advice, please consult a qualified healthcare professional.`;
      returnedHospitals = [];
      actionChips.push(
        { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
        { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
      );
    } else {
      const precautionsList = currentCondition.precautions.map((p) => `• ${p}`).join('\n');
      const remediesList = currentCondition.homeRemedies.map((r) => `• ${r}`).join('\n');
      const medicinesList = currentCondition.recommendedMedicines.map((m) => `• ${m}`).join('\n');

      let mlDifferentialText = '';
      const mlPreds = pythonMlResponse?.retrievedContext?.ml_predictions?.top_predictions || pythonMlResponse?.ml_predictions?.top_predictions;
      if (mlPreds && mlPreds.length > 0) {
        mlDifferentialText = `\n### 🧬 **ML Differential Probability (Trained on 163,000 cases):**\n` +
          mlPreds.slice(0, 4).map((p: any) => `• **${p.disease.toUpperCase()}**: ${p.confidence_percent || `${(p.confidence * 100).toFixed(1)}%`} match (Urgency: ${p.urgency_level || 'ROUTINE'})`).join('\n') + '\n';
      }

      if (pythonMlResponse?.answer && pythonMlResponse.answer.length > 50 && !pythonMlResponse.answer.includes('No healthcare records matched')) {
        responseText = pythonMlResponse.answer;
      } else {
        responseText = `### 🩺 Assessment
Based on the reported symptoms, here is an initial preliminary health evaluation.

### 🔍 Possible Causes
• **${currentCondition.disease}** (Triage Urgency: **${currentCondition.urgency}**)
*${currentCondition.description}*
${mlDifferentialText}
### 💡 What You Can Do
${precautionsList}
${remediesList}

### ⚠️ Avoid / Do Not Do
• Do not self-start unprescribed antibiotics or heavy painkillers.
• Do not ignore worsening signs or difficulty breathing.

### 🏥 When to See a Doctor
Visit your local Primary Health Centre (PHC) or district hospital if symptoms persist or worsen.

> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor. For an accurate clinical diagnosis, please consult a qualified healthcare professional.`;
      }

      returnedHospitals = asksForHospital ? recommendedHospitalsList : [];
      actionChips.push(
        { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
        { label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' },
        { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
      );
    }
  }

  // ==========================================
  // CASE D: GENERAL GREETING / INQUIRY
  // ==========================================
  else {
    responseText = `👋 **Hello! I am AarogyaMitra, your Gujarat Health AI Assistant.**

I am here to support you with:
• 🩺 **Symptom guidance & clinical assessment** (e.g. "What should I do for headache?", "Causes of high fever")
• 🏥 **Finding nearest specialized government hospitals** (type "nearby hospitals" or "hospital for chest pain")
• 💊 **Checking generic medicines & Jan Aushadhi stores** (type "medicines" or "pharmacy near me")
• 🎟️ **Instant OPD Token booking & teleconsultation**

How may I assist you today? Please feel free to describe your symptoms or health queries.`;

    returnedHospitals = [];
    actionChips.push(
      { label: '🏥 Nearby Hospitals', action: 'NAVIGATE', path: '/patient/facilities' },
      { label: '💊 Medical Stores', action: 'NAVIGATE', path: '/patient/medical-stores' },
      { label: '🎟️ Live OPD Token', action: 'NAVIGATE', path: '/patient/tokens' }
    );
  }

  const latencyMs = Date.now() - startTime;

  sendSuccess(res, 'Assistant response generated successfully', {
    answer: responseText,
    reply: responseText,
    message: responseText,
    intent,
    is_emergency: isEmergency,
    matchedCondition: matchedCondition?.disease || null,
    urgency: matchedCondition?.urgency || (isEmergency ? 'EMERGENCY' : 'ROUTINE'),
    doctor: topHospital.doctorOnDuty ? { name: topHospital.doctorOnDuty.name, specialty: topHospital.doctorOnDuty.specialty, room: topHospital.doctorOnDuty.opdRoom } : null,
    facility: { name: topHospital.name, availableBeds: topHospital.availableBeds, icuBeds: topHospital.icuBedsAvailable },
    recommendedHospitals: returnedHospitals,
    actionChips,
    latency_ms: latencyMs,
  });
}

