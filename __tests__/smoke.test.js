import { describe, expect, it } from '@jest/globals';

describe('app smoke test', () => {
  it('loads the Jest environment', () => {
    expect(1).toBe(1);
  });
});
