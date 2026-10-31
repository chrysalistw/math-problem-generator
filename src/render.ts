import { digitCount, type Problem } from './generator';

export type Layout = 'horizontal' | 'vertical';

export interface RenderOptions {
  layout: Layout;
  /** Draw working cells (carry row + one square per digit). */
  grid: boolean;
  answers: boolean;
  title: string;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function header(title: string): HTMLElement {
  const h = el('header', 'sheet-header');
  h.append(el('h1', undefined, title));
  const fields = el('div', 'sheet-fields');
  for (const label of ['姓名', '日期', '得分']) {
    const f = el('span', 'field');
    f.append(el('span', undefined, `${label}：`), el('span', 'blank'));
    fields.append(f);
  }
  h.append(fields);
  return h;
}

/** Right-aligns the digits of n into `width` cells. */
function digitCells(n: number | null, width: number): string[] {
  const s = n === null ? '' : String(n);
  return Array.from({ length: width }, (_, i) => s[i - (width - s.length)] ?? '');
}

function verticalProblem(p: Problem, index: number, grid: boolean): HTMLElement {
  // Longer number on top; the sum can have one more digit than the longer addend.
  const [top, bottom] = digitCount(p.a) >= digitCount(p.b) ? [p.a, p.b] : [p.b, p.a];
  const width = digitCount(top) + 1;
  const box = el('div', 'problem vertical');
  box.append(el('div', 'num', `(${index + 1})`));

  const table = el('div', 'vgrid');
  table.style.setProperty('--cols', String(width + 1));
  const row = (cls: string, op: string, cells: string[]) => {
    table.append(el('div', `cell op ${cls}`, op));
    for (const c of cells) table.append(el('div', `cell ${cls}`, c));
  };
  if (grid) row('carry', '', digitCells(null, width));
  row('digit', '', digitCells(top, width));
  row('digit addend', '+', digitCells(bottom, width));
  row('answer', '', digitCells(null, width));
  box.append(table);
  return box;
}

function horizontalProblem(p: Problem, index: number, grid: boolean): HTMLElement {
  const box = el('div', 'problem horizontal');
  const line = el('div', 'hline');
  line.append(
    el('span', 'num', `(${index + 1})`),
    el('span', 'expr', `${p.a} + ${p.b} =`),
    el('span', 'answer-blank'),
  );
  box.append(line);
  if (grid) {
    // Empty scratch grid sized for working the problem out vertically.
    const width = Math.max(digitCount(p.a), digitCount(p.b)) + 2;
    const scratch = el('div', 'scratch');
    scratch.style.setProperty('--cols', String(width));
    for (let i = 0; i < width * 4; i++) scratch.append(el('div', 'cell'));
    box.append(scratch);
  }
  return box;
}

function answerKey(problems: Problem[], title: string): HTMLElement {
  const sheet = el('section', 'sheet answers');
  sheet.append(el('h2', undefined, `${title}｜答案`));
  const list = el('ol', 'answer-list');
  for (const p of problems) {
    const li = el('li');
    li.append(el('span', 'expr', `${p.a} + ${p.b} = `), el('strong', undefined, String(p.sum)));
    list.append(li);
  }
  sheet.append(list);
  return sheet;
}

export function renderWorksheet(root: HTMLElement, problems: Problem[], opts: RenderOptions): void {
  const sheet = el('section', 'sheet questions');
  sheet.append(header(opts.title));
  const body = el('div', `problems ${opts.layout}${opts.grid ? ' with-grid' : ''}`);
  problems.forEach((p, i) =>
    body.append(opts.layout === 'vertical' ? verticalProblem(p, i, opts.grid) : horizontalProblem(p, i, opts.grid)),
  );
  sheet.append(body);

  root.replaceChildren(sheet);
  if (opts.answers) root.append(answerKey(problems, opts.title));
}
