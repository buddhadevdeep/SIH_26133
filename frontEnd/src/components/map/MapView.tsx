import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Facility } from '@/types/facility';
import { cn } from '@/lib/utils';

export interface MapViewProps {
  facilities: Facility[];
  selectedFacilityId?: string;
  onSelectFacility?: (facility: Facility) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
  showHeatmap?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  showNearestOnly?: boolean;
  isLiveTracking?: boolean;
  gpsAccuracy?: number | null;
  onNearestFound?: (facility: Facility, distanceKm: number) => void;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
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

export const MapView: React.FC<MapViewProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  center = [23.2156, 72.6369], // Gandhinagar district center
  zoom = 12,
  className,
  showHeatmap = false,
  userLocation,
  showNearestOnly = false,
  isLiveTracking = false,
  gpsAccuracy,
  onNearestFound,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const routeDecorationsRef = useRef<L.Layer[]>([]);
  const onNearestFoundRef = useRef(onNearestFound);
  onNearestFoundRef.current = onNearestFound;
  const lastNearestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if container already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const tileUrl =
      import.meta.env.VITE_MAP_TILE_URL ||
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const initialCenter = userLocation ? [userLocation.lat, userLocation.lng] as [number, number] : center;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom,
      zoomControl: true,
    });

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and routes when facilities, userLocation, or showNearestOnly change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers & route lines
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (userCircleRef.current) {
      userCircleRef.current.remove();
      userCircleRef.current = null;
    }
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    routeDecorationsRef.current.forEach((layer) => layer.remove());
    routeDecorationsRef.current = [];

    // Add User Current Location Marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: ${isLiveTracking ? 'rgba(16, 185, 129, 0.45)' : 'rgba(14, 165, 233, 0.4)'}; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            ${isLiveTracking ? `<div style="position: absolute; width: 58px; height: 58px; border-radius: 50%; background: rgba(5, 150, 105, 0.2); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>` : ''}
            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${isLiveTracking ? '#059669' : '#0284c7'}; border: 3px solid #ffffff; box-shadow: 0 4px 14px ${isLiveTracking ? 'rgba(5,150,105,0.6)' : 'rgba(2,132,199,0.5)'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: bold;">
              ${isLiveTracking ? '🛰️' : '📍'}
            </div>
            ${isLiveTracking ? `
              <div style="position: absolute; top: -18px; white-space: nowrap; background: #065f46; color: #a7f3d0; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid #10b981; display: flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: ping 1s infinite;"></span>
                LIVE GPS
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      const uMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      uMarker.bindPopup(`
        <div class="p-2 text-slate-800 font-sans text-xs space-y-1">
          <div class="font-bold text-sm text-sky-900 flex items-center gap-1.5">
            ${isLiveTracking ? '<span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span> 🛰️ Live GPS Tracking' : '📍 Patient Location'}
          </div>
          <div class="text-[11px] text-slate-500">${userLocation.lat.toFixed(5)}°N, ${userLocation.lng.toFixed(5)}°E</div>
          ${gpsAccuracy ? `<div class="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-200">Accuracy: ±${gpsAccuracy}m</div>` : ''}
          <div class="text-[11px] text-emerald-700 font-semibold">${isLiveTracking ? 'Live stream updated continuously' : 'GPS Active & Verified'}</div>
        </div>
      `);
      userMarkerRef.current = uMarker;

      const circleRadius = gpsAccuracy ? Math.max(25, Math.min(gpsAccuracy, 2000)) : 1500;
      const uCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: circleRadius,
        color: isLiveTracking ? '#059669' : '#0284c7',
        fillColor: isLiveTracking ? '#34d399' : '#38bdf8',
        fillOpacity: isLiveTracking ? 0.12 : 0.08,
        weight: isLiveTracking ? 2 : 1.5,
        dashArray: '4, 4',
      }).addTo(map);
      userCircleRef.current = uCircle;
    }

    // Filter valid facilities with coordinates
    const validFacilities = facilities.filter((f) => f.coordinates && f.coordinates.lat && f.coordinates.lng);

    // Compute distance for each facility if userLocation is known
    let facilitiesToRender: Array<Facility & { calculatedDist?: number }> = validFacilities.map((facility) => {
      let distanceKm = facility.distanceKm;
      if (userLocation && facility.coordinates) {
        distanceKm = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          facility.coordinates.lat,
          facility.coordinates.lng
        );
      }
      return { ...facility, calculatedDist: distanceKm };
    });

    // Find nearest hospital if userLocation is available
    let nearestFacility: (Facility & { calculatedDist?: number }) | null = null;
    if (userLocation && facilitiesToRender.length > 0) {
      facilitiesToRender.sort((a, b) => (a.calculatedDist ?? Infinity) - (b.calculatedDist ?? Infinity));
      nearestFacility = facilitiesToRender[0];
      if (nearestFacility && nearestFacility.id !== lastNearestIdRef.current) {
        lastNearestIdRef.current = nearestFacility.id;
        if (nearestFacility.calculatedDist !== undefined && onNearestFoundRef.current) {
          onNearestFoundRef.current(nearestFacility, nearestFacility.calculatedDist);
        }
      }
    }

    // If showNearestOnly is true and nearestFacility exists, show ONLY the nearest hospital marker!
    if (showNearestOnly && nearestFacility && userLocation) {
      facilitiesToRender = [nearestFacility];

      // Draw polyline connecting patient location to nearest hospital
      const startPoint: [number, number] = [userLocation.lat, userLocation.lng];
      const endPoint: [number, number] = [nearestFacility.coordinates.lat, nearestFacility.coordinates.lng];

      const routeLine = L.polyline([startPoint, endPoint], {
        color: '#0d9488',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);

      const travelTimeMin = Math.max(2, Math.round((nearestFacility.calculatedDist || 2) * 2.2));
      routeLine.bindTooltip(
        `<div style="font-size: 11px; font-weight: 700; color: #0f766e; padding: 2px 4px;">🚗 ${nearestFacility.calculatedDist ?? 0} km • ~${travelTimeMin} min</div>`,
        { permanent: true, direction: 'center', className: 'route-distance-tooltip' }
      );
      routeLineRef.current = routeLine;

      // Add a visual highlight pulse around nearest hospital
      const highlightCircle = L.circle(endPoint, {
        radius: 1200,
        color: '#0d9488',
        fillColor: '#14b8a6',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
      routeDecorationsRef.current.push(highlightCircle);
    }

    // Render facility markers
    facilitiesToRender.forEach((facility) => {
      if (!facility.coordinates) return;
      const isSelected = facility.id === selectedFacilityId;
      const isNearest = nearestFacility && facility.id === nearestFacility.id;
      const isCritical = facility.availableBeds <= 5;
      const isBusy = facility.availableBeds > 5 && facility.availableBeds <= 15;

      const markerColor = isNearest ? '#0d9488' : isCritical ? '#dc2626' : isBusy ? '#d97706' : '#2563eb';
      const markerSize = isNearest ? 44 : isSelected ? 38 : 30;

      const customIcon = L.divIcon({
        className: 'custom-facility-marker',
        html: `
          <div style="position: relative; width: ${markerSize}px; height: ${markerSize}px; display: flex; align-items: center; justify-content: center;">
            ${isNearest ? `<div style="position: absolute; width: ${markerSize + 12}px; height: ${markerSize + 12}px; border-radius: 50%; background: rgba(13, 148, 136, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="
              background: linear-gradient(135deg, ${markerColor}, ${isNearest ? '#042f2e' : '#1e293b'});
              width: ${markerSize}px;
              height: ${markerSize}px;
              border-radius: 50%;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: ${isNearest ? '16px' : '12px'};
              font-weight: 800;
              transition: all 0.2s ease;
              cursor: pointer;
            ">
              ${isNearest ? '🏥' : '+'}
            </div>
            ${isNearest ? `
              <div style="position: absolute; bottom: -18px; white-space: nowrap; background: #0f766e; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); border: 1px solid white;">
                Nearest Hospital
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [markerSize + 16, markerSize + 16],
        iconAnchor: [(markerSize + 16) / 2, (markerSize + 16) / 2],
      });

      const marker = L.marker([facility.coordinates.lat, facility.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isNearest ? 900 : 100,
      }).addTo(map);

      const distanceDisplay = facility.calculatedDist !== undefined ? `${facility.calculatedDist} km away` : facility.distanceKm !== undefined ? `${facility.distanceKm} km away` : 'Nearby';
      const estTime = Math.max(2, Math.round((facility.calculatedDist || facility.distanceKm || 2) * 2.2));

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2.5 text-slate-800 font-sans text-xs space-y-2 min-w-[220px]';
      popupContent.innerHTML = `
        <div class="border-b border-slate-100 pb-1.5">
          ${isNearest ? '<div class="inline-block bg-teal-100 text-teal-900 font-bold text-[10px] px-2 py-0.5 rounded-full mb-1">⭐ Nearest Hospital to You</div>' : ''}
          <div class="font-bold text-sm text-slate-900 leading-snug">${facility.name}</div>
          <div class="text-[11px] text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
            📍 ${distanceDisplay} • ~${estTime} mins drive
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg">
          <div>
            <div class="text-slate-500 text-[10px]">General Beds</div>
            <div class="font-bold text-slate-800">${facility.availableBeds || 0} / ${facility.totalBeds || 0}</div>
          </div>
          <div>
            <div class="text-slate-500 text-[10px]">ICU Available</div>
            <div class="font-bold text-red-700">${facility.icuBedsAvailable || 0} beds</div>
          </div>
        </div>
        <div class="flex items-center justify-between text-[11px] pt-0.5">
          <span class="text-slate-600">OPD Wait: <strong>${facility.currentWaitTimeMinutes || 15} min</strong></span>
          <span class="font-bold ${facility.emergencyAvailable ? 'text-emerald-700' : 'text-slate-500'}">
            ${facility.emergencyAvailable ? '● 24/7 Emergency' : 'Closed'}
          </span>
        </div>
        <div class="pt-2 flex items-center gap-2">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${facility.coordinates.lat},${facility.coordinates.lng}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center bg-teal-700 hover:bg-teal-800 text-white font-bold py-1.5 px-2 rounded-lg text-xs transition-colors">
            Get Directions →
          </a>
          <a href="tel:${facility.emergencyNumber || '108'}" class="bg-red-50 hover:bg-red-100 text-red-700 font-bold py-1.5 px-2.5 rounded-lg text-xs border border-red-200">
            📞 Call
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        onSelectFacility?.(facility);
      });

      // Auto-open nearest popup if showNearestOnly
      if (showNearestOnly && isNearest) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }

      markersRef.current.push(marker);
    });

    // Optional epidemic cluster circles (only when not in showNearestOnly mode)
    if (showHeatmap && !showNearestOnly) {
      const clusterCircle = L.circle([23.235, 72.65], {
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.18,
        radius: 3500,
      }).addTo(map);
      clusterCircle.bindPopup('<b>Epidemic Cluster Watch</b><br/>Sector 24 / Pethapur - Vector Surge Alert');
      routeDecorationsRef.current.push(clusterCircle);
    }

    // Auto-fit bounds if we have points
    const points: [number, number][] = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    facilitiesToRender.forEach((f) => {
      if (f.coordinates) points.push([f.coordinates.lat, f.coordinates.lng]);
    });

    if (points.length > 0) {
      try {
        if (points.length === 1) {
          map.setView(points[0], 14);
        } else {
          const bounds = L.latLngBounds(points);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      } catch {
        // ignore
      }
    }
  }, [facilities, selectedFacilityId, onSelectFacility, showHeatmap, userLocation, showNearestOnly]);

  return (
    <div className={cn('relative w-full h-[380px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100', className)}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
