import { Incident } from '../types';
import * as ss from 'simple-statistics';

/**
 * Crime Classification and Clustering
 * Analyzes crime patterns and groups similar crimes together
 */
export class CrimeClassifier {
  // Crime severity mappings (learned from data)
  private static readonly CRIME_SEVERITY_MAP: Record<string, number> = {
    'drug-related': 9,
    robbery: 9,
    'homicide': 10,
    'assault': 8,
    'burglary': 7,
    'theft': 5,
    'vandalism': 3,
    'fraud': 6,
    'cybercrime': 6,
    'kidnapping': 10,
  };

  /**
   * Classify and cluster crimes by type and characteristics
   * Returns grouped crime analysis
   */
  static classifyCrimes(incidents: Incident[]): CrimeClassification {
    if (!incidents || incidents.length === 0) {
      return {
        clusters: [],
        crimeTypeStats: {},
        topCrimeTypes: [],
      };
    }

    const crimeMap = new Map<
      string,
      {
        incidents: Incident[];
        severities: number[];
        locations: Array<{ lat: number; lng: number }>;
      }
    >();

    // Group incidents by crime type
    incidents.forEach((incident) => {
      const type = incident.type.toLowerCase();
      if (!crimeMap.has(type)) {
        crimeMap.set(type, {
          incidents: [],
          severities: [],
          locations: [],
        });
      }

      const data = crimeMap.get(type)!;
      data.incidents.push(incident);
      data.severities.push(
        this.CRIME_SEVERITY_MAP[type] ??
          (incident.severity === 'high' ? 7 : incident.severity === 'medium' ? 5 : 3)
      );
      data.locations.push({ lat: incident.lat, lng: incident.lng });
    });

    // Create classification clusters
    const clusters: CrimeCluster[] = Array.from(crimeMap.entries()).map(
      ([type, data]) => ({
        crimeType: type,
        count: data.incidents.length,
        percentOfTotal: (data.incidents.length / incidents.length) * 100,
        avgSeverity:
          Math.round(
            (ss.mean(data.severities) / 10) * 100
          ) / 100,
        severityDistribution: this.getSeverityDistribution(data.incidents),
        spatialDispersion: this.calculateSpatialDispersion(data.locations),
        topZones: this.getTopZones(data.incidents),
        riskLevel: this.determineRiskLevel(data),
      })
    );

    // Sort by count
    clusters.sort((a, b) => b.count - a.count);

    return {
      clusters,
      crimeTypeStats: Object.fromEntries(
        clusters.map((c) => [c.crimeType, { count: c.count, avgSeverity: c.avgSeverity }])
      ),
      topCrimeTypes: clusters.slice(0, 5).map((c) => ({
        type: c.crimeType,
        count: c.count,
        percentage: c.percentOfTotal,
      })),
    };
  }

  /**
   * Analyze crime trend by day of week
   * Returns prediction for crime volume per day
   */
  static analyzeTrend(incidents: Incident[]): TrendAnalysis {
    if (!incidents || incidents.length === 0) {
      return {
        byDay: {},
        prediction: null,
        seasonalityFactor: 1.0,
      };
    }

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayMap: Record<string, Incident[]> = {};

    // Group by day of week
    dayNames.forEach((day) => {
      dayMap[day] = [];
    });

    incidents.forEach((incident) => {
      const date = incident.timestamp || new Date();
      const dayName = dayNames[date.getDay()];
      dayMap[dayName].push(incident);
    });

    // Calculate statistics per day
    const byDay: Record<string, DayStats> = {};
    const incidentCounts: number[] = [];

    dayNames.forEach((day) => {
      const dayIncidents = dayMap[day];
      const count = dayIncidents.length;
      incidentCounts.push(count);

      byDay[day] = {
        count,
        avgSeverity: dayIncidents.length
          ? ss.mean(
              dayIncidents.map((i) =>
                i.severity === 'high' ? 3 : i.severity === 'medium' ? 2 : 1
              )
            )
          : 0,
        peakHours: this.identifyPeakHours(dayIncidents),
      };
    });

    // Calculate trend prediction (simple linear extrapolation)
    const prediction = this.predictNextWeekTrend(incidentCounts);

    // Calculate seasonality (std dev / mean)
    const mean = ss.mean(incidentCounts);
    const variance = ss.sampleVariance(incidentCounts);
    const stdDev = Math.sqrt(variance);
    const seasonalityFactor = mean > 0 ? stdDev / mean : 1.0;

    return {
      byDay,
      prediction,
      seasonalityFactor: Math.round(seasonalityFactor * 100) / 100,
    };
  }

