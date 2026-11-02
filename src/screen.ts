import { digitCount, type Problem } from './generator';
import type { Layout } from './render';

/** On-screen problem cards. Answers are always in the DOM; CSS shows them when
 *  the container has the `show-answers` class, otherwise the slot stays blank. */
export function renderCards(root: HTMLElement, problems: Problem[], layout: Layout): void {
  root.className = `cards ${layout}${root.classList.contains('show-answers') ? ' show-answers' : ''}`;
  root.replaceChildren(...problems.map((p, i) => (layout === 'vertical' ? verticalCard(p, i) : horizontalCard(p, i))));
}

function span(className: string, text: string): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = className;
  s.textContent = text;
  return s;
}

function card(index: number): HTMLDivElement {
  const c = document.createElement('div');
  c.className = 'card';
  c.append(span('card-num', String(index + 1)));
  return c;
}

function horizontalCard(p: Problem, index: number): HTMLElement {
  const c = card(index);
  const expr = document.createElement('div');
  expr.className = 'h-expr';
  expr.append(`${p.a} + ${p.b} = `, span('ans', String(p.sum)));
  c.append(expr);
  return c;
}

function verticalCard(p: Problem, index: number): HTMLElement {
  const c = card(index);
  const v = document.createElement('div');
  v.className = 'v-expr';
  v.style.setProperty('--w', String(Math.max(digitCount(p.a), digitCount(p.b)) + 1));
  const row = (cls: string, op: string, value: string, valueClass = 'n') => {
    const r = document.createElement('div');
    r.className = `v-row ${cls}`;
    r.append(span('op', op), span(valueClass, value));
    v.append(r);
  };
  row('', '', String(p.a));
  row('addend', '+', String(p.b));
  row('result', '', String(p.sum), 'ans');
  c.append(v);
  return c;
}
