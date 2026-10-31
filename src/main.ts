import './styles.css';
import './print.css';
import { generate, MAX_COUNT, type CarryMode } from './generator';
import { renderWorksheet, type Layout } from './render';
import { randomSeed } from './rng';
import { isPremium, startCheckout } from './premium';

interface Settings {
  m: number;
  mix: boolean;
  n: number;
  carry: CarryMode;
  layout: Layout;
  grid: boolean;
  ans: boolean;
  seed: number;
}

const DEFAULTS: Omit<Settings, 'seed'> = {
  m: 2,
  mix: false,
  n: 20,
  carry: 'any',
  layout: 'horizontal',
  grid: false,
  ans: true,
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('controls');
const preview = $<HTMLElement>('preview');

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clampInt(value: string | null, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Settings live in the URL so a worksheet can be reloaded or shared unchanged. */
function readUrl(): Settings {
  const q = new URLSearchParams(location.search);
  const flag = (key: string, fallback: boolean) => (q.has(key) ? q.get(key) === '1' : fallback);
  const seed = Number.parseInt(q.get('seed') ?? '', 36);
  return {
    m: clampInt(q.get('m'), 1, 3, DEFAULTS.m),
    mix: flag('mix', DEFAULTS.mix),
    n: clampInt(q.get('n'), 1, MAX_COUNT, DEFAULTS.n),
    carry: pick(q.get('carry'), ['any', 'none', 'must'] as const, DEFAULTS.carry),
    layout: pick(q.get('layout'), ['horizontal', 'vertical'] as const, DEFAULTS.layout),
    grid: flag('grid', DEFAULTS.grid),
    ans: flag('ans', DEFAULTS.ans),
    seed: Number.isFinite(seed) ? seed >>> 0 : randomSeed(),
  };
}

function writeUrl(s: Settings): void {
  const q = new URLSearchParams({
    m: String(s.m),
    mix: s.mix ? '1' : '0',
    n: String(s.n),
    carry: s.carry,
    layout: s.layout,
    grid: s.grid ? '1' : '0',
    ans: s.ans ? '1' : '0',
    seed: s.seed.toString(36),
  });
  history.replaceState(null, '', `?${q}`);
}

function fillForm(s: Settings): void {
  $<HTMLSelectElement>('m').value = String(s.m);
  $<HTMLInputElement>('mix').checked = s.mix;
  $<HTMLInputElement>('n').value = String(s.n);
  $<HTMLSelectElement>('carry').value = s.carry;
  form.querySelector<HTMLInputElement>(`input[name=layout][value=${s.layout}]`)!.checked = true;
  $<HTMLInputElement>('grid').checked = s.grid;
  $<HTMLInputElement>('ans').checked = s.ans;
}

function readForm(seed: number): Settings {
  const layout = form.querySelector<HTMLInputElement>('input[name=layout]:checked')?.value ?? null;
  return {
    m: clampInt($<HTMLSelectElement>('m').value, 1, 3, DEFAULTS.m),
    mix: $<HTMLInputElement>('mix').checked,
    n: clampInt($<HTMLInputElement>('n').value, 1, MAX_COUNT, DEFAULTS.n),
    carry: pick($<HTMLSelectElement>('carry').value, ['any', 'none', 'must'] as const, DEFAULTS.carry),
    layout: pick(layout, ['horizontal', 'vertical'] as const, DEFAULTS.layout),
    grid: $<HTMLInputElement>('grid').checked,
    ans: $<HTMLInputElement>('ans').checked,
    seed,
  };
}

function updateMixControl(m: number): void {
  const mix = $<HTMLInputElement>('mix');
  mix.disabled = m === 1;
  $('mix-label').classList.toggle('disabled', m === 1);
  $('mix-text').textContent = m === 1 ? 'm-1' : String(m - 1);
}

let current = readUrl();

function update(s: Settings): void {
  current = s;
  updateMixControl(s.m);
  writeUrl(s);
  const { problems, warning } = generate({ m: s.m, mixDigits: s.mix, count: s.n, carry: s.carry, seed: s.seed });
  $('warning').textContent = warning ?? '';
  const title = `${s.m} 位數加法練習`;
  document.title = `${title}｜加法練習題生成器`;
  renderWorksheet(preview, problems, { layout: s.layout, grid: s.grid, answers: s.ans, title });
}

form.addEventListener('input', () => update(readForm(current.seed)));
form.addEventListener('submit', (e) => e.preventDefault());
$('regen').addEventListener('click', () => update(readForm(randomSeed())));
$('print').addEventListener('click', () => window.print());
$('upgrade').addEventListener('click', () => void startCheckout());
$('premium').hidden = isPremium();

fillForm(current);
update(current);
