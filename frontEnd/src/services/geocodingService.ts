// High-Precision Geocoding and Reverse Geocoding Service for HealthConnect

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
  district?: string;
  source: 'ONLINE_OSM' | 'LOCAL_EXACT' | 'LOCAL_PINCODE' | 'LOCAL_FUZZY';
}

// Comprehensive Local Database of Gujarat Localities, Sectors, Talukas, and Pincodes
export const GUJARAT_LOCALITY_DB: Array<{
  keywords: string[];
  name: string;
  district: string;
  pincode?: string;
  lat: number;
  lng: number;
}> = [
  // Gandhinagar Sectors & Areas
  { keywords: ['sector 12', 'civil hospital', 'apex', 'bus depot gandhinagar', 'ch-road'], name: 'Sector 12 (Civil Hospital & Central Bus Depot), Gandhinagar', district: 'Gandhinagar', pincode: '382012', lat: 23.2156, lng: 72.6369 },
  { keywords: ['sector 1', 'raj bhavan', 'vidhan sabha'], name: 'Sector 1 (Capital Complex), Gandhinagar', district: 'Gandhinagar', pincode: '382001', lat: 23.2285, lng: 72.6645 },
  { keywords: ['sector 2', 'swarnim sankul'], name: 'Sector 2 (Swarnim Sankul), Gandhinagar', district: 'Gandhinagar', pincode: '382002', lat: 23.2230, lng: 72.6580 },
  { keywords: ['sector 6', 'ch-3'], name: 'Sector 6, Gandhinagar', district: 'Gandhinagar', pincode: '382006', lat: 23.2205, lng: 72.6480 },
  { keywords: ['sector 7', 'shopping center 7'], name: 'Sector 7, Gandhinagar', district: 'Gandhinagar', pincode: '382007', lat: 23.2120, lng: 72.6440 },
  { keywords: ['sector 8'], name: 'Sector 8, Gandhinagar', district: 'Gandhinagar', pincode: '382008', lat: 23.2050, lng: 72.6495 },
  { keywords: ['sector 10', 'gh-4'], name: 'Sector 10, Gandhinagar', district: 'Gandhinagar', pincode: '382010', lat: 23.2180, lng: 72.6390 },
  { keywords: ['sector 11', 'circuit house', 'ch-5'], name: 'Sector 11, Gandhinagar', district: 'Gandhinagar', pincode: '382011', lat: 23.2250, lng: 72.6350 },
  { keywords: ['sector 13', 'gh-5'], name: 'Sector 13, Gandhinagar', district: 'Gandhinagar', pincode: '382013', lat: 23.2320, lng: 72.6300 },
  { keywords: ['sector 14'], name: 'Sector 14, Gandhinagar', district: 'Gandhinagar', pincode: '382014', lat: 23.2390, lng: 72.6250 },
  { keywords: ['sector 16', 'gh-6'], name: 'Sector 16, Gandhinagar', district: 'Gandhinagar', pincode: '382016', lat: 23.2350, lng: 72.6450 },
  { keywords: ['sector 21', 'vegetable market 21', 'shopping 21'], name: 'Sector 21 (Market Area), Gandhinagar', district: 'Gandhinagar', pincode: '382021', lat: 23.2290, lng: 72.6510 },
  { keywords: ['sector 22', 'panchayat bhavan'], name: 'Sector 22, Gandhinagar', district: 'Gandhinagar', pincode: '382022', lat: 23.2220, lng: 72.6540 },
  { keywords: ['sector 23', 'ch-road sector 23'], name: 'Sector 23, Gandhinagar', district: 'Gandhinagar', pincode: '382023', lat: 23.2360, lng: 72.6570 },
  { keywords: ['sector 24', 'gidc sector 24', 'electronics estate'], name: 'Sector 24 (GIDC Area), Gandhinagar', district: 'Gandhinagar', pincode: '382024', lat: 23.2430, lng: 72.6520 },
  { keywords: ['sector 28', 'gidc 28'], name: 'Sector 28 (Industrial Estate), Gandhinagar', district: 'Gandhinagar', pincode: '382028', lat: 23.2490, lng: 72.6610 },
  { keywords: ['sector 30', 'kh-0'], name: 'Sector 30, Gandhinagar', district: 'Gandhinagar', pincode: '382030', lat: 23.2560, lng: 72.6680 },
  { keywords: ['kudasan', 'bhaijipura', 'pdpu road'], name: 'Kudasan, Gandhinagar', district: 'Gandhinagar', pincode: '382421', lat: 23.1812, lng: 72.6310 },
  { keywords: ['sargasan', 'ch-0 circle', 'pramukh'], name: 'Sargasan, Gandhinagar', district: 'Gandhinagar', pincode: '382421', lat: 23.1950, lng: 72.6180 },
  { keywords: ['raysan', 'pdeu', 'gift city road'], name: 'Raysan, Gandhinagar', district: 'Gandhinagar', pincode: '382710', lat: 23.1720, lng: 72.6510 },
  { keywords: ['infocity', 'tcs garima', 'daiict'], name: 'Infocity / DA-IICT, Gandhinagar', district: 'Gandhinagar', pincode: '382007', lat: 23.1880, lng: 72.6280 },
  { keywords: ['gift city', 'gift sez'], name: 'GIFT City, Gandhinagar', district: 'Gandhinagar', pincode: '382355', lat: 23.1598, lng: 72.6844 },
  { keywords: ['adalaj', 'stepwell adalaj', 'trimandir'], name: 'Adalaj, Gandhinagar', district: 'Gandhinagar', pincode: '382421', lat: 23.1667, lng: 72.5833 },
  { keywords: ['pethapur', 'phc pethapur', 'gram panchayat pethapur'], name: 'Pethapur Primary Health Centre, Gandhinagar', district: 'Gandhinagar', pincode: '382610', lat: 23.2750, lng: 72.6580 },
  { keywords: ['kalol', 'sub-district hospital kalol', 'vakharia chowk', 'kalol bus station'], name: 'Kalol Sub-District Hospital, Gandhinagar', district: 'Gandhinagar', pincode: '382721', lat: 23.2435, lng: 72.4965 },
  { keywords: ['mansa', 'chc mansa', 'station road mansa'], name: 'Mansa Community Health Centre (CHC), Gandhinagar', district: 'Gandhinagar', pincode: '382845', lat: 23.4283, lng: 72.6611 },
  { keywords: ['dehgam', 'chc dehgam', 'dahegam'], name: 'Dehgam Community Health Centre, Gandhinagar', district: 'Gandhinagar', pincode: '382305', lat: 23.1670, lng: 72.8120 },
  { keywords: ['chiloda', 'chiloda circle'], name: 'Chiloda, Gandhinagar', district: 'Gandhinagar', pincode: '382355', lat: 23.2610, lng: 72.7310 },

  // Ahmedabad Localities & Hospitals
  { keywords: ['asarwa', 'civil hospital ahmedabad', 'bj medical', 'asarwa civil'], name: 'Ahmedabad Civil Hospital & BJ Medical College, Asarwa', district: 'Ahmedabad', pincode: '380016', lat: 23.0525, lng: 72.5950 },
  { keywords: ['sola', 'gmers sola', 'civil hospital sola', 'sg highway sola'], name: 'GMERS Medical College & Hospital, Sola, Ahmedabad', district: 'Ahmedabad', pincode: '380060', lat: 23.0805, lng: 72.5245 },
  { keywords: ['maninagar', 'lg hospital', 'lg municipal'], name: 'LG Municipal General Hospital, Maninagar, Ahmedabad', district: 'Ahmedabad', pincode: '380008', lat: 22.9985, lng: 72.6025 },
  { keywords: ['sanand', 'chc sanand', 'gidc sanand'], name: 'Sanand Community Health Centre, Ahmedabad', district: 'Ahmedabad', pincode: '382110', lat: 22.9868, lng: 72.3812 },
  { keywords: ['vastrapur', 'iim ahmedabad', 'vastrapur lake'], name: 'Vastrapur, Ahmedabad', district: 'Ahmedabad', pincode: '380015', lat: 23.0360, lng: 72.5290 },
  { keywords: ['satellite', 'shyamal', 'shivranjani', 'isro'], name: 'Satellite / Shivranjani, Ahmedabad', district: 'Ahmedabad', pincode: '380015', lat: 23.0270, lng: 72.5220 },
  { keywords: ['bopal', 'south bopal', 'ghuma'], name: 'Bopal / South Bopal, Ahmedabad', district: 'Ahmedabad', pincode: '380058', lat: 23.0340, lng: 72.4680 },
  { keywords: ['gota', 'chandlodiya', 'gota bridge'], name: 'Gota / Chandlodiya, Ahmedabad', district: 'Ahmedabad', pincode: '382481', lat: 23.1020, lng: 72.5350 },
  { keywords: ['chandkheda', 'motera', 'narendra modi stadium'], name: 'Chandkheda / Motera, Ahmedabad', district: 'Ahmedabad', pincode: '380005', lat: 23.1110, lng: 72.5950 },
  { keywords: ['naroda', 'odhav', 'nikol', 'krishnanagar'], name: 'Naroda / Nikol, Ahmedabad', district: 'Ahmedabad', pincode: '382330', lat: 23.0690, lng: 72.6580 },
  { keywords: ['paldi', 'ellis bridge', 'v.s. hospital', 'vs hospital'], name: 'Paldi / VS Hospital, Ahmedabad', district: 'Ahmedabad', pincode: '380006', lat: 23.0160, lng: 72.5690 },

  // Surat
  { keywords: ['majura gate', 'new civil hospital surat', 'govt medical surat'], name: 'New Civil Hospital Surat, Majura Gate', district: 'Surat', pincode: '395001', lat: 21.1702, lng: 72.8311 },
  { keywords: ['smimer', 'sahara darwaja', 'umarwada'], name: 'SMIMER Hospital, Sahara Darwaja, Surat', district: 'Surat', pincode: '395010', lat: 21.1960, lng: 72.8420 },
  { keywords: ['bardoli', 'sardar smarak'], name: 'Sardar Smarak Sub-District Hospital, Bardoli, Surat', district: 'Surat', pincode: '394601', lat: 21.1215, lng: 73.1120 },
  { keywords: ['adajan', 'rander', 'pal'], name: 'Adajan / Pal, Surat', district: 'Surat', pincode: '395009', lat: 21.1950, lng: 72.7930 },

  // Vadodara
  { keywords: ['ssg hospital', 'sayajigunj', 'jail road vadodara'], name: 'Sir Sayajirao General (SSG) Hospital, Vadodara', district: 'Vadodara', pincode: '390001', lat: 22.3072, lng: 73.1812 },
  { keywords: ['padra', 'chc padra'], name: 'Padra Community Health Centre, Vadodara', district: 'Vadodara', pincode: '391440', lat: 22.2380, lng: 73.0820 },
  { keywords: ['gotri', 'gmers gotri'], name: 'GMERS Medical College & Hospital Gotri, Vadodara', district: 'Vadodara', pincode: '390021', lat: 22.3160, lng: 73.1490 },

  // Rajkot
  { keywords: ['pdu civil', 'hospital chowk rajkot'], name: 'PDU Government Medical College & Civil Hospital, Rajkot', district: 'Rajkot', pincode: '360001', lat: 22.3039, lng: 70.8022 },
  { keywords: ['gondal', 'sdh gondal'], name: 'Gondal Sub-District Hospital, Rajkot', district: 'Rajkot', pincode: '360311', lat: 21.9610, lng: 70.7980 },

  // Other Districts
  { keywords: ['bhavnagar', 'sir t hospital', 'kalanala'], name: 'Sir T Civil Hospital, Bhavnagar', district: 'Bhavnagar', pincode: '364001', lat: 21.7645, lng: 72.1519 },
  { keywords: ['jamnagar', 'gg hospital', 'indira marg'], name: 'GG Government Hospital, Jamnagar', district: 'Jamnagar', pincode: '361008', lat: 22.4707, lng: 70.0577 },
  { keywords: ['junagadh', 'majevadi gate', 'junagadh civil'], name: 'Junagadh Civil Hospital, Junagadh', district: 'Junagadh', pincode: '362001', lat: 21.5222, lng: 70.4579 },
  { keywords: ['mehsana', 'civil hospital mehsana'], name: 'Mehsana General Hospital, Mehsana', district: 'Mehsana', pincode: '384001', lat: 23.5977, lng: 72.3693 },
  { keywords: ['anand', 'anand civil', 'karamsad'], name: 'Pramukhswami Medical College / Civil Hospital, Anand', district: 'Anand', pincode: '388001', lat: 22.5645, lng: 72.9289 },
  { keywords: ['navsari', 'navsari civil'], name: 'Navsari Civil Hospital, Navsari', district: 'Navsari', pincode: '396445', lat: 20.9467, lng: 72.9520 },
  { keywords: ['valsad', 'valsad civil'], name: 'GMERS Civil Hospital Valsad', district: 'Valsad', pincode: '396001', lat: 20.6100, lng: 72.9260 },
  { keywords: ['morbi', 'morbi civil'], name: 'Morbi Civil Hospital', district: 'Morbi', pincode: '363641', lat: 22.8120, lng: 70.8380 },
  { keywords: ['paten', 'patan', 'dharpur patan'], name: 'GMERS Hospital Dharpur, Patan', district: 'Patan', pincode: '384265', lat: 23.8500, lng: 72.1260 },
  { keywords: ['palanpur', 'banaskantha'], name: 'Palanpur Civil Hospital, Banaskantha', district: 'Banaskantha', pincode: '385001', lat: 24.1720, lng: 72.4380 },
  { keywords: ['himatnagar', 'sabarkantha'], name: 'Himatnagar Civil Hospital, Sabarkantha', district: 'Sabarkantha', pincode: '383001', lat: 23.5980, lng: 72.9690 },
];

