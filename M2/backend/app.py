"""
FastAPI Backend REST API for SIH Healthcare AI Assistant.
Provides clean, secure, and production-ready endpoints for conversational AI,
geospatial hospital lookup, medicine inventory search, service queries,
differential disease prediction, and patient EHR records.
"""

import os
import sys
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Path, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from rag.rag_engine import rag_engine
from database.mongo_manager import mongo_manager
from ml_models.disease_classifier import DiseasePredictor, MODEL_PATH, KB_FILE
from backend.sarvam_service import sarvam_service

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SIH Healthcare AI Assistant API",
    description="Grounded Healthcare AI Assistant utilizing actual dataset, MongoDB Atlas, ML differential diagnosis, and Gemini reasoning.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend static directory
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/", tags=["UI"], include_in_schema=False)
def serve_ui():
    """Serve the interactive web UI dashboard."""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "AarogyaMitra API is running. Visit /docs for Swagger UI."}

# Instantiate ML predictor
predictor = DiseasePredictor(MODEL_PATH, KB_FILE)

# ================= REQUEST & RESPONSE MODELS =================

class ChatMessage(BaseModel):
    role: str = Field(..., example="user")  # "user" or "assistant"
    content: str = Field(..., example="I have high fever")

class ChatRequest(BaseModel):
    message: str = Field(..., example="Which medicine is available for fever in Rajkot hospitals?")
    image: Optional[str] = Field(None, example="data:image/jpeg;base64,...")
    userId: Optional[str] = Field(None, example="PAT-1001")
    sessionId: Optional[str] = Field(None, example="sess_1715420000_abc")
    history: Optional[List[ChatMessage]] = Field(default_factory=list)
    latitude: Optional[float] = Field(None, example=22.3039)
    longitude: Optional[float] = Field(None, example=70.8022)

class ChatResponse(BaseModel):
    answer: str
    intent: str
    sources: List[str]
    confidence: Optional[float] = None
    retrievedContext: Dict[str, Any]
    actions: Optional[Dict[str, bool]] = None
    is_emergency: bool = False
    latency_ms: float

class PredictRequest(BaseModel):
    symptoms: List[str] = Field(..., example=["shortness of breath", "sharp chest pain", "dizziness"])
    top_k: Optional[int] = Field(5, ge=1, le=10)

class TTSRequest(BaseModel):
    text: str = Field(..., example="સાહેબ મને ત્રણ દિવસથી તાવ છે, શરીર દુખે છે ને બહુ નબળાઈ લાગે છે")
    language_code: Optional[str] = Field("gu-IN", example="gu-IN")
    speaker: Optional[str] = Field("meera", example="meera")

# Server-side conversational memory store (keyed by sessionId)
SESSION_MEMORY: Dict[str, List[Dict[str, str]]] = {}
MAX_STORED_TURNS_PER_SESSION = 10

# ================= API ENDPOINTS =================

