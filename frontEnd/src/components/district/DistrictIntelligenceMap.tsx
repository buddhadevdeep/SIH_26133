import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { AreaIntelligenceProfile, FacilityGapProfile } from '@/types/intelligence';

interface DistrictIntelligenceMapProps {
  areas: AreaIntelligenceProfile[];
  facilities: FacilityGapProfile[];
  selectedAreaId?: string;
  onSelectArea: (area: AreaIntelligenceProfile) => void;
  selectedFacilityId?: string;
  onSelectFacility?: (facility: FacilityGapProfile) => void;
  className?: string;
}

export const DistrictIntelligenceMap: React.FC<DistrictIntelligenceMapProps> = ({
  areas,
  facilities,
  selectedAreaId,
  onSelectArea,
  selectedFacilityId,
  onSelectFacility,
  className = 'h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const tileUrl =
      import.meta.env.VITE_MAP_TILE_URL ||
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    // Center on Gandhinagar District
    const map = L.map(mapContainerRef.current, {
      center: [23.27, 72.62],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Render markers and referral lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Map of facility coordinates for referral vector line drawing
    const facilityCoordMap: Record<string, [number, number]> = {
      fac_civil_01: [23.2156, 72.6369],
      fac_mansa_02: [23.4281, 72.6612],
      fac_kalol_03: [23.2372, 72.4984],
      fac_pet_04: [23.2721, 72.6841],
    };

    // 1. Draw Referral Lines (Dashed Vectors from High-Dependency Villages to Civil Hospital)
    areas.forEach((area) => {
      const destId = area.referralDependency.primaryDestinationFacilityId;
      const destCoords = facilityCoordMap[destId];
      if (destCoords && area.referralDependency.outwardReferralRatio >= 0.5) {
        const line = L.polyline([[area.coordinates.lat, area.coordinates.lng], destCoords], {
          color: area.status === 'ATTENTION_REQUIRED' ? '#e11d48' : '#d97706',
          weight: 2,
          opacity: 0.7,
          dashArray: '5, 8',
        }).addTo(layerGroup);

        line.bindTooltip(
          `<strong>${area.name} ➔ ${area.referralDependency.primaryDestinationFacilityName}</strong><br/>Outward Referral Ratio: ${Math.round(area.referralDependency.outwardReferralRatio * 100)}% (${area.referralDependency.averageTransferDistanceKm} km)`,
          { sticky: true }
        );
      }
    });

    // 2. Add Facility Markers (Rectangular Building Badges)
    facilities.forEach((fac) => {
      const coords = facilityCoordMap[fac.facilityId];
      if (!coords) return;

      const isSelected = fac.facilityId === selectedFacilityId;
      const isCritical = fac.overallGapSeverity === 'CRITICAL';
      const isModerate = fac.overallGapSeverity === 'MODERATE';
      const borderColor = isSelected ? '#0f766e' : isCritical ? '#dc2626' : isModerate ? '#d97706' : '#2563eb';
      const bgColor = isSelected ? '#0f766e' : '#ffffff';
      const textColor = isSelected ? '#ffffff' : '#0f172a';

      const facIcon = L.divIcon({
        className: 'custom-facility-node',
        html: `
          <div style="
            background-color: ${bgColor};
            border: 2px solid ${borderColor};
            color: ${textColor};
            padding: 4px 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.18);
            font-family: sans-serif;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${isCritical ? '#dc2626' : '#10b981'};"></span>
            <span>${fac.facilityName.split('(')[0].replace('Gandhinagar ', '').replace('Sub-District Hospital', 'SDH')}</span>
          </div>
        `,
        iconSize: [140, 30],
        iconAnchor: [70, 15],
      });

      const marker = L.marker(coords, { icon: facIcon }).addTo(layerGroup);

      marker.on('click', () => {
        if (onSelectFacility) {
          onSelectFacility(fac);
        }
      });

      marker.bindTooltip(
        `<strong>${fac.facilityName}</strong><br/>Type: ${fac.facilityType}<br/>Total Beds: ${fac.capacityMetrics.totalBeds} (${fac.capacityMetrics.availableBeds} free)<br/>ICU Free: ${fac.capacityMetrics.icuBedsAvailable} / ${fac.capacityMetrics.icuBedsTotal}<br/>Gaps Identified: ${fac.identifiedGaps.length}`,
        { direction: 'top', offset: [0, -10] }
      );
    });

    // 3. Add Village / Area Cluster Markers (Circular Pulse Rings for Gap Areas)
    areas.forEach((area) => {
      const isSelected = area.id === selectedAreaId;
      const isCritical = area.status === 'ATTENTION_REQUIRED';
      const mainColor = isCritical ? '#e11d48' : '#d97706';

      const areaIcon = L.divIcon({
        className: 'custom-area-node',
        html: `
          <div style="position: relative; width: 34px; height: 34px; cursor: pointer;">
            ${
              isCritical
                ? `<div style="
                    position: absolute;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background-color: ${mainColor};
                    opacity: 0.35;
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>`
                : ''
            }
            <div style="
              position: absolute;
              top: 3px;
              left: 3px;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background-color: ${isSelected ? '#0f172a' : mainColor};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 10px rgba(0,0,0,0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-size: 11px;
              font-weight: 800;
            ">
              ${area.priorityScore}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([area.coordinates.lat, area.coordinates.lng], { icon: areaIcon }).addTo(layerGroup);

      marker.on('click', () => {
        onSelectArea(area);
      });

      marker.bindTooltip(
        `<strong>${area.name}</strong><br/>Service Gap Score: <strong>${area.priorityScore} / 100</strong><br/>Outward Referrals: ${Math.round(area.referralDependency.outwardReferralRatio * 100)}%<br/>Status: ${area.status.replace(/_/g, ' ')}`,
        { direction: 'top', offset: [0, -12] }
      );
    });
  }, [areas, facilities, selectedAreaId, selectedFacilityId, onSelectArea, onSelectFacility]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Interactive Legend Box */}
      <div className="absolute top-3 right-3 z-[1000] rounded-xl bg-white/95 backdrop-blur-md p-3 shadow-md border border-slate-200 text-xs space-y-1.5 pointer-events-auto max-w-[210px]">
        <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block">
          District GIS Intelligence
        </span>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-600 shrink-0" />
          <span className="text-[11px] text-slate-700 font-medium">Area Needing Attention</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
          <span className="text-[11px] text-slate-700 font-medium">Watch Area</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-md bg-white border border-teal-700 shrink-0" />
          <span className="text-[11px] text-slate-700 font-medium">Public Health Facility</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span className="w-4 border-b-2 border-dashed border-rose-500 shrink-0" />
          <span className="text-[10px] text-slate-500">High Referral Transfer Dependency</span>
        </div>
      </div>
    </div>
  );
};