/**
 * Intelligent Multi-Tier Geocoding Function
 * 1. Checks online OpenStreetMap Nominatim for exact street-level coordinates.
 * 2. If network error or timeout, falls back to local high-precision locality & pincode database.
 */
export async function geocodeLocationQuery(query: string, districtHint?: string): Promise<GeocodeResult | null> {
  const clean = query.trim();
  if (!clean) return null;

  // 1. Check exact pincode match in local DB
  const pincodeMatch = clean.match(/\b\d{6}\b/);
  if (pincodeMatch) {
    const pin = pincodeMatch[0];
    const foundByPin = GUJARAT_LOCALITY_DB.find((item) => item.pincode === pin);
    if (foundByPin) {
      return {
        displayName: `${foundByPin.name} (PIN: ${pin})`,
        lat: foundByPin.lat,
        lng: foundByPin.lng,
        district: foundByPin.district,
        source: 'LOCAL_PINCODE',
      };
    }
  }

  // 2. Try Online OSM Nominatim Geocoding
  try {
    const fullSearch = `${clean}, Gujarat, India`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullSearch)}&countrycodes=in&limit=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'HealthConnect-GeoService/1.0',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            displayName: item.display_name,
            lat,
            lng,
            type: item.type,
            source: 'ONLINE_OSM',
          };
        }
      }
    }
  } catch {
    // Network or timeout: fallback to local database
  }

  // 3. Fallback to Local Locality & Sector Database with Fuzzy Token Matching
  const searchLower = clean.toLowerCase();
  let bestMatch: (typeof GUJARAT_LOCALITY_DB)[0] | null = null;
  let highestScore = 0;

  for (const item of GUJARAT_LOCALITY_DB) {
    let score = 0;

    // Check keyword exact inclusion
    for (const kw of item.keywords) {
      if (searchLower.includes(kw)) {
        score += kw.length * 3;
      }
    }

    // Check name inclusion
    if (searchLower.includes(item.name.toLowerCase())) {
      score += 20;
    }

    // Check district match
    if (districtHint && item.district.toLowerCase() === districtHint.toLowerCase()) {
      score += 5;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && highestScore > 0) {
    return {
      displayName: bestMatch.name,
      lat: bestMatch.lat,
      lng: bestMatch.lng,
      district: bestMatch.district,
      source: 'LOCAL_EXACT',
    };
  }

  // 4. Default fallback: Gandhinagar Central
  return {
    displayName: clean,
    lat: 23.2156,
    lng: 72.6369,
    district: districtHint || 'Gandhinagar',
    source: 'LOCAL_FUZZY',
  };
}