  /**
   * Get severity distribution
   */
  private static getSeverityDistribution(incidents: Incident[]): Record<string, number> {
    const counts = { high: 0, medium: 0, low: 0 };
    incidents.forEach((i) => {
      if (i.severity === 'high') counts.high++;
      else if (i.severity === 'medium') counts.medium++;
      else counts.low++;
    });
    return counts;
  }

  /**
   * Calculate spatial dispersion (how spread out are crimes)
   * Returns 0-1 score (0 = concentrated, 1 = dispersed)
   */
  private static calculateSpatialDispersion(
    locations: Array<{ lat: number; lng: number }>
  ): number {
    if (locations.length < 2) return 0;

    const centerLat =
      locations.reduce((sum, l) => sum + l.lat, 0) / locations.length;
    const centerLng =
      locations.reduce((sum, l) => sum + l.lng, 0) / locations.length;

    const distances = locations.map((l) => {
      const latDiff = l.lat - centerLat;
      const lngDiff = l.lng - centerLng;
      return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    });

    const stdDev = Math.sqrt(ss.sampleVariance(distances));
    const mean = ss.mean(distances);

    // Normalize to 0-1
    const maxPossibleDispersion = 0.5; // Approximate max dispersion
    return Math.min(1, (stdDev / maxPossibleDispersion) * 0.5 + (mean / 0.3) * 0.5);
  }

  /**
   * Get top 3 zones for a crime type
   */
  private static getTopZones(incidents: Incident[]): Array<{ zone: string; count: number }> {
    const zoneMap = new Map<string, number>();
    incidents.forEach((i) => {
      zoneMap.set(i.zone, (zoneMap.get(i.zone) ?? 0) + 1);
    });

    return Array.from(zoneMap.entries())
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }

  /**
   * Determine risk level from crime data
   */
  private static determineRiskLevel(data: {
    incidents: Incident[];
    severities: number[];
  }): 'critical' | 'high' | 'medium' | 'low' {
    const severityScore = ss.mean(data.severities) / 10;
    const volumeScore = Math.min(1, data.incidents.length / 100);
    const combinedScore = severityScore * 0.6 + volumeScore * 0.4;

    if (combinedScore >= 0.75) return 'critical';
    if (combinedScore >= 0.5) return 'high';
    if (combinedScore >= 0.25) return 'medium';
    return 'low';
  }

  /**
   * Identify peak hours for a crime type
   */
  private static identifyPeakHours(incidents: Incident[]): string[] {
    if (incidents.length === 0) return [];

    const hourMap = new Map<number, number>();

    incidents.forEach((incident) => {
      const hour = (incident.timestamp || new Date()).getHours();
      hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
    });

    return Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00-${(hour + 1) % 24}:00`);
  }

  /**
   * Simple linear trend prediction
   */
  private static predictNextWeekTrend(counts: number[]): TrendPrediction {
    if (counts.length < 2) {
      return { trend: 'stable', confidence: 0, expectedChange: 0 };
    }

    // Calculate linear regression
    const n = counts.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = ss.mean(x);
    const yMean = ss.mean(counts);

    const numerator = counts.reduce(
      (sum, y, i) => sum + (x[i] - xMean) * (y - yMean),
      0
    );
    const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const expectedChange = Math.round(slope * 10) / 10;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.5) trend = 'stable';
    else trend = slope > 0 ? 'increasing' : 'decreasing';

    // Confidence based on R-squared
    const predictions = x.map((xi) => yMean + slope * (xi - xMean));
    const ssRes = counts.reduce(
      (sum, y, i) => sum + Math.pow(y - predictions[i], 2),
      0
    );
    const ssTot = counts.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return {
      trend,
      confidence: Math.round(rSquared * 100),
      expectedChange,
    };
  }
}

export interface CrimeCluster {
  crimeType: string;
  count: number;
  percentOfTotal: number;
  avgSeverity: number;
  severityDistribution: Record<string, number>;
  spatialDispersion: number;
  topZones: Array<{ zone: string; count: number }>;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export interface CrimeClassification {
  clusters: CrimeCluster[];
  crimeTypeStats: Record<string, { count: number; avgSeverity: number }>;
  topCrimeTypes: Array<{ type: string; count: number; percentage: number }>;
}

export interface TrendAnalysis {
  byDay: Record<string, DayStats>;
  prediction: TrendPrediction | null;
  seasonalityFactor: number;
}

export interface DayStats {
  count: number;
  avgSeverity: number;
  peakHours: string[];
}

export interface TrendPrediction {
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  expectedChange: number;
}
