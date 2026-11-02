import { describe, expect, it } from 'vitest';
import { digitCount, generate, hasCarry } from '../src/generator';

describe('hasCarry', () => {
  it('detects carries in any column', () => {
    expect(hasCarry(5, 5)).toBe(true);
    expect(hasCarry(14, 3)).toBe(false);
    expect(hasCarry(150, 60)).toBe(true);
    expect(hasCarry(123, 456)).toBe(false);
    expect(hasCarry(3, 198)).toBe(true);
  });
});

describe('generate', () => {
  for (const aDigits of [1, 2, 3]) {
    for (const bDigits of [1, 2, 3]) {
      for (const noCarry of [false, true]) {
        it(`a=${aDigits} digits, b=${bDigits} digits, noCarry=${noCarry}`, () => {
          const { problems } = generate({ aDigits, bDigits, noCarry, count: 30, seed: 42 });
          expect(problems).toHaveLength(30);
          for (const p of problems) {
            expect(digitCount(p.a)).toBe(aDigits);
            expect(digitCount(p.b)).toBe(bDigits);
            expect(p.a).toBeGreaterThan(0);
            expect(p.b).toBeGreaterThan(0);
            expect(p.sum).toBe(p.a + p.b);
            if (noCarry) expect(hasCarry(p.a, p.b)).toBe(false);
          }
        });
      }
    }
  }

  it('random mode includes carrying problems', () => {
    const { problems } = generate({ aDigits: 2, bDigits: 2, noCarry: false, count: 50, seed: 7 });
    expect(problems.some((p) => hasCarry(p.a, p.b))).toBe(true);
  });

  it('is reproducible with the same seed', () => {
    const opts = { aDigits: 2, bDigits: 1, noCarry: false, count: 20, seed: 123 };
    expect(generate(opts)).toEqual(generate(opts));
    expect(generate({ ...opts, seed: 124 }).problems).not.toEqual(generate(opts).problems);
  });

  it('has no duplicates when the problem space is large enough', () => {
    const { problems, warning } = generate({ aDigits: 2, bDigits: 2, noCarry: false, count: 100, seed: 1 });
    expect(new Set(problems.map((p) => `${p.a}+${p.b}`)).size).toBe(100);
    expect(warning).toBeUndefined();
  });

  it('warns when it must repeat (1-digit, no carry has only 36 pairs)', () => {
    const { problems, warning } = generate({ aDigits: 1, bDigits: 1, noCarry: true, count: 50, seed: 1 });
    expect(problems).toHaveLength(50);
    expect(warning).toBeDefined();
  });

  it('clamps count to 1..200 and digits to 1..3', () => {
    expect(generate({ aDigits: 1, bDigits: 1, noCarry: false, count: 0, seed: 1 }).problems).toHaveLength(1);
    const big = generate({ aDigits: 9, bDigits: 0, noCarry: false, count: 999, seed: 1 }).problems;
    expect(big).toHaveLength(200);
    expect(digitCount(big[0].a)).toBe(3);
    expect(digitCount(big[0].b)).toBe(1);
  });
});
