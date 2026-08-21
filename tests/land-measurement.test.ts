import { describe, expect, it } from 'vitest';
import { buildCSV, buildGeoJSON, buildKML } from '../src/tools/land-measurement/exporters';
import { getSegments, polygonAreaSquareMeters, totalDistance, type GeoPoint } from '../src/tools/land-measurement/geometry';
import { formatThaiLandUnits, toThaiLandUnits } from '../src/tools/land-measurement/units';

const points: GeoPoint[] = [
  { id: 'a', lat: 13.7563, lng: 100.5018, source: 'map', createdAt: 1 },
  { id: 'b', lat: 13.7563, lng: 100.5118, source: 'map', createdAt: 2 },
  { id: 'c', lat: 13.7663, lng: 100.5118, source: 'gps', accuracyMeters: 6, createdAt: 3 },
  { id: 'd', lat: 13.7663, lng: 100.5018, source: 'map', createdAt: 4 },
];

describe('land measurement geometry', () => {
  it('calculates geodesic segments and total without pixel assumptions', () => {
    expect(getSegments(points)).toHaveLength(3);
    expect(totalDistance(points)).toBeGreaterThan(2000);
    expect(totalDistance(points, true)).toBeGreaterThan(totalDistance(points));
  });
  it('calculates a positive parcel area and centroid-compatible scale', () => {
    const area = polygonAreaSquareMeters(points);
    expect(area).toBeGreaterThan(500_000);
    expect(area).toBeLessThan(1_500_000);
  });
});

describe('land units and exports', () => {
  it('converts Thai land units using 1600 m² per rai', () => {
    expect(toThaiLandUnits(12_456.3)).toEqual({ rai: 7, ngan: 3, squareWa: expect.closeTo(14.075, 0.001) });
    expect(formatThaiLandUnits(1600)).toContain('1 ไร่');
  });
  it('exports valid geometry formats with GPS accuracy metadata', () => {
    const geojson = JSON.parse(buildGeoJSON(points, 'area')) as { features: Array<{ geometry: { type: string; coordinates: number[][][] }; properties: { accuracies: Array<number | null> } }> };
    expect(geojson.features[0]!.geometry.type).toBe('Polygon');
    expect(geojson.features[0]!.geometry.coordinates[0]).toHaveLength(5);
    expect(geojson.features[0]!.properties.accuracies).toContain(6);
    expect(buildKML(points, 'area')).toContain('<Polygon>');
    expect(buildCSV(points)).toContain('id,latitude,longitude,source,accuracy_meters,created_at');
    expect(buildCSV(points)).toContain('gps');
  });
});

describe('measurement quality', () => {
  it('classifies GPS accuracy with transparent thresholds', async () => {
    const { accuracyLevel, measurementQuality } = await import('../src/tools/land-measurement/quality');
    expect(accuracyLevel(4)).toBe('good');
    expect(accuracyLevel(18)).toBe('fair');
    expect(accuracyLevel(45)).toBe('poor');
    expect(measurementQuality([{ ...points[0]!, source: 'gps', accuracyMeters: 8 }], 'gps')).toBe('good');
    expect(measurementQuality([{ ...points[0]!, source: 'gps', accuracyMeters: 45 }], 'gps')).toBe('poor');
  });
  it('flags duplicate or self-intersecting parcel points before area display', async () => {
    const { validatePolygon } = await import('../src/tools/land-measurement/quality');
    expect(validatePolygon([points[0]!, points[1]!, points[1]!, points[3]!]).valid).toBe(false);
    expect(validatePolygon([points[0]!, points[2]!, points[1]!, points[3]!]).issues).toContain('เส้นขอบแปลงตัดกัน / Self-intersecting boundary');
  });
});
