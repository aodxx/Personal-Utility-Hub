export const MAX_REGEX_INPUT_CHARS = 1_000_000;
export const MAX_REGEX_MATCHES = 10_000;
export const MAX_REGEX_REPLACEMENT_CHARS = 100_000;

export interface RegexMatch {
  index: number;
  end: number;
  text: string;
  groups: string[];
  namedGroups: Record<string, string | undefined>;
}

export interface RegexRunResult {
  matches: RegexMatch[];
  truncated: boolean;
  durationMs: number;
}

function assertInputSize(input: string): void {
  if (input.length > MAX_REGEX_INPUT_CHARS) {
    throw new Error(`ข้อความยาวเกิน ${MAX_REGEX_INPUT_CHARS.toLocaleString()} ตัวอักษร / Input exceeds ${MAX_REGEX_INPUT_CHARS.toLocaleString()} characters`);
  }
}

function createRegex(pattern: string, flags: string): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid regular expression';
    throw new Error(`Pattern ไม่ถูกต้อง / Invalid pattern: ${message}`);
  }
}

function toMatch(match: RegExpExecArray): RegexMatch {
  const namedGroups = Object.fromEntries(Object.entries(match.groups ?? {}).map(([key, value]) => [key, value]));
  return {
    index: match.index,
    end: match.index + match[0].length,
    text: match[0],
    groups: match.slice(1),
    namedGroups,
  };
}

export function runRegex(pattern: string, flags: string, input: string): RegexRunResult {
  assertInputSize(input);
  const regex = createRegex(pattern, flags);
  const started = performance.now();
  const matches: RegexMatch[] = [];
  let truncated = false;

  if (!regex.global && !regex.sticky) {
    const match = regex.exec(input);
    if (match) matches.push(toMatch(match));
  } else {
    while (matches.length < MAX_REGEX_MATCHES) {
      const match = regex.exec(input);
      if (!match) break;
      matches.push(toMatch(match));
      if (match[0] === '') {
        regex.lastIndex = match.index + 1;
      }
    }
    truncated = matches.length >= MAX_REGEX_MATCHES;
  }

  return { matches, truncated, durationMs: performance.now() - started };
}

export function replaceRegex(pattern: string, flags: string, input: string, replacement: string): string {
  assertInputSize(input);
  if (replacement.length > MAX_REGEX_REPLACEMENT_CHARS) {
    throw new Error(`ข้อความแทนที่ยาวเกิน ${MAX_REGEX_REPLACEMENT_CHARS.toLocaleString()} ตัวอักษร / Replacement exceeds ${MAX_REGEX_REPLACEMENT_CHARS.toLocaleString()} characters`);
  }
  return input.replace(createRegex(pattern, flags), replacement);
}

export function regexLiteral(pattern: string, flags: string): string {
  return `/${pattern.replaceAll('/', '\\/')}/${flags}`;
}
