import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { Metric, RiskZone, TrendPoint, Incident, Severity } from './types';

export interface DashboardData {
  metrics: Metric[];
  riskZones: RiskZone[];
  trend: TrendPoint[];
  incidents: Incident[];
}

const DB_NAME = 'SafeCity';

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

const normalizeIncident = (incident: any): Incident => {
  const lat = incident.lat ?? incident.latitude;
  const lng = incident.lng ?? incident.lon ?? incident.long ?? incident.longitude;

  const baseTimestamp = (() => {
    if (incident.date) {
      const d = new Date(incident.date);
      if (incident.time && typeof incident.time === 'string') {
        const [h, m, s] = incident.time.split(':').map((v: string) => parseInt(v, 10));
        if (!Number.isNaN(h)) d.setHours(h, m ?? 0, s ?? 0, 0);
      }
      return d;
    }
    if (incident.timestamp) return new Date(incident.timestamp);
    return new Date();
  })();

  const severityRaw = incident.severity ?? incident.level ?? 'low';
  const severity = String(severityRaw).toLowerCase() as Severity;

  return {
    id: (incident._id as ObjectId | undefined)?.toString() ?? incident.id ?? '',
    lat: Number(lat),
    lng: Number(lng),
    type: incident.type ?? incident.crime_type ?? 'unknown',
    severity,
    timeAgo: incident.timeAgo ?? formatTimeAgo(baseTimestamp),
    zone: incident.zone ?? incident.area ?? incident.city ?? 'Unknown',
    timestamp: baseTimestamp,
    firId: incident.fir_id ?? incident.firId,
    status: incident.status,
    crimeDescription: incident.crime_description ?? incident.description,
    victimName: incident.victim_name,
    victimGender: incident.victim_gender,
    victimAge: incident.victim_age ? Number(incident.victim_age) : undefined,
    victimContact: incident.victim_contact,
    victimEmail: incident.victim_email,
    victimAddress: incident.victim_address,
    city: incident.city,
    state: incident.state,
    rawDate: incident.date,
    rawTime: incident.time,
  };
};

// Calculate metrics from incidents
function calculateMetrics(incidents: Incident[]): Metric[] {
  const total = incidents.length;
  const highRiskZones = new Set(incidents.filter(i => i.severity === 'high').map(i => i.zone)).size;
  
  // Calculate crime rate change (mock comparison for now)
  const changePercent = ((Math.random() - 0.6) * 20).toFixed(1);
  const isDecrease = parseFloat(changePercent) < 0;
  
  return [
    {
      title: 'Total Incidents',
      value: String(total),
      subtext: '+8.2%',
      trend: 'up',
    },
    {
      title: 'Crime Rate Change',
      value: `${changePercent}%`,
      subtext: 'vs last month',
      trend: isDecrease ? 'down' : 'up',
    },
    {
      title: 'High-Risk Zones',
      value: String(highRiskZones),
      subtext: 'in Mumbai',
      trend: 'up',
    },
    {
      title: 'Patrol Efficiency',
      value: '87.3%',
      subtext: '+5.1%',
      trend: 'up',
    },
  ];
}

// Calculate high-risk zones from incidents
function calculateRiskZones(incidents: Incident[]): RiskZone[] {
  const zoneMap = new Map<string, { incidents: Incident[]; highCount: number; crimeTypes: Set<string> }>();

  incidents.forEach(incident => {
    if (!zoneMap.has(incident.zone)) {
      zoneMap.set(incident.zone, { incidents: [], highCount: 0, crimeTypes: new Set() });
    }
    const zone = zoneMap.get(incident.zone)!;
    zone.incidents.push(incident);
    if (incident.severity === 'high') zone.highCount++;
    zone.crimeTypes.add(incident.type);
  });

  const zones = Array.from(zoneMap.entries()).map(([name, data]) => {
    const incidentCount = data.incidents.length;
    const highRatio = data.highCount / incidentCount;
    const score = Math.round(highRatio * 100 + incidentCount * 0.2);
    const trendValue = ((Math.random() - 0.4) * 20).toFixed(0);
    const trendDirection = parseInt(trendValue) > 0 ? 'up' : 'down';
    
    return {
      name,
      score,
      incidents: incidentCount,
      trend: `${parseInt(trendValue) > 0 ? '+' : ''}${trendValue}%`,
      trendDirection: trendDirection as 'up' | 'down',
      timeAgo: data.incidents[0]?.timeAgo || '1 hour ago',
      crimeTypes: Array.from(data.crimeTypes).slice(0, 3),
      rank: 0,
    };
  });

  // Sort by score and assign ranks
  zones.sort((a, b) => b.score - a.score);
  zones.forEach((zone, index) => {
    zone.rank = index + 1;
  });

  return zones.slice(0, 3);
}

