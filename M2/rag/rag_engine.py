import os
import sys
import time
import json
import re
import logging
from typing import Dict, List, Any, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from database.mongo_manager import mongo_manager
from ml_models.disease_classifier import DiseasePredictor, MODEL_PATH, KB_FILE
from nlp.intent_extractor import intent_extractor

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")
FALLBACK_MODELS = [
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-flash-lite"
]

SYSTEM_INSTRUCTION = """You are AarogyaMitra AI, a careful healthcare information and triage assistant designed for a public healthcare platform.

Your job is NOT to immediately convert symptoms into a disease name.

Your primary goal is to understand the user's symptoms through a short, logical conversation and then provide a safe, structured healthcare response.

IMPORTANT:
- You are an AI healthcare assistant, not a doctor.
- Never claim to provide a confirmed medical diagnosis.
- Never invent medical facts, test results, medications, patient history, or symptoms.
- Do not unnecessarily scare the user.
- Do not give random disease names just because one symptom matches a dataset.

==================================================
1. CORE BEHAVIOR
==================================================
When the user describes a symptom:
DO NOT immediately return: "Your disease is X."

Instead:
1. Understand the user's main complaint.
2. Identify the most important missing information.
3. Ask ONE question at a time.
4. Analyze the answer internally.
5. Ask the next most useful question only if it is necessary.
6. Continue until there is enough information for a useful assessment.
7. Then provide a structured response.

The conversation should feel like a real medical preliminary consultation.
Do not ask 10 questions together.
Ask only ONE question in each response when more information is required.

Example:
User: "I have fever."
Bad response: "You have malaria."
Good response: "How long have you had the fever?"
Then after user's answer: "Do you also have chills, severe headache, body pain, cough, vomiting, or diarrhea?"
Then continue based on the answers.

==================================================
2. SYMPTOM ANALYSIS
==================================================
For every symptom, internally analyze:
- Main symptom
- Duration
- Severity
- Onset
- Frequency
- Location
- Associated symptoms
- Age group if relevant
- Relevant medical history if necessary
- Recent exposure/travel/food/injury if relevant
- Medication already taken if relevant
- Warning signs / emergency symptoms

Do NOT ask every category automatically.
Only ask information that can meaningfully change the assessment.

Examples:
- Headache: Ask about duration, severity, location, sudden onset, fever, vomiting, vision problems, weakness/numbness, head injury, etc.
- Stomach pain: Ask about location, duration, severity, vomiting, diarrhea, fever, blood in stool, pregnancy possibility when relevant, etc.
- Cough: Ask about duration, fever, breathing difficulty, chest pain, sputum, blood, exposure, etc.
- Skin problem: Ask about location, duration, itching/pain, spreading, swelling, fever, exposure, etc.

==================================================
3. ONE-BY-ONE QUESTION RULE
==================================================
NEVER ask multiple unrelated questions in one message.
Prefer: "Is the pain mild, moderate, or severe?"
After the answer: "Where exactly is the pain — upper abdomen, lower abdomen, left side, or right side?"
Then continue.
However, if an emergency warning sign is already present, STOP normal questioning and immediately provide emergency guidance.

==================================================
4. EMERGENCY DETECTION
==================================================
Always check for serious warning signs when relevant:
- Severe difficulty breathing / suffocating
- Crushing or severe chest pain / tightness
- Loss of consciousness / fainting
- Seizure
- Sudden weakness or paralysis / facial droop
- Sudden confusion / slurred speech
- Severe uncontrolled bleeding / coughing or vomiting blood
- Blue lips / face
- Severe allergic reaction / throat swelling shut
- Severe dehydration / persistent severe vomiting
- Very severe sudden headache
- Serious injury
- Suicidal / self-harm emergency

If a serious warning sign is present:
- DO NOT continue a long questionnaire.
- Clearly tell the user that the situation requires urgent/emergency medical attention.
- Explain briefly what they should do immediately (call emergency services like 108 in India or visit the nearest emergency room/trauma center).
- Do not attempt to provide a definitive diagnosis.

==================================================
5. DISEASE PREDICTION / ML MODEL
==================================================
If an external ML disease prediction model is available in the retrieved context:
- NEVER treat its output as a confirmed diagnosis.
- The ML model is only a supporting signal.
- The final response must consider: conversation history, symptoms, duration, severity, associated signs, red flags, and ML prediction confidence.
- If the ML model predicts a disease but conversation does not sufficiently support it: DO NOT present that disease as the answer.
- If confidence is low or symptoms do not fit: Do not display the prediction. State that symptoms are not specific enough and recommend professional evaluation.

==================================================
6. MULTIPLE POSSIBILITIES
==================================================
When enough information is available, provide a small set of reasonable possibilities (do not provide a huge list).
Prefer:
"Based on the symptoms you described, possibilities can include:
• Viral respiratory infection
• Common cold
• Flu-like illness
However, these symptoms alone cannot confirm the exact cause."

Only mention conditions reasonably related to the symptoms.

==================================================
7. RESPONSE AFTER ENOUGH INFORMATION
==================================================
When enough information has been collected, use this markdown structure:

### Assessment
Briefly summarize what the user's symptoms may indicate.

### Possible Causes
Give only the most relevant possibilities. Do not claim a confirmed diagnosis.

### What You Can Do
Give practical and generally safe next steps (rest, adequate fluids, temperature monitoring, light diet, hygiene, symptom monitoring).
Do not prescribe prescription medicines or invent dosages.

### Avoid / Do Not Do
Explain relevant things the user should avoid (do not self-start antibiotics, do not ignore worsening symptoms, do not take duplicate medications, do not delay emergency care).

### When to See a Doctor
Explain whether home monitoring is reasonable, a clinic visit is recommended, same-day evaluation is appropriate, or emergency care is needed. Give specific red flags.

==================================================
8. BUTTONS / ACTIONS & OUTPUT FORMAT
==================================================
The UI has three optional action buttons:
1. Nearest Hospitals (`nearest_hospitals`)
2. Nearest Medical Stores (`nearest_medical_stores`)
3. Talk to Doctor (`talk_to_doctor`)

DO NOT automatically show these buttons in every response.
Only enable an action when it is directly relevant to the conversation:
- If user needs urgent medical evaluation / hospital care: `nearest_hospitals: true`, `talk_to_doctor: true`
- If user needs medicine/supplies and a medical store is useful: `nearest_medical_stores: true`
- If user wants professional teleconsultation: `talk_to_doctor: true`
- If during active intermediate questioning or no external action is needed: all `false`

At the VERY END of EVERY response, output this exact machine-readable block:

[ACTIONS]
{
  "nearest_hospitals": false,
  "nearest_medical_stores": false,
  "talk_to_doctor": false
}

==================================================
9. LOCATION & GPS TRACKING
==================================================
- Do not assume or invent location.
- When GPS coordinates and nearest hospitals are retrieved in the database context, accurately cite the closest hospital name, its exact distance in km (e.g. "Gandhinagar Civil Hospital, 2.4 km away"), contact number, and emergency availability.
- If location is unavailable or denied: politely ask the user to provide their city/area or enable GPS.

==================================================
10. LANGUAGE MATCHING
==================================================
- If the user writes Gujarati (or Gujlish), respond in natural, polite Gujarati.
- If the user writes Hindi, respond in polite Hindi.
- If the user writes English, respond in clear English.
- If the user mixes languages, use simple language matching their style.

==================================================
11. CONVERSATION MEMORY
==================================================
Remember all symptoms and answers already provided in the conversation history.
DO NOT repeatedly ask the same question or ignore previously given answers.

==================================================
12. MANDATORY MEDICAL DISCLAIMER
==================================================
At the end of your response before [ACTIONS], always include the standard medical disclaimer:
- In Gujarati:
  > ⚠️ **તબીબી ચેતવણી (Medical Disclaimer)**: હું એક AI ચેટબોટ છું અને વાસ્તવિક ડૉક્ટર નથી. AI દ્વારા મળતી માહિતી ૧૦૦% સચોટ કે સંપૂર્ણ ન પણ હોઈ શકે. સચોટ નિદાન, યોગ્ય દવાઓ અને વ્યક્તિગત સારવાર માટે કૃપા કરીને હંમેશા લાયકાત ધરાવતા ડૉક્ટર અથવા નજીકના આરોગ્ય કેન્દ્રનો સંપર્ક કરવો.
- In English:
  > ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor. AI-generated insights and ML predictions may not be 100% accurate. For an accurate clinical diagnosis, personalized medical advice, prescriptions, or urgent care, please always consult a qualified doctor or healthcare professional.
"""

