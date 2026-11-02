import './styles.css';
import './sheet.css';
import './print.css';
import { generate, MAX_COUNT } from './generator';
import { renderWorksheet, type Layout } from './render';
import { renderCards } from './screen';
import { randomSeed } from './rng';
import { isPremium, startCheckout } from './premium';

interface Settings {
  /** Augend (被加數) digits. */
  a: number;
  /** Addend (加數) digits. */
  b: number;
  noCarry: boolean;
  n: number;
  layout: Layout;
  /** Horizontal only: blank working space under each printed problem. */
  space: boolean;
  ans: boolean;
  seed: number;
}

const DEFAULTS: Omit<Settings, 'seed'> = {
  a: 2,
  b: 2,
  noCarry: false,
  n: 20,
  layout: 'horizontal',
  space: false,
  ans: true,
};

const LAYOUTS = ['horizontal', 'vertical'] as const;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('controls');
const cards = $<HTMLElement>('cards');
const printRoot = $<HTMLElement>('print-root');
const countInput = $<HTMLInputElement>('n');
const spaceInput = $<HTMLInputElement>('space');

function pick<T extends string>(value: string | null | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clampInt(value: string | null | undefined, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function radio(name: string): string | undefined {
  return form.querySelector<HTMLInputElement>(`input[name=${name}]:checked`)?.value;
}

function setRadio(name: string, value: string): void {
  const input = form.querySelector<HTMLInputElement>(`input[name=${name}][value="${value}"]`);
  if (input) input.checked = true;
}

/** Settings live in the URL so a worksheet can be reloaded or shared unchanged. */
function readUrl(): Settings {
  const q = new URLSearchParams(location.search);
  const flag = (key: string, fallback: boolean) => (q.has(key) ? q.get(key) === '1' : fallback);
  const seed = Number.parseInt(q.get('seed') ?? '', 36);
  return {
    a: clampInt(q.get('a'), 1, 3, DEFAULTS.a),
    b: clampInt(q.get('b'), 1, 3, DEFAULTS.b),
    noCarry: flag('nc', DEFAULTS.noCarry),
    n: clampInt(q.get('n'), 1, MAX_COUNT, DEFAULTS.n),
    layout: pick(q.get('layout'), LAYOUTS, DEFAULTS.layout),
    space: flag('space', DEFAULTS.space),
    ans: flag('ans', DEFAULTS.ans),
    seed: Number.isFinite(seed) ? seed >>> 0 : randomSeed(),
  };
}

function writeUrl(s: Settings): void {
  const q = new URLSearchParams({
    a: String(s.a),
    b: String(s.b),
    nc: s.noCarry ? '1' : '0',
    n: String(s.n),
    layout: s.layout,
    space: s.space ? '1' : '0',
    ans: s.ans ? '1' : '0',
    seed: s.seed.toString(36),
  });
  history.replaceState(null, '', `?${q}`);
}

function fillForm(s: Settings): void {
  setRadio('a', String(s.a));
  setRadio('b', String(s.b));
  setRadio('layout', s.layout);
  $<HTMLInputElement>('nc').checked = s.noCarry;
  countInput.value = String(s.n);
  spaceInput.checked = s.space;
  $<HTMLInputElement>('ans').checked = s.ans;
}

function readForm(seed: number): Settings {
  return {
    a: clampInt(radio('a'), 1, 3, DEFAULTS.a),
    b: clampInt(radio('b'), 1, 3, DEFAULTS.b),
    noCarry: $<HTMLInputElement>('nc').checked,
    n: clampInt(countInput.value, 1, MAX_COUNT, DEFAULTS.n),
    layout: pick(radio('layout'), LAYOUTS, DEFAULTS.layout),
    space: spaceInput.checked,
    ans: $<HTMLInputElement>('ans').checked,
    seed,
  };
}

function syncControls(s: Settings): void {
  // Vertical problems are already laid out for working, so no extra space.
  const vertical = s.layout === 'vertical';
  spaceInput.disabled = vertical;
  $('space-label').classList.toggle('disabled', vertical);
}

function summary(s: Settings): void {
  const h = $('summary');
  const sub = document.createElement('small');
  sub.textContent = `${s.a} 位數 + ${s.b} 位數 · ${s.noCarry ? '不進位' : '隨機進位'} · ${s.layout === 'vertical' ? '直式' : '橫式'}`;
  h.replaceChildren(`${s.n} 題`, sub);
}

let current = readUrl();

function update(s: Settings): void {
  current = s;
  syncControls(s);
  writeUrl(s);
  const { problems, warning } = generate({ aDigits: s.a, bDigits: s.b, noCarry: s.noCarry, count: s.n, seed: s.seed });
  $('warning').textContent = warning ?? '';
  summary(s);
  const title = s.a === s.b ? `${s.a} 位數加法練習` : `${s.a} 位數 + ${s.b} 位數加法練習`;
  document.title = `${title}｜加法練習題生成器`;
  renderCards(cards, problems, s.layout);
  renderWorksheet(printRoot, problems, { layout: s.layout, space: s.space, answers: s.ans, title });
}

form.addEventListener('input', () => update(readForm(current.seed)));
form.addEventListener('submit', (e) => e.preventDefault());
// Normalise an out-of-range or empty count once the user leaves the field.
countInput.addEventListener('change', () => (countInput.value = String(current.n)));
$('show-answers').addEventListener('change', (e) => {
  cards.classList.toggle('show-answers', (e.target as HTMLInputElement).checked);
});
$('regen').addEventListener('click', () => update(readForm(randomSeed())));
$('print').addEventListener('click', () => window.print());
$('upgrade').addEventListener('click', () => void startCheckout());
$('premium').hidden = isPremium();

fillForm(current);
update(current);
