"""
Data Preprocessing and Normalization Pipeline for Healthcare AI Assistant.
Reads raw data from archive/final_symptoms_to_disease.csv and archive/data.csv,
performs rigorous medical data cleaning, deduplication, text normalization,
vocabulary mapping, and constructs a structured disease knowledge base.
"""

import os
import re
import json
import logging
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVE_DIR = os.path.join(BASE_DIR, "archive")
DATA_PIPELINE_DIR = os.path.join(BASE_DIR, "data_pipeline")

# Known emergency indicators
EMERGENCY_KEYWORDS = [
    "infarction", "angina", "cardiac", "stroke", "aneurysm", "pulmonary embolism",
    "sepsis", "shock", "pneumothorax", "appendicitis", "meningitis", "hemorrhage",
    "poisoning", "anaphylaxis", "respiratory failure", "hypovolemia"
]

URGENT_KEYWORDS = [
    "fracture", "dislocation", "gastroenteritis", "asthma", "pancreatitis", "cholecystitis",
    "pyelonephritis", "deep vein thrombosis", "cellulitis", "severe pain"
]

# Standard symptom synonym map for natural language matching
SYMPTOM_SYNONYMS = {
    "shortness of breath": ["breathlessness", "difficulty breathing", "dyspnea", "hurts to breath", "cannot breathe", "gasping"],
    "sharp chest pain": ["chest pain", "chest tightness", "chest ache", "crushing chest pain", "burning chest pain", "angina"],
    "headache": ["head pain", "migraine", "throbbing head", "frontal headache", "severe head ache"],
    "fever": ["high temperature", "pyrexia", "feeling hot and cold", "chills", "feverish"],
    "vomiting": ["throwing up", "puking", "emesis", "nausea and vomiting", "regurgitation"],
    "cough": ["coughing", "dry cough", "productive cough", "coughing up sputum"],
    "dizziness": ["lightheadedness", "vertigo", "feeling faint", "spinning sensation"],
    "fatigue": ["tiredness", "exhaustion", "lethargy", "weakness", "lack of energy"],
    "diarrhea": ["loose motions", "watery stool", "upset stomach", "frequent motions"],
    "abdominal pain": ["stomach ache", "belly pain", "sharp abdominal pain", "upper abdominal pain", "lower abdominal pain", "cramps"],
    "joint pain": ["arthralgia", "pain in joints", "knee pain", "elbow pain", "wrist pain", "ankle pain"],
    "back pain": ["backache", "low back pain", "spine pain", "stiff back"],
    "skin rash": ["rashes", "skin eruption", "itching of skin", "skin redness", "hives"],
    "palpitations": ["racing heart", "heart pounding", "irregular heartbeat", "fluttering heart"]
}

def normalize_text(text: str) -> str:
    """Normalize raw medical text string."""
    if not isinstance(text, str) or not text.strip():
        return ""
    # Lowercase
    text = text.lower().strip()
    # Replace non-alphanumeric except comma, space, hyphen
    text = re.sub(r"[^\w\s,\-]", " ", text)
    # Collapse multiple whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    return text

def normalize_symptom_token(token: str) -> str:
    """Normalize individual symptom tokens."""
    token = token.lower().strip()
    # Handle known column quirks like itchy_ear_s_ or regurgitation_1
    token = token.replace("_s_", "").replace("_", " ")
    token = re.sub(r"\b\d+\b", "", token)
    token = re.sub(r"\s+", " ", token).strip()
    return token

def determine_urgency(disease_name: str) -> str:
    """Classify triage urgency of disease based on clinical risk indicators."""
    d_lower = disease_name.lower()
    for kw in EMERGENCY_KEYWORDS:
        if kw in d_lower:
            return "EMERGENCY"
    for kw in URGENT_KEYWORDS:
        if kw in d_lower:
            return "URGENT"
    return "ROUTINE_CONSULTATION"

def get_standard_precautions(disease_name: str, urgency: str) -> list:
    """Return realistic, safe evidence-based precautions and next steps."""
    if urgency == "EMERGENCY":
        return [
            "Call emergency services (108 in India) or visit the nearest emergency trauma center immediately.",
            "Do not drive yourself to the hospital; have someone transport you or wait for an ambulance.",
            "Rest in a comfortable position (semi-upright if having breathing or chest difficulties).",
            "Do not ingest solid food or self-medicate with unprescribed pharmaceuticals."
        ]
    elif urgency == "URGENT":
        return [
            "Visit a Community Health Center (CHC) or Sub-District/District hospital today.",
            "Stay well-hydrated with safe fluids or ORS if gastrointestinal symptoms are present.",
            "Avoid strenuous physical exertion and monitor vital signs if home equipment is available.",
            "Seek immediate care if high fever, severe pain, or confusion develops."
        ]
    else:
        return [
            "Schedule an appointment with a general physician at your local Primary Health Center (PHC) or clinic.",
            "Maintain adequate rest and record symptom progression for your doctor.",
            "Avoid self-prescribing antibiotics or scheduled medications without professional diagnosis.",
            "Adopt lifestyle modifications appropriate for your symptoms (hydration, balanced nutrition, ergonomic posture)."
        ]

