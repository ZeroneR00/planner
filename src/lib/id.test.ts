import { makeId } from '@/lib/id';

describe('makeId', () => {
  it('выдаёт uuid v4', () => {
    expect(makeId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('1000 вызовов — 1000 разных id', () => {
    const ids = new Set(Array.from({ length: 1000 }, makeId));
    expect(ids.size).toBe(1000);
  });
});
