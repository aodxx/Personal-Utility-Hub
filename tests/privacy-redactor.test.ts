import { describe, expect, it } from 'vitest';
import { redactText } from '../src/tools/privacy-redactor';

describe('Privacy Redactor security coverage', () => {
  it('redacts assignment credentials before phone detection can split the value', () => {
    const result = redactText('token=sk-test1234567890\ncontact=+66 81 234 5678');
    expect(result.output).toContain('[REDACTED:SECRET]');
    expect(result.output).not.toContain('sk-test1234567890');
    expect(result.output).toContain('[REDACTED:PHONE]');
    expect(result.counts['Secret / credential']).toBe(1);
    expect(result.counts.Phone).toBe(1);
  });

  it('redacts bearer, JWT-like, and provider-prefixed credentials', () => {
    const result = redactText('Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature\nkey=AKIA1234567890ABCDEF\nOPENAI=sk-proj-1234567890');
    expect(result.output).not.toMatch(/Bearer eyJ/);
    expect(result.output).not.toContain('AKIA1234567890ABCDEF');
    expect(result.output).not.toContain('sk-proj-1234567890');
    expect(result.counts['Secret / credential']).toBe(3);
  });

  it('does not claim a match when no supported pattern is present', () => {
    const result = redactText('ordinary note with no private values');
    expect(result.total).toBe(0);
    expect(result.output).toBe('ordinary note with no private values');
  });
});
