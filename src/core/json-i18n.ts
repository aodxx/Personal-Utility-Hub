export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface I18nMapResult {
  baseKeys: string[];
  targetKeys: string[];
  missingInTarget: string[];
  extraInTarget: string[];
  sharedKeys: string[];
  skeleton: Record<string, unknown>;
}

function isObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function flattenJson(value: JsonValue, prefix = ''): Record<string, JsonPrimitive> {
  if (!isObject(value)) return prefix ? { [prefix]: value as JsonPrimitive } : {};
  const result: Record<string, JsonPrimitive> = {};
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isObject(child)) Object.assign(result, flattenJson(child, path));
    else if (Array.isArray(child)) result[path] = JSON.stringify(child) as JsonPrimitive;
    else result[path] = child;
  }
  return result;
}

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) cursor[part] = value;
    else {
      const next = cursor[part];
      if (!next || typeof next !== 'object' || Array.isArray(next)) cursor[part] = {};
      cursor = cursor[part] as Record<string, unknown>;
    }
  });
}

export function compareI18nJson(baseText: string, targetText: string): I18nMapResult {
  const base = JSON.parse(baseText) as JsonValue;
  const target = JSON.parse(targetText) as JsonValue;
  const baseFlat = flattenJson(base);
  const targetFlat = flattenJson(target);
  const baseKeys = Object.keys(baseFlat).sort();
  const targetKeys = Object.keys(targetFlat).sort();
  const missingInTarget = baseKeys.filter((key) => !(key in targetFlat));
  const extraInTarget = targetKeys.filter((key) => !(key in baseFlat));
  const sharedKeys = baseKeys.filter((key) => key in targetFlat);
  const skeleton: Record<string, unknown> = {};
  for (const key of baseKeys) setPath(skeleton, key, key in targetFlat ? targetFlat[key] : `TODO: ${baseFlat[key] ?? ''}`);
  return { baseKeys, targetKeys, missingInTarget, extraInTarget, sharedKeys, skeleton };
}
