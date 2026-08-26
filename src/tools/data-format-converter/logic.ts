import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { parse as parseJsonWithDiagnostics, printParseErrorCode, type ParseError } from 'jsonc-parser';
import { parseDocument, stringify as stringifyYaml } from 'yaml';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';

export const DATA_FORMATS = ['json', 'yaml', 'toml', 'xml'] as const;
export type DataFormat = (typeof DATA_FORMATS)[number];

export const MAX_INPUT_CHARS = 500_000;
export const MAX_INPUT_BYTES = 2_000_000;
export const MAX_OUTPUT_CHARS = 1_000_000;

export interface DataFormatErrorOptions {
  format: DataFormat;
  line?: number;
  column?: number;
}

export class DataFormatError extends Error {
  readonly format: DataFormat;
  readonly line?: number;
  readonly column?: number;

  constructor(message: string, options: DataFormatErrorOptions) {
    super(message);
    this.name = 'DataFormatError';
    this.format = options.format;
    this.line = options.line;
    this.column = options.column;
  }
}

export interface ConversionResult {
  sourceFormat: DataFormat;
  targetFormat: DataFormat;
  output: string;
  warnings: string[];
}

const XML_PARSE_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: false,
  processEntities: false,
  removeNSPrefix: false,
} as const;

const XML_BUILD_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
  processEntities: false,
} as const;

function formatLabel(format: DataFormat): string {
  return format.toUpperCase();
}

function assertFormat(value: string): asserts value is DataFormat {
  if (!(DATA_FORMATS as readonly string[]).includes(value)) throw new Error(`Unsupported data format: ${value}`);
}

function assertInputSize(source: string, format: DataFormat): void {
  if (!source.trim()) throw new DataFormatError(`${formatLabel(format)} input is empty`, { format });
  if (source.length > MAX_INPUT_CHARS) {
    throw new DataFormatError(`${formatLabel(format)} input exceeds ${MAX_INPUT_CHARS.toLocaleString()} characters`, { format });
  }
  const byteLength = new TextEncoder().encode(source).byteLength;
  if (byteLength > MAX_INPUT_BYTES) {
    throw new DataFormatError(`${formatLabel(format)} input exceeds ${MAX_INPUT_BYTES.toLocaleString()} UTF-8 bytes`, { format });
  }
}

function positionToLineColumn(source: string, position: number): { line: number; column: number } {
  const safePosition = Math.max(0, Math.min(position, source.length));
  const before = source.slice(0, safePosition);
  const line = before.split('\n').length;
  const lastNewline = before.lastIndexOf('\n');
  return { line, column: safePosition - lastNewline };
}

function parseJsonValue(source: string): unknown {
  const errors: ParseError[] = [];
  const value = parseJsonWithDiagnostics(source, errors, { allowEmptyContent: false, allowTrailingComma: false, disallowComments: true });
  const first = errors[0];
  if (first) {
    const location = positionToLineColumn(source, first.offset);
    throw new DataFormatError(`JSON is invalid: ${printParseErrorCode(first.error)}`, { format: 'json', ...location });
  }
  return value as unknown;
}

function yamlLocation(error: unknown, source: string): { line?: number; column?: number } {
  const typedError = error as { linePos?: Array<{ line: number; col: number }>; pos?: [number, number] };
  const linePos = typedError.linePos?.[0];
  if (linePos) return { line: linePos.line, column: linePos.col };
  const offset = typedError.pos?.[0];
  return typeof offset === 'number' ? positionToLineColumn(source, offset) : {};
}

function parseYamlValue(source: string): unknown {
  const document = parseDocument(source, { prettyErrors: false });
  const firstError = document.errors.at(0);
  if (firstError) {
    throw new DataFormatError(`YAML is invalid: ${firstError.message}`, { format: 'yaml', ...yamlLocation(firstError, source) });
  }
  try {
    return document.toJS({ mapAsMap: false }) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid YAML value';
    throw new DataFormatError(`YAML could not be converted: ${message}`, { format: 'yaml' });
  }
}