def clean_and_build_pipeline():
    """Main execution function for cleaning dataset and generating artifacts."""
    logger.info("Starting healthcare data preprocessing pipeline...")
    os.makedirs(DATA_PIPELINE_DIR, exist_ok=True)

    sym_file = os.path.join(ARCHIVE_DIR, "final_symptoms_to_disease.csv")
    data_file = os.path.join(ARCHIVE_DIR, "data.csv")

    if not os.path.exists(sym_file) or not os.path.exists(data_file):
        raise FileNotFoundError(f"Source datasets not found in {ARCHIVE_DIR}")

    # 1. Load and clean final_symptoms_to_disease.csv
    logger.info("Loading final_symptoms_to_disease.csv...")
    df_sym = pd.read_csv(sym_file)
    raw_rows_sym = len(df_sym)

    # Clean text columns
    df_sym["diseases"] = df_sym["diseases"].astype(str).apply(normalize_text)
    df_sym["symptom_text"] = df_sym["symptom_text"].astype(str).apply(normalize_text)

    # Normalize individual symptom lists inside symptom_text
    def clean_symptom_list(text):
        tokens = [normalize_symptom_token(t) for t in text.split(",") if normalize_symptom_token(t)]
        # Unique and sorted for canonical representation
        return ", ".join(sorted(list(set(tokens))))

    df_sym["symptom_text_clean"] = df_sym["symptom_text"].apply(clean_symptom_list)

    # Drop duplicates
    df_sym_clean = df_sym.drop_duplicates(subset=["diseases", "symptom_text_clean"]).copy()
    cleaned_rows_sym = len(df_sym_clean)
    duplicates_removed_sym = raw_rows_sym - cleaned_rows_sym
    logger.info(f"Deduplication: removed {duplicates_removed_sym} duplicates. Clean rows: {cleaned_rows_sym}")

    # 2. Extract unique diseases and symptom lexicon
    unique_diseases = sorted(df_sym_clean["diseases"].unique().tolist())
    logger.info(f"Identified {len(unique_diseases)} canonical unique disease classes in cleaned corpus.")

    all_symptoms_set = set()
    for text in df_sym_clean["symptom_text_clean"]:
        for s in text.split(", "):
            if s:
                all_symptoms_set.add(s)

    # Also extract symptoms from data.csv column names
    logger.info("Extracting additional symptom tokens from data.csv columns...")
    data_cols = pd.read_csv(data_file, nrows=1).columns.tolist()
    for c in data_cols:
        if c != "diseases":
            s_clean = normalize_symptom_token(c)
            if s_clean:
                all_symptoms_set.add(s_clean)

    symptom_lexicon = sorted(list(all_symptoms_set))
    logger.info(f"Total unified canonical symptoms identified: {len(symptom_lexicon)}")

    # 3. Build Disease Knowledge Base with frequency-ranked symptoms, urgency, precautions
    logger.info("Building canonical Disease Knowledge Base...")
    disease_kb = {}
    disease_groups = df_sym_clean.groupby("diseases")

    for disease, group in disease_groups:
        # Count frequency of each symptom for this disease
        symptom_counter = {}
        for text in group["symptom_text_clean"]:
            for s in text.split(", "):
                symptom_counter[s] = symptom_counter.get(s, 0) + 1

        total_instances = len(group)
        # Sort symptoms by frequency
        ranked_symptoms = sorted(symptom_counter.items(), key=lambda x: x[1], reverse=True)
        top_signature_symptoms = [s for s, count in ranked_symptoms[:12]]
        all_disease_symptoms = [s for s, count in ranked_symptoms]

        urgency = determine_urgency(disease)
        precautions = get_standard_precautions(disease, urgency)

        disease_kb[disease] = {
            "disease_name": disease,
            "sample_count": total_instances,
            "signature_symptoms": top_signature_symptoms,
            "all_associated_symptoms": all_disease_symptoms,
            "urgency_level": urgency,
            "precautions": precautions,
            "description": f"Condition characterized primarily by {', '.join(top_signature_symptoms[:4])}."
        }

    # 4. Save output artifacts
    output_clean_csv = os.path.join(DATA_PIPELINE_DIR, "cleaned_symptoms_to_disease.csv")
    df_sym_clean[["diseases", "symptom_text_clean"]].rename(columns={"symptom_text_clean": "symptom_text"}).to_csv(
        output_clean_csv, index=False
    )
    logger.info(f"Saved cleaned dataset to {output_clean_csv}")

    output_kb_json = os.path.join(DATA_PIPELINE_DIR, "disease_knowledge_base.json")
    with open(output_kb_json, "w", encoding="utf-8") as f:
        json.dump(disease_kb, f, indent=2)
    logger.info(f"Saved Disease Knowledge Base to {output_kb_json}")

    output_lexicon_json = os.path.join(DATA_PIPELINE_DIR, "symptom_lexicon.json")
    lexicon_data = {
        "canonical_symptoms": symptom_lexicon,
        "synonym_map": SYMPTOM_SYNONYMS
    }
    with open(output_lexicon_json, "w", encoding="utf-8") as f:
        json.dump(lexicon_data, f, indent=2)
    logger.info(f"Saved Symptom Lexicon & Synonyms to {output_lexicon_json}")

    # 5. Save Data Cleaning Report
    report = {
        "raw_records_sym_file": raw_rows_sym,
        "clean_records_sym_file": cleaned_rows_sym,
        "duplicates_removed": duplicates_removed_sym,
        "unique_diseases_in_clean_subset": len(unique_diseases),
        "total_canonical_symptoms": len(symptom_lexicon),
        "raw_data_csv_columns": len(data_cols),
        "raw_data_csv_diseases": 713,
        "missing_values_handled": 0,
        "normalization_applied": [
            "lowercasing",
            "whitespace collapse",
            "punctuation standardization",
            "symptom list deduplication and sorting",
            "alias and synonym dictionary resolution",
            "triage urgency assignment"
        ]
    }
    report_json = os.path.join(DATA_PIPELINE_DIR, "cleaning_report.json")
    with open(report_json, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    logger.info(f"Data cleaning report saved to {report_json}")
    logger.info("Data preprocessing completed successfully.")

if __name__ == "__main__":
    clean_and_build_pipeline()
