'use client';

import { useState } from 'react';
import { TrendPoint } from '../../lib/types';

interface CrimeTrendAnalysisProps {
  chartData: TrendPoint[];
}

export default function CrimeTrendAnalysis({ chartData }: CrimeTrendAnalysisProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const data = chartData ?? [];

  const crimeTypes = [
    { name: 'Theft', color: 'bg-blue-500', data: data.map((d) => d.theft) },
    { name: 'Assault', color: 'bg-red-500', data: data.map((d) => d.assault) },
    { name: 'Vandalism', color: 'bg-yellow-500', data: data.map((d) => d.vandalism) },
    { name: 'Burglary', color: 'bg-purple-500', data: data.map((d) => d.burglary) },
  ];

  const maxValue = data.length
    ? Math.max(...data.flatMap((d) => [d.theft, d.assault, d.vandalism, d.burglary]))
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Crime Trend Analysis</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Simple Bar Chart */}
      <div className="relative h-64 mb-6">
        <div className="absolute inset-0 flex items-end justify-between space-x-2">
          {data.map((point, index) => {
            const total = point.theft + point.assault + point.vandalism + point.burglary;
            const heightPercent = maxValue ? (total / (maxValue * 4)) * 100 : 0;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative" style={{ height: '200px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-linear-to-t from-blue-500 to-blue-400 rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ height: `${heightPercent}%` }}
                    title={`Total: ${total}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 mt-2 font-medium">
                  {point.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {crimeTypes.map((crime, index) => {
            const total = crime.data.reduce((sum, val) => sum + val, 0);
            return (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 ${crime.color} rounded-full`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {crime.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{total}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
