import { describe, expect, it } from 'vitest';
import { digitCount, generate, hasCarry, type CarryMode } from '../src/generator';

const modes: CarryMode[] = ['none', 'must', 'any'];

describe('hasCarry', () => {
  it('detects carries in any column', () => {
    expect(hasCarry(5, 5)).toBe(true);
    expect(hasCarry(14, 3)).toBe(false);
    expect(hasCarry(150, 60)).toBe(true);
    expect(hasCarry(123, 456)).toBe(false);
  });
});

describe('generate', () => {
  for (const m of [1, 2, 3]) {
    for (const mixDigits of [false, true]) {
      for (const carry of modes) {
        it(`m=${m} mix=${mixDigits} carry=${carry}`, () => {
          const { problems } = generate({ m, mixDigits, count: 30, carry, seed: 42 });
          expect(problems).toHaveLength(30);
          for (const p of problems) {
            expect(p.sum).toBe(p.a + p.b);
            const [long, short] = [p.a, p.b].sort((x, y) => y - x).map(digitCount);
            expect(long).toBe(m);
            const allowed = mixDigits && m >= 2 ? [m, m - 1] : [m];
            expect(allowed).toContain(short);
            expect(p.a).toBeGreaterThan(0);
            expect(p.b).toBeGreaterThan(0);
            if (carry === 'none') expect(hasCarry(p.a, p.b)).toBe(false);
            if (carry === 'must') expect(hasCarry(p.a, p.b)).toBe(true);
          }
        });
      }
    }
  }

  it('mix mode actually produces m-1 digit addends', () => {
    const { problems } = generate({ m: 3, mixDigits: true, count: 50, carry: 'any', seed: 7 });
    expect(problems.some((p) => Math.min(digitCount(p.a), digitCount(p.b)) === 2)).toBe(true);
  });

  it('is reproducible with the same seed', () => {
    const opts = { m: 2, mixDigits: true, count: 20, carry: 'any' as const, seed: 123 };
    expect(generate(opts)).toEqual(generate(opts));
    expect(generate({ ...opts, seed: 124 }).problems).not.toEqual(generate(opts).problems);
  });

  it('has no duplicates when the problem space is large enough', () => {
    const { problems, warning } = generate({ m: 2, mixDigits: false, count: 100, carry: 'any', seed: 1 });
    expect(new Set(problems.map((p) => `${p.a}+${p.b}`)).size).toBe(100);
    expect(warning).toBeUndefined();
  });

  it('warns when it must repeat (1-digit, no carry has only 36 pairs)', () => {
    const { problems, warning } = generate({ m: 1, mixDigits: false, count: 50, carry: 'none', seed: 1 });
    expect(problems).toHaveLength(50);
    expect(warning).toBeDefined();
  });

  it('clamps count to 1..200', () => {
    expect(generate({ m: 1, mixDigits: false, count: 0, carry: 'any', seed: 1 }).problems).toHaveLength(1);
    expect(generate({ m: 3, mixDigits: false, count: 999, carry: 'any', seed: 1 }).problems).toHaveLength(200);
  });
});
