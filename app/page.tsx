import Header from './components/Header';
import DashboardControls from './components/DashboardControls';
import CityCrimeMap from './components/CityCrimeMap';
import HighRiskZones from './components/HighRiskZones';
import CrimeTrendAnalysis from './components/CrimeTrendAnalysis';
import { getDashboardData } from '../lib/getDashboardData';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Executive Safety Dashboard</h1>
          <p className="text-gray-600">Strategic oversight of city-wide crime patterns and departmental performance metrics</p>
        </div>

        {/* Dashboard Controls - Full Width */}
        <DashboardControls metrics={data.metrics} />
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Wider (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <CityCrimeMap incidents={data.incidents} />
          </div>
          
          {/* Right Column - Narrower (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <HighRiskZones zones={data.riskZones} />
            <CrimeTrendAnalysis chartData={data.trend} />
          </div>
        </div>
      </main>
    </div>
  );
}
