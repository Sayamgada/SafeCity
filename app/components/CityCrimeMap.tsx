'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Incident, Severity } from '../../lib/types';

// Define the crime data type
interface CrimeDataPoint {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: Severity;
  time: string;
  zone: string;
}

interface CityCrimeMapProps {
  incidents: Incident[];
  mlAnalytics?: any; // mlAnalytics.hotspots, classification, anomalies, temporalAnalysis
}

// Dynamically import map component (client-side only)
const MapView = dynamic(
  () => import('./MapView').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function CityCrimeMap({ incidents, mlAnalytics }: CityCrimeMapProps) {
  const [lastUpdated, setLastUpdated] = useState('');
  const [viewMode, setViewMode] = useState<'heatmap' | 'zones'>('heatmap');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setLastUpdated(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const crimeData = useMemo(() => {
    console.log('Processing incidents:', incidents?.length || 0);
    const processed = (incidents ?? []).map((incident, index) => ({
      id: incident.id ?? String(index + 1),
      lat: incident.lat,
      lng: incident.lng,
      type: incident.type,
      severity: incident.severity,
      time: incident.timeAgo,
      zone: incident.zone,
    }));
    return processed;
  }, [incidents]);

  const zoneSummary = useMemo(() => {
    const summary: Record<string, { count: number; high: number; medium: number; low: number }> = {};

    (incidents ?? []).forEach((incident) => {
      if (!summary[incident.zone]) {
        summary[incident.zone] = { count: 0, high: 0, medium: 0, low: 0 };
      }
      summary[incident.zone].count += 1;
      summary[incident.zone][incident.severity] += 1;
    });

    return Object.entries(summary)
      .map(([name, stats]) => {
        const highRatio = stats.high / stats.count;
        const color = highRatio > 0.5 ? 'bg-red-500' : highRatio > 0.25 ? 'bg-orange-500' : 'bg-green-500';
        return { name, count: stats.count, color };
      })
      .sort((a, b) => b.count - a.count);
  }, [incidents]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">City Crime Map</h2>
          <p className="text-sm text-gray-500 mt-1">Interactive visualization with real-time updates</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'heatmap'
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            <span>Heatmap</span>
          </button>
          <button
            onClick={() => setViewMode('zones')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'zones'
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            <span>Zones</span>
          </button>
        </div>
      </div>

      {/* Zone Labels */}
      {/* <div className="flex flex-wrap gap-3 mb-4">
        {zoneSummary.map((zone, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className={`w-2 h-2 ${zone.color} rounded-full`}></span>
            <span className="text-sm font-medium text-gray-700">{zone.name}</span>
            <span className="text-sm text-gray-500">{zone.count}</span>
          </div>
        ))}
        <button className="flex items-center space-x-1 text-blue-600 text-sm font-medium hover:text-blue-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Directions</span>
        </button>
      </div> */}

      {/* Map Container */}
      <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
        <MapView
          crimeData={crimeData}
          viewMode={viewMode}
          hotspots={mlAnalytics?.hotspots ?? []}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        {/* Legend */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="text-sm text-gray-600">High Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Medium Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Low Risk</span>
          </div>
        </div>
        
        {/* Update timestamp */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Updated: {lastUpdated}</span>
        </div>
      </div>
    </div>
  );
}