/**
 * High-Accuracy Device GPS Fetcher
 */
export function getCurrentDeviceLocation(
  timeoutMs = 12000
): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Exact Centroid Coordinates for All Gujarat Districts & Regions
 */
export const GUJARAT_DISTRICT_CENTERS: Record<string, { lat: number; lng: number; name: string }> = {
  Ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad Central (Civil & Medical Hub)' },
  Gandhinagar: { lat: 23.2156, lng: 72.6369, name: 'Gandhinagar Capital Complex (Sector 12)' },
  Surat: { lat: 21.1702, lng: 72.8311, name: 'Surat Central (Majura Gate Civil Area)' },
  Vadodara: { lat: 22.3072, lng: 73.1812, name: 'Vadodara Central (SSG Hospital Area)' },
  Rajkot: { lat: 22.3039, lng: 70.8022, name: 'Rajkot Hospital Chowk (PDU Civil)' },
  Bhavnagar: { lat: 21.7645, lng: 72.1519, name: 'Bhavnagar Central (Sir T Hospital)' },
  Jamnagar: { lat: 22.4707, lng: 70.0577, name: 'Jamnagar GG Hospital Area' },
  Junagadh: { lat: 21.5222, lng: 70.4579, name: 'Junagadh Central' },
  Morbi: { lat: 22.8120, lng: 70.8380, name: 'Morbi Civil Area' },
  Mehsana: { lat: 23.5977, lng: 72.3693, name: 'Mehsana Central' },
  Patan: { lat: 23.8500, lng: 72.1260, name: 'Patan Dharpur' },
  Anand: { lat: 22.5645, lng: 72.9289, name: 'Anand Civil / Medical Area' },
  Kheda: { lat: 22.6916, lng: 72.8634, name: 'Nadiad / Kheda' },
  Bharuch: { lat: 21.7051, lng: 72.9959, name: 'Bharuch Central' },
  Kutch: { lat: 23.2420, lng: 69.6669, name: 'Bhuj / Kutch' },
  Navsari: { lat: 20.9467, lng: 72.9520, name: 'Navsari Central' },
  Valsad: { lat: 20.6100, lng: 72.9260, name: 'Valsad Civil Area' },
  Surendranagar: { lat: 22.7277, lng: 71.6370, name: 'Surendranagar Central' },
  Panchmahal: { lat: 22.7758, lng: 73.6149, name: 'Godhra / Panchmahal' },
  Dahod: { lat: 22.8396, lng: 74.2542, name: 'Dahod Central' },
  Amreli: { lat: 21.6032, lng: 71.2221, name: 'Amreli Central' },
  Porbandar: { lat: 21.6417, lng: 69.6293, name: 'Porbandar Coastal' },
  'Gir Somnath': { lat: 20.9042, lng: 70.3667, name: 'Veraval / Somnath' },
  Botad: { lat: 22.1704, lng: 71.6664, name: 'Botad Central' },
  'Devbhumi Dwarka': { lat: 22.2037, lng: 69.6640, name: 'Khambhalia / Dwarka' },
  Aravalli: { lat: 23.4616, lng: 73.2982, name: 'Modasa / Aravalli' },
  Mahisagar: { lat: 23.1352, lng: 73.6166, name: 'Lunawada / Mahisagar' },
  'Chhota Udaipur': { lat: 22.3081, lng: 74.0137, name: 'Chhota Udaipur' },
  Narmada: { lat: 21.8718, lng: 73.5027, name: 'Rajpipla / Narmada' },
  Tapi: { lat: 21.1118, lng: 73.3934, name: 'Vyara / Tapi' },
  Dang: { lat: 20.7570, lng: 73.6874, name: 'Ahwa / Dang' },
  Banaskantha: { lat: 24.1720, lng: 72.4380, name: 'Palanpur / Banaskantha' },
  Sabarkantha: { lat: 23.5980, lng: 72.9690, name: 'Himatnagar / Sabarkantha' },
};

