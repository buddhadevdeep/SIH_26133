"""
MongoDB Manager for Healthcare Assistant.
Manages connections, schema indexes, seeding of disease knowledge,
geospatial queries, inventory lookups, service matching, and secure EHR access.
"""

import os
import re
import json
import math
import logging
from typing import List, Dict, Any, Optional
from pymongo import MongoClient, ASCENDING, TEXT, GEOSPHERE
from pymongo.errors import PyMongoError, OperationFailure
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_FILE = os.path.join(BASE_DIR, "data_pipeline", "disease_knowledge_base.json")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://deepbuddhadev135_db_user:RFUtAgSlhuwoDLRg@rms.beog0b4.mongodb.net/healthconnect?retryWrites=true&w=majority")
PRIMARY_DB_NAME = os.getenv("PRIMARY_DB", "healthconnect")
DEMO_DB_NAME = os.getenv("DEMO_DB", "healthconnect")

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    try:
        R = 6371.0  # Earth's radius in kilometers
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except Exception:
        return 9999.0

class MongoManager:
    """Central interface for querying and indexing MongoDB."""

    def __init__(self, uri: str = MONGODB_URI):
        self.uri = uri
        self.client = None
        self.primary_db = None
        self.demo_db = None
        self._connect()

    def _connect(self):
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=4000)
            self.client.admin.command("ping")
            
            # Detect default database name from URI if specified (e.g. /healthconnect)
            db_name = PRIMARY_DB_NAME
            try:
                uri_db = self.client.get_default_database()
                if uri_db is not None and uri_db.name:
                    db_name = uri_db.name
            except Exception:
                pass

            self.primary_db = self.client[db_name]
            self.demo_db = self.client[DEMO_DB_NAME if DEMO_DB_NAME else db_name]
            logger.info(f"Successfully connected to MongoDB database: {db_name}")
        except Exception as e:
            logger.warning(f"Connection to primary MongoDB URI ({self.uri}) failed: {e}. Trying fallback...")
            atlas_fallback = "mongodb+srv://24010101189_db_user:10u8BUP8J8sWoQgu@cluster0.lfpnctl.mongodb.net/?appName=Cluster0"
            try:
                self.client = MongoClient(atlas_fallback, serverSelectionTimeoutMS=4000)
                self.client.admin.command("ping")
                self.primary_db = self.client[PRIMARY_DB_NAME if PRIMARY_DB_NAME in self.client.list_database_names() else "healthcare_db"]
                self.demo_db = self.client[DEMO_DB_NAME if DEMO_DB_NAME in self.client.list_database_names() else "healthcare_demo"]
                logger.info(f"Successfully connected to MongoDB Atlas fallback database: {self.primary_db.name}")
            except Exception as fallback_err:
                logger.error(f"Failed to connect to MongoDB: {fallback_err}")
                self.client = None

    def is_connected(self) -> bool:
        if not self.client:
            return False
        try:
            self.client.admin.command("ping")
            return True
        except Exception:
            return False

    def _get_hospital_candidates(self) -> List[Dict[str, Any]]:
        """Retrieve hospitals/facilities from primary_db or fallback database."""
        if not self.is_connected():
            return []
        
        # 1. Try facilities in primary_db
        if "facilities" in self.primary_db.list_collection_names():
            facs = list(self.primary_db["facilities"].find({"isActive": True}))
            if not facs:
                facs = list(self.primary_db["facilities"].find({}))
            if facs:
                return facs

        # 2. Try hospitals in primary_db
        if "hospitals" in self.primary_db.list_collection_names():
            hosps = list(self.primary_db["hospitals"].find({"isActive": True}))
            if not hosps:
                hosps = list(self.primary_db["hospitals"].find({}))
            if hosps:
                return hosps

        # 3. Check healthcare_db or other local database
        for alt_db_name in ["healthconnect", "healthcare_db", "healthconnected"]:
            if alt_db_name in self.client.list_database_names():
                alt_db = self.client[alt_db_name]
                for col_name in ["facilities", "hospitals"]:
                    if col_name in alt_db.list_collection_names():
                        docs = list(alt_db[col_name].find({"isActive": True})) or list(alt_db[col_name].find({}))
                        if docs:
                            return docs

        return []

    def initialize_indexes(self):
        """Create necessary performance and search indexes safely."""
        if not self.is_connected():
            logger.warning("MongoDB not connected; skipping index initialization.")
            return

        def safe_create_index(collection, keys, **kwargs):
            try:
                collection.create_index(keys, **kwargs)
            except OperationFailure as err:
                logger.debug(f"Index notice for {collection.name}: {err.details.get('errmsg', err)}")
            except Exception as e:
                logger.debug(f"Index notice: {e}")

        try:
            # 1. Hospitals / Facilities: 2dsphere on location, text on name, district, type
            for col_name in ["hospitals", "facilities"]:
                if col_name in self.primary_db.list_collection_names():
                    h_col = self.primary_db[col_name]
                    safe_create_index(h_col, [("location", GEOSPHERE)])
                    safe_create_index(h_col, [("name", TEXT), ("district", TEXT), ("type", TEXT)])

            # 2. Medicines: text index on name, genericName, category
            if "medicines" in self.primary_db.list_collection_names():
                med_col = self.primary_db["medicines"]
                safe_create_index(med_col, [("name", TEXT), ("genericName", TEXT), ("category", TEXT)])

            # 3. Hospital Services
            for col_name in ["hospitalservices", "hospital_services", "operationalservices"]:
                if col_name in self.primary_db.list_collection_names():
                    col = self.primary_db[col_name]
                    safe_create_index(col, [("serviceName", ASCENDING)])
                    safe_create_index(col, [("hospitalId", ASCENDING)])

            # 4. Hospital Medicines inventory
            for col_name in ["hospitalmedicines", "hospital_medicines"]:
                if col_name in self.primary_db.list_collection_names():
                    col = self.primary_db[col_name]
                    safe_create_index(col, [("hospitalId", ASCENDING), ("medicineId", ASCENDING)])

            # 5. Diseases collection in primary_db
            if "diseases" in self.primary_db.list_collection_names():
                d_col = self.primary_db["diseases"]
                safe_create_index(d_col, [("disease", TEXT), ("specialty", TEXT)])
                safe_create_index(d_col, [("disease", ASCENDING)], unique=True)

            logger.info("MongoDB search & performance indexes initialized.")
        except Exception as e:
            logger.error(f"Error during index initialization: {e}")

    def seed_disease_kb(self):
        """Seed verified disease knowledge base from disease_knowledge_base.json."""
        if not self.is_connected():
            logger.warning("MongoDB not connected; skipping disease seeding.")
            return

        if not os.path.exists(KB_FILE):
            logger.warning(f"Disease KB file {KB_FILE} not found; skipping seeding.")
            return

        try:
            diseases_col = self.primary_db["diseases"]
            if diseases_col.count_documents({}) > 0:
                logger.info("Diseases collection already seeded. Skipping.")
                return

            with open(KB_FILE, "r", encoding="utf-8") as f:
                kb_data = json.load(f)

            docs_to_insert = []
            for d_name, d_data in kb_data.items():
                docs_to_insert.append({
                    "disease": d_name,
                    "specialty": d_data.get("specialty", "General Medicine"),
                    "signature_symptoms": d_data.get("signature_symptoms", []),
                    "all_associated_symptoms": d_data.get("all_associated_symptoms", []),
                    "urgency_level": d_data.get("urgency_level", "ROUTINE_CONSULTATION"),
                    "precautions": d_data.get("precautions", []),
                    "description": d_data.get("description", "")
                })

            if docs_to_insert:
                diseases_col.delete_many({})
                diseases_col.insert_many(docs_to_insert)
                logger.info(f"Seeded {len(docs_to_insert)} diseases into {self.primary_db.name}.diseases.")
        except Exception as e:
            logger.error(f"Error seeding disease knowledge base: {e}")

    # ================= QUERY METHODS =================

    def find_nearby_hospitals(
        self,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        max_distance_km: Optional[float] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find hospitals near geographic GPS coordinates with accurate Haversine distance calculation and sorting.
        Guarantees exact distance tracking in km and finds the true closest facility.
        """
        if not self.is_connected():
            return []

        if lat is None or lng is None:
            return self.search_hospitals(limit=limit)

        try:
            user_lat = float(lat)
            user_lng = float(lng)

            candidates = self._get_hospital_candidates()
            if not candidates:
                return []

            enriched = []
            for h in candidates:
                h["_id"] = str(h["_id"])
                # Extract coordinates reliably across schema variations
                coords = h.get("coordinates") or {}
                loc = h.get("location") or {}
                loc_coords = loc.get("coordinates", []) if isinstance(loc, dict) else []

                h_lat = h.get("latitude")
                if h_lat is None and isinstance(coords, dict):
                    h_lat = coords.get("lat") or coords.get("latitude")
                if h_lat is None and len(loc_coords) >= 2:
                    h_lat = loc_coords[1]

                h_lng = h.get("longitude")
                if h_lng is None and isinstance(coords, dict):
                    h_lng = coords.get("lng") or coords.get("longitude")
                if h_lng is None and len(loc_coords) >= 1:
                    h_lng = loc_coords[0]

                if h_lat is not None and h_lng is not None:
                    try:
                        h_lat = float(h_lat)
                        h_lng = float(h_lng)
                        dist = calculate_haversine_distance(user_lat, user_lng, h_lat, h_lng)
                        h["distanceKm"] = round(dist, 1)
                        h["distance_km"] = round(dist, 1)
                        h["distance_str"] = f"{round(dist, 1)} km"
                        enriched.append((dist, h))
                    except (ValueError, TypeError):
                        h["distanceKm"] = 999.0
                        h["distance_km"] = 999.0
                        h["distance_str"] = "N/A"
                        enriched.append((999.0, h))
                else:
                    h["distanceKm"] = 999.0
                    h["distance_km"] = 999.0
                    h["distance_str"] = "N/A"
                    enriched.append((999.0, h))

            # Sort strictly by distance in ascending order
            enriched.sort(key=lambda x: x[0])

            # Apply max_distance_km filter if provided and results exist
            if max_distance_km is not None and max_distance_km > 0:
                within_radius = [item[1] for item in enriched if item[0] <= max_distance_km]
                if within_radius:
                    results = within_radius[:limit]
                else:
                    results = [item[1] for item in enriched[:limit]]
            else:
                results = [item[1] for item in enriched[:limit]]

            if results:
                results[0]["is_closest_facility"] = True

            return results
        except Exception as e:
            logger.error(f"Error in find_nearby_hospitals GPS tracking: {e}")
            return self.search_hospitals(limit=limit)

    def search_hospitals(
        self,
        query: Optional[str] = None,
        district: Optional[str] = None,
        emergency_only: bool = False,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search hospitals by name, district, or emergency availability."""
        if not self.is_connected():
            return []

        try:
            filter_doc = {"isActive": True}
            if emergency_only:
                filter_doc["emergencyAvailable"] = True
            if district:
                filter_doc["district"] = {"$regex": re.escape(district), "$options": "i"}

            if query and query.strip():
                stop_words = {"which", "what", "where", "is", "are", "the", "in", "and", "or", "of", "for", "its", "located", "hospital", "hospitals", "operating", "hours", "contact", "number", "address", "phone"}
                words = [w.strip() for w in re.split(r"\W+", query.lower()) if len(w.strip()) > 2 and w.strip() not in stop_words]
                
                or_clauses = []
                if len(query.strip()) <= 30:
                    or_clauses.extend([
                        {"name": {"$regex": re.escape(query.strip()), "$options": "i"}},
                        {"address": {"$regex": re.escape(query.strip()), "$options": "i"}},
                        {"district": {"$regex": re.escape(query.strip()), "$options": "i"}}
                    ])

                for word in words:
                    or_clauses.extend([
                        {"name": {"$regex": re.escape(word), "$options": "i"}},
                        {"address": {"$regex": re.escape(word), "$options": "i"}},
                        {"district": {"$regex": re.escape(word), "$options": "i"}},
                        {"type": {"$regex": re.escape(word), "$options": "i"}}
                    ])

                if or_clauses:
                    filter_doc["$or"] = or_clauses

            candidates = self._get_hospital_candidates()
            results = []
            
            for h in candidates:
                # Check active and emergency filters
                if emergency_only and not h.get("emergencyAvailable"):
                    continue
                if district and district.lower() not in h.get("district", "").lower():
                    continue

                if query and query.strip():
                    q_lower = query.lower()
                    h_name = h.get("name", "").lower()
                    h_addr = h.get("address", "").lower()
                    h_dist = h.get("district", "").lower()
                    h_type = h.get("type", "").lower()

                    matches = (q_lower in h_name or q_lower in h_addr or q_lower in h_dist or
                               any(w in h_name or w in h_addr or w in h_dist or w in h_type for w in words))
                    if not matches:
                        continue

                h_copy = dict(h)
                h_copy["_id"] = str(h_copy["_id"])
                results.append(h_copy)
                if len(results) >= limit:
                    break

            return results
        except Exception as e:
            logger.error(f"Error searching hospitals: {e}")
            return []

    def search_medicines(self, query: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search catalog medicines by brand or generic name."""
        if not self.is_connected():
            return []

        try:
            filter_doc = {"isActive": True}
            if query and query.strip():
                q = query.strip()
                filter_doc["$or"] = [
                    {"name": {"$regex": re.escape(q), "$options": "i"}},
                    {"genericName": {"$regex": re.escape(q), "$options": "i"}},
                    {"category": {"$regex": re.escape(q), "$options": "i"}},
                    {"description": {"$regex": re.escape(q), "$options": "i"}}
                ]
            
            med_col = self.primary_db["medicines"] if "medicines" in self.primary_db.list_collection_names() else None
            if med_col is None:
                for alt in ["healthcare_db", "healthconnected"]:
                    if alt in self.client.list_database_names() and "medicines" in self.client[alt].list_collection_names():
                        med_col = self.client[alt]["medicines"]
                        break

            if med_col is None:
                return []

            results = list(med_col.find(filter_doc).limit(limit))
            for r in results:
                r["_id"] = str(r["_id"])
            return results
        except Exception as e:
            logger.error(f"Error searching medicines: {e}")
            return []

    def check_medicine_stock(
        self,
        medicine_query: str,
        hospital_name: Optional[str] = None,
        district: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Join medicines with hospital inventory and hospitals to report real-time stock."""
        if not self.is_connected():
            return []

        try:
            meds = self.search_medicines(medicine_query)
            if not meds:
                return []

            med_map = {str(m["_id"]): m for m in meds}
            h_candidates = self._get_hospital_candidates()
            hospitals = {str(h["_id"]): h for h in h_candidates}

            inv_records = []
            for col_name in ["hospitalmedicines", "hospital_medicines", "dispensingrecords"]:
                if col_name in self.primary_db.list_collection_names():
                    inv_records.extend(list(self.primary_db[col_name].find()))

            stock_results = []
            seen_pairs = set()

            for inv in inv_records:
                inv_med_id = str(inv.get("medicineId", ""))
                inv_hosp_id = str(inv.get("hospitalId", inv.get("facilityId", "")))
                pair_key = (inv_hosp_id, inv_med_id)

                if pair_key in seen_pairs:
                    continue

                if inv_med_id in med_map and inv_hosp_id in hospitals:
                    seen_pairs.add(pair_key)
                    hosp = hospitals[inv_hosp_id]
                    med = med_map[inv_med_id]

                    if hospital_name and hospital_name.lower() not in hosp["name"].lower():
                        continue
                    if district and district.lower() not in hosp.get("district", "").lower():
                        continue

                    stock_results.append({
                        "medicine_name": med["name"],
                        "generic_name": med.get("genericName", med["name"]),
                        "category": med.get("category", "General"),
                        "hospital_name": hosp["name"],
                        "hospital_type": hosp.get("type", "Hospital"),
                        "district": hosp.get("district", ""),
                        "phone": hosp.get("phone", hosp.get("contactNumber", "")),
                        "quantity": inv.get("quantity", inv.get("stockQuantity", 0)),
                        "availability_status": inv.get("availabilityStatus", "In Stock"),
                        "last_updated": str(inv.get("lastUpdated", inv.get("updatedAt", "")))
                    })

            return stock_results
        except Exception as e:
            logger.error(f"Error checking medicine stock: {e}")
            return []

    def search_hospital_services(
        self,
        service_query: Optional[str] = None,
        hospital_name: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Join hospital services with hospitals to show available medical services."""
        if not self.is_connected():
            return []

        try:
            services = []
            for col_name in ["hospitalservices", "hospital_services", "operationalservices"]:
                if col_name in self.primary_db.list_collection_names():
                    services.extend(list(self.primary_db[col_name].find()))

            h_candidates = self._get_hospital_candidates()
            hospitals = {str(h["_id"]): h for h in h_candidates}

            results = []
            seen_entries = set()

            for s in services:
                s_name = s.get("serviceName", s.get("name", ""))
                desc = s.get("description", "")
                if service_query and (service_query.lower() not in s_name.lower() and service_query.lower() not in desc.lower()):
                    continue

                hosp_id = str(s.get("hospitalId", s.get("facilityId", "")))
                hosp = hospitals.get(hosp_id)

                if hosp:
                    if hospital_name and hospital_name.lower() not in hosp["name"].lower():
                        continue

                    entry_key = (hosp["name"], s_name)
                    if entry_key in seen_entries:
                        continue
                    seen_entries.add(entry_key)

                    results.append({
                        "service_name": s_name,
                        "description": desc or f"{s_name} department services",
                        "is_available": s.get("isAvailable", True),
                        "estimated_cost_inr": s.get("estimatedCost", None),
                        "hospital_name": hosp["name"],
                        "hospital_type": hosp.get("type", "Hospital"),
                        "district": hosp.get("district", ""),
                        "phone": hosp.get("phone", hosp.get("contactNumber", "")),
                        "opening_time": hosp.get("openingTime", "08:00 AM"),
                        "closing_time": hosp.get("closingTime", "08:00 PM")
                    })

            return results
        except Exception as e:
            logger.error(f"Error searching hospital services: {e}")
            return []

    def get_disease_knowledge(self, disease_name: str) -> Optional[Dict[str, Any]]:
        """Retrieve verified disease profile from diseases collection."""
        if not self.is_connected():
            return None

        try:
            d_col = self.primary_db["diseases"] if "diseases" in self.primary_db.list_collection_names() else None
            if d_col is None:
                for alt in ["healthcare_db", "healthconnect"]:
                    if alt in self.client.list_database_names() and "diseases" in self.client[alt].list_collection_names():
                        d_col = self.client[alt]["diseases"]
                        break

            if d_col is None:
                return None

            clean_name = disease_name.strip().lower()
            doc = d_col.find_one({
                "$or": [
                    {"disease": {"$regex": f"^{re.escape(clean_name)}$", "$options": "i"}},
                    {"disease": {"$regex": re.escape(clean_name), "$options": "i"}}
                ]
            })
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        except Exception as e:
            logger.error(f"Error retrieving disease profile: {e}")
            return None

    def get_patient_records(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Securely retrieve patient demographics, EHR, and diagnostics."""
        if not self.is_connected() or not patient_id:
            return None

        try:
            pid = patient_id.strip()
            
            p_col = self.primary_db["patients"] if "patients" in self.primary_db.list_collection_names() else self.demo_db.get("patients")
            if p_col is None:
                return None

            patient = p_col.find_one(
                {"$or": [{"patientId": pid}, {"id": pid}, {"phone": pid}, {"abhaId": pid}, {"healthCardNumber": pid}]}
            )
            if not patient:
                return None

            patient["_id"] = str(patient["_id"])

            history = None
            for h_col_name in ["patienthistories", "patienthealthrecords"]:
                if h_col_name in self.primary_db.list_collection_names():
                    history = self.primary_db[h_col_name].find_one({"$or": [{"patientId": patient.get("patientId", pid)}, {"id": pid}]})
                    if history:
                        history["_id"] = str(history["_id"])
                        break

            diagnostics = []
            for d_col_name in ["diagnostics", "diagnosticorders"]:
                if d_col_name in self.primary_db.list_collection_names():
                    docs = list(self.primary_db[d_col_name].find({"$or": [{"patientId": patient.get("patientId", pid)}, {"patientId": pid}]}))
                    for d in docs:
                        d["_id"] = str(d["_id"])
                        diagnostics.append(d)

            return {
                "demographics": patient,
                "history": history,
                "diagnostics": diagnostics
            }
        except Exception as e:
            logger.error(f"Error retrieving patient record: {e}")
            return None


# Global singleton instance
mongo_manager = MongoManager()

if __name__ == "__main__":
    print(f"MongoDB Connected: {mongo_manager.is_connected()}")
    if mongo_manager.is_connected():
        mongo_manager.initialize_indexes()
        mongo_manager.seed_disease_kb()
        hospitals = mongo_manager.find_nearby_hospitals(23.2156, 72.6369, limit=3)
        print(f"Found {len(hospitals)} nearby hospitals from {mongo_manager.primary_db.name}:")
        for h in hospitals:
            print(f"  - {h.get('name')} ({h.get('distance_str')})")
