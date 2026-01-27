'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CrimeDataPoint {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  zone: string;
}

interface MapViewProps {
  crimeData: CrimeDataPoint[];
  viewMode: 'heatmap' | 'zones';
}

export default function MapView({ crimeData, viewMode }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const heatmapLayer = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainer.current || mapInstance.current) return;

    // Initialize map centered on Mumbai
    const map = L.map(mapContainer.current, {
      center: [19.0760, 72.8777],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstance.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initialize layers
    markersLayer.current = L.layerGroup().addTo(map);
    setMapReady(true);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      markersLayer.current = null;
      setMapReady(false);
    };
  }, [isClient]);

  // Update markers based on crime data
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !markersLayer.current) return;

    console.log('Updating markers with crime data:', crimeData.length, 'incidents');
    console.log('View mode:', viewMode);
    console.log('Sample crime data:', crimeData.slice(0, 2));

    // Clear existing markers
    markersLayer.current.clearLayers();

    if (viewMode === 'zones') {
      // Create marker clusters manually
      const clusterGroups: { [key: string]: CrimeDataPoint[] } = {};
      
      crimeData.forEach((crime) => {
        const key = `${Math.floor(crime.lat * 100)}_${Math.floor(crime.lng * 100)}`;
        if (!clusterGroups[key]) {
          clusterGroups[key] = [];
        }
        clusterGroups[key].push(crime);
      });

      // Add clustered markers
      Object.values(clusterGroups).forEach((cluster) => {
        const avgLat = cluster.reduce((sum, c) => sum + c.lat, 0) / cluster.length;
        const avgLng = cluster.reduce((sum, c) => sum + c.lng, 0) / cluster.length;
        const count = cluster.length;
        
        // Determine severity color
        const highCount = cluster.filter(c => c.severity === 'high').length;
        const color = highCount > count / 2 ? '#ef4444' : 
                     highCount > count / 4 ? '#f97316' : '#22c55e';

        // Use CircleMarker with larger radius for clusters
        const radius = Math.min(25, 10 + count);
        const marker = L.circleMarker([avgLat, avgLng], {
          radius: radius,
          fillColor: color,
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.7,
        });
        
        // Create popup content
        const crimeTypeCounts: { [key: string]: number } = {};
        cluster.forEach(crime => {
          crimeTypeCounts[crime.type] = (crimeTypeCounts[crime.type] || 0) + 1;
        });
        
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${cluster[0].zone}</h3>
            <p style="margin-bottom: 8px; color: #666; font-size: 14px;">${count} incidents in this area</p>
            <div style="margin-top: 8px;">
              ${Object.entries(crimeTypeCounts)
                .map(([type, cnt]) => `
                  <div style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px;">
                    <span style="text-transform: capitalize;">${type}:</span>
                    <span style="font-weight: 600;">${cnt}</span>
                  </div>
                `).join('')}
            </div>
            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666;">
              Latest: ${cluster[0].time}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersLayer.current?.addLayer(marker);
      });
      console.log('Added', Object.keys(clusterGroups).length, 'cluster markers');
    } else {
      // Heatmap mode - show individual markers with color coding
      crimeData.forEach((crime) => {
        const color = crime.severity === 'high' ? '#ef4444' : 
                     crime.severity === 'medium' ? '#f97316' : '#22c55e';

        // Use CircleMarker instead of divIcon for better reliability
        const marker = L.circleMarker([crime.lat, crime.lng], {
          radius: 6,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });
        
        const popupContent = `
          <div style="min-width: 180px;">
            <h3 style="font-weight: bold; margin-bottom: 6px; font-size: 14px; text-transform: capitalize;">
              ${crime.type}
            </h3>
            <div style="margin: 4px 0; font-size: 13px;">
              <span style="color: #666;">Severity:</span>
              <span style="
                margin-left: 6px;
                padding: 2px 8px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 600;
                background-color: ${crime.severity === 'high' ? '#fee2e2' : 
                                   crime.severity === 'medium' ? '#fed7aa' : '#dcfce7'};
                color: ${color};
              ">
                ${crime.severity.toUpperCase()}
              </span>
            </div>
            <div style="margin: 4px 0; font-size: 13px; color: #666;">
              Zone: ${crime.zone}
            </div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666;">
              ${crime.time}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersLayer.current?.addLayer(marker);
      });
      console.log('Added', crimeData.length, 'individual markers in heatmap mode');
    }
  }, [crimeData, viewMode, mapReady]);

  if (!isClient) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0 }} />
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2" style={{ zIndex: 1000 }}>
        <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-sm font-medium text-gray-700">
          {crimeData.length} incidents
        </div>
      </div>
    </div>
  );
}
