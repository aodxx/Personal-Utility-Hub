export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  source: 'map' | 'gps';
  accuracyMeters?: number;
  createdAt: number;
}

export interface SegmentMeasurement {
  from: number;
  to: number;
  meters: number;
}

const EARTH_RADIUS_METERS = 6_378_137;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function haversineDistance(a: Pick<GeoPoint, 'lat' | 'lng'>, b: Pick<GeoPoint, 'lat' | 'lng'>): number {
  const lat1 = toRadians(a.lat); const lat2 = toRadians(b.lat);
  const dLat = lat2 - lat1; const dLng = toRadians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

export function getSegments(points: readonly GeoPoint[], close = false): SegmentMeasurement[] {
  const segments: SegmentMeasurement[] = [];
  for (let index = 1; index < points.length; index += 1) segments.push({ from: index - 1, to: index, meters: haversineDistance(points[index - 1]!, points[index]!) });
  if (close && points.length >= 3) segments.push({ from: points.length - 1, to: 0, meters: haversineDistance(points[points.length - 1]!, points[0]!) });
  return segments;
}

export function totalDistance(points: readonly GeoPoint[], close = false): number { return getSegments(points, close).reduce((sum, segment) => sum + segment.meters, 0); }

/** Equirectangular local projection followed by shoelace area; accurate for small land parcels. */
export function polygonAreaSquareMeters(points: readonly GeoPoint[]): number {
  if (points.length < 3) return 0;
  const originLat = toRadians(points.reduce((sum, point) => sum + point.lat, 0) / points.length);
  const originLng = points[0]!.lng;
  const projected = points.map((point) => ({ x: EARTH_RADIUS_METERS * toRadians(point.lng - originLng) * Math.cos(originLat), y: EARTH_RADIUS_METERS * toRadians(point.lat - points[0]!.lat) }));
  let area = 0;
  for (let index = 0; index < projected.length; index += 1) { const current = projected[index]!; const next = projected[(index + 1) % projected.length]!; area += current.x * next.y - next.x * current.y; }
  return Math.abs(area) / 2;
}

export function polygonCentroid(points: readonly GeoPoint[]): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  const area = polygonAreaSquareMeters(points);
  if (area === 0) return { lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length, lng: points.reduce((sum, point) => sum + point.lng, 0) / points.length };
  const originLat = toRadians(points.reduce((sum, point) => sum + point.lat, 0) / points.length); const originLng = points[0]!.lng; const projected = points.map((point) => ({ x: EARTH_RADIUS_METERS * toRadians(point.lng - originLng) * Math.cos(originLat), y: EARTH_RADIUS_METERS * toRadians(point.lat - points[0]!.lat) }));
  let signedArea = 0; let cx = 0; let cy = 0;
  for (let index = 0; index < projected.length; index += 1) { const current = projected[index]!; const next = projected[(index + 1) % projected.length]!; const cross = current.x * next.y - next.x * current.y; signedArea += cross; cx += (current.x + next.x) * cross; cy += (current.y + next.y) * cross; }
  signedArea /= 2; if (Math.abs(signedArea) < 1e-9) return { lat: points[0]!.lat, lng: points[0]!.lng };
  cx /= 6 * signedArea; cy /= 6 * signedArea;
  return { lat: points[0]!.lat + (cy / EARTH_RADIUS_METERS) * (180 / Math.PI), lng: originLng + (cx / (EARTH_RADIUS_METERS * Math.cos(originLat))) * (180 / Math.PI) };
}

export function validatePoint(lat: number, lng: number): boolean { return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180; }
