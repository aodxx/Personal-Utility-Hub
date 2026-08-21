import type { GeoPoint } from '../geometry';

export function buildGeoJSON(points: readonly GeoPoint[], mode: 'distance' | 'area' | 'gps'): string {
  const coordinates = points.map((point) => [point.lng, point.lat]);
  const geometry = mode === 'distance' ? { type: 'LineString', coordinates } : mode === 'area' && points.length >= 3 ? { type: 'Polygon', coordinates: [[...coordinates, coordinates[0]]] } : { type: 'MultiPoint', coordinates };
  return JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { mode, pointCount: points.length, sources: points.map((point) => point.source), accuracies: points.map((point) => point.accuracyMeters ?? null) }, geometry }] }, null, 2);
}

export function buildKML(points: readonly GeoPoint[], mode: 'distance' | 'area' | 'gps'): string {
  const coordinates = points.map((point) => `${point.lng},${point.lat},0`).join(' '); const closed = mode === 'area' && points.length >= 3 ? `${coordinates} ${points[0]!.lng},${points[0]!.lat},0` : coordinates; const tag = mode === 'area' && points.length >= 3 ? `<Polygon><outerBoundaryIs><LinearRing><coordinates>${closed}</coordinates></LinearRing></outerBoundaryIs></Polygon>` : `<LineString><tessellate>1</tessellate><coordinates>${coordinates}</coordinates></LineString>`;
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Land Measurement</name><Placemark><name>${mode}</name>${tag}</Placemark></Document></kml>`;
}

function csvCell(value: string | number): string { const text = String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
export function buildCSV(points: readonly GeoPoint[]): string { return ['id,latitude,longitude,source,accuracy_meters,created_at', ...points.map((point) => [point.id, point.lat, point.lng, point.source, point.accuracyMeters ?? '', new Date(point.createdAt).toISOString()].map(csvCell).join(','))].join('\n'); }
