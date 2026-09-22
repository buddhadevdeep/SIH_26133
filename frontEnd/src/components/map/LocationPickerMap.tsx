import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onChangeLocation: (lat: number, lng: number) => void;
  title?: string;
  height?: string;
  zoom?: number;
  markerLabel?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  lat,
  lng,
  onChangeLocation,
  title = 'Click anywhere on map or drag pin to set exact location',
  height = '200px',
  zoom = 15,
  markerLabel = 'Hospital Location Pin',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeLocationRef = useRef(onChangeLocation);
  onChangeLocationRef.current = onChangeLocation;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: true,
    });

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'custom-location-pin',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background: #0f766e; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(15,118,110,0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
            📍
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 30],
    });

    const marker = L.marker([lat, lng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    marker.bindPopup(`<div style="font-size: 11px; font-weight: bold; color: #0f766e;">${markerLabel}</div>`);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChangeLocationRef.current(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChangeLocationRef.current(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center & marker when lat / lng props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), { animate: true });
      }
    }
  }, [lat, lng]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span>{title}</span>
        <span className="font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded">
          {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
        </span>
      </div>
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="rounded-xl border border-teal-200 overflow-hidden shadow-2xs z-0"
      />
    </div>
  );
};
