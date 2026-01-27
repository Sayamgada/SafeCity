export type Severity = 'high' | 'medium' | 'low';

export interface Incident {
  id?: string;
  lat: number;
  lng: number;
  type: string;
  severity: Severity;
  timeAgo: string;
  zone: string;
  timestamp?: Date;
  firId?: string;
  status?: string;
  crimeDescription?: string;
  victimName?: string;
  victimGender?: string;
  victimAge?: number;
  victimContact?: string;
  victimEmail?: string;
  victimAddress?: string;
  city?: string;
  state?: string;
  rawDate?: string;
  rawTime?: string;
}

export interface RiskZone {
  rank: number;
  name: string;
  score: number;
  incidents: number;
  trend: string;
  trendDirection: 'up' | 'down';
  timeAgo: string;
  crimeTypes: string[];
}

export interface Metric {
  title: string;
  value: string;
  subtext: string;
  trend?: 'up' | 'down';
}

export interface TrendPoint {
  day: string;
  theft: number;
  assault: number;
  vandalism: number;
  burglary: number;
}
