import { describe, expect, it } from 'vitest';
import { parseHash } from '../src/app/routes';

describe('parseHash', () => {
  it.each(['', '#', '#/'])('maps %s to home', (hash) => {
    expect(parseHash(hash)).toEqual({ kind: 'home' });
  });

  it('maps a valid tool route', () => {
    expect(parseHash('#/tools/foundation-demo')).toEqual({ kind: 'tool', toolId: 'foundation-demo' });
  });

  it('rejects nested and malformed routes', () => {
    expect(parseHash('#/tools/foundation-demo/settings').kind).toBe('not-found');
    expect(parseHash('#/%E0%A4%A').kind).toBe('not-found');
  });
});
