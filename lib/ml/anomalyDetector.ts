import { Incident } from '../types';
import * as ss from 'simple-statistics';

/**
 * Anomaly Detection Engine
 * Identifies suspicious patterns and unusual crime behaviors
 */
export class AnomalyDetector {
  /**
   * Detect anomalies in crime data using statistical methods
   * Looks for:
   * - Sudden spikes in incidents
   * - Unusual severity patterns
   * - Geographic clusters appearing suddenly
   * - Time-based anomalies
   */
  static detectAnomalies(incidents: Incident[]): Anomaly[] {
    if (incidents.length < 5) return [];

    const anomalies: Anomaly[] = [];

    // 1. Detect volume spikes
    anomalies.push(...this.detectVolumeAnomalies(incidents));

    // 2. Detect severity anomalies
    anomalies.push(...this.detectSeverityAnomalies(incidents));

    // 3. Detect geographic anomalies
    anomalies.push(...this.detectGeographicAnomalies(incidents));

    // 4. Detect temporal anomalies
    anomalies.push(...this.detectTemporalAnomalies(incidents));

    // 5. Detect crime type anomalies
    anomalies.push(...this.detectCrimeTypeAnomalies(incidents));

    // Sort by anomaly score
    anomalies.sort((a, b) => b.score - a.score);

    return anomalies.slice(0, 20); // Return top 20 anomalies
  }