@app.post("/api/speech-to-text", tags=["Voice AI"])
async def speech_to_text_endpoint(
    file: UploadFile = File(...),
    language_code: str = Form("gu-IN"),
    prompt: Optional[str] = Form(None)
):
    """
    Sarvam Saaras Speech-to-Text ASR Endpoint.
    Transcribes audio recorded from user microphone to Gujarati/multilingual text.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")
    
    result = sarvam_service.speech_to_text(
        file_bytes=content,
        filename=file.filename or "audio.webm",
        language_code=language_code,
        prompt=prompt
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Speech recognition failed."))
    return result

@app.post("/api/text-to-speech", tags=["Voice AI"])
def text_to_speech_endpoint(req: TTSRequest):
    """
    Sarvam Bulbul Text-to-Speech TTS Endpoint.
    Converts assistant text response to natural Gujarati voice (base64 WAV audio).
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text string cannot be empty.")

    result = sarvam_service.text_to_speech(
        text=req.text,
        target_language_code=req.language_code or "gu-IN",
        speaker=req.speaker or "meera"
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Text-to-speech synthesis failed."))
    return result


@app.get("/api/health", tags=["System"])
def health_check():
    """System health check, database ping, and ML model status."""
    mongo_status = mongo_manager.get_status_summary()
    gemini_ready = rag_engine.genai_client is not None
    ml_ready = predictor.pipeline is not None

    return {
        "status": "healthy" if mongo_status["status"] == "CONNECTED" else "degraded",
        "gemini_api_configured": gemini_ready,
        "ml_classifier_loaded": ml_ready,
        "database": mongo_status
    }

@app.post("/api/chat", response_model=ChatResponse, tags=["Conversational AI"])
def chat_endpoint(req: ChatRequest):
    """
    Primary conversational endpoint with multi-turn conversation memory.
    Processes user queries through intent extraction, MongoDB context retrieval,
    ML differential classification (if symptoms present), and Gemini grounded reasoning.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    # Consolidate conversation history
    history_dicts: List[Dict[str, str]] = []
    if req.history and len(req.history) > 0:
        history_dicts = [{"role": h.role, "content": h.content} for h in req.history]
    elif req.sessionId and req.sessionId in SESSION_MEMORY:
        history_dicts = SESSION_MEMORY[req.sessionId]

    try:
        response_data = rag_engine.generate_response(
            user_query=req.message,
            image=req.image,
            user_id=req.userId,
            history=history_dicts,
            session_id=req.sessionId,
            latitude=req.latitude,
            longitude=req.longitude
        )

        # Update server-side session memory
        if req.sessionId:
            if req.sessionId not in SESSION_MEMORY:
                SESSION_MEMORY[req.sessionId] = []
            SESSION_MEMORY[req.sessionId].append({"role": "user", "content": req.message})
            SESSION_MEMORY[req.sessionId].append({"role": "assistant", "content": response_data["answer"]})
            # Trim to max turns
            if len(SESSION_MEMORY[req.sessionId]) > MAX_STORED_TURNS_PER_SESSION * 2:
                SESSION_MEMORY[req.sessionId] = SESSION_MEMORY[req.sessionId][-MAX_STORED_TURNS_PER_SESSION * 2:]

        return response_data
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal assistant processing error: {str(e)}")

@app.post("/api/chat/reset", tags=["Conversational AI"])
def reset_session(session_id: Optional[str] = None):
    """Reset server-side conversation history for a given session."""
    if session_id and session_id in SESSION_MEMORY:
        del SESSION_MEMORY[session_id]
        return {"status": "success", "message": f"Session {session_id} history cleared."}
    return {"status": "success", "message": "Session history cleared or was empty."}

@app.post("/api/predict-disease", tags=["Clinical ML"])
def predict_disease(req: PredictRequest):
    """
    Differential disease classification from symptoms.
    Returns calibrated probability distributions, urgency ratings, and matched symptoms.
    """
    if not req.symptoms:
        raise HTTPException(status_code=400, detail="At least one symptom must be provided.")

    try:
        results = predictor.predict(symptoms=req.symptoms, top_k=req.top_k)
        return results
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/api/hospitals/nearby", tags=["Hospitals"])
def get_nearby_hospitals(
    lat: float = Query(..., description="Latitude coordinate", examples=[22.3039]),
    lng: float = Query(..., description="Longitude coordinate", examples=[70.8022]),
    max_distance_km: float = Query(50.0, description="Max distance in kilometers", examples=[30.0]),
    limit: int = Query(5, ge=1, le=20)
):
    """Find nearby hospital facilities using geospatial GeoJSON indexing."""
    hospitals = mongo_manager.find_nearby_hospitals(lat=lat, lng=lng, max_distance_km=max_distance_km, limit=limit)
    return {"count": len(hospitals), "hospitals": hospitals}

@app.get("/api/hospitals/search", tags=["Hospitals"])
def search_hospitals(
    query: Optional[str] = Query(None, description="Search term for name or address", examples=["Gondal"]),
    district: Optional[str] = Query(None, description="District filter", examples=["Rajkot"]),
    emergency_only: bool = Query(False, description="Filter for 24/7 emergency availability"),
    limit: int = Query(10, ge=1, le=50)
):
    """Search hospital records by facility name, district, or emergency capability."""
    results = mongo_manager.search_hospitals(query=query, district=district, emergency_only=emergency_only, limit=limit)
    return {"count": len(results), "hospitals": results}

@app.get("/api/hospitals/services", tags=["Hospital Services"])
def search_hospital_services(
    service: Optional[str] = Query(None, description="Service name (e.g. Maternal Care, OPD, X-Ray)", examples=["Maternal Care"]),
    hospital: Optional[str] = Query(None, description="Hospital name filter", examples=["PHC Gondal"])
):
    """Find facilities providing specific clinical services with operational hours and fee guidelines."""
    results = mongo_manager.search_hospital_services(service_query=service, hospital_name=hospital)
    return {"count": len(results), "services": results}

@app.get("/api/medicines/search", tags=["Medicines & Inventory"])
def search_medicines(
    query: Optional[str] = Query(None, description="Medicine name or symptom indication", examples=["Paracetamol"]),
    district: Optional[str] = Query(None, description="District filter for inventory", examples=["Rajkot"])
):
    """
    Search medicines and check live stock levels across network facilities.
    """
    if query:
        stock = mongo_manager.check_medicine_stock(medicine_query=query, district=district)
        if stock:
            return {"query": query, "type": "inventory_stock", "count": len(stock), "results": stock}

    # Catalog fallback
    catalog = mongo_manager.search_medicines(query=query)
    return {"query": query, "type": "catalog", "count": len(catalog), "results": catalog}

@app.get("/api/diseases/search", tags=["Diseases"])
def search_diseases(
    name: str = Query(..., description="Disease name", examples=["cystitis"])
):
    """Retrieve verified disease profile, signature symptoms, precautions, and urgency level."""
    profile = mongo_manager.get_disease_knowledge(disease_name=name)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Disease '{name}' not found in project database.")
    return profile

@app.get("/api/patient/history/{patient_id}", tags=["Patient EHR"])
def get_patient_history(
    patient_id: str = Path(..., description="Patient ID (e.g. PAT-1001)", examples=["PAT-1001"])
):
    """
    Access-controlled patient EHR retrieval.
    Returns patient demographics, chronic conditions, verified drug allergies, and past visits.
    """
    record = mongo_manager.get_patient_records(patient_id=patient_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Patient record '{patient_id}' not found.")
    return record

# Application entry point for development
if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting Healthcare AI Assistant backend on http://{host}:{port}")
    uvicorn.run("app:app", host=host, port=port, reload=True)
