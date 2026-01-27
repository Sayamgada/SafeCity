'use client';

import { RiskZone } from '../../lib/types';

interface HighRiskZonesProps {
  zones: RiskZone[];
}

export default function HighRiskZones({ zones }: HighRiskZonesProps) {
  const zonesData = zones ?? [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', badge: 'bg-red-500' };
    if (score >= 80) return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', badge: 'bg-orange-500' };
    return { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', badge: 'bg-yellow-500' };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <h2 className="text-xl font-bold text-gray-900">High-Risk Zones</h2>
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Top 3 areas requiring immediate attention</p>
        </div>
      </div>

      {/* Zone Cards */}
      <div className="space-y-4">
        {zonesData.map((zone) => {
          const colors = getScoreColor(zone.score);
          return (
            <div
              key={zone.rank}
              className={`${colors.bg} border ${colors.border} rounded-lg p-4 hover:shadow-md transition-shadow`}
            >
              {/* Zone Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-2xl font-bold text-gray-400">{zone.rank}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{zone.name}</h3>
                    <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{zone.incidents} incidents</span>
                      </div>
                      <div className={`flex items-center space-x-1 font-medium ${
                        zone.trendDirection === 'up' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {zone.trendDirection === 'up' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                        )}
                        <span>{zone.trend}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{zone.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${colors.text} font-bold text-2xl px-3 py-1 rounded`}>
                  {zone.score}
                </div>
              </div>

              {/* Crime Type Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {zone.crimeTypes.map((type, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700"
                  >
                    {type}
                  </span>
                ))}
              </div>

              {/* View Details Button */}
              <button className="flex items-center space-x-1 text-gray-900 hover:text-blue-600 font-medium text-sm transition-colors">
                <span>View Details</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="flex items-center space-x-1 text-gray-900 hover:text-blue-600 font-medium text-sm transition-colors">
          <span>View All Risk Zones</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