  /**
   * Detect volume spikes using Z-score analysis
   */
  private static detectVolumeAnomalies(incidents: Incident[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Group by hour
    const hourMap = new Map<number, Incident[]>();
    incidents.forEach((incident) => {
      const hour = Math.floor(
        (incident.timestamp || new Date()).getTime() / (1000 * 60 * 60)
      );
      if (!hourMap.has(hour)) hourMap.set(hour, []);
      hourMap.get(hour)!.push(incident);
    });

    const hourCounts = Array.from(hourMap.values()).map((i) => i.length);
    if (hourCounts.length < 5) return anomalies;

    const mean = ss.mean(hourCounts);
    const stdDev = Math.sqrt(ss.sampleVariance(hourCounts));

    Array.from(hourMap.entries()).forEach(([hour, hourIncidents]) => {
      const count = hourIncidents.length;
      const zScore = stdDev === 0 ? 0 : (count - mean) / stdDev;

      // Z-score > 2 is unusual (top 5%)
      if (zScore > 2) {
        anomalies.push({
          type: 'volume_spike',
          severity: 'high',
          score: Math.min(100, zScore * 20),
          description: `Unusual spike in incidents: ${count} incidents vs average ${Math.round(mean)}`,
          affectedIncidents: hourIncidents,
          confidence: this.calculateConfidence(zScore),
          detectedAt: new Date(),
          recommendation:
            'Increase patrol presence and investigation focus during peak hours',
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect severity anomalies
   */
  private static detectSeverityAnomalies(incidents: Incident[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Group by zone
    const zoneMap = new Map<string, Incident[]>();
    incidents.forEach((incident) => {
      if (!zoneMap.has(incident.zone)) zoneMap.set(incident.zone, []);
      zoneMap.get(incident.zone)!.push(incident);
    });

    Array.from(zoneMap.entries()).forEach(([zone, zoneIncidents]) => {
      const severityScores = zoneIncidents.map((i) =>
        i.severity === 'high' ? 3 : i.severity === 'medium' ? 2 : 1
      );

      const mean = ss.mean(severityScores);
      const stdDev = Math.sqrt(ss.sampleVariance(severityScores));

      // Check if this zone has unusually high severity
      if (mean > 2.0) {
        const zScore = (mean - 2) / (stdDev || 0.5);
        if (zScore > 1.5) {
          anomalies.push({
            type: 'severity_spike',
            severity: 'critical',
            score: Math.min(100, zScore * 25),
            description: `${zone} shows unusually high crime severity (avg: ${mean.toFixed(2)}/3)`,
            affectedIncidents: zoneIncidents,
            confidence: this.calculateConfidence(zScore),
            detectedAt: new Date(),
            recommendation: 'Deploy specialized units and increase investigative resources',
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Detect geographic anomalies (unusual spatial clustering)
   */
  private static detectGeographicAnomalies(incidents: Incident[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Calculate spatial density
    incidents.forEach((incident, index) => {
      const nearbyIncidents = incidents.filter(
        (other, otherIndex) => otherIndex !== index && this.getDistance(incident, other) < 1
      );

      if (nearbyIncidents.length > 10) {
        // Unusual clustering
        const zScore = (nearbyIncidents.length - 5) / 3;
        anomalies.push({
          type: 'geographic_cluster',
          severity: 'high',
          score: Math.min(100, zScore * 15),
          description: `Unusual crime cluster detected near ${incident.zone} (${nearbyIncidents.length} incidents within 1km)`,
          affectedIncidents: [incident, ...nearbyIncidents.slice(0, 5)],
          confidence: this.calculateConfidence(zScore),
          detectedAt: new Date(),
          recommendation: 'Investigate underlying cause of cluster (gang activity, event, etc.)',
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect temporal anomalies (unusual time patterns)
   */
  private static detectTemporalAnomalies(incidents: Incident[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // Check for crimes at unusual hours
    const dayHourMap = new Map<string, Incident[]>();

    incidents.forEach((incident) => {
      const date = incident.timestamp || new Date();
      const key = `${date.getDay()}-${date.getHours()}`;
      if (!dayHourMap.has(key)) dayHourMap.set(key, []);
      dayHourMap.get(key)!.push(incident);
    });

    Array.from(dayHourMap.entries()).forEach(([key, timeIncidents]) => {
      const hour = parseInt(key.split('-')[1]);
      const count = timeIncidents.length;

      // Late night crimes (midnight-5am) are more suspicious
      if ((hour >= 22 || hour < 5) && count > 3) {
        anomalies.push({
          type: 'temporal_anomaly',
          severity: 'medium',
          score: Math.min(100, count * 15),
          description: `Unusual late-night crime activity: ${count} incidents between ${hour}:00-${(hour + 1) % 24}:00`,
          affectedIncidents: timeIncidents,
          confidence: 75 + Math.min(25, count * 10),
          detectedAt: new Date(),
          recommendation: 'Increase nighttime patrol and surveillance in affected areas',
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect unusual crime type patterns
   */
  private static detectCrimeTypeAnomalies(incidents: Incident[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    const crimeTypeMap = new Map<string, Incident[]>();
    incidents.forEach((incident) => {
      const type = incident.type.toLowerCase();
      if (!crimeTypeMap.has(type)) crimeTypeMap.set(type, []);
      crimeTypeMap.get(type)!.push(incident);
    });

    const typeCounts = Array.from(crimeTypeMap.values()).map((i) => i.length);
    const mean = ss.mean(typeCounts);
    const stdDev = Math.sqrt(ss.sampleVariance(typeCounts));

    // Detect unusual crime types
    Array.from(crimeTypeMap.entries()).forEach(([type, typeIncidents]) => {
      const count = typeIncidents.length;
      const zScore = stdDev === 0 ? 0 : (count - mean) / stdDev;

      if (zScore > 2 && (type.includes('drug') || type.includes('robbery') || type.includes('assault'))) {
        anomalies.push({
          type: 'crime_type_spike',
          severity: 'high',
          score: Math.min(100, zScore * 20),
          description: `Unusual spike in ${type}: ${count} incidents vs average ${Math.round(mean)}`,
          affectedIncidents: typeIncidents.slice(0, 5),
          confidence: this.calculateConfidence(zScore),
          detectedAt: new Date(),
          recommendation: `Launch targeted investigation into ${type} incidents. Consider organized crime involvement.`,
        });
      }
    });

    return anomalies;
  }

  /**
   * Calculate Haversine distance in km
   */
  private static getDistance(point1: Incident, point2: Incident): number {
    const R = 6371;
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLng = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate confidence score based on statistical significance
   */
  private static calculateConfidence(zScore: number): number {
    // Z-score to percentile
    const erf = (x: number) => {
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;

      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x);

      const t = 1.0 / (1.0 + p * x);
      const y =
        1.0 -
        ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
          t *
          Math.exp(-x * x);

      return sign * y;
    };

    const percentile = (50 + (50 * erf(zScore / Math.sqrt(2)))) | 0;
    return Math.min(100, Math.max(50, percentile));
  }
}

export interface Anomaly {
  type: 'volume_spike' | 'severity_spike' | 'geographic_cluster' | 'temporal_anomaly' | 'crime_type_spike';
  severity: 'critical' | 'high' | 'medium' | 'low';
  score: number; // 0-100
  description: string;
  affectedIncidents: Incident[];
  confidence: number; // 0-100
  detectedAt: Date;
  recommendation: string;
}