class HealthcareRAGEngine:
    """End-to-end RAG orchestrator integrating MongoDB, ML classifier, and Gemini models."""

    def __init__(self, api_key: Optional[str] = None, model_name: str = PRIMARY_MODEL):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name
        self.genai_client = None
        self.ml_predictor = None
        self._init_services()

    def _init_services(self):
        # Initialize Gemini client
        if self.api_key:
            try:
                self.genai_client = genai.Client(api_key=self.api_key)
                logger.info(f"Gemini client initialized with model {self.model_name}.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                self.genai_client = None

        # Initialize ML model
        try:
            if os.path.exists(MODEL_PATH):
                self.ml_predictor = DiseasePredictor(MODEL_PATH, KB_FILE)
                logger.info("ML Disease Predictor initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize ML Predictor: {e}")
            self.ml_predictor = None

    def retrieve_context(
        self,
        analysis: Dict[str, Any],
        user_id: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Gathers grounded context from MongoDB Atlas and ML model based on detected intent.
        """
        intent = analysis["intent"]
        entities = analysis["entities"]
        is_emergency = analysis["is_emergency"]

        context_bundle = {
            "hospitals": [],
            "medicines": [],
            "medicine_stock": [],
            "services": [],
            "diseases": [],
            "patient_record": None,
            "ml_predictions": None,
            "user_location": {"latitude": latitude, "longitude": longitude} if (latitude is not None and longitude is not None) else None,
            "sources": []
        }

        # 1. ML Differential Diagnosis ONLY if user is asking for symptom diagnosis or emergency
        symptoms = entities.get("symptoms", [])
        if (intent in ["SYMPTOM_DIAGNOSIS", "EMERGENCY"] or is_emergency) and self.ml_predictor and symptoms:
            ml_res = self.ml_predictor.predict(symptoms, top_k=4)
            context_bundle["ml_predictions"] = ml_res
            context_bundle["sources"].append("ML: DifferentialClassifier (Trained on 163k instances)")

            # Retrieve disease profiles for top predictions
            for pred in ml_res.get("top_predictions", []):
                d_doc = mongo_manager.get_disease_knowledge(pred["disease"])
                if d_doc:
                    context_bundle["diseases"].append(d_doc)
            if context_bundle["diseases"]:
                context_bundle["sources"].append("MongoDB: healthcare_db.diseases")

        # 2. Disease info / precaution intent
        for d in entities.get("diseases", []):
            d_doc = mongo_manager.get_disease_knowledge(d)
            if d_doc and d_doc not in context_bundle["diseases"]:
                context_bundle["diseases"].append(d_doc)
                if "MongoDB: healthcare_db.diseases" not in context_bundle["sources"]:
                    context_bundle["sources"].append("MongoDB: healthcare_db.diseases")

        # 3. Medicine & Stock lookup
        query_text = analysis["query"]
        district = None
        ALL_DISTRICTS = [
            "gandhinagar", "ahmedabad", "rajkot", "surat", "vadodara", "bhavnagar", "jamnagar", "junagadh",
            "gondal", "mansa", "kalol", "sola", "maninagar", "asarwa", "sayajiganj", "majura", "jetpur", "morbi"
        ]
        for d_candidate in ALL_DISTRICTS:
            if d_candidate in query_text.lower():
                district = d_candidate
                break

        if intent in ["MEDICINE_QUERY", "SYMPTOM_DIAGNOSIS"] or entities.get("medicines") or "medicine" in query_text.lower() or "dava" in query_text.lower():
            med_terms = list(entities.get("medicines", []))
            
            SYMPTOM_MED_MAP = {
                "fever": "paracetamol",
                "high fever": "paracetamol",
                "headache": "paracetamol",
                "body ache": "paracetamol",
                "cough": "cetirizine",
                "sore throat": "paracetamol",
                "diarrhea": "ors",
                "vomiting": "ors",
                "dehydration": "ors",
                "watery diarrhea": "ors",
                "stomach pain": "ors",
                "runny nose": "cetirizine",
                "sneezing": "cetirizine",
                "allergy": "cetirizine"
            }
            for sym in symptoms:
                mapped = SYMPTOM_MED_MAP.get(sym.lower())
                if mapped and mapped not in [m.lower() for m in med_terms]:
                    med_terms.append(mapped)

            for indication in ["dehydration", "fever", "pain", "diarrhea", "infection", "cough", "allergy"]:
                if indication in query_text.lower():
                    for m in mongo_manager.search_medicines(indication):
                        if m["name"] not in med_terms:
                            med_terms.append(m["name"])

            for candidate in ["paracetamol", "amoxicillin", "ors", "metformin", "cetirizine", "ciprofloxacin"]:
                if candidate in query_text.lower() and candidate not in [m.lower() for m in med_terms]:
                    med_terms.append(candidate)

            if med_terms:
                for m in med_terms:
                    stock = mongo_manager.check_medicine_stock(m, district=district)
                    if stock:
                        context_bundle["medicine_stock"].extend(stock)
                        if "MongoDB: healthcare_db.hospitalmedicines" not in context_bundle["sources"]:
                            context_bundle["sources"].append("MongoDB: healthcare_db.hospitalmedicines")
            elif intent == "MEDICINE_QUERY":
                med_list = mongo_manager.search_medicines(limit=5)
                context_bundle["medicines"].extend(med_list)
                if med_list and "MongoDB: healthcare_db.medicines" not in context_bundle["sources"]:
                    context_bundle["sources"].append("MongoDB: healthcare_db.medicines")

        # 4. Hospital Services lookup
        if intent == "HOSPITAL_SERVICE" or entities.get("services") or any(w in query_text.lower() for w in ["service", "maternal", "gynecology", "opd", "child care", "x-ray", "icu"]):
            service_terms = list(entities.get("services", []))
            for cand in ["maternal care", "maternal", "gynecology", "general opd", "opd", "child care", "x-ray", "icu", "immunization", "orthopedic"]:
                if cand in query_text.lower() and cand not in service_terms:
                    service_terms.append(cand)

            for sq in (service_terms or [query_text]):
                services = mongo_manager.search_hospital_services(service_query=sq)
                if services:
                    context_bundle["services"].extend(services)
                    if "MongoDB: healthcare_db.hospitalservices" not in context_bundle["sources"]:
                        context_bundle["sources"].append("MongoDB: healthcare_db.hospitalservices")

        # 5. Hospital Facility lookup (GPS + Context Aware)
        is_hospital_inquiry = (
            intent in ["HOSPITAL_QUERY", "EMERGENCY", "SYMPTOM_DIAGNOSIS"]
            or is_emergency
            or any(w in query_text.lower() for w in ["hospital", "hospitals", "phc", "chc", "near", "nearest", "nearby", "najik", "doctor", "admit", "bed", "emergency"])
        )

        if is_hospital_inquiry:
            emergency_only = is_emergency or intent == "EMERGENCY"
            hospitals = []

            # Priority 1: If user explicitly mentions a city, district, or hospital name in their query
            if district or any(name_hint in query_text.lower() for name_hint in ["civil", "mehta", "sola", "lg", "ssg", "pdu", "mansa", "kalol", "pethapur", "ikdrc", "gcri"]):
                hospitals = mongo_manager.search_hospitals(
                    query=query_text if intent not in ["SYMPTOM_DIAGNOSIS", "EMERGENCY"] else None,
                    district=district,
                    emergency_only=emergency_only,
                    limit=3
                )
                # If user GPS is available, attach calculated distances to each matching hospital
                if latitude is not None and longitude is not None:
                    for h in hospitals:
                        h_lat = h.get("latitude") or (h.get("coordinates") or {}).get("lat")
                        h_lng = h.get("longitude") or (h.get("coordinates") or {}).get("lng")
                        if h_lat and h_lng:
                            dist = mongo_manager.find_nearby_hospitals(lat=latitude, lng=longitude, limit=1)
                            # Compute individual distance
                            from database.mongo_manager import calculate_haversine_distance
                            d_km = round(calculate_haversine_distance(latitude, longitude, h_lat, h_lng), 1)
                            h["distanceKm"] = d_km
                            h["distance_str"] = f"{d_km} km"

            # Priority 2: If user asks for nearest/nearby facilities or emergency with live GPS coords
            if not hospitals and latitude is not None and longitude is not None:
                hospitals = mongo_manager.find_nearby_hospitals(lat=latitude, lng=longitude, limit=3)

            # Priority 3: Fallback general hospital search
            if not hospitals:
                hospitals = mongo_manager.search_hospitals(query=query_text, district=district, limit=3)

            if not hospitals:
                hospitals = mongo_manager.search_hospitals(limit=3)

            context_bundle["hospitals"].extend(hospitals)
            if hospitals and "MongoDB: healthcare_db.hospitals" not in context_bundle["sources"]:
                context_bundle["sources"].append("MongoDB: healthcare_db.hospitals")


        # 6. Patient EHR lookup
        pid = entities.get("patient_id") or user_id
        if pid and (intent == "PATIENT_HISTORY" or "history" in query_text.lower() or "allergy" in query_text.lower()):
            record = mongo_manager.get_patient_records(pid)
            if record:
                context_bundle["patient_record"] = record
                context_bundle["sources"].append("MongoDB: healthcare_demo.patienthistories")

        # Deduplicate sources
        context_bundle["sources"] = list(dict.fromkeys(context_bundle["sources"]))
        return context_bundle

    def generate_response(
        self,
        user_query: str,
        image: Optional[str] = None,
        user_id: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
        session_id: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Complete pipeline execution: query understanding -> multimodal vision / retrieval -> Gemini reasoning -> structured response.
        Incorporates recent conversation history for multi-turn conversational memory and context resolution.
        """
        t0 = time.perf_counter()

        # Step 1: Query analysis with multi-turn context
        analysis = intent_extractor.analyze(user_query, user_id=user_id, history=history)
        intent = analysis["intent"]
        is_emergency = analysis["is_emergency"]

        has_gujarati = any(0x0A80 <= ord(char) <= 0x0AFF for char in user_query)

        # Step 2: Handle greetings, acknowledgments, thanks, closures and non-healthcare queries immediately
        if not image:
            if intent == "GREETING":
                if has_gujarati:
                    greeting_text = (
                        "નમસ્તે! હું **આરોગ્યમિત્ર AI** છું — તમારો ગુજરાત ડિજિટલ આરોગ્ય સહાયક.\n\n"
                        "હું તમારા સ્વાસ્થ્ય લક્ષણો સમજવામાં, નજીકના સરકારી દવાખાના/હોસ્પિટલ શોધવામાં અને જરૂરી માર્ગદર્શન આપવામાં મદદ કરી શકું છું.\n\n"
                        "આજે હું આપને કેવી રીતે સહાય કરી શકું? કૃપા કરીને તમારી તકલીફ અથવા લક્ષણો જણાવો.\n\n"
                        "> ⚠️ **તબીબી ચેતવણી**: હું એક AI ચેટબોટ છું, વાસ્તવિક ડૉક્ટર નથી. સચોટ નિદાન અને સારવાર માટે હંમેશા લાયકાત ધરાવતા ડૉક્ટરની સલાહ લો."
                    )
                else:
                    greeting_text = (
                        "Hello! I am **AarogyaMitra AI**, your healthcare information and triage assistant.\n\n"
                        "I am here to help you understand symptoms, find nearby verified government healthcare centers, check medicine stock, and guide you safely.\n\n"
                        "To assist you better, could you please describe what symptoms or health questions you have today?\n\n"
                        "> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor. For accurate diagnosis and personalized prescriptions, always consult a qualified healthcare professional."
                    )
                return {
                    "answer": greeting_text,
                    "intent": "GREETING",
                    "sources": [],
                    "confidence": None,
                    "retrievedContext": {},
                    "actions": {
                        "nearest_hospitals": False,
                        "nearest_medical_stores": False,
                        "talk_to_doctor": False
                    },
                    "is_emergency": False,
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2)
                }

            if intent == "ACKNOWLEDGMENT":
                if has_gujarati:
                    ack_text = (
                        "સમજાઈ ગયું તે જાણીને આનંદ થયો! 😊\n\n"
                        "જો તમને કોઈ અન્ય શારીરિક તકલીફ હોય, દવાઓ વિશે પૂછવું હોય અથવા નજીકના ડૉક્ટરની મુલાકાત લેવી હોય, તો મને જરૂર જણાવો.\n\n"
                        "તમારી કાળજી રાખજો અને સ્વસ્થ રહો! 🌿"
                    )
                else:
                    ack_text = (
                        "Glad to hear that! 😊\n\n"
                        "If you have any other symptoms, need guidance on medicines, or wish to locate nearby government health centers, please feel free to ask anytime.\n\n"
                        "Take good care of yourself and stay healthy! 🌿"
                    )
                return {
                    "answer": ack_text,
                    "intent": "ACKNOWLEDGMENT",
                    "sources": [],
                    "confidence": None,
                    "retrievedContext": {},
                    "actions": {
                        "nearest_hospitals": False,
                        "nearest_medical_stores": False,
                        "talk_to_doctor": False
                    },
                    "is_emergency": False,
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2)
                }

            if intent == "GRATITUDE":
                if has_gujarati:
                    grat_text = (
                        "તમારો ખૂબ ખૂબ આભાર! 🙏\n\n"
                        "તમારી સેવા કરવી અને યોગ્ય આરોગ્ય માર્ગદર્શન આપવું એ મારી પ્રાથમિકતા છે. ભવિષ્યમાં પણ કોઈપણ સ્વાસ્થ્ય પ્રશ્ન હોય તો હું હંમેશા હાજર છું.\n\n"
                        "સ્વસ્થ રહો અને કાળજી રાખજો! 🌿"
                    )
                else:
                    grat_text = (
                        "You are most welcome! 🙏\n\n"
                        "I am always here to assist you with healthcare navigation, symptoms understanding, and medical safety. Please feel free to reach out anytime.\n\n"
                        "Wishing you the very best of health! 🌿"
                    )
                return {
                    "answer": grat_text,
                    "intent": "GRATITUDE",
                    "sources": [],
                    "confidence": None,
                    "retrievedContext": {},
                    "actions": {
                        "nearest_hospitals": False,
                        "nearest_medical_stores": False,
                        "talk_to_doctor": False
                    },
                    "is_emergency": False,
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2)
                }

            if intent == "CLOSURE":
                if has_gujarati:
                    close_text = (
                        "આવજો! 🌟\n\n"
                        "તમારા સ્વાસ્થ્યમાં ઝડપી સુધારો થાય અને તમે હંમેશા નિરોગી રહો તેવી શુભેચ્છાઓ. જ્યારે પણ જરૂર પડે ત્યારે ફરીથી સંપર્ક કરજો. કાળજી રાખજો! 🌿"
                    )
                else:
                    close_text = (
                        "Goodbye and take care! 🌟\n\n"
                        "Wishing you good health, safety, and a quick recovery. Whenever you need healthcare guidance, AarogyaMitra AI is always here for you. Stay well! 🌿"
                    )
                return {
                    "answer": close_text,
                    "intent": "CLOSURE",
                    "sources": [],
                    "confidence": None,
                    "retrievedContext": {},
                    "actions": {
                        "nearest_hospitals": False,
                        "nearest_medical_stores": False,
                        "talk_to_doctor": False
                    },
                    "is_emergency": False,
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2)
                }

            if intent == "SYMPTOM_DIAGNOSIS" and len(history or []) <= 1 and not analysis["entities"].get("duration") and not is_emergency:
                sym_list = analysis["entities"].get("symptoms", [])
                sym_text = ", ".join(sym_list) if sym_list else "health discomfort"
                
                if has_gujarati:
                    triage_text = (
                        f"હું સમજું છું કે આપને **{sym_text}** ની તકલીફ જણાય છે. આપની સ્થિતિનું યોગ્ય મૂલ્યાંકન કરવા માટે:\n\n"
                        f"1. **આ લક્ષણ કેટલા સમયથી (કેટલા દિવસ કે કલાકથી) છે?**\n"
                        f"2. **તકલીફ સામાન્ય (mild), મધ્યમ (moderate) કે વધારે (severe) છે?**\n"
                        f"3. **આ સાથે અન્ય કોઈ વધારાના લક્ષણો (જેમ કે ઉધરસ, ઊલટી, ગળામાં દુખાવો કે ચક્કર) છે?**\n\n"
                        f"કૃપા કરીને વિગત જણાવો જેથી હું આપને સચોટ સલાહ આપી શકું.\n\n"
                        f"> ⚠️ **તબીબી ચેતવણી**: હું એક AI સહાયક છું, વાસ્તવિક ડૉક્ટર નથી. સચોટ નિદાન માટે નજીકના આરોગ્ય કેન્દ્ર અથવા ડૉક્ટરનો સંપર્ક કરો."
                    )
                else:
                    triage_text = (
                        f"I understand you are experiencing **{sym_text}**. To help assess your condition properly:\n\n"
                        f"1. **How long have you had this symptom (e.g., hours or days)?**\n"
                        f"2. **Is the discomfort mild, moderate, or severe?**\n"
                        f"3. **Do you have any other accompanying symptoms (such as body ache, cough, nausea, or dizziness)?**\n\n"
                        f"Please reply with these details so I can guide you safely.\n\n"
                        f"> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor. For personalized diagnosis, please consult a qualified physician."
                    )
                return {
                    "answer": triage_text,
                    "intent": "SYMPTOM_DIAGNOSIS",
                    "sources": ["ML: AarogyaMitra Clinical Triage Protocol"],
                    "confidence": None,
                    "retrievedContext": {},
                    "actions": {
                        "nearest_hospitals": False,
                        "nearest_medical_stores": False,
                        "talk_to_doctor": False
                    },
                    "is_emergency": False,
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2)
                }

            if intent == "IRRELEVANT":
                return {
                    "answer": (
                        "### Assessment\n"
                        "Your query does not appear to be related to healthcare or medical assistance.\n\n"
                        "### What You Can Do\n"
                        "I am specialized exclusively as the AarogyaMitra AI Healthcare Assistant to help you with symptoms triage, nearby hospitals, medicine inventory, and verified health guidance.\n\n"
                        "Please ask any health-related question or describe your symptoms to begin.\n\n"
                        "> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor."
                    ),
                    "intent": "IRRELEVANT",
                    "sources": [],
                    "confidence": None,
                    "retrievedContext": {},
                    "actions": {
                        "nearest_hospitals": False,
                        "nearest_medical_stores": False,
                        "talk_to_doctor": False
                    },
                    "is_emergency": False,
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2)
                }

        # Step 3: Retrieval (GPS location-aware)
        context = self.retrieve_context(analysis, user_id=user_id, latitude=latitude, longitude=longitude)

        # Step 4: Construct prompt for Gemini (Text or Multimodal Vision)
        image_part = None
        if image:
            try:
                raw_b64 = image
                mime_type = "image/jpeg"
                if "base64," in image:
                    header, raw_b64 = image.split("base64,", 1)
                    if "image/png" in header:
                        mime_type = "image/png"
                    elif "image/webp" in header:
                        mime_type = "image/webp"
                img_bytes = base64.b64decode(raw_b64.strip())
                image_part = types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
                logger.info(f"Decoded visual image attachment: {len(img_bytes)} bytes, mime={mime_type}")
            except Exception as img_err:
                logger.warning(f"Failed to decode image attachment: {img_err}")

        if image_part:
            lang_instruction = "Respond in fluent, compassionate Gujarati (ગુજરાતી)" if has_gujarati else "Respond in clear, professional English"
            prompt_content = f"""You are AarogyaMitra AI, an expert clinical healthcare triage and visual assessment assistant.
The patient attached a healthcare visual record (such as an open wound / laceration / bleeding cut / skin lesion / rash / prescription / lab report).

USER MESSAGE: "{user_query}"

INSTRUCTIONS:
1. Carefully inspect the attached image and describe the visual findings accurately.
2. If it is a WOUND / CUT / LACERATION:
   - Identify the nature of injury (e.g. cut on hand/skin, open laceration, bleeding status, wound edges).
   - Provide immediate first aid steps:
     * Apply gentle, firm pressure with a clean sterile cloth/gauze to stop bleeding.
     * Clean the wound with clean water or normal saline.
     * Apply an antiseptic (povidone-iodine / Betadine) and dress with a sterile bandage.
     * Avoid applying unsterile substances (turmeric, mud, ash).
   - Tetanus Toxoid (TT) Alert: Advise receiving a Tetanus booster (TT injection) within 24-48 hours if last dose was over 5 years ago.
   - Suture / Stitches & Red Flag: If the wound is deep, gaping, bleeding won't stop after 10 mins of pressure, or numbness occurs, advise going to the nearest hospital General Surgery / Trauma OPD immediately.
3. If it is a PRESCRIPTION or REPORT:
   - Transcribe medication names, dosages, timings, precautions, or lab test interpretations clearly.
4. If it is a SKIN RASH / DERMATOLOGY:
   - Describe visible symptoms and suggest consulting Dermatology / General Medicine OPD.
5. LANGUAGE REQUIREMENT: {lang_instruction}.
6. Structure with clean markdown headers:
   ### 📸 Visual Assessment
   ### 🩺 First Aid & Clinical Guidance
   ### ⚠️ Critical Precautions & Tetanus Warning
   ### 🏥 Recommended Hospital Department

Include standard medical disclaimer at the end."""
            contents_payload = [prompt_content, image_part]
        else:
            prompt_content = self._build_gemini_prompt(user_query, analysis, context, history=history)
            contents_payload = prompt_content

        # Step 5: Generate response via Gemini (with fast model fallback)
        answer = None
        if self.genai_client:
            models_to_try = [self.model_name] + [m for m in FALLBACK_MODELS if m != self.model_name]
            for candidate_model in models_to_try:
                try:
                    response = self.genai_client.models.generate_content(
                        model=candidate_model,
                        contents=contents_payload,
                        config=types.GenerateContentConfig(
                            temperature=0.2,
                            top_p=0.8,
                            max_output_tokens=600
                        )
                    )
                    answer = response.text.strip()
                    if answer:
                        break
                except Exception as e:
                    logger.warning(f"Model {candidate_model} failed ({e}); attempting next fallback if available...")

        # Fallback if Gemini fails or is unreachable
        if not answer:
            answer = self._generate_grounded_fallback(user_query, analysis, context, history=history, has_image=bool(image))

        # Extract [ACTIONS] block cleanly
        actions_dict = {
            "nearest_hospitals": bool(is_emergency or bool(image) or intent in ["HOSPITAL_QUERY", "EMERGENCY"] or (context.get("hospitals") and intent not in ["GREETING", "GENERAL_HEALTHCARE"])),
            "nearest_medical_stores": bool(context.get("medicine_stock") or intent == "MEDICINE_QUERY" or bool(image)),
            "talk_to_doctor": bool(is_emergency or bool(image) or intent in ["EMERGENCY", "SYMPTOM_DIAGNOSIS"])
        }

        if "[ACTIONS]" in answer:
            parts = answer.split("[ACTIONS]")
            answer = parts[0].strip()
            actions_raw = parts[1].strip()
            # Extract JSON block from actions_raw
            json_match = re.search(r"\{[\s\S]*?\}", actions_raw)
            if json_match:
                try:
                    parsed_act = json.loads(json_match.group(0))
                    for k in ["nearest_hospitals", "nearest_medical_stores", "talk_to_doctor"]:
                        if k in parsed_act:
                            actions_dict[k] = bool(parsed_act[k])
                except Exception:
                    pass

        # Enforce mandatory medical AI disclaimer
        answer = self._ensure_medical_disclaimer(answer, user_query)

        # Compute highest confidence from ML if applicable
        confidence = None
        if context.get("ml_predictions") and context["ml_predictions"].get("top_predictions"):
            confidence = context["ml_predictions"]["top_predictions"][0]["confidence"]

        latency_ms = round((time.perf_counter() - t0) * 1000, 2)

        # Sanitize retrieved context for JSON serialization
        serialized_context = self._serialize_context(context)

        return {
            "answer": answer,
            "intent": "PHOTO_ANALYSIS" if image else intent,
            "sources": context["sources"],
            "confidence": confidence,
            "retrievedContext": serialized_context,
            "actions": actions_dict,
            "is_emergency": is_emergency,
            "latency_ms": latency_ms
        }

    def _ensure_medical_disclaimer(self, answer: str, user_query: str) -> str:
        """Ensure all assistant answers contain a prominent medical disclaimer without appending duplicate blocks."""
        if not answer:
            return answer

        has_gujarati = any(0x0A80 <= ord(char) <= 0x0AFF for char in (user_query + answer))

        disclaimer_markers = [
            "medical disclaimer", "disclaimer", "તબીબી ચેતવણી", "અસ્વીકરણ",
            "ai chatbot", "ai ચેટબોટ", "not a doctor", "ડૉક્ટર નથી", "consult a doctor"
        ]
        
        has_disclaimer = any(marker in answer.lower() for marker in disclaimer_markers)
        if not has_disclaimer:
            if has_gujarati:
                disclaimer_text = (
                    "\n\n> ⚠️ **તબીબી ચેતવણી (Medical Disclaimer)**: હું એક AI ચેટબોટ છું અને વાસ્તવિક ડૉક્ટર નથી. "
                    "AI દ્વારા મળતી માહિતી ૧૦૦% સચોટ કે સંપૂર્ણ ન પણ હોઈ શકે. "
                    "સચોટ નિદાન, યોગ્ય દવાઓ અને વ્યક્તિગત સારવાર માટે કૃપા કરીને હંમેશા લાયકાત ધરાવતા ડૉક્ટર અથવા નજીકના આરોગ્ય કેન્દ્રનો સંપર્ક કરવો."
                )
            else:
                disclaimer_text = (
                    "\n\n> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor. "
                    "Information provided by AI may not be 100% accurate or complete. "
                    "For an accurate clinical diagnosis, personalized medical advice, prescriptions, or urgent care, please always consult a qualified doctor or healthcare professional."
                )
            return answer.strip() + disclaimer_text

        return answer.strip()

    def _build_gemini_prompt(
        self,
        user_query: str,
        analysis: Dict[str, Any],
        context: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Construct structured prompt with system instructions, conversation history, context, and query."""
        context_json = json.dumps(self._serialize_context(context), indent=2)

        history_section = ""
        if history and isinstance(history, list) and len(history) > 0:
            formatted_turns = []
            for h in history[-6:]:
                role = "User" if h.get("role") in ["user", "human"] else "Assistant"
                content = h.get("content", "").strip()
                if content:
                    if len(content) > 400:
                        content = content[:400] + "..."
                    formatted_turns.append(f"{role}: {content}")
            if formatted_turns:
                history_section = (
                    "==================================================\n"
                    "CONVERSATION HISTORY (RECENT TURNS - USE FOR CONTEXT & TRIAGE FLOW):\n"
                    + "\n".join(formatted_turns) + "\n"
                )

        return f"""{SYSTEM_INSTRUCTION}

{history_section}==================================================
USER CURRENT QUERY:
"{user_query}"

ANALYSIS METADATA:
- Detected Intent: {analysis['intent']}
- Extracted Entities: {json.dumps(analysis['entities'])}
- Emergency Red Flag Detected: {analysis['is_emergency']}
- Red Flag Reasons: {analysis['emergency_reasons']}

GROUNDED DATABASE CONTEXT FROM MONGODB & ML:
<database_context>
{context_json}
</database_context>
==================================================

INSTRUCTIONS FOR THIS TURN:
1. If the user reported a symptom and information is missing (duration, severity, location, or associated signs) and NO red-flag emergency:
   - Ask ONE single logical, polite triage question. Do NOT jump to conclusions or disease name.
   - Set [ACTIONS] all false.
2. If red-flag emergency symptoms are present:
   - Stop questioning and immediately provide emergency instructions (call 108 / visit nearest emergency facility).
   - Set nearest_hospitals: true, talk_to_doctor: true.
3. If enough information has been collected across previous turns:
   - Provide the complete 5-section response (### Assessment, ### Possible Causes, ### What You Can Do, ### Avoid / Do Not Do, ### When to See a Doctor).
   - Include the medical disclaimer and appropriate [ACTIONS] block at the very end.
"""

    def _generate_grounded_fallback(
        self,
        query: str,
        analysis: Dict[str, Any],
        context: Dict[str, Any],
        history: Optional[List[Dict[str, str]]] = None,
        has_image: bool = False
    ) -> str:
        """Deterministic, grounded template fallback in case of Gemini unavailability."""
        intent = analysis["intent"]
        is_emergency = analysis["is_emergency"]
        symptoms = analysis["entities"].get("symptoms", [])
        has_gujarati = any(0x0A80 <= ord(char) <= 0x0AFF for char in query)

        # Visual Image Assessment Fallback
        if has_image or "ફોટો" in query or "photo" in query.lower() or "image" in query.lower():
            if has_gujarati:
                return (
                    "### 📸 તબીબી ફોટો આકારણી (Clinical Visual Review)\n"
                    "જોડાયેલ આરોગ્યસંભાળ ફોટોગ્રાફનું પ્રારંભિક તબીબી વિશ્લેષણ:\n\n"
                    "### 🩺 દ્રશ્ય તારણો અને પ્રાથમિક સારવાર (First Aid)\n"
                    "• **સ્થિતિ**: ત્વચા પર ઘા / કટ (Laceration / Skin Injury) ની સ્થિતિ જણાય છે.\n"
                    "• **તાત્કાલિક પગલાં**:\n"
                    "  1. રક્તસ્રાવ રોકવા માટે સ્વચ્છ, જંતુમુક્ત કપડા કે ગોઝ વડે ઘા પર હળવું દબાણ આપો.\n"
                    "  2. ઘાને સ્વચ્છ પાણી અથવા નોર્મલ સલાઇન વડે સાફ કરો.\n"
                    "  3. પોવિડોન-આયોડિન (Povidone-Iodine / Betadine) એન્ટિસેપ્ટિક લગાવી પાટો બાંધો.\n"
                    "  4. ઘા પર હળદર, માટી, પાવડર કે અન્ય અસ્વચ્છ વસ્તુઓ ન લગાવો.\n\n"
                    "### ⚠️ ટીટનેસ અને રેડ ફ્લેગ ચેતવણી\n"
                    "• જો ધનુર્વા (TT) નું ઇન્જેક્શન લીધાને ૫ વર્ષથી વધુ સમય થયો હોય, તો ૨૪ કલાકમાં નજીકના આરોગ્ય કેન્દ્રમાંથી TT નું ઇન્જેક્શન લો.\n"
                    "• જો ઘા ઊંડો હોય, ટાંકા (stitches) ની જરૂર હોય, અથવા લોહી બંધ ન થતું હોય, તો તાત્કાલિક નજીકની સરકારી હોસ્પિટલમાં જનરલ સર્જરી/કેઝ્યુઅલ્ટીમાં બતાવો.\n\n"
                    "### 🏥 ભલામણ કરેલ વિભાગ: **જનરલ સર્જરી OPD / ૨૪x૭ કેઝ્યુઅલ્ટી**"
                )
            else:
                return (
                    "### 📸 Clinical Visual Review\n"
                    "Preliminary clinical triage for the attached healthcare visual record:\n\n"
                    "### 🩺 Visual Findings & Immediate First Aid\n"
                    "• **Condition**: Visible skin laceration / wound requiring proper antiseptic care.\n"
                    "• **Immediate Action Steps**:\n"
                    "  1. Apply direct, gentle pressure with a clean sterile cloth or gauze to control bleeding.\n"
                    "  2. Gently cleanse the area with clean water or sterile saline.\n"
                    "  3. Apply an approved antiseptic (such as Povidone-Iodine / Betadine) and dress with a sterile bandage.\n"
                    "  4. Do NOT apply unsterile traditional substances (turmeric, ash, or mud).\n\n"
                    "### ⚠️ Tetanus Toxoid (TT) & Clinical Red Flags\n"
                    "• If your last Tetanus (TT) shot was over 5 years ago, obtain a booster injection within 24-48 hours.\n"
                    "• If the cut is deep (gaping, requires stitches), bleeding persists after 10 mins of pressure, or numbness occurs, visit the Emergency / General Surgery OPD immediately.\n\n"
                    "### 🏥 Recommended Department: **General Surgery OPD / 24x7 Emergency Trauma**"
                )

        # If user reported a single new symptom and no duration or severity is known, ask ONE triage question
        has_duration = bool(analysis["entities"].get("duration"))
        if intent == "SYMPTOM_DIAGNOSIS" and symptoms and not has_duration and not is_emergency:
            s_name = symptoms[0]
            if has_gujarati:
                return (
                    f"હું સમજી શકું છું કે તમને {s_name} ની તકલીફ છે. "
                    f"યોગ્ય મૂલ્યાંકન કરવા માટે, કૃપા કરીને જણાવો કે આ તકલીફ કેટલા દિવસથી છે, અને તે સામાન્ય, મધ્યમ કે ગંભીર છે?"
                )
            return (
                f"I understand you are experiencing {s_name}. "
                f"To help assess this properly, how many days have you had this symptom, and is it mild, moderate, or severe?"
            )

        # Assessment
        assessment = f"Based on the reported symptoms ({', '.join(symptoms) if symptoms else query}), here is an initial preliminary health evaluation."

        # Possible causes
        poss_lines = []
        if context.get("ml_predictions"):
            preds = context["ml_predictions"].get("top_predictions", [])
            for p in preds[:3]:
                poss_lines.append(f"• **{p['disease'].title()}** (Supporting ML match: ~{p['confidence_percent']})")
        else:
            poss_lines.append("• Common viral or environmental health conditions")
            poss_lines.append("• Routine clinical symptoms requiring in-person evaluation")
        poss_causes = "\n".join(poss_lines)

        # What you can do
        what_to_do = (
            "- Get adequate physical rest and maintain hydration.\n"
            "- Monitor body temperature and note any changing symptoms.\n"
            "- Eat light, easily digestible food."
        )

        # Avoid / Do Not Do
        avoid_do = (
            "- Do not self-start antibiotics or unprescribed medicines.\n"
            "- Do not ignore worsening or sudden new symptoms.\n"
            "- Do not delay seeking medical care if severe pain or breathing difficulty occurs."
        )

        # When to see a doctor
        when_doctor = (
            "Visit your local Primary Health Centre (PHC), Community Health Centre (CHC), or district hospital if symptoms persist beyond 2-3 days, or immediately if red-flag signs appear."
        )

        # Relevant hospital GPS info if available
        hosp_info = ""
        if context.get("hospitals"):
            h = context["hospitals"][0]
            dist_str = f" ({h['distanceKm']} km away)" if h.get("distanceKm") is not None else ""
            hosp_info = f"\n\n**Nearest Facility**: {h['name']}{dist_str}, {h.get('address', '')} | Contact: {h.get('phone', '108')}"

        emergency_block = ""
        if is_emergency:
            emergency_block = (
                "\n\n> 🚨 **URGENT MEDICAL WARNING**: Your symptoms suggest a potential medical emergency. "
                "Please call 108 immediately or proceed to the nearest emergency trauma center."
            )

        return (
            f"### Assessment\n{assessment}\n\n"
            f"### Possible Causes\n{poss_causes}\n\n"
            f"### What You Can Do\n{what_to_do}\n\n"
            f"### Avoid / Do Not Do\n{avoid_do}\n\n"
            f"### When to See a Doctor\n{when_doctor}{hosp_info}"
            f"{emergency_block}\n\n"
            "> ⚠️ **Medical Disclaimer**: I am an AI chatbot, not a licensed medical doctor. "
            "For an accurate diagnosis and treatment, please consult a qualified healthcare professional.\n\n"
            "[ACTIONS]\n"
            "{\n"
            f'  "nearest_hospitals": {str(bool(is_emergency or context.get("hospitals"))).lower()},\n'
            f'  "nearest_medical_stores": {str(bool(context.get("medicine_stock"))).lower()},\n'
            f'  "talk_to_doctor": {str(bool(is_emergency or intent == "SYMPTOM_DIAGNOSIS")).lower()}\n'
            "}"
        )

    def _serialize_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB ObjectIds and complex structures into JSON-serializable primitives."""
        def sanitize(obj):
            if isinstance(obj, dict):
                return {k: sanitize(v) for k, v in obj.items() if k != "_id"}
            elif isinstance(obj, list):
                return [sanitize(elem) for elem in obj]
            elif hasattr(obj, "isoformat"):
                return obj.isoformat()
            return obj
        return sanitize(context)

rag_engine = HealthcareRAGEngine()

if __name__ == "__main__":
    print("Testing AarogyaMitra Healthcare RAG Engine...")
    test_q = "I have a fever"
    resp = rag_engine.generate_response(test_q)
    print("\n--- Response ---")
    print(resp["answer"])
    print("\nSources:", resp["sources"])
    print("Latency:", resp["latency_ms"], "ms")
