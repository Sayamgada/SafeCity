import { Incident } from '../types';

/**
 * Crime Hotspot Detection using spatial clustering
 * Identifies geographic areas with high crime concentration
 */
export class HotspotDetector {
  /**
   * Detect crime hotspots using DBSCAN-like clustering
   * Groups nearby incidents that form density-based clusters
   *
   * Parameters:
   * - eps: Maximum distance between points in km (default 1.5km)
   * - minPoints: Minimum incidents to form a cluster (default 3)
   */
  static detectHotspots(
    incidents: Incident[],
    eps: number = 1.5,
    minPoints: number = 3
  ): HotspotCluster[] {
    if (incidents.length < minPoints) return [];

    const clusters: HotspotCluster[] = [];
    const visited = new Set<string>();
    const clusterId = new Map<string, number>();

    incidents.forEach((incident, index) => {
      const incidentId = `${index}`;

      if (visited.has(incidentId)) return;

      visited.add(incidentId);
      const neighbors = this.getNeighbors(incident, incidents, eps, index);

      if (neighbors.length >= minPoints) {
        const cluster = this.expandCluster(
          incident,
          neighbors,
          incidents,
          eps,
          minPoints,
          visited,
          index
        );
        clusters.push(cluster);

        // Mark cluster membership
        neighbors.forEach((idx) => {
          clusterId.set(`${idx}`, clusters.length - 1);
        });
      }
    });

    // Sort by incident count
    clusters.sort((a, b) => b.incidents.length - a.incidents.length);

    // Calculate hotspot intensity
    return clusters.map((cluster, index) => ({
      ...cluster,
      intensity: this.calculateIntensity(cluster),
      rank: index + 1,
    }));
  }

  /**
   * Find all neighbors within eps distance
   */
  private static getNeighbors(
    point: Incident,
    incidents: Incident[],
    eps: number,
    excludeIndex: number
  ): number[] {
    const neighbors: number[] = [];

    incidents.forEach((incident, index) => {
      if (index === excludeIndex) return;
      const distance = this.calculateDistance(point, incident);
      if (distance <= eps) {
        neighbors.push(index);
      }
    });

    return neighbors;
  }

  /**
   * Expand cluster by adding density-reachable points
   */
  private static expandCluster(
    point: Incident,
    neighbors: number[],
    incidents: Incident[],
    eps: number,
    minPoints: number,
    visited: Set<string>,
    startIndex: number
  ): HotspotCluster {
    const clusterIndices = new Set<number>();
    clusterIndices.add(startIndex);

    let queue = [...neighbors];
    while (queue.length > 0) {
      const idx = queue.shift()!;
      const id = `${idx}`;

      if (visited.has(id)) continue;
      visited.add(id);
      clusterIndices.add(idx);

      const currentNeighbors = this.getNeighbors(
        incidents[idx],
        incidents,
        eps,
        idx
      );

      if (currentNeighbors.length >= minPoints) {
        queue = queue.concat(currentNeighbors);
      }
    }

    // Calculate cluster center and bounds
    const clusterIncidents = Array.from(clusterIndices).map((idx) =>
      incidents[idx]
    );
    const centerLat =
      clusterIncidents.reduce((sum, i) => sum + i.lat, 0) /
      clusterIncidents.length;
    const centerLng =
      clusterIncidents.reduce((sum, i) => sum + i.lng, 0) /
      clusterIncidents.length;

    // Calculate severity distribution
    const highCount = clusterIncidents.filter(
      (i) => i.severity === 'high'
    ).length;
    const mediumCount = clusterIncidents.filter(
      (i) => i.severity === 'medium'
    ).length;
    const lowCount = clusterIncidents.filter(
      (i) => i.severity === 'low'
    ).length;

    return {
      center: { lat: centerLat, lng: centerLng },
      incidents: clusterIncidents,
      radius: this.calculateClusterRadius(clusterIncidents, centerLat, centerLng),
      severityDistribution: {
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      intensity: 0, // Will be calculated later
      rank: 0,
    };
  }

  /**
   * Calculate cluster radius (average distance from center)
   */
  private static calculateClusterRadius(
    incidents: Incident[],
    centerLat: number,
    centerLng: number
  ): number {
    if (incidents.length === 0) return 0;

    const distances = incidents.map((i) => {
      const latDiff = i.lat - centerLat;
      const lngDiff = i.lng - centerLng;
      return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111; // Convert to km
    });

    const avgDistance =
      distances.reduce((a, b) => a + b, 0) / distances.length;
    return Math.round(avgDistance * 10) / 10;
  }

  /**
   * Calculate hotspot intensity (0-100)
   * Based on incident density and severity
   */
  private static calculateIntensity(cluster: HotspotCluster): number {
    const incidentDensity = cluster.incidents.length;
    const severityRatio =
      cluster.severityDistribution.high / cluster.incidents.length;

    // Normalize: assume 50 incidents is max density for this cluster type
    const densityScore = Math.min(
      50,
      (incidentDensity / 50) * 50
    );
    const severityScore = severityRatio * 50;

    return Math.round(Math.min(100, densityScore + severityScore));
  }

  /**
   * Calculate Haversine distance between two points in km
   */
  private static calculateDistance(point1: Incident, point2: Incident): number {
    const R = 6371; // Earth's radius in km
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
}

export interface HotspotCluster {
  center: { lat: number; lng: number };
  incidents: Incident[];
  radius: number;
  severityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  intensity: number;
  rank: number;
}
