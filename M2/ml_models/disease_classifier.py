"""
Lightweight Symptom-to-Disease Differential Diagnosis Classifier.
Uses TF-IDF feature extraction with a calibrated Multinomial Naive Bayes model
to output ranked differential diagnoses with confidence probabilities and symptom matching.
"""

import os
import json
import time
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    top_k_accuracy_score,
    precision_recall_fscore_support,
    classification_report
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "ml_models")
DATA_CSV = os.path.join(BASE_DIR, "data_pipeline", "cleaned_symptoms_to_disease.csv")
KB_FILE = os.path.join(BASE_DIR, "data_pipeline", "disease_knowledge_base.json")
MODEL_PATH = os.path.join(MODEL_DIR, "disease_classifier.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "model_metrics.json")

class DiseasePredictor:
    """Inference wrapper for the trained symptom-to-disease model."""

    def __init__(self, model_path: str = MODEL_PATH, kb_path: str = KB_FILE):
        self.model_path = model_path
        self.kb_path = kb_path
        self.pipeline = None
        self.classes_ = None
        self.kb = {}
        self._load()

    def _load(self):
        if os.path.exists(self.model_path):
            self.pipeline = joblib.load(self.model_path)
            self.classes_ = self.pipeline.named_steps["classifier"].classes_
            logger.info(f"Loaded trained classifier with {len(self.classes_)} classes.")
        if os.path.exists(self.kb_path):
            with open(self.kb_path, "r", encoding="utf-8") as f:
                self.kb = json.load(f)
            logger.info(f"Loaded {len(self.kb)} disease knowledge profiles.")

    def predict(self, symptoms: list, top_k: int = 5) -> dict:
        """
        Given a list of symptom strings, predict top-k differential diagnoses
        with calibrated probabilities and matched symptom overlap.
        """
        t0 = time.perf_counter()
        if not self.pipeline:
            raise RuntimeError("Model pipeline is not loaded. Train the model first.")

        if isinstance(symptoms, list):
            symptom_str = ", ".join([str(s).lower().strip() for s in symptoms if str(s).strip()])
            input_symptoms = [str(s).lower().strip() for s in symptoms if str(s).strip()]
        else:
            symptom_str = str(symptoms).lower().strip()
            input_symptoms = [s.strip() for s in symptom_str.split(",") if s.strip()]

        if not symptom_str:
            return {
                "top_predictions": [],
                "urgency_level": "ROUTINE_CONSULTATION",
                "inference_time_ms": 0.0,
                "note": "No valid symptoms provided."
            }

        # Predict probabilities
        probas = self.pipeline.predict_proba([symptom_str])[0]
        top_indices = np.argsort(probas)[::-1][:top_k]

        predictions = []
        highest_urgency = "ROUTINE_CONSULTATION"

        for idx in top_indices:
            disease_name = self.classes_[idx]
            confidence = float(probas[idx])
            disease_meta = self.kb.get(disease_name, {})
            urgency = disease_meta.get("urgency_level", "ROUTINE_CONSULTATION")
            signature_syms = disease_meta.get("signature_symptoms", [])

            # Compute symptom overlap
            matched_syms = [s for s in input_symptoms if any(s in sig or sig in s for sig in signature_syms)]
            if not matched_syms:
                matched_syms = [s for s in input_symptoms if s in disease_meta.get("all_associated_symptoms", [])]

            if urgency == "EMERGENCY":
                highest_urgency = "EMERGENCY"
            elif urgency == "URGENT" and highest_urgency != "EMERGENCY":
                highest_urgency = "URGENT"

            predictions.append({
                "disease": disease_name,
                "confidence": round(confidence, 4),
                "confidence_percent": f"{confidence * 100:.1f}%",
                "urgency_level": urgency,
                "matched_symptoms": matched_syms,
                "precautions": disease_meta.get("precautions", [])[:2]
            })

        latency_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "top_predictions": predictions,
            "overall_urgency": highest_urgency,
            "inference_time_ms": round(latency_ms, 2)
        }

def train_and_evaluate():
    """Train the differential diagnosis classifier and save evaluation metrics."""
    logger.info("Starting model training pipeline...")
    os.makedirs(MODEL_DIR, exist_ok=True)

    if not os.path.exists(DATA_CSV):
        raise FileNotFoundError(f"Cleaned dataset not found at {DATA_CSV}. Run clean_dataset.py first.")

    logger.info(f"Loading cleaned dataset from {DATA_CSV}...")
    df = pd.read_csv(DATA_CSV)
    logger.info(f"Dataset shape: {df.shape}")

    X = df["symptom_text"].values
    y = df["diseases"].values

    # Stratified 80/20 train/test split
    logger.info("Performing stratified 80/20 train/test split...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Pipeline: TF-IDF n-grams + MultinomialNB
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=600, ngram_range=(1, 2), stop_words="english")),
        ("classifier", MultinomialNB(alpha=0.1))
    ])

    logger.info("Fitting TF-IDF + MultinomialNB classifier...")
    t0 = time.time()
    pipeline.fit(X_train, y_train)
    train_duration = time.time() - t0
    logger.info(f"Model trained successfully in {train_duration:.2f} seconds.")

    # Evaluate on held-out test set
    logger.info("Evaluating on held-out test set...")
    t1 = time.time()
    y_pred = pipeline.predict(X_test)
    eval_duration = time.time() - t1

    y_proba = pipeline.predict_proba(X_test)
    classes = pipeline.named_steps["classifier"].classes_

    acc_top1 = accuracy_score(y_test, y_pred)
    acc_top3 = top_k_accuracy_score(y_test, y_proba, k=3, labels=classes)
    acc_top5 = top_k_accuracy_score(y_test, y_proba, k=5, labels=classes)

    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )

    logger.info(f"=== MODEL EVALUATION RESULTS ===")
    logger.info(f"Top-1 Accuracy : {acc_top1 * 100:.2f}%")
    logger.info(f"Top-3 Accuracy : {acc_top3 * 100:.2f}%")
    logger.info(f"Top-5 Accuracy : {acc_top5 * 100:.2f}%")
    logger.info(f"Weighted Precision: {precision * 100:.2f}%")
    logger.info(f"Weighted Recall   : {recall * 100:.2f}%")
    logger.info(f"Weighted F1-Score : {f1 * 100:.2f}%")

    # Save model artifact
    joblib.dump(pipeline, MODEL_PATH)
    logger.info(f"Model persisted to {MODEL_PATH}")

    # Save metrics report
    metrics = {
        "model_type": "TF-IDF + Multinomial Naive Bayes",
        "num_classes": len(classes),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_duration_seconds": round(train_duration, 2),
        "top_1_accuracy": round(float(acc_top1), 4),
        "top_3_accuracy": round(float(acc_top3), 4),
        "top_5_accuracy": round(float(acc_top5), 4),
        "weighted_precision": round(float(precision), 4),
        "weighted_recall": round(float(recall), 4),
        "weighted_f1_score": round(float(f1), 4),
        "avg_test_inference_ms": round((eval_duration / len(X_test)) * 1000, 3)
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Metrics saved to {METRICS_PATH}")

    # Quick test prediction
    predictor = DiseasePredictor(MODEL_PATH, KB_FILE)
    test_result = predictor.predict(["shortness of breath", "sharp chest pain", "dizziness"])
    logger.info(f"Sample prediction test: {json.dumps(test_result, indent=2)}")

if __name__ == "__main__":
    train_and_evaluate()
