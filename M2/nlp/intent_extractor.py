"""
Healthcare Query Understanding, Intent Classification, and Entity Extraction Engine.
Analyzes user natural language queries, extracts clinical entities (symptoms, diseases,
medicines, hospitals, services, patient IDs), identifies triage emergencies, and flags irrelevant topics.
"""

import os
import re
import json
import logging
from typing import Dict, List, Any, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEXICON_PATH = os.path.join(BASE_DIR, "data_pipeline", "symptom_lexicon.json")
KB_PATH = os.path.join(BASE_DIR, "data_pipeline", "disease_knowledge_base.json")

# Emergency red flag keywords and patterns
EMERGENCY_TRIGGERS = [
    r"\b(crushing|severe|sharp)\s+(chest\s+pain|chest\s+tightness)\b",
    r"\b(cannot\s+breathe|severe\s+shortness\s+of\s+breath|gasping\s+for\s+air|suffocating)\b",
    r"\b(coughing\s+up\s+blood|vomiting\s+blood|blood\s+in\s+vomit|hematemesis|hemoptysis)\b",
    r"\b(slurred\s+words|slurring\s+words|facial\s+droop|face\s+paralysis|arm\s+weakness\s+on\s+one\s+side)\b",
    r"\b(unconscious|passed\s+out|fainted\s+and\s+unresponsive|loss\s+of\s+consciousness)\b",
    r"\b(anaphylaxis|severe\s+allergic\s+reaction|throat\s+swelling\s+shut)\b",
    r"(છાતીમાં\s+દુખાવો|છાતીમાં\s+તીવ્ર\s+દુખાવો|છાતી\s+ભીંચાય\s+છે)",
    r"(શ્વાસ\s+નથી\s+લઈ\s+શકાતો|શ્વાસ\s+લેવામાં\s+ભારે\s+તકલીફ|દમ\s+ઘૂંટાય\s+છે|શ્વાસ\s+રૂંધાય)",
    r"(લોહીની\s+ઉલટી|ઉધરસમાં\s+લોહી)",
    r"(બેભાન|બેહોશ|ભાન\s+ગુમાવ્યું)",
    r"(લકવા|મોઢું\s+વાંકું)"
]

# Non-healthcare filter keywords
NON_HEALTHCARE_KEYWORDS = [
    "cricket", "football", "match", "movie", "song", "poem", "joke", "weather forecast",
    "ipl", "politics", "president", "bitcoin", "crypto", "stock market", "code a game"
]

