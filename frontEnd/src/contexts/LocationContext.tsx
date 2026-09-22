import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface LocationFacility {
  id: string;
  name: string;
  district: string;
  type: string;
  typeBadge: string;
  address: string;
  availableBeds?: number;
  emergency24x7: boolean;
}

export const GUJARAT_DISTRICTS = [
  'Gandhinagar',
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Bhavnagar',
  'Jamnagar',
  'Junagadh',
] as const;

export const AVAILABLE_HOSPITALS: LocationFacility[] = [
  // Gandhinagar
  {
    id: 'fac_civil_01',
    name: 'Gandhinagar Civil Hospital & Medical College',
    district: 'Gandhinagar',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'Apex District Hospital',
    address: 'Sector 12, Near Bus Depot, Gandhinagar - 382012',
    availableBeds: 48,
    emergency24x7: true,
  },
  {
    id: 'fac_mansa_02',
    name: 'Mansa Community Health Centre (CHC)',
    district: 'Gandhinagar',
    type: 'CHC',
    typeBadge: 'Community Health Centre',
    address: 'Station Road, Mansa, Gandhinagar - 382845',
    availableBeds: 18,
    emergency24x7: true,
  },
  {
    id: 'fac_kalol_03',
    name: 'Kalol Sub-District Hospital',
    district: 'Gandhinagar',
    type: 'SUB_DISTRICT_HOSPITAL',
    typeBadge: 'Sub-District Hospital',
    address: 'Vakharia Chowk, Kalol, Gandhinagar - 382721',
    availableBeds: 22,
    emergency24x7: true,
  },
  {
    id: 'fac_pet_04',
    name: 'Pethapur Primary Health Centre (PHC)',
    district: 'Gandhinagar',
    type: 'PHC',
    typeBadge: 'Primary Health Centre',
    address: 'Near Old Gram Panchayat, Pethapur - 382610',
    availableBeds: 7,
    emergency24x7: false,
  },

  // Ahmedabad
  {
    id: 'fac_ahd_civil_01',
    name: 'Ahmedabad Civil Hospital & BJ Medical College',
    district: 'Ahmedabad',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'Apex Super-Specialty',
    address: 'Asarwa, Ahmedabad - 380016',
    availableBeds: 180,
    emergency24x7: true,
  },
  {
    id: 'fac_ahd_sola_02',
    name: 'GMERS Medical College & Civil Hospital Sola',
    district: 'Ahmedabad',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'Medical College & Hospital',
    address: 'SG Highway, Sola, Ahmedabad - 380060',
    availableBeds: 75,
    emergency24x7: true,
  },
  {
    id: 'fac_ahd_lg_03',
    name: 'LG Municipal General Hospital',
    district: 'Ahmedabad',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'Municipal General Hospital',
    address: 'Maninagar, Ahmedabad - 380008',
    availableBeds: 54,
    emergency24x7: true,
  },
  {
    id: 'fac_ahd_sanand_04',
    name: 'Sanand Community Health Centre (CHC)',
    district: 'Ahmedabad',
    type: 'CHC',
    typeBadge: 'Community Health Centre',
    address: 'Near GIDC Gate, Sanand, Ahmedabad - 382110',
    availableBeds: 14,
    emergency24x7: true,
  },

  // Surat
  {
    id: 'fac_surat_civil_01',
    name: 'New Civil Hospital Surat (Govt Medical College)',
    district: 'Surat',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'District Hospital',
    address: 'Majura Gate, Surat - 395001',
    availableBeds: 110,
    emergency24x7: true,
  },
  {
    id: 'fac_surat_smimer_02',
    name: 'SMIMER Hospital & Municipal Medical College',
    district: 'Surat',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'Municipal Hospital',
    address: 'Sahara Darwaja, Umarwada, Surat - 395010',
    availableBeds: 62,
    emergency24x7: true,
  },
  {
    id: 'fac_surat_bardoli_03',
    name: 'Sardar Smarak Sub-District Hospital',
    district: 'Surat',
    type: 'SUB_DISTRICT_HOSPITAL',
    typeBadge: 'Sub-District Hospital',
    address: 'Station Road, Bardoli, Surat - 394601',
    availableBeds: 28,
    emergency24x7: true,
  },

  // Vadodara
  {
    id: 'fac_vad_ssg_01',
    name: 'Sir Sayajirao General (SSG) Hospital',
    district: 'Vadodara',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'Apex Medical College Hospital',
    address: 'Jail Road, Sayajigunj, Vadodara - 390001',
    availableBeds: 92,
    emergency24x7: true,
  },
  {
    id: 'fac_vad_padra_02',
    name: 'Padra Community Health Centre (CHC)',
    district: 'Vadodara',
    type: 'CHC',
    typeBadge: 'Community Health Centre',
    address: 'Station Road, Padra, Vadodara - 391440',
    availableBeds: 16,
    emergency24x7: true,
  },

  // Rajkot
  {
    id: 'fac_raj_civil_01',
    name: 'PDU Government Medical College & Civil Hospital',
    district: 'Rajkot',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'Apex District Hospital',
    address: 'Hospital Chowk, Rajkot - 360001',
    availableBeds: 84,
    emergency24x7: true,
  },
  {
    id: 'fac_raj_gondal_02',
    name: 'Gondal Sub-District Hospital',
    district: 'Rajkot',
    type: 'SUB_DISTRICT_HOSPITAL',
    typeBadge: 'Sub-District Hospital',
    address: 'Gondal Bypass, Rajkot - 360311',
    availableBeds: 24,
    emergency24x7: true,
  },

  // Bhavnagar
  {
    id: 'fac_bhv_sirt_01',
    name: 'Sir Takhtasinhji (Sir T) Civil Hospital',
    district: 'Bhavnagar',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'District Hospital',
    address: 'Kalanala, Bhavnagar - 364001',
    availableBeds: 45,
    emergency24x7: true,
  },

  // Jamnagar
  {
    id: 'fac_jam_gg_01',
    name: 'Guru Gobind Singh (GG) Government Hospital',
    district: 'Jamnagar',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'Apex Teaching Hospital',
    address: 'Indira Marg, Jamnagar - 361008',
    availableBeds: 58,
    emergency24x7: true,
  },

  // Junagadh
  {
    id: 'fac_jun_civil_01',
    name: 'Junagadh Civil Hospital & GMERS College',
    district: 'Junagadh',
    type: 'DISTRICT_HOSPITAL',
    typeBadge: 'District Hospital',
    address: 'Majevadi Gate, Junagadh - 362001',
    availableBeds: 36,
    emergency24x7: true,
  },
];

