import { digitCount, type Problem } from './generator';

export type Layout = 'horizontal' | 'vertical';

export interface RenderOptions {
  layout: Layout;
  /** Horizontal only: leave blank room under each problem for working. */
  space: boolean;
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

function verticalProblem(p: Problem, index: number): HTMLElement {
  // Augend on top. The sum can have one more digit than the longer addend.
  const width = Math.max(digitCount(p.a), digitCount(p.b)) + 1;
  const box = el('div', 'problem vertical');
  box.append(el('div', 'num', `(${index + 1})`));

  const table = el('div', 'vgrid');
  table.style.setProperty('--cols', String(width + 1));
  const row = (cls: string, op: string, cells: string[]) => {
    table.append(el('div', `cell op ${cls}`, op));
    for (const c of cells) table.append(el('div', `cell ${cls}`, c));
  };
  row('digit', '', digitCells(p.a, width));
  row('digit addend', '+', digitCells(p.b, width));
  row('answer', '', digitCells(null, width));
  box.append(table);
  return box;
}

function horizontalProblem(p: Problem, index: number, space: boolean): HTMLElement {
  const box = el('div', 'problem horizontal');
  const line = el('div', 'hline');
  line.append(
    el('span', 'num', `(${index + 1})`),
    el('span', 'expr', `${p.a} + ${p.b} =`),
    el('span', 'answer-blank'),
  );
  box.append(line);
  if (space) box.append(el('div', 'work-space'));
  return box;
}

function answerKey(problems: Problem[], title: string): HTMLElement {
  const sheet = el('section', 'sheet answers');
  sheet.append(el('h2', undefined, `${title}｜答案`));
  const list = el('div', 'answer-list');
  problems.forEach((p, i) => {
    const item = el('div', 'answer-item');
    item.append(el('span', 'num', `(${i + 1})`), el('strong', undefined, String(p.sum)));
    list.append(item);
  });
  sheet.append(list);
  return sheet;
}

export function renderWorksheet(root: HTMLElement, problems: Problem[], opts: RenderOptions): void {
  const sheet = el('section', 'sheet questions');
  sheet.append(header(opts.title));
  const space = opts.space && opts.layout === 'horizontal';
  const body = el('div', `problems ${opts.layout}${space ? ' with-space' : ''}`);
  problems.forEach((p, i) =>
    body.append(opts.layout === 'vertical' ? verticalProblem(p, i) : horizontalProblem(p, i, space)),
  );
  sheet.append(body);

  root.replaceChildren(sheet);
  if (opts.answers) root.append(answerKey(problems, opts.title));
}