class IntentExtractor:
    """Natural language query analyzer for healthcare domains."""

    def __init__(self, lexicon_path: str = LEXICON_PATH, kb_path: str = KB_PATH):
        self.canonical_symptoms = []
        self.synonym_map = {}
        self.known_diseases = []
        self.known_medicines = [
            "paracetamol", "amoxicillin", "ors", "oral rehydration salts",
            "metformin", "cetirizine", "amlodipine", "azithromycin",
            "ibuprofen", "pantoprazole", "insulin", "ciprofloxacin"
        ]
        self.known_services = [
            "general opd", "opd", "maternal care", "gynecology", "child care",
            "pediatrics", "emergency", "trauma", "x-ray", "radiology",
            "immunization", "orthopedic", "icu", "pathology", "blood bank"
        ]
        self.known_facilities = [
            "phc", "chc", "hospital", "clinic", "gondal", "jetpur", "rajkot",
            "civil hospital", "pdu", "sub center", "mavdi", "district hospital"
        ]
        self._load_lexicon(lexicon_path, kb_path)

    def _load_lexicon(self, lexicon_path: str, kb_path: str):
        if os.path.exists(lexicon_path):
            with open(lexicon_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.canonical_symptoms = data.get("canonical_symptoms", [])
                self.synonym_map = data.get("synonym_map", {})

        if os.path.exists(kb_path):
            with open(kb_path, "r", encoding="utf-8") as f:
                kb_data = json.load(f)
                self.known_diseases = list(kb_data.keys())

    def check_emergency(self, query: str) -> tuple[bool, List[str]]:
        """Detect critical red-flag emergency symptoms."""
        q_lower = query.lower()
        red_flags = []
        for pattern in EMERGENCY_TRIGGERS:
            match = re.search(pattern, q_lower)
            if match:
                red_flags.append(match.group(0))
        return len(red_flags) > 0, red_flags

    def extract_symptoms(self, query: str) -> List[str]:
        """Extract matching symptoms using exact, n-gram, and synonym mapping (supporting Gujarati & English)."""
        q_lower = query.lower()
        detected = set()

        # Check synonyms first
        for canonical, syns in self.synonym_map.items():
            for syn in syns:
                syn_lower = syn.lower()
                # If term contains non-ASCII characters (e.g. Gujarati), use simple containment
                if any(ord(char) > 127 for char in syn_lower):
                    if syn_lower in q_lower:
                        detected.add(canonical)
                        break
                else:
                    if re.search(r"\b" + re.escape(syn_lower) + r"\b", q_lower):
                        detected.add(canonical)
                        break

        # Check canonical symptoms
        for sym in self.canonical_symptoms:
            sym_lower = sym.lower()
            if any(ord(char) > 127 for char in sym_lower):
                if sym_lower in q_lower:
                    detected.add(sym)
            else:
                if re.search(r"\b" + re.escape(sym_lower) + r"\b", q_lower):
                    detected.add(sym)

        return sorted(list(detected))

    def extract_duration(self, query: str) -> Optional[str]:
        """Extract illness duration from query (e.g. '3 days', 'ત્રણ દિવસથી', '2 weeks')."""
        # Gujarati duration patterns
        guj_num_map = {"એક": "1", "બે": "2", "ત્રણ": "3", "ચાર": "4", "પાંચ": "5", "છ": "6", "સાત": "7"}
        for g_num, d_val in guj_num_map.items():
            if f"{g_num} દિવસ" in query or f"{g_num} દિવસથી" in query:
                return f"{d_val} days"

        m = re.search(r"(\d+)\s*(days?|weeks?|months?|દિવસે|દિવસથી)", query, re.IGNORECASE)
        if m:
            return f"{m.group(1)} {m.group(2)}"
        return None


    def extract_diseases(self, query: str) -> List[str]:
        """Extract matching disease names."""
        q_lower = query.lower()
        matched = []
        for d in self.known_diseases:
            if len(d) > 3 and re.search(r"\b" + re.escape(d) + r"\b", q_lower):
                matched.append(d)
        return matched

    def extract_medicines(self, query: str) -> List[str]:
        """Extract medicine names."""
        q_lower = query.lower()
        matched = []
        for m in self.known_medicines:
            if re.search(r"\b" + re.escape(m) + r"\b", q_lower):
                matched.append(m)
        return matched

    def extract_services(self, query: str) -> List[str]:
        """Extract hospital medical services."""
        q_lower = query.lower()
        matched = []
        for s in self.known_services:
            if re.search(r"\b" + re.escape(s) + r"\b", q_lower):
                matched.append(s)
        return matched

    def extract_patient_id(self, query: str) -> Optional[str]:
        """Extract patient ID format (PAT-XXXX or ABHA-XXXX-XXXX-XXXX)."""
        pat_match = re.search(r"\b(PAT-\d{3,5})\b", query, re.IGNORECASE)
        if pat_match:
            return pat_match.group(1).upper()

        abha_match = re.search(r"\b(ABHA-[\d\-]+)\b", query, re.IGNORECASE)
        if abha_match:
            return abha_match.group(1).upper()

        return None

    def analyze(self, query: str, user_id: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Analyze user query, detect intent, extract entities, identify emergencies,
        and resolve multi-turn conversational references from recent chat history.
        """
        q_clean = query.strip()
        q_lower = q_clean.lower()

        # 1. Non-healthcare check (only for first turn or explicit non-health keywords)
        is_non_health = any(re.search(r"\b" + re.escape(kw) + r"\b", q_lower) for kw in NON_HEALTHCARE_KEYWORDS)
        if is_non_health and not any(m in q_lower for m in ["fever", "pain", "hospital", "doctor", "medicine", "dava", "bimar"]):
            return {
                "intent": "IRRELEVANT",
                "is_emergency": False,
                "emergency_reasons": [],
                "entities": {},
                "query": q_clean
            }

        # 2. Emergency check
        is_emergency, red_flags = self.check_emergency(q_clean)

        # 3. Entity extraction from current query
        extracted_symptoms = self.extract_symptoms(q_clean)
        extracted_diseases = self.extract_diseases(q_clean)
        extracted_medicines = self.extract_medicines(q_clean)
        extracted_services = self.extract_services(q_clean)
        extracted_pid = self.extract_patient_id(q_clean) or (user_id if (user_id and user_id.startswith("PAT-")) else None)

        # 4. Multi-Turn Context & Reference Resolution
        past_symptoms: List[str] = []
        past_medicines: List[str] = []
        past_diseases: List[str] = []
        past_facilities: List[str] = []
        past_pid: Optional[str] = None

        if history and isinstance(history, list):
            # Parse entities from recent history turns (newest to oldest)
            for turn in reversed(history[-6:]):
                content = turn.get("content", "")
                if not content:
                    continue
                if not past_medicines:
                    past_medicines = self.extract_medicines(content)
                if not past_diseases:
                    past_diseases = self.extract_diseases(content)
                if not past_pid:
                    past_pid = self.extract_patient_id(content)
                syms = self.extract_symptoms(content)
                for s in syms:
                    if s not in past_symptoms:
                        past_symptoms.append(s)

        # Check for referents/pronouns referring to previous turn
        medicine_referent_patterns = [
            r"\b(this|that|the|aa|te)\s+(medicine|tablet|drug|medication|dava)\b",
            r"\b(where\s+can\s+i\s+get\s+(it|this)|where\s+to\s+buy|is\s+it\s+available|stock\s+of\s+this)\b",
            r"\b(dosage|side\s+effects?|how\s+to\s+take|when\s+to\s+take|dava\s+kyathi)\b"
        ]
        has_medicine_referent = any(re.search(pat, q_lower) for pat in medicine_referent_patterns)

        facility_referent_patterns = [
            r"\b(this|that|the|aa|te)\s+(hospital|clinic|center|phc|chc)\b",
            r"\b(how\s+far|is\s+it\s+open|visiting\s+hours|opd\s+timings?|contact\s+number|phone)\b",
            r"\b(tya\s+javay|hospital\s+kyare\s+khule)\b"
        ]
        has_facility_referent = any(re.search(pat, q_lower) for pat in facility_referent_patterns)

        additive_symptom_patterns = [
            r"\b(and\s+also|also\s+have|now\s+i\s+have|started\s+having|along\s+with|along\s+with\s+that)\b",
            r"\b(ane\s+pan|pan\s+thai\s+chhe|have\s+...|saathe\s+saathe)\b"
        ]
        has_additive_symptom = any(re.search(pat, q_lower) for pat in additive_symptom_patterns)

        # Inherit medicine from history if referenced
        if (has_medicine_referent or ("medicine" in q_lower and not extracted_medicines)) and past_medicines:
            for med in past_medicines:
                if med not in extracted_medicines:
                    extracted_medicines.append(med)
            logger.info(f"Inherited medicines from history: {extracted_medicines}")

        # Merge symptoms if user is adding symptoms cumulatively
        if (has_additive_symptom or len(extracted_symptoms) > 0) and past_symptoms:
            # Combine past symptoms with new symptoms
            merged_symptoms = list(dict.fromkeys(past_symptoms + extracted_symptoms))
            extracted_symptoms = merged_symptoms
            logger.info(f"Merged cumulative symptoms across turns: {extracted_symptoms}")

        # Inherit patient ID if not explicitly mentioned in current turn
        if not extracted_pid and past_pid:
            extracted_pid = past_pid

        # Facility keywords
        has_facility_kw = any(f in q_lower for f in self.known_facilities) or any(
            w in q_lower for w in ["hospital", "clinic", "phc", "chc", "center", "nearby", "location", "distance"]
        ) or has_facility_referent
        has_medicine_kw = any(w in q_lower for w in ["medicine", "tablet", "dosage", "drug", "stock", "syrup", "capsule", "powder", "dava"]) or len(extracted_medicines) > 0 or has_medicine_referent
        has_service_kw = any(w in q_lower for w in ["service", "facility", "opd", "treatment", "care", "delivery", "checkup"]) or len(extracted_services) > 0
        has_precaution_kw = any(w in q_lower for w in ["precaution", "prevent", "advice", "diet", "lifestyle", "what should i do", "home care"])
        has_history_kw = any(w in q_lower for w in ["my history", "past history", "past visit", "my record", "my records", "my report", "my prescription", "my allergy", "my allergies", "previous diagnosis"])

        # Multi-turn triage answer patterns (when answering previous questions)
        triage_answer_patterns = [
            r"^(yes|yeah|yep|yup|no|nope|only\s+\w+|just\s+\w+|mild|moderate|severe|since\s+\w+|\d+\s*days?)\b",
            r"^(હા|ના|માત્ર|ફક્ત|હળવો|મધ્યમ|તીવ્ર|સામાન્ય|બે\s*દિવસ|ત્રણ\s*દિવસ)",
            r"^(ha|haa|na|naa|fakta|matra|halvo|tivra)\b"
        ]
        is_triage_answer = any(re.search(pat, q_lower) for pat in triage_answer_patterns)

        # Conversational pattern checks (English, Gujarati, Hinglish/Gujlish)
        greeting_patterns = [
            r"^(hi|hii|hiii|hello|hey|heyy|kem\s*cho|namaste|namaskar|pranam|good\s+morning|good\s+afternoon|good\s+evening|su\s+prabhat)\b",
            r"^(નમસ્તે|નમસ્કાર|પ્રણામ|કેમ\s*છો|સુપ્રભાત)"
        ]
        is_greeting = any(re.search(pat, q_lower) for pat in greeting_patterns)

        ack_patterns = [
            r"^(ok|okay|k|good|proper|nice|great|fine|cool|done|got\s*it|understood|all\s*right|alright|perfect|well\s*done|sure|yes\s*ok|noted|makes\s*sense|sounds\s*good|looks\s*good|all\s*good|very\s*good|superb|awesome|excellent|no\s*problem)\b",
            r"(ok\s+good|good\s+proper|proper\s+response|good\s+response|ok\s+proper|very\s+proper|proper\s+guidance)",
            r"^(સારું|ઠીક\s*છે|બરોબર|બરાબર|સમજાઈ\s*ગયું|સરસ|યોગ્ય|ઉત્તમ|ઓકે|બરાબર\s*છે|સારું\s*છે|સરસ\s*છે|યોગ્ય\s*છે|સાચી\s*વાત|વાંધો\s*નથી)",
            r"^(saru|barobar|barabar|samjai\s*gayu|thik\s*chhe|thik\s*che|saras|yogya|uttam)\b",
            r"^(theek\s*hai|thik\s*hai|accha|achha|badhiya|sahi\s*hai)\b"
        ]
        is_ack = any(re.search(pat, q_lower) for pat in ack_patterns)

        gratitude_patterns = [
            r"\b(thank\s*you|thanks|thank\s*u|thx|thanks\s*a\s*lot|thank\s*you\s*so\s*much|thank\s*you\s*doctor|many\s*thanks)\b",
            r"(આભાર|ખૂબ\s*આભાર|ધન્યવાદ|ખુબ\s*ખુબ\s*આભાર)",
            r"\b(aabhar|khub\s*aabhar|dhanyawad|dhanyavad|shukriya)\b"
        ]
        is_gratitude = any(re.search(pat, q_lower) for pat in gratitude_patterns)

        closure_patterns = [
            r"^(bye|goodbye|good\s*bye|tata|see\s*you|take\s*care|good\s*night|gn|have\s*a\s*good\s*day|take\s*rest)\b",
            r"^(આવજો|શુભ\s*રાત્રિ|કાળજી\s*રાખજો)",
            r"^(aavjo|shubh\s*ratri)\b"
        ]
        is_closure = any(re.search(pat, q_lower) for pat in closure_patterns)

        # If user answered a triage question with previous symptoms in history
        if is_triage_answer and past_symptoms and len(extracted_symptoms) == 0:
            extracted_symptoms = past_symptoms
            logger.info(f"Retained triage symptoms from previous turn: {extracted_symptoms}")

        # 5. Intent Determination
        intent = "GENERAL_HEALTHCARE"

        if is_emergency:
            intent = "EMERGENCY"
        elif is_greeting and len(extracted_symptoms) == 0 and not has_facility_kw and not has_medicine_kw:
            intent = "GREETING"
        elif is_gratitude and len(extracted_symptoms) == 0 and not has_facility_kw and not has_medicine_kw:
            intent = "GRATITUDE"
        elif is_closure and len(extracted_symptoms) == 0 and not has_facility_kw and not has_medicine_kw:
            intent = "CLOSURE"
        elif is_ack and len(extracted_symptoms) == 0 and not has_facility_kw and not has_medicine_kw:
            intent = "ACKNOWLEDGMENT"
        elif len(extracted_symptoms) > 0:
            intent = "SYMPTOM_DIAGNOSIS"
        elif has_history_kw and extracted_pid:
            intent = "PATIENT_HISTORY"
        elif has_medicine_referent or (has_medicine_kw and any(w in q_lower for w in ["available", "which medicine", "what medicine", "stock", "get", "buy", "kyathi", "malse"])):
            intent = "MEDICINE_QUERY"
        elif has_service_kw and has_facility_kw:
            intent = "HOSPITAL_SERVICE"
        elif len(extracted_symptoms) > 0:
            intent = "SYMPTOM_DIAGNOSIS"
        elif has_facility_kw:
            intent = "HOSPITAL_QUERY"
        elif has_precaution_kw and (extracted_diseases or extracted_symptoms):
            intent = "PRECAUTION_QUERY"
        elif extracted_diseases:
            intent = "DISEASE_INFO"
        elif has_medicine_kw:
            intent = "MEDICINE_QUERY"

        duration = self.extract_duration(q_clean)

        return {
            "intent": intent,
            "is_emergency": is_emergency,
            "emergency_reasons": red_flags,
            "entities": {
                "symptoms": extracted_symptoms,
                "diseases": extracted_diseases,
                "medicines": extracted_medicines,
                "services": extracted_services,
                "patient_id": extracted_pid,
                "duration": duration
            },
            "query": q_clean
        }

intent_extractor = IntentExtractor()

if __name__ == "__main__":
    test_queries = [
        "I have severe sharp chest pain radiating to my arm and cannot breathe",
        "Which medicine is available for fever and pain in Rajkot?",
        "Which hospital provides Maternal Care or Gynecology?",
        "What are the precautions for cystitis?",
        "Does patient PAT-1001 have any allergies to sulfonamides?",
        "I have high fever, headache, nausea, and stiff neck",
        "Who won the IPL match yesterday?"
    ]
    print("Testing Intent Extractor...")
    for q in test_queries:
        res = intent_extractor.analyze(q)
        print(f"\nQuery: {q}")
        print(f"  Intent: {res['intent']} | Emergency: {res['is_emergency']}")
        print(f"  Entities: {res['entities']}")