// Helper Haversine formula
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

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; hospital: string; id: string }> = {
  Gandhinagar: { lat: 23.2156, lng: 72.6369, hospital: 'Gandhinagar Civil Hospital & Medical College', id: 'fac_civil_01' },
  Ahmedabad: { lat: 23.0525, lng: 72.595, hospital: 'Ahmedabad Civil Hospital & BJ Medical College', id: 'fac_ahd_civil_01' },
  Surat: { lat: 21.1702, lng: 72.8311, hospital: 'New Civil Hospital Surat (Govt Medical College)', id: 'fac_surat_civil_01' },
  Vadodara: { lat: 22.3072, lng: 73.1812, hospital: 'Sir Sayajirao General (SSG) Hospital', id: 'fac_vad_ssg_01' },
  Rajkot: { lat: 22.3039, lng: 70.8022, hospital: 'PDU Government Medical College & Civil Hospital', id: 'fac_raj_civil_01' },
  Bhavnagar: { lat: 21.7645, lng: 72.1519, hospital: 'Sir Takhtasinhji (Sir T) Civil Hospital', id: 'fac_bhv_sirt_01' },
  Jamnagar: { lat: 22.4707, lng: 70.0577, hospital: 'Guru Gobind Singh (GG) Government Hospital', id: 'fac_jam_gg_01' },
  Junagadh: { lat: 21.5222, lng: 70.4579, hospital: 'Junagadh Civil Hospital & GMERS College', id: 'fac_jun_civil_01' },
};

