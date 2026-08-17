export type GeometryType = 'Point' | 'LineString' | 'Polygon';
export type FieldType = 'text' | 'number' | 'boolean' | 'date';
export type Coordinate = [number, number];
export type Geometry = { type: 'Point'; coordinates: Coordinate } | { type: 'LineString'; coordinates: Coordinate[] } | { type: 'Polygon'; coordinates: Coordinate[][] };
export interface Layer { id: string; name: string; geometry: GeometryType; color: string; visible: boolean; }
export interface SchemaField { id: string; name: string; type: FieldType; required: boolean; }
export interface Feature { id: string; layerId: string; geometry: Geometry; properties: Record<string, string | number | boolean>; createdAt: string; }
export interface RecordItem { id: string; featureId: string; values: Record<string, string | number | boolean>; }
export interface MappingProject { id: string; name: string; version: 1; layers: Layer[]; schema: SchemaField[]; features: Feature[]; records: RecordItem[]; updatedAt: string; }

export const uid = (prefix: string): string => `${prefix}-${crypto.randomUUID()}`;
export const createProject = (name = 'Community Survey'): MappingProject => ({ id: uid('project'), name, version: 1, layers: [
  { id: uid('layer'), name: 'บ้านเรือน', geometry: 'Point', color: '#2563eb', visible: true },
  { id: uid('layer'), name: 'จุดน้ำ', geometry: 'Point', color: '#0891b2', visible: true },
  { id: uid('layer'), name: 'เขตชุมชน', geometry: 'Polygon', color: '#16a34a', visible: true },
  { id: uid('layer'), name: 'เส้นทาง', geometry: 'LineString', color: '#f59e0b', visible: true },
], schema: [
  { id: uid('field'), name: 'ชื่อสถานที่', type: 'text', required: false },
  { id: uid('field'), name: 'หมายเหตุ', type: 'text', required: false },
], features: [], records: [], updatedAt: new Date().toISOString() });
