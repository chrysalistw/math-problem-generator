import { createRng, randInt, type Rng } from './rng';

export type CarryMode = 'none' | 'must' | 'any';

export interface GenOptions {
  /** Digits of the first addend, 1..3. */
  m: number;
  /** When m ≥ 2, also allow the second addend to have m-1 digits. */
  mixDigits: boolean;
  count: number;
  carry: CarryMode;
  seed: number;
}

export interface Problem {
  a: number;
  b: number;
  sum: number;
}

export interface GenResult {
  problems: Problem[];
  /** Set when there are not enough distinct problems and some repeat. */
  warning?: string;
}

export const MAX_COUNT = 200;

export function digitCount(n: number): number {
  return String(n).length;
}

export function hasCarry(a: number, b: number): boolean {
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) >= 10) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

function randWithDigits(rng: Rng, d: number): number {
  return randInt(rng, d === 1 ? 1 : 10 ** (d - 1), 10 ** d - 1);
}

/** Builds a pair column by column so that no column sums to 10 or more. */
function noCarryPair(rng: Rng, da: number, db: number): [number, number] {
  let a = 0;
  let b = 0;
  for (let i = 0; i < da; i++) {
    const aTop = i === da - 1;
    const bHere = i < db;
    const bTop = i === db - 1;
    let ai: number;
    let bi = 0;
    if (!bHere) {
      ai = randInt(rng, aTop ? 1 : 0, 9);
    } else {
      // Leave room for b's digit: b needs at least 1 when it is b's top digit.
      const bMin = bTop ? 1 : 0;
      ai = randInt(rng, aTop ? 1 : 0, 9 - bMin);
      bi = randInt(rng, bMin, 9 - ai);
    }
    a += ai * 10 ** i;
    b += bi * 10 ** i;
  }
  return [a, b];
}

function makePair(rng: Rng, opts: GenOptions): [number, number] {
  const m = clampDigits(opts.m);
  const db = opts.mixDigits && m >= 2 && rng() < 0.5 ? m - 1 : m;
  let a: number;
  let b: number;
  if (opts.carry === 'none') {
    [a, b] = noCarryPair(rng, m, db);
  } else {
    // 'must': resample until some column carries.
    for (let tries = 0; ; tries++) {
      a = randWithDigits(rng, m);
      b = randWithDigits(rng, db);
      if (opts.carry === 'any' || hasCarry(a, b) || tries > 1000) break;
    }
  }
  // Shuffle order so the shorter number is sometimes first (horizontal layout).
  return rng() < 0.5 ? [a, b] : [b, a];
}

function clampDigits(m: number): number {
  return Math.min(3, Math.max(1, Math.round(m) || 1));
}

export function generate(opts: GenOptions): GenResult {
  const rng = createRng(opts.seed);
  const count = Math.min(MAX_COUNT, Math.max(1, Math.round(opts.count) || 1));
  const problems: Problem[] = [];
  const seen = new Set<string>();
  const maxTries = count * 200;
  let tries = 0;
  let repeated = false;

  while (problems.length < count) {
    const [a, b] = makePair(rng, opts);
    const key = `${a}+${b}`;
    tries++;
    if (seen.has(key)) {
      if (tries < maxTries) continue;
      repeated = true;
    }
    seen.add(key);
    problems.push({ a, b, sum: a + b });
  }

  return {
    problems,
    warning: repeated ? '符合條件的題目不夠多，部分題目會重複。' : undefined,
  };
}
