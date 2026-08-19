export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  enum?: unknown[];
  additionalProperties?: boolean;
};

function typeOfValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function mergeSchemas(values: unknown[]): JsonSchema {
  const schemas = values.map(inferSchema);
  const serialized = new Map(schemas.map((schema) => [JSON.stringify(schema), schema]));
  const unique = [...serialized.values()];
  if (unique.length === 1) return unique[0]!;
  return { anyOf: unique };
}

export function inferSchema(value: unknown): JsonSchema {
  if (value === null || typeof value !== 'object') return { type: typeOfValue(value) };
  if (Array.isArray(value)) return { type: 'array', items: value.length ? mergeSchemas(value) : {} };
  const properties: Record<string, JsonSchema> = {};
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record).sort()) properties[key] = inferSchema(record[key]);
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}

export function generateSchema(input: string): string {
  const value = JSON.parse(input);
  return JSON.stringify({ $schema: 'https://json-schema.org/draft/2020-12/schema', ...inferSchema(value) }, null, 2);
}