interface LocationContextType {
  selectedDistrict: string;
  selectedFacility: string;
  selectedFacilityId: string;
  userCoords: { lat: number; lng: number } | null;
  stateGrid: string;
  isLocationModalOpen: boolean;
  isLiveTracking: boolean;
  gpsAccuracy: number | null;
  gpsHeading: number | null;
  gpsSpeed: number | null;
  lastLocationUpdate: Date | null;
  openLocationModal: () => void;
  closeLocationModal: () => void;
  setLocation: (district: string, facilityName: string, facilityId?: string) => void;
  setUserCoords: (coords: { lat: number; lng: number } | null) => void;
  detectGpsLocation: () => Promise<{ success: boolean; message: string; coords?: { lat: number; lng: number } }>;
  setExactCustomLocation: (lat: number, lng: number, label?: string) => void;
  startLiveTracking: () => void;
  stopLiveTracking: () => void;
  toggleLiveTracking: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => {
    return user?.district || localStorage.getItem('healthconnect_district') || '';
  });

  const [selectedFacility, setSelectedFacility] = useState<string>(() => {
    return (
      user?.facilityName ||
      localStorage.getItem('healthconnect_facility') ||
      ''
    );
  });

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    return user?.facilityId || localStorage.getItem('healthconnect_facility_id') || '';
  });

  // Automatically lock and sync location context whenever authenticated user changes
  useEffect(() => {
    if (user?.district) {
      setSelectedDistrict(user.district);
      localStorage.setItem('healthconnect_district', user.district);
    }
    if (user?.facilityName) {
      setSelectedFacility(user.facilityName);
      localStorage.setItem('healthconnect_facility', user.facilityName);
    }
    if (user?.facilityId) {
      setSelectedFacilityId(user.facilityId);
      localStorage.setItem('healthconnect_facility_id', user.facilityId);
    }
  }, [user?.district, user?.facilityName, user?.facilityId]);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(() => {
    try {
      const saved = localStorage.getItem('healthconnect_user_coords');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsHeading, setGpsHeading] = useState<number | null>(null);
  const [gpsSpeed, setGpsSpeed] = useState<number | null>(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const watchIdRef = React.useRef<number | null>(null);

  const setLocation = (district: string, facilityName: string, facilityId?: string) => {
    setSelectedDistrict(district);
    setSelectedFacility(facilityName);
    const matched = facilityId || AVAILABLE_HOSPITALS.find((h) => h.name === facilityName)?.id || 'fac_civil_01';
    setSelectedFacilityId(matched);

    localStorage.setItem('healthconnect_district', district);
    localStorage.setItem('healthconnect_facility', facilityName);
    localStorage.setItem('healthconnect_facility_id', matched);
  };

  const updateUserCoords = (coords: { lat: number; lng: number } | null) => {
    setUserCoords(coords);
    if (coords) {
      localStorage.setItem('healthconnect_user_coords', JSON.stringify(coords));
    } else {
      localStorage.removeItem('healthconnect_user_coords');
    }
  };

  const setExactCustomLocation = (lat: number, lng: number, label?: string) => {
    const coords = { lat, lng };
    updateUserCoords(coords);
    setGpsAccuracy(5); // high manual accuracy
    setLastLocationUpdate(new Date());

    // Find closest district
    let closestDistrict = 'Gandhinagar';
    let minDistance = Infinity;
    Object.entries(DISTRICT_COORDINATES).forEach(([districtName, info]) => {
      const dist = calculateDistanceKm(lat, lng, info.lat, info.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestDistrict = districtName;
      }
    });

    setSelectedDistrict(closestDistrict);
    localStorage.setItem('healthconnect_district', closestDistrict);
  };

  const detectGpsLocation = async (): Promise<{ success: boolean; message: string; coords?: { lat: number; lng: number } }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, message: 'GPS is not supported by your browser.' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const coords = { lat: latitude, lng: longitude };
          updateUserCoords(coords);
          setGpsAccuracy(Math.round(accuracy));
          setLastLocationUpdate(new Date());

          // Find closest district mathematically
          let closestDistrict = 'Gandhinagar';
          let minDistance = Infinity;

          Object.entries(DISTRICT_COORDINATES).forEach(([districtName, info]) => {
            const dist = calculateDistanceKm(latitude, longitude, info.lat, info.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestDistrict = districtName;
            }
          });

          setSelectedDistrict(closestDistrict);
          localStorage.setItem('healthconnect_district', closestDistrict);

          resolve({
            success: true,
            message: `📍 GPS Fixed at [${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E] (Accuracy ±${Math.round(accuracy)}m)`,
            coords,
          });
        },
        (error) => {
          resolve({
            success: false,
            message: error.message || 'Unable to access your GPS position. Please enter address or drop pin on map.',
          });
        },
        { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
      );
    });
  };

  const startLiveTracking = () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported by your browser.');
      return;
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLiveTracking(true);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        updateUserCoords(coords);
        setGpsAccuracy(Math.round(accuracy));
        setGpsHeading(heading);
        setGpsSpeed(speed);
        setLastLocationUpdate(new Date());

        // Dynamically compute closest center
        let closestDistrict = 'Gandhinagar';
        let closestHospital = 'Gandhinagar Civil Hospital & Medical College';
        let closestId = 'fac_civil_01';
        let minDistance = Infinity;

        Object.entries(DISTRICT_COORDINATES).forEach(([districtName, info]) => {
          const dist = calculateDistanceKm(latitude, longitude, info.lat, info.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestDistrict = districtName;
            closestHospital = info.hospital;
            closestId = info.id;
          }
        });

        setLocation(closestDistrict, closestHospital, closestId);
      },
      (error) => {
        console.warn('[GPS Live Tracking] Error:', error.message);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    watchIdRef.current = id;
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
  };

  const toggleLiveTracking = () => {
    if (isLiveTracking) {
      stopLiveTracking();
    } else {
      startLiveTracking();
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        selectedDistrict,
        selectedFacility,
        selectedFacilityId,
        userCoords,
        stateGrid: 'Gujarat Public Health Grid',
        isLocationModalOpen,
        isLiveTracking,
        gpsAccuracy,
        gpsHeading,
        gpsSpeed,
        lastLocationUpdate,
        openLocationModal: () => setIsLocationModalOpen(true),
        closeLocationModal: () => setIsLocationModalOpen(false),
        setLocation,
        setUserCoords: updateUserCoords,
        detectGpsLocation,
        setExactCustomLocation,
        startLiveTracking,
        stopLiveTracking,
        toggleLiveTracking,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