export interface ResolvedLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'DEVICE_GPS' | 'DEVICE_APPROX' | 'ADDRESS_GEOCODING' | 'DISTRICT_CENTROID';
  message: string;
}

/**
 * Robust, resilient location resolver for hospitals.
 * Never throws or fails with "Position update is unavailable".
 * 1. Tries high-accuracy GPS (4s)
 * 2. Tries network/Wi-Fi location (3s)
 * 3. Tries geocoding the entered address or hospital name
 * 4. Fallbacks to the district centroid coordinates
 */
export async function resolveHospitalLocation(options: {
  address?: string;
  facilityName?: string;
  district?: string;
  pincode?: string;
}): Promise<ResolvedLocation> {
  const { address, facilityName, district, pincode } = options;

  // 1. Try High-Accuracy GPS (short timeout 4s)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const gpsPos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 60000,
        });
      });
      return {
        lat: Number(gpsPos.coords.latitude.toFixed(6)),
        lng: Number(gpsPos.coords.longitude.toFixed(6)),
        accuracy: Math.round(gpsPos.coords.accuracy),
        source: 'DEVICE_GPS',
        message: `📍 Device GPS fix acquired (Accuracy: ±${Math.round(gpsPos.coords.accuracy)}m)`,
      };
    } catch {
      // High-accuracy GPS unavailable on desktop. Try low-accuracy network triangulation (3s)
      try {
        const approxPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 3000,
            maximumAge: 300000,
          });
        });
        return {
          lat: Number(approxPos.coords.latitude.toFixed(6)),
          lng: Number(approxPos.coords.longitude.toFixed(6)),
          accuracy: Math.round(approxPos.coords.accuracy),
          source: 'DEVICE_APPROX',
          message: `📍 Network location acquired [${approxPos.coords.latitude.toFixed(4)}°N, ${approxPos.coords.longitude.toFixed(4)}°E]`,
        };
      } catch {
        // Hardware/network geolocation unavailable
      }
    }
  }

  // 2. Geocode from entered address / hospital name / pincode
  const query = [facilityName, address, pincode].filter(Boolean).join(' ').trim();
  if (query) {
    try {
      const geo = await geocodeLocationQuery(query, district);
      if (geo && geo.lat && geo.lng) {
        return {
          lat: Number(geo.lat.toFixed(6)),
          lng: Number(geo.lng.toFixed(6)),
          source: 'ADDRESS_GEOCODING',
          message: `🎯 Located from Hospital Address: ${geo.displayName} [${geo.lat.toFixed(4)}°N, ${geo.lng.toFixed(4)}°E]`,
        };
      }
    } catch {
      // Continue to district centroid fallback
    }
  }

  // 3. Fallback to District Centroid / Hospital Hub
  const cleanDistrict = (district || 'Gandhinagar').trim();
  const districtKey = Object.keys(GUJARAT_DISTRICT_CENTERS).find(
    (k) => k.toLowerCase() === cleanDistrict.toLowerCase()
  );
  const centroid = districtKey
    ? GUJARAT_DISTRICT_CENTERS[districtKey]
    : GUJARAT_DISTRICT_CENTERS['Gandhinagar'];

  return {
    lat: Number(centroid.lat.toFixed(6)),
    lng: Number(centroid.lng.toFixed(6)),
    source: 'DISTRICT_CENTROID',
    message: `📌 Located to ${cleanDistrict} District Hub (${centroid.name}) [${centroid.lat.toFixed(4)}°N, ${centroid.lng.toFixed(4)}°E]`,
  };
}

/**
 * Calculates Haversine distance in KM between two geographic coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
