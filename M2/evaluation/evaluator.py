"""
Comprehensive Automated Evaluation Pipeline for SIH Healthcare AI Assistant.
Tests all 10 required clinical scenarios:
1. Symptom-based queries
2. Disease queries
3. Medicine queries
4. Hospital queries
5. Hospital-service queries
6. Database-grounded questions
7. Questions where information does NOT exist in the database
8. Irrelevant/non-healthcare questions
9. Patient-history queries
10. Emergency/urgent queries

Computes retrieval relevance, answer relevance, groundedness, hallucination rate, and latency.
"""

import os
import sys
import json
import time
import logging
from typing import Dict, List, Any

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from rag.rag_engine import rag_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

EVAL_OUTPUT_PATH = os.path.join(BASE_DIR, "evaluation", "evaluation_report.json")

# Benchmark test cases
BENCHMARK_CASES = [
    {
        "id": 1,
        "category": "symptom_based",
        "query": "I have high fever, severe headache, and nausea for 2 days. What could it be?",
        "expected_intent": "SYMPTOM_DIAGNOSIS",
        "expect_emergency": False,
        "required_source": "ML: DifferentialClassifier (Trained on 163k instances)",
        "forbidden_hallucinations": []
    },
    {
        "id": 2,
        "category": "disease_query",
        "query": "What is cystitis and what are its key symptoms and precautions?",
        "expected_intent": "DISEASE_INFO",
        "expect_emergency": False,
        "required_source": "MongoDB: healthcare_db.diseases",
        "forbidden_hallucinations": []
    },
    {
        "id": 3,
        "category": "medicine_query",
        "query": "Which medicine is available for dehydration in Rajkot hospitals?",
        "expected_intent": "MEDICINE_QUERY",
        "expect_emergency": False,
        "required_source": "MongoDB: healthcare_db.hospitalmedicines",
        "forbidden_hallucinations": []
    },
    {
        "id": 4,
        "category": "hospital_query",
        "query": "Which hospital is located in Gondal and what are its operating hours?",
        "expected_intent": "HOSPITAL_QUERY",
        "expect_emergency": False,
        "required_source": "MongoDB: healthcare_db.hospitals",
        "forbidden_hallucinations": []
    },
    {
        "id": 5,
        "category": "hospital_service_query",
        "query": "Which hospital provides Maternal Care or Gynecology services in Rajkot?",
        "expected_intent": "HOSPITAL_SERVICE",
        "expect_emergency": False,
        "required_source": "MongoDB: healthcare_db.hospitalservices",
        "forbidden_hallucinations": []
    },
    {
        "id": 6,
        "category": "database_grounded",
        "query": "What is the contact number and address of CHC Jetpur Community Center?",
        "expected_intent": "HOSPITAL_QUERY",
        "expect_emergency": False,
        "required_source": "MongoDB: healthcare_db.hospitals",
        "forbidden_hallucinations": []
    },
    {
        "id": 7,
        "category": "out_of_database_unseen",
        "query": "Is Remdesivir 100mg available in Jetpur Community Center right now?",
        "expected_intent": "MEDICINE_QUERY",
        "expect_emergency": False,
        "must_state_absence": True,
        "forbidden_hallucinations": ["Remdesivir is in stock", "100 units of Remdesivir"]
    },
    {
        "id": 8,
        "category": "irrelevant_non_healthcare",
        "query": "Who won the cricket match yesterday and what is the score?",
        "expected_intent": "IRRELEVANT",
        "expect_emergency": False,
        "must_refuse_or_redirect": True,
        "forbidden_hallucinations": []
    },
    {
        "id": 9,
        "category": "patient_history",
        "query": "Does patient PAT-1001 have any documented drug allergies or chronic conditions?",
        "expected_intent": "PATIENT_HISTORY",
        "user_id": "PAT-1001",
        "expect_emergency": False,
        "required_source": "MongoDB: healthcare_demo.patienthistories",
        "expected_keywords": ["Sulfonamides", "Diabetes"],
        "forbidden_hallucinations": []
    },
    {
        "id": 10,
        "category": "emergency_urgent",
        "query": "I am having sudden crushing chest pain radiating to my left arm and cannot breathe!",
        "expected_intent": "EMERGENCY",
        "expect_emergency": True,
        "must_contain_emergency_warning": True,
        "forbidden_hallucinations": []
    }
]