// Calculate crime trends by day
function calculateTrends(incidents: Incident[]): TrendPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trends: TrendPoint[] = [];

  days.forEach(day => {
    // For now, aggregate all data. In production, you'd filter by actual dates
    const dayIncidents = incidents;
    
    const theft = dayIncidents.filter(i => i.type === 'theft').length;
    const assault = dayIncidents.filter(i => i.type === 'assault').length;
    const vandalism = dayIncidents.filter(i => i.type === 'vandalism').length;
    const burglary = dayIncidents.filter(i => i.type === 'burglary').length;
    
    // Add some variation to simulate different days
    const variation = Math.random() * 0.4 + 0.8;
    
    trends.push({
      day,
      theft: Math.round(theft / 7 * variation),
      assault: Math.round(assault / 7 * variation),
      vandalism: Math.round(vandalism / 7 * variation),
      burglary: Math.round(burglary / 7 * variation),
    });
  });

  return trends;
}

// Generate mock Mumbai crime data
function generateMockIncidents(): Incident[] {
  const zones = [
    { name: 'Fort District', lat: 18.9547, lng: 72.8290, count: 45 },
    { name: 'Eastern Suburbs', lat: 19.0596, lng: 72.8295, count: 52 },
    { name: 'Bandra-Worli', lat: 19.0596, lng: 72.8295, count: 31 },
    { name: 'Marine Drive', lat: 18.9432, lng: 72.8236, count: 28 },
    { name: 'Northern Suburbs', lat: 19.1136, lng: 72.8697, count: 14 },
  ];

  const crimeTypes = ['theft', 'assault', 'vandalism', 'burglary', 'robbery', 'drug-related'];
  const severities: Severity[] = ['high', 'medium', 'low'];
  const incidents: Incident[] = [];

  zones.forEach(zone => {
    for (let i = 0; i < zone.count; i++) {
      incidents.push({
        id: `incident_${incidents.length + 1}`,
        lat: zone.lat + (Math.random() - 0.5) * 0.03,
        lng: zone.lng + (Math.random() - 0.5) * 0.03,
        type: crimeTypes[Math.floor(Math.random() * crimeTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        timeAgo: `${Math.floor(Math.random() * 48)} mins ago`,
        zone: zone.name,
        timestamp: new Date(),
      });
    }
  });

  return incidents;
}

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);

    // Fetch incidents from the database
    const rawIncidents = await db.collection('incidents').find().toArray();
    
    // If database is empty, use mock data
    let incidents = rawIncidents.length > 0 
      ? rawIncidents.map(normalizeIncident)
      : generateMockIncidents();

    // Calculate all other data from incidents
    const metrics = calculateMetrics(incidents);
    const riskZones = calculateRiskZones(incidents);
    const trend = calculateTrends(incidents);

    return {
      metrics,
      riskZones,
      trend,
      incidents,
    };
  } catch (error) {
    console.error('Error fetching dashboard data, using mock data:', error);
    // Fallback to mock data if database connection fails
    const incidents = generateMockIncidents();
    return {
      metrics: calculateMetrics(incidents),
      riskZones: calculateRiskZones(incidents),
      trend: calculateTrends(incidents),
      incidents,
    };
  }
};
