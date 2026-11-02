import { createRng, randInt, type Rng } from './rng';

export interface GenOptions {
  /** Digits of the augend (被加數), 1..3. */
  aDigits: number;
  /** Digits of the addend (加數), 1..3. */
  bDigits: number;
  /** true: no column may carry. false: random. */
  noCarry: boolean;
  count: number;
  seed: number;
}

export interface Problem {
  /** Augend (被加數), always written first / on top. */
  a: number;
  /** Addend (加數). */
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

export function clampDigits(d: number): number {
  return Math.min(3, Math.max(1, Math.round(d) || 1));
}

function randWithDigits(rng: Rng, d: number): number {
  return randInt(rng, d === 1 ? 1 : 10 ** (d - 1), 10 ** d - 1);
}

/** Builds a pair column by column so that no column sums to 10 or more. */
function noCarryPair(rng: Rng, da: number, db: number): [number, number] {
  let a = 0;
  let b = 0;
  for (let i = 0; i < Math.max(da, db); i++) {
    const aHere = i < da;
    const bHere = i < db;
    // A number's leading digit must be at least 1.
    const aMin = i === da - 1 ? 1 : 0;
    const bMin = i === db - 1 ? 1 : 0;
    let ai = 0;
    let bi = 0;
    if (aHere && bHere) {
      ai = randInt(rng, aMin, 9 - bMin);
      bi = randInt(rng, bMin, 9 - ai);
    } else if (aHere) {
      ai = randInt(rng, aMin, 9);
    } else {
      bi = randInt(rng, bMin, 9);
    }
    a += ai * 10 ** i;
    b += bi * 10 ** i;
  }
  return [a, b];
}

export function generate(opts: GenOptions): GenResult {
  const rng = createRng(opts.seed);
  const da = clampDigits(opts.aDigits);
  const db = clampDigits(opts.bDigits);
  const count = Math.min(MAX_COUNT, Math.max(1, Math.round(opts.count) || 1));
  const problems: Problem[] = [];
  const seen = new Set<string>();
  const maxTries = count * 200;
  let tries = 0;
  let repeated = false;

  while (problems.length < count) {
    const [a, b] = opts.noCarry ? noCarryPair(rng, da, db) : [randWithDigits(rng, da), randWithDigits(rng, db)];
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
