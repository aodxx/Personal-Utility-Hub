import { polygonAreaSquareMeters, type GeoPoint } from './geometry';

export type AccuracyLevel = 'good' | 'fair' | 'poor' | 'unknown';
export type MeasurementQuality = 'good' | 'review' | 'poor' | 'unknown';

export interface PolygonValidation {
  valid: boolean;
  issues: string[];
}

export function accuracyLevel(accuracyMeters?: number): AccuracyLevel {
  if (!Number.isFinite(accuracyMeters)) return 'unknown';
  if (accuracyMeters! <= 10) return 'good';
  if (accuracyMeters! <= 30) return 'fair';
  return 'poor';
}

export function accuracyLabel(level: AccuracyLevel): string {
  return ({ good: 'ดี / Good', fair: 'ควรตรวจซ้ำ / Review', poor: 'คลาดเคลื่อนสูง / Poor', unknown: 'ไม่ทราบ / Unknown' })[level];
}

function orientation(a: GeoPoint, b: GeoPoint, c: GeoPoint): number {
  return (b.lng - a.lng) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lng - a.lng);
}

function onSegment(a: GeoPoint, b: GeoPoint, p: GeoPoint): boolean {
  return Math.min(a.lng, b.lng) <= p.lng && p.lng <= Math.max(a.lng, b.lng) && Math.min(a.lat, b.lat) <= p.lat && p.lat <= Math.max(a.lat, b.lat);
}

function segmentsIntersect(a: GeoPoint, b: GeoPoint, c: GeoPoint, d: GeoPoint): boolean {
  const epsilon = 1e-12;
  const abC = orientation(a, b, c); const abD = orientation(a, b, d); const cdA = orientation(c, d, a); const cdB = orientation(c, d, b);
  if (Math.abs(abC) < epsilon && onSegment(a, b, c)) return true;
  if (Math.abs(abD) < epsilon && onSegment(a, b, d)) return true;
  if (Math.abs(cdA) < epsilon && onSegment(c, d, a)) return true;
  if (Math.abs(cdB) < epsilon && onSegment(c, d, b)) return true;
  return (abC > 0) !== (abD > 0) && (cdA > 0) !== (cdB > 0);
}

export function validatePolygon(points: readonly GeoPoint[]): PolygonValidation {
  const issues: string[] = [];
  if (points.length < 3) issues.push('ต้องมีอย่างน้อย 3 จุด / At least 3 points are required');
  const unique = new Set(points.map((point) => `${point.lat.toFixed(8)},${point.lng.toFixed(8)}`));
  if (unique.size !== points.length) issues.push('มีจุดซ้ำกัน / Duplicate points detected');
  if (points.length >= 3 && polygonAreaSquareMeters(points) < 1) issues.push('พื้นที่เล็กหรือจุดอยู่แนวเดียวกัน / Area is too small or collinear');
  if (points.length >= 4) {
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i]!; const b = points[(i + 1) % points.length]!;
      for (let j = i + 1; j < points.length; j += 1) {
        const c = points[j]!; const d = points[(j + 1) % points.length]!;
        if (i === 0 && j === points.length - 1) continue;
        if (j === i + 1) continue;
        if (segmentsIntersect(a, b, c, d)) issues.push('เส้นขอบแปลงตัดกัน / Self-intersecting boundary');
      }
    }
  }
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

export function measurementQuality(points: readonly GeoPoint[], mode: 'distance' | 'area' | 'gps'): MeasurementQuality {
  if (points.length === 0) return 'unknown';
  const accuracies = points.map((point) => point.accuracyMeters).filter((value): value is number => Number.isFinite(value));
  if (accuracies.some((value) => value > 30)) return 'poor';
  if (mode === 'area' && !validatePolygon(points).valid) return 'poor';
  if (accuracies.length === 0) return 'unknown';
  if (accuracies.some((value) => value > 10)) return 'review';
  return 'good';
}

export function measurementQualityLabel(level: MeasurementQuality): string {
  return ({ good: 'คุณภาพดี / Good quality', review: 'ควรตรวจซ้ำ / Review recommended', poor: 'ควรแก้ไขข้อมูล / Needs correction', unknown: 'ยังประเมินไม่ได้ / Not enough quality data' })[level];
}
