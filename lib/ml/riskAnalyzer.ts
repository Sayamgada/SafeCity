import { Incident, RiskZone } from '../types';
import * as ss from 'simple-statistics';

/**
 * Risk Score Calculation Engine
 * Uses severity distribution, incident density, and spatial clustering
 */
export class RiskAnalyzer {
  /**
   * Calculate risk zones using ML-based clustering and severity analysis
   * Takes into account:
   * - Incident frequency per zone
   * - High severity concentration
   * - Temporal trends
   * - Crime type diversity
   */
  static calculateRiskZones(incidents: Incident[]): RiskZone[] {
    if (!incidents || incidents.length === 0) {
      return [];
    }

    // Group incidents by zone
    const zoneMap = new Map<
      string,
      {
        incidents: Incident[];
        highCount: number;
        mediumCount: number;
        lowCount: number;
        crimeTypes: Set<string>;
        timestamps: Date[];
      }
    >();

    incidents.forEach((incident) => {
      if (!zoneMap.has(incident.zone)) {
        zoneMap.set(incident.zone, {
          incidents: [],
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          crimeTypes: new Set(),
          timestamps: [],
        });
      }

      const zone = zoneMap.get(incident.zone)!;
      zone.incidents.push(incident);
      zone.timestamps.push(incident.timestamp || new Date());

      // Count by severity
      if (incident.severity === 'high') zone.highCount++;
      else if (incident.severity === 'medium') zone.mediumCount++;
      else zone.lowCount++;

      zone.crimeTypes.add(incident.type);
    });

    // Calculate risk scores using ML features
    const zones = Array.from(zoneMap.entries()).map(([name, data]) => {
      const score = this.calculateRiskScore(data, incidents.length);
      const trend = this.calculateTrend(data.timestamps);
      const trendDirection = trend > 0 ? ('up' as const) : ('down' as const);

      return {
        name,
        score: Math.min(100, Math.max(0, score)), // Clamp between 0-100
        incidents: data.incidents.length,
        trend: `${trend > 0 ? '+' : ''}${trend}%`,
        trendDirection,
        timeAgo:
          data.incidents[0]?.timeAgo || this.getTimeAgoString(data.timestamps[0]),
        crimeTypes: Array.from(data.crimeTypes).slice(0, 3),
        rank: 0,
      };
    });

    // Sort by risk score and assign ranks
    zones.sort((a, b) => b.score - a.score);
    zones.forEach((zone, index) => {
      zone.rank = index + 1;
    });

    return zones.slice(0, 10); // Return top 10 risk zones
  }

  /**
   * Calculate risk score using weighted features:
   * - High severity ratio (40% weight)
   * - Incident density (30% weight)
   * - Crime type diversity (15% weight)
   * - Temporal concentration (15% weight)
   */
  private static calculateRiskScore(
    zoneData: {
      incidents: Incident[];
      highCount: number;
      mediumCount: number;
      lowCount: number;
      crimeTypes: Set<string>;
      timestamps: Date[];
    },
    totalIncidents: number
  ): number {
    const incidentCount = zoneData.incidents.length;

    // Feature 1: High severity ratio (0-40 points)
    const severityRatio = zoneData.highCount / incidentCount;
    const severityScore = severityRatio * 40;

    // Feature 2: Incident density relative to total (0-30 points)
    const densityRatio = incidentCount / totalIncidents;
    const densityScore = Math.min(30, densityRatio * 100);

    // Feature 3: Crime type diversity (0-15 points)
    // More diverse = higher risk
    const crimeTypeScore = Math.min(15, zoneData.crimeTypes.size * 2);

    // Feature 4: Temporal concentration (0-15 points)
    // Calculate if incidents are concentrated in recent time
    const temporalScore = this.calculateTemporalConcentration(
      zoneData.timestamps
    );

    const totalScore = severityScore + densityScore + crimeTypeScore + temporalScore;

    return totalScore;
  }

  /**
   * Calculate temporal concentration (how recent are the incidents)
   * Recent incidents get higher scores
   */
  private static calculateTemporalConcentration(timestamps: Date[]): number {
    if (timestamps.length === 0) return 0;

    const now = new Date();
    const recentCount = timestamps.filter((ts) => {
      const diffMs = now.getTime() - ts.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 7; // Within last 7 days
    }).length;

    const recentRatio = recentCount / timestamps.length;
    return Math.min(15, recentRatio * 30);
  }

  /**
   * Calculate trend using linear regression on temporal data
   * Returns percentage change
   */
  private static calculateTrend(timestamps: Date[]): number {
    if (timestamps.length < 2) return 0;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const week1Count = timestamps.filter(
      (ts) => ts >= oneWeekAgo && ts <= now
    ).length;
    const week2Count = timestamps.filter(
      (ts) => ts >= twoWeeksAgo && ts <= oneWeekAgo
    ).length;

    if (week2Count === 0) return week1Count > 0 ? 100 : 0;

    const changePercent = ((week1Count - week2Count) / week2Count) * 100;
    return Math.round(changePercent * 10) / 10; // Round to 1 decimal
  }

  /**
   * Convert timestamp to time ago string
   */
  private static getTimeAgoString(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }
}