function parseTomlValue(source: string): unknown {
  try {
    return parseToml(source) as unknown;
  } catch (error) {
    const candidate = error as { message?: string; line?: number; column?: number };
    throw new DataFormatError(`TOML is invalid: ${candidate.message || 'Invalid TOML document'}`, {
      format: 'toml',
      line: candidate.line,
      column: candidate.column,
    });
  }
}

function parseXmlValue(source: string): unknown {
  const validation = XMLValidator.validate(source, { allowBooleanAttributes: false });
  if (validation !== true) {
    throw new DataFormatError(`XML is invalid: ${validation.err.msg}`, {
      format: 'xml',
      line: validation.err.line,
      column: validation.err.col,
    });
  }
  try {
    return new XMLParser(XML_PARSE_OPTIONS).parse(source) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid XML document';
    throw new DataFormatError(`XML could not be converted: ${message}`, { format: 'xml' });
  }
}

export function parseData(source: string, format: DataFormat): unknown {
  assertInputSize(source, format);
  switch (format) {
    case 'json': return parseJsonValue(source);
    case 'yaml': return parseYamlValue(source);
    case 'toml': return parseTomlValue(source);
    case 'xml': return parseXmlValue(source);
  }
}

function assertJsonCompatible(value: unknown, path = '$'): void {
  if (typeof value === 'bigint') throw new Error(`BigInt at ${path} cannot be represented safely in JSON`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonCompatible(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object' || value instanceof Date) return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) assertJsonCompatible(child, `${path}.${key}`);
}

function stringifyData(value: unknown, format: DataFormat): string {
  try {
    switch (format) {
      case 'json':
        assertJsonCompatible(value);
        return JSON.stringify(value, null, 2);
      case 'yaml':
        return stringifyYaml(value, { indent: 2, sortMapEntries: false });
      case 'toml':
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('TOML output requires a root object/table');
        return stringifyToml(value as Record<string, unknown>);
      case 'xml':
        return new XMLBuilder(XML_BUILD_OPTIONS).build({ root: value });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : `Unable to build ${formatLabel(format)}`;
    throw new DataFormatError(`${formatLabel(format)} output could not be built: ${message}`, { format });
  }
}

function assertOutputSize(output: string, format: DataFormat): void {
  if (output.length > MAX_OUTPUT_CHARS) {
    throw new DataFormatError(`${formatLabel(format)} output exceeds ${MAX_OUTPUT_CHARS.toLocaleString()} characters`, { format });
  }
}

function getWarnings(sourceFormat: DataFormat, targetFormat: DataFormat, value: unknown): string[] {
  if (sourceFormat === targetFormat) return [];
  const warnings: string[] = [];
  if (sourceFormat === 'yaml' || targetFormat === 'yaml') warnings.push('YAML comments, anchors, aliases and custom tags may not round-trip exactly.');
  if (sourceFormat === 'toml' || targetFormat === 'toml') warnings.push('TOML dates, table ordering and format-specific types may change during conversion.');
  if (sourceFormat === 'xml' || targetFormat === 'xml') warnings.push('XML attributes, namespaces, comments and mixed-content ordering may not round-trip exactly.');
  if (targetFormat === 'xml') warnings.push('JSON-like values are wrapped in a generated <root> element for XML output.');
  if (Array.isArray(value) && targetFormat === 'toml') warnings.push('TOML output requires a root table; root arrays are not supported.');
  if ((typeof value !== 'object' || value === null) && targetFormat === 'toml') warnings.push('TOML output requires a root table; scalar roots are not supported.');
  return [...new Set(warnings)];
}

export function convertData(source: string, sourceFormatValue: string, targetFormatValue: string): ConversionResult {
  assertFormat(sourceFormatValue);
  assertFormat(targetFormatValue);
  const value = parseData(source, sourceFormatValue);
  const output = stringifyData(value, targetFormatValue);
  assertOutputSize(output, targetFormatValue);
  return {
    sourceFormat: sourceFormatValue,
    targetFormat: targetFormatValue,
    output,
    warnings: getWarnings(sourceFormatValue, targetFormatValue, value),
  };
}

export function formatDataError(error: unknown): string {
  if (!(error instanceof DataFormatError)) return error instanceof Error ? error.message : 'Conversion failed';
  const location = error.line && error.column ? ` (line ${error.line}, column ${error.column})` : '';
  return `${error.message}${location}`;
}