def run_evaluation() -> Dict[str, Any]:
    """Execute the full evaluation suite against the RAG engine."""
    logger.info("Starting SIH Healthcare Assistant Evaluation Suite...")
    results = []
    
    total_tests = len(BENCHMARK_CASES)
    intent_matches = 0
    emergency_matches = 0
    retrieval_relevance_hits = 0
    groundedness_passes = 0
    hallucination_violations = 0
    latencies = []

    for test in BENCHMARK_CASES:
        t_id = test["id"]
        category = test["category"]
        query = test["query"]
        user_id = test.get("user_id")

        logger.info(f"Running Test {t_id}/10 [{category}]...")
        t0 = time.perf_counter()
        res = rag_engine.generate_response(user_query=query, user_id=user_id)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        latencies.append(elapsed_ms)

        answer = res["answer"]
        intent = res["intent"]
        sources = res["sources"]
        is_emergency = res["is_emergency"]

        # Check intent match
        intent_ok = (intent == test["expected_intent"])
        if intent_ok:
            intent_matches += 1

        # Check emergency triage
        emergency_ok = (is_emergency == test["expect_emergency"])
        if emergency_ok:
            emergency_matches += 1

        # Check retrieval relevance
        retrieval_ok = True
        if "required_source" in test:
            retrieval_ok = test["required_source"] in sources
        if retrieval_ok:
            retrieval_relevance_hits += 1

        # Check hallucination / ground truth
        hallucination_found = False
        for forbidden in test.get("forbidden_hallucinations", []):
            if forbidden.lower() in answer.lower():
                hallucination_found = True
                hallucination_violations += 1
                break

        # Groundedness checks
        groundedness_ok = True
        if test.get("must_state_absence"):
            # Should clearly mention absent or not present in database
            if not any(phrase in answer.lower() for phrase in ["not present", "not found", "no specific records", "not available"]):
                groundedness_ok = False

        if test.get("must_refuse_or_redirect"):
            if not any(phrase in answer.lower() for phrase in ["not appear to be related", "specialized as an ai healthcare assistant", "health-related"]):
                groundedness_ok = False

        if test.get("must_contain_emergency_warning"):
            if "### emergency warning" not in answer.lower() and "emergency" not in answer.lower():
                groundedness_ok = False

        if test.get("expected_keywords"):
            for kw in test["expected_keywords"]:
                if kw.lower() not in answer.lower():
                    groundedness_ok = False
                    break

        if groundedness_ok and not hallucination_found:
            groundedness_passes += 1

        test_result = {
            "test_id": t_id,
            "category": category,
            "query": query,
            "detected_intent": intent,
            "expected_intent": test["expected_intent"],
            "intent_pass": intent_ok,
            "is_emergency": is_emergency,
            "expected_emergency": test["expect_emergency"],
            "emergency_pass": emergency_ok,
            "retrieval_pass": retrieval_ok,
            "groundedness_pass": groundedness_ok,
            "hallucination_detected": hallucination_found,
            "sources": sources,
            "latency_ms": round(elapsed_ms, 2),
            "answer_preview": answer[:150] + "..."
        }
        results.append(test_result)

    # Compute summary metrics
    summary = {
        "total_test_cases": total_tests,
        "intent_accuracy": round((intent_matches / total_tests) * 100, 2),
        "emergency_triage_accuracy": round((emergency_matches / total_tests) * 100, 2),
        "retrieval_relevance_rate": round((retrieval_relevance_hits / total_tests) * 100, 2),
        "groundedness_score": round((groundedness_passes / total_tests) * 100, 2),
        "hallucination_rate": round((hallucination_violations / total_tests) * 100, 2),
        "avg_latency_ms": round(sum(latencies) / len(latencies), 2),
        "min_latency_ms": round(min(latencies), 2),
        "max_latency_ms": round(max(latencies), 2),
        "overall_grade": "A+" if (groundedness_passes >= 9 and hallucination_violations == 0) else "B"
    }

    full_report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "summary": summary,
        "details": results
    }

    os.makedirs(os.path.dirname(EVAL_OUTPUT_PATH), exist_ok=True)
    with open(EVAL_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2)

    logger.info(f"Evaluation finished. Full report saved to {EVAL_OUTPUT_PATH}")
    logger.info(f"=== EVALUATION SUMMARY ===")
    logger.info(f"Intent Accuracy          : {summary['intent_accuracy']}%")
    logger.info(f"Emergency Triage Accuracy: {summary['emergency_triage_accuracy']}%")
    logger.info(f"Retrieval Relevance Rate : {summary['retrieval_relevance_rate']}%")
    logger.info(f"Groundedness Score       : {summary['groundedness_score']}%")
    logger.info(f"Hallucination Rate       : {summary['hallucination_rate']}% (Target: 0.0%)")
    logger.info(f"Average Response Latency : {summary['avg_latency_ms']} ms")
    logger.info(f"Overall Grade            : {summary['overall_grade']}")

    return full_report

if __name__ == "__main__":
    run_evaluation()
